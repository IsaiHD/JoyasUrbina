package domain

import "time"

// Equivalente a VentaPayload y Venta en la base de datos
type Venta struct {
	IDVenta            int       `json:"id_venta,omitempty"`
	NombreProducto     string    `json:"nombre_producto"`
	SKU                string    `json:"sku_joya"`
	PrecioVenta        float64   `json:"precio_venta"`
	Cantidad           int       `json:"cantidad"`
	EsReversible       bool      `json:"es_reversible"`
	IDMetodoPago       int       `json:"id_metodo_pago"`
	IDTipo             int       `json:"id_tipo,omitempty"`
	IDMaterial         int       `json:"id_material,omitempty"`
	IDPiedra           int       `json:"id_piedra,omitempty"`
	IDPiedraSecundaria int       `json:"id_piedra_secundaria,omitempty"`
	IDUsuario          string    `json:"id_usuario,omitempty"`
	PaymentID          string    `json:"payment_id,omitempty"`
	Cuotas             int       `json:"cuotas,omitempty"`
	FechaVenta         time.Time `json:"fecha_venta,omitempty"`
}

type CatalogoItem struct {
	ID     int64  `json:"id"`
	Nombre string `json:"nombre"`
}

type Catalogs struct {
	Tipos      []CatalogoItem `json:"tipos"`
	Materiales []CatalogoItem `json:"materiales"`
	Piedras    []CatalogoItem `json:"piedras"`
}

type DashboardStats struct {
	RevenueToday     float64          `json:"revenueToday"`
	SalesCount       int              `json:"salesCount"`
	SalesLast7Days   []map[string]any `json:"salesLast7Days"`
	ProductNamesList []string         `json:"productNamesList"`
}
