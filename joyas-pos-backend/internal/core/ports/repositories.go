package ports

import (
	"context"

	"joyas-urbina-backend/internal/core/domain"
)

type VentasRepository interface {
	VincularPagoBatch(ctx context.Context, userID string, req *domain.VincularPagoBatchRequest) error
	CreateVentaDirecta(ctx context.Context, v *domain.Venta) error
	GetVentas(ctx context.Context) ([]domain.Venta, error)
	GetCatalogs(ctx context.Context) (*domain.Catalogs, error)
	GetMetodosPago(ctx context.Context) ([]map[string]any, error)
}

type DashboardRepository interface {
	GetDashboardStats(ctx context.Context) (*domain.DashboardStats, error)
}
