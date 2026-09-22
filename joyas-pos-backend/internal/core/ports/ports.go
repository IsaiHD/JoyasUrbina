package ports

import (
	"context"
	"joyas-urbina-backend/internal/core/domain"
)

type PaymentProvider interface {
	GetPayment(ctx context.Context, paymentID string) (*domain.MPPaymentDetail, error)
}

type TransactionRepository interface {
	SaveTransaction(ctx context.Context, tx *domain.PaymentTransaction) error
}

type PaymentUseCase interface {
	ProcessWebhook(ctx context.Context, payload domain.MPWebhookPayload) error
}
