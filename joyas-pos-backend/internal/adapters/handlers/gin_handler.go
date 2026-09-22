package handlers

import (
	"fmt"
	"log"
	"net/http"

	"joyas-urbina-backend/internal/core/domain"
	"joyas-urbina-backend/internal/core/ports"

	"github.com/gin-gonic/gin"
)

type GinHandler struct {
	mpClient     ports.PaymentProvider
	supabaseRepo ports.TransactionRepository
}

func NewGinHandler(mp ports.PaymentProvider, sb ports.TransactionRepository) *GinHandler {
	return &GinHandler{
		mpClient:     mp,
		supabaseRepo: sb,
	}
}

func (h *GinHandler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "healthy"})
}

func (h *GinHandler) HandleWebhook(c *gin.Context) {
	var payload domain.MPWebhookPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusOK, gin.H{"status": "ignored"})
		return
	}

	if payload.Type == "payment" || payload.Action == "payment.created" || payload.Action == "payment.updated" {
		go func(paymentID string) {
			ctx := c.Request.Context()
			detail, err := h.mpClient.GetPayment(ctx, paymentID)
			if err != nil {
				log.Printf("[ERROR] Obtener pago MP (%s): %v\n", paymentID, err)
				return
			}

			if detail.Status == "approved" {
				tx := domain.PaymentTransaction{
					PaymentID:         fmt.Sprintf("%d", detail.ID),
					DeviceID:          fmt.Sprintf("%d", detail.PosID),
					Monto:             detail.TransactionAmt,
					Estado:            detail.Status,
					MetodoPago:        detail.PaymentMethod.Type,
					Cuotas:            detail.Installments,
					EstadoVinculacion: "PENDIENTE",
					Metadata:          detail,
				}

				if err := h.supabaseRepo.SaveTransaction(ctx, &tx); err != nil {
					log.Printf("[ERROR] Persistir pago en Supabase: %v\n", err)
					return
				}
				log.Printf("[OK] Pago aprobado %s registrado exitosamente.\n", paymentID)
			}
		}(payload.Data.ID)
	}

	c.JSON(http.StatusOK, gin.H{"status": "received"})
}
