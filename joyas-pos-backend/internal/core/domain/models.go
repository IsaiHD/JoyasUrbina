package domain

import "time"

// Venta representa una fila individual en la tabla public.venta
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
	IDPiedra           *int      `json:"id_piedra,omitempty"`
	IDPiedraSecundaria *int      `json:"id_piedra_secundaria,omitempty"`
	IDUsuario          string    `json:"id_usuario,omitempty"`
	PaymentID          string    `json:"payment_id,omitempty"`
	Cuotas             int       `json:"cuotas,omitempty"`
	FechaVenta         time.Time `json:"fecha_venta,omitempty"`
}

// ItemVenta representa cada joya individual dentro de una venta batch
type ItemVenta struct {
	NombreProducto     string  `json:"nombre_producto" binding:"required"`
	SKU                string  `json:"sku_joya"`
	PrecioVenta        float64 `json:"precio_venta" binding:"required,gt=0"`
	Cantidad           int     `json:"cantidad" binding:"required,gt=0"`
	EsReversible       bool    `json:"es_reversible"`
	IDTipo             int     `json:"id_tipo"`
	IDMaterial         int     `json:"id_material"`
	IDPiedra           *int    `json:"id_piedra"`
	IDPiedraSecundaria *int    `json:"id_piedra_secundaria"`
}

// VincularPagoBatchRequest es el payload que enviará el modal al confirmar
type VincularPagoBatchRequest struct {
	PaymentID    string      `json:"payment_id" binding:"required"`
	IDMetodoPago int         `json:"id_metodo_pago"`
	Cuotas       int         `json:"cuotas"`
	Items        []ItemVenta `json:"items" binding:"required,min=1"`
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
