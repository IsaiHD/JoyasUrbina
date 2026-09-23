package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"joyas-urbina-backend/internal/core/domain"
	"joyas-urbina-backend/internal/core/ports"
)

type VentasRepo struct {
	db *sql.DB
}

func NewVentasRepo(db *sql.DB) ports.VentasRepository {
	return &VentasRepo{db: db}
}

// VincularPagoBatch inserta múltiples productos asociados a un único pago y actualiza la transacción
// VincularPagoBatch inserta múltiples productos asociados a un único pago
// usando la fecha real en que la máquina Point procesó la transacción.
func (r *VentasRepo) VincularPagoBatch(ctx context.Context, userID string, req *domain.VincularPagoBatchRequest) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("error iniciando transacción: %w", err)
	}
	defer tx.Rollback()

	// 1. Obtener la fecha real del cobro registrada por la máquina Point
	var fechaReal time.Time
	queryFecha := `SELECT creado_en FROM pago_transaccion WHERE payment_id = $1`
	err = tx.QueryRowContext(ctx, queryFecha, req.PaymentID).Scan(&fechaReal)
	if err != nil {
		// Fallback por seguridad si no encuentra la fecha previa
		fechaReal = time.Now()
	}

	// 2. Insertar cada producto usando la fechaReal de la máquina ($14)
	queryVenta := `
		INSERT INTO venta (
			nombre_producto, sku_joya, precio_venta, cantidad, es_reversible,
			id_metodo_pago, id_tipo, id_material, id_piedra, id_piedra_secundaria,
			id_usuario, payment_id, cuotas, fecha_venta
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`

	stmt, err := tx.PrepareContext(ctx, queryVenta)
	if err != nil {
		return fmt.Errorf("error preparando query batch: %w", err)
	}
	defer stmt.Close()

	for _, item := range req.Items {
		_, err := stmt.ExecContext(ctx,
			item.NombreProducto,
			item.SKU,
			item.PrecioVenta,
			item.Cantidad,
			item.EsReversible,
			req.IDMetodoPago,
			item.IDTipo,
			item.IDMaterial,
			item.IDPiedra,
			item.IDPiedraSecundaria,
			userID,
			req.PaymentID,
			req.Cuotas,
			fechaReal, // <-- Fecha exacta de la máquina
		)
		if err != nil {
			return fmt.Errorf("error insertando joya (%s): %w", item.NombreProducto, err)
		}
	}

	// 3. Marcar la transacción como VINCULADO
	queryTx := `UPDATE pago_transaccion SET estado_vinculacion = 'VINCULADO' WHERE payment_id = $1`
	res, err := tx.ExecContext(ctx, queryTx, req.PaymentID)
	if err != nil {
		return fmt.Errorf("error actualizando estado de pago_transaccion: %w", err)
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("error verificando filas actualizadas: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("no se encontró transacción con payment_id %s", req.PaymentID)
	}

	return tx.Commit()
}

// CreateVentaDirecta inserta una venta sin pasarela externa
func (r *VentasRepo) CreateVentaDirecta(ctx context.Context, v *domain.Venta) error {
	query := `
		INSERT INTO venta (
			nombre_producto, sku_joya, precio_venta, cantidad, es_reversible,
			id_metodo_pago, id_tipo, id_material, id_piedra, id_piedra_secundaria,
			id_usuario, cuotas, fecha_venta
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`

	_, err := r.db.ExecContext(ctx, query,
		v.NombreProducto, v.SKU, v.PrecioVenta, v.Cantidad, v.EsReversible,
		v.IDMetodoPago, v.IDTipo, v.IDMaterial, v.IDPiedra, v.IDPiedraSecundaria,
		v.IDUsuario, v.Cuotas)
	if err != nil {
		return fmt.Errorf("error creando venta directa: %w", err)
	}
	return nil
}

// GetVentas lista las ventas con sus relaciones normalizadas
func (r *VentasRepo) GetVentas(ctx context.Context) ([]domain.Venta, error) {
	ventas := []domain.Venta{}

	query := `
		SELECT 
			v.id_venta, v.fecha_venta, v.nombre_producto, COALESCE(v.sku_joya, ''), 
			v.precio_venta, COALESCE(v.cantidad, 1), COALESCE(v.es_reversible, false),
			COALESCE(v.id_metodo_pago, 0), COALESCE(v.id_tipo, 0), COALESCE(v.id_material, 0), 
			v.id_piedra, v.id_piedra_secundaria, 
			COALESCE(v.id_usuario, '00000000-0000-0000-0000-000000000000'), 
			COALESCE(v.payment_id, ''), COALESCE(v.cuotas, 1)
		FROM venta v
		ORDER BY v.fecha_venta DESC`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return ventas, fmt.Errorf("error consultando ventas: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var v domain.Venta
		err := rows.Scan(
			&v.IDVenta, &v.FechaVenta, &v.NombreProducto, &v.SKU,
			&v.PrecioVenta, &v.Cantidad, &v.EsReversible,
			&v.IDMetodoPago, &v.IDTipo, &v.IDMaterial,
			&v.IDPiedra, &v.IDPiedraSecundaria,
			&v.IDUsuario, &v.PaymentID, &v.Cuotas,
		)
		if err != nil {
			return nil, fmt.Errorf("error escaneando fila de venta: %w", err)
		}
		ventas = append(ventas, v)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error recorriendo filas de venta: %w", err)
	}

	return ventas, nil
}

// GetCatalogs extrae tipo_joyas, material y piedra garantizando slices no nulos
func (r *VentasRepo) GetCatalogs(ctx context.Context) (*domain.Catalogs, error) {
	catalogo := &domain.Catalogs{
		Tipos:      []domain.CatalogoItem{},
		Materiales: []domain.CatalogoItem{},
		Piedras:    []domain.CatalogoItem{},
	}

	// 1. Tipos de joyas
	rowsTipos, err := r.db.QueryContext(ctx, "SELECT id_tipo, COALESCE(nombre_tipo, '') FROM public.tipo_joyas ORDER BY id_tipo ASC")
	if err != nil {
		return nil, fmt.Errorf("error consultando tipo_joyas: %w", err)
	}
	defer rowsTipos.Close()

	for rowsTipos.Next() {
		var item domain.CatalogoItem
		if err := rowsTipos.Scan(&item.ID, &item.Nombre); err != nil {
			return nil, fmt.Errorf("error escaneando tipo_joya: %w", err)
		}
		catalogo.Tipos = append(catalogo.Tipos, item)
	}
	if err := rowsTipos.Err(); err != nil {
		return nil, fmt.Errorf("error recorriendo filas de tipo_joya: %w", err)
	}

	// 2. Materiales
	rowsMat, err := r.db.QueryContext(ctx, "SELECT id_material, COALESCE(nombre_material, '') FROM public.material ORDER BY id_material ASC")
	if err != nil {
		return nil, fmt.Errorf("error consultando material: %w", err)
	}
	defer rowsMat.Close()

	for rowsMat.Next() {
		var item domain.CatalogoItem
		if err := rowsMat.Scan(&item.ID, &item.Nombre); err != nil {
			return nil, fmt.Errorf("error escaneando material: %w", err)
		}
		catalogo.Materiales = append(catalogo.Materiales, item)
	}
	if err := rowsMat.Err(); err != nil {
		return nil, fmt.Errorf("error recorriendo filas de material: %w", err)
	}

	// 3. Piedras
	rowsPiedra, err := r.db.QueryContext(ctx, "SELECT id_piedra, COALESCE(nombre_piedra, '') FROM public.piedra ORDER BY id_piedra ASC")
	if err != nil {
		return nil, fmt.Errorf("error consultando piedra: %w", err)
	}
	defer rowsPiedra.Close()

	for rowsPiedra.Next() {
		var item domain.CatalogoItem
		if err := rowsPiedra.Scan(&item.ID, &item.Nombre); err != nil {
			return nil, fmt.Errorf("error escaneando piedra: %w", err)
		}
		catalogo.Piedras = append(catalogo.Piedras, item)
	}
	if err := rowsPiedra.Err(); err != nil {
		return nil, fmt.Errorf("error recorriendo filas de piedra: %w", err)
	}

	return catalogo, nil
}

// GetMetodosPago obtiene los registros de la tabla public.metodo_pago
func (r *VentasRepo) GetMetodosPago(ctx context.Context) ([]map[string]any, error) {
	metodos := []map[string]any{}

	query := `SELECT id_pago, tipo_pago FROM public.metodo_pago ORDER BY id_pago ASC`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return metodos, fmt.Errorf("error consultando metodo_pago: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var idPago int64
		var tipoPago string
		if err := rows.Scan(&idPago, &tipoPago); err != nil {
			return nil, fmt.Errorf("error escaneando metodo_pago: %w", err)
		}
		metodos = append(metodos, map[string]any{
			"id_pago":   idPago,
			"tipo_pago": tipoPago,
		})
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error recorriendo filas de metodo_pago: %w", err)
	}

	return metodos, nil
}
