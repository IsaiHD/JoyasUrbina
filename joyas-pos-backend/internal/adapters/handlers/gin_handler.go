package handlers

import (
	"context"
	"fmt"
	"log"
	"math"
	"net/http"
	"sync"

	"joyas-urbina-backend/internal/core/domain"
	"joyas-urbina-backend/internal/core/ports"

	"github.com/gin-gonic/gin"
)

// Guard en memoria: evita procesar el mismo payment_id en paralelo si
// llegan dos webhooks casi simultáneos (optimización; la idempotencia
// real la da el UNIQUE(payment_id) + on_conflict en Supabase).
var (
	processingPayments = make(map[string]struct{})
	procMu             sync.Mutex
)

func tryLockPayment(paymentID string) bool {
	procMu.Lock()
	defer procMu.Unlock()
	if _, exists := processingPayments[paymentID]; exists {
		return false
	}
	processingPayments[paymentID] = struct{}{}
	return true
}

func unlockPayment(paymentID string) {
	procMu.Lock()
	defer procMu.Unlock()
	delete(processingPayments, paymentID)
}

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

// ENDPOINT PARA MERCADO PAGO (Recibe)
// El aviso al frontend ya no pasa por acá: el frontend escucha directo
// la tabla `pago_transaccion` vía Supabase Realtime (evento INSERT).
func (h *GinHandler) HandleWebhook(c *gin.Context) {
	var payload domain.MPWebhookPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusOK, gin.H{"status": "ignored"})
		return
	}

	if payload.Type == "payment" || payload.Action == "payment.created" || payload.Action == "payment.updated" {
		paymentID := payload.Data.ID

		// Evita procesar el mismo payment_id dos veces en paralelo si MP
		// reenvía el webhook casi al instante.
		if !tryLockPayment(paymentID) {
			log.Printf("[SKIP] Pago %s ya se está procesando\n", paymentID)
			c.JSON(http.StatusOK, gin.H{"status": "already_processing"})
			return
		}

		// La gorutina es excelente aquí para responderle rápido a Mercado Pago
		go func(paymentID string) {
			defer unlockPayment(paymentID)

			// Nota: Como estamos en una gorutina, es mejor crear un contexto nuevo
			// porque el c.Request.Context() se cancela al terminar la petición HTTP original.
			ctx := context.Background()

			detail, err := h.mpClient.GetPayment(ctx, paymentID)
			if err != nil {
				log.Printf("[ERROR] Obtener pago MP (%s): %v\n", paymentID, err)
				return
			}

			if detail.Status == "approved" {
				// installment_amount / net_received_amount vienen de MP; si no
				// vinieran (ej. pagos en 1 cuota a veces los omite), se calculan.
				montoCuota := detail.TransactionDetails.InstallmentAmount
				if montoCuota == 0 && detail.Installments > 0 {
					montoCuota = detail.TransactionAmt / float64(detail.Installments)
				}
				montoLiquido := detail.TransactionDetails.NetReceivedAmount
				if montoLiquido == 0 {
					montoLiquido = detail.TransactionAmt
				}

				tx := domain.PaymentTransaction{
					PaymentID:         fmt.Sprintf("%d", detail.ID),
					Monto:             int64(math.Round(detail.TransactionAmt)),
					Cuotas:            detail.Installments,
					MontoCuota:        montoCuota,
					MontoLiquido:      montoLiquido,
					MetodoPago:        detail.PaymentTypeID,
					TipoTarjeta:       detail.PaymentMethodID,
					EstadoVinculacion: "PENDIENTE",
				}

				// SaveTransaction hace upsert (merge-duplicates + on_conflict
				// sobre payment_id): si MP reenvía el webhook, esto actualiza
				// la fila existente en vez de duplicarla.
				if err := h.supabaseRepo.SaveTransaction(ctx, &tx); err != nil {
					log.Printf("[ERROR] Persistir pago en Supabase: %v\n", err)
					return
				}
				log.Printf("[OK] Pago aprobado %s registrado exitosamente.\n", paymentID)
			}
		}(paymentID)
	}

	c.JSON(http.StatusOK, gin.H{"status": "received"})
}
