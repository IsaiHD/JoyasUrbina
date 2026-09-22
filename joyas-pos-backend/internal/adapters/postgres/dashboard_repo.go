package postgres

import (
	"context"
	"database/sql"
	"joyas-urbina-backend/internal/core/domain"
	"joyas-urbina-backend/internal/core/ports"
	"time"
)

type DashboardRepo struct {
	db *sql.DB
}

func NewDashboardRepo(db *sql.DB) ports.DashboardRepository {
	return &DashboardRepo{db: db}
}

func (r *DashboardRepo) GetDashboardStats(ctx context.Context) (*domain.DashboardStats, error) {
	today := time.Now().Truncate(24 * time.Hour)
	sevenDaysAgo := today.AddDate(0, 0, -6)

	query := `SELECT fecha_venta, precio_venta, COALESCE(nombre_producto, 'Otros') 
	          FROM venta WHERE fecha_venta >= $1 ORDER BY fecha_venta ASC`

	rows, err := r.db.QueryContext(ctx, query, sevenDaysAgo)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var revenueToday float64
	var salesCount int

	// Mapa para agrupar por día
	dailySalesMap := make(map[string]map[string]any)
	productNamesSet := make(map[string]bool)

	// Inicializar los últimos 7 días
	for i := 6; i >= 0; i-- {
		d := today.AddDate(0, 0, -i)
		// Formatear a nombre de día corto (ej: "Mon", "Tue").
		// Si necesitas español ("lun", "mar"), mapeas d.Weekday()
		dayName := d.Format("Mon")
		dailySalesMap[dayName] = map[string]any{"name": dayName}
	}

	for rows.Next() {
		var fecha time.Time
		var precio float64
		var producto string

		if err := rows.Scan(&fecha, &precio, &producto); err != nil {
			return nil, err
		}

		productNamesSet[producto] = true
		dayName := fecha.Format("Mon")

		if !fecha.Before(today) {
			revenueToday += precio
			salesCount++
		}

		if dayMap, exists := dailySalesMap[dayName]; exists {
			currentVal, _ := dayMap[producto].(float64)
			dayMap[producto] = currentVal + precio
		}
	}

	// Convertir sets y mapas a slices/arrays para JSON
	var productNamesList []string
	for p := range productNamesSet {
		productNamesList = append(productNamesList, p)
	}

	var salesLast7Days []map[string]any
	for i := 6; i >= 0; i-- {
		dayName := today.AddDate(0, 0, -i).Format("Mon")
		salesLast7Days = append(salesLast7Days, dailySalesMap[dayName])
	}

	return &domain.DashboardStats{
		RevenueToday:     revenueToday,
		SalesCount:       salesCount,
		SalesLast7Days:   salesLast7Days,
		ProductNamesList: productNamesList,
	}, nil
}
