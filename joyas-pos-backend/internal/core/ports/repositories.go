package ports

import (
	"context"
	"joyas-urbina-backend/internal/core/domain"
)

type VentasRepository interface {
	CreateVentaDirecta(ctx context.Context, v *domain.Venta) error
	VincularPagoConVenta(ctx context.Context, v *domain.Venta, transaccionID int) error
	GetVentas(ctx context.Context) ([]domain.Venta, error)
	GetCatalogs(ctx context.Context) (*domain.Catalogs, error)
	GetMetodosPago(ctx context.Context) ([]map[string]any, error)
}

type DashboardRepository interface {
	GetDashboardStats(ctx context.Context) (*domain.DashboardStats, error)
}
