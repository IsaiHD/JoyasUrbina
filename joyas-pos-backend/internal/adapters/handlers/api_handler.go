package handlers

import (
	"net/http"

	"joyas-urbina-backend/internal/core/domain"
	"joyas-urbina-backend/internal/core/ports"

	"github.com/gin-gonic/gin"
)

type APIHandler struct {
	ventasRepo ports.VentasRepository
	dashRepo   ports.DashboardRepository
}

func NewAPIHandler(v ports.VentasRepository, d ports.DashboardRepository) *APIHandler {
	return &APIHandler{ventasRepo: v, dashRepo: d}
}

// POST /api/v1/ventas/vincular
func (h *APIHandler) VincularPago(c *gin.Context) {
	var req struct {
		Venta         domain.Venta `json:"venta"`
		TransaccionID int          `json:"transaccion_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido"})
		return
	}

	// Obtener ID del usuario desde el JWT (previamente inyectado por el Middleware de Auth)
	req.Venta.IDUsuario = c.GetString("userID")

	if err := h.ventasRepo.VincularPagoConVenta(c.Request.Context(), &req.Venta, req.TransaccionID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "Vinculación exitosa"})
}

// GET /api/v1/dashboard/stats
func (h *APIHandler) GetDashboardStats(c *gin.Context) {
	stats, err := h.dashRepo.GetDashboardStats(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// ====================================================================
// MÉTODOS FALTANTES AÑADIDOS
// ====================================================================

// GET /api/v1/ventas
func (h *APIHandler) GetVentas(c *gin.Context) {
	ventas, err := h.ventasRepo.GetVentas(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Si es nulo, devolvemos un array vacío para no romper el frontend de React
	if ventas == nil {
		ventas = []domain.Venta{}
	}

	c.JSON(http.StatusOK, ventas)
}

// POST /api/v1/ventas
func (h *APIHandler) CreateVenta(c *gin.Context) {
	var venta domain.Venta
	if err := c.ShouldBindJSON(&venta); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON de venta inválido"})
		return
	}

	// Inyectar el usuario que está realizando la acción
	venta.IDUsuario = c.GetString("userID")

	if err := h.ventasRepo.CreateVentaDirecta(c.Request.Context(), &venta); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"status": "Venta registrada exitosamente"})
}

// GET /api/v1/catalogos
func (h *APIHandler) GetCatalogs(c *gin.Context) {
	catalogs, err := h.ventasRepo.GetCatalogs(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, catalogs)
}

// GET /api/v1/metodos-pago
func (h *APIHandler) GetMetodosPago(c *gin.Context) {
	metodos, err := h.ventasRepo.GetMetodosPago(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Prevenir nulos para el frontend
	if metodos == nil {
		metodos = []map[string]any{}
	}

	c.JSON(http.StatusOK, metodos)
}
