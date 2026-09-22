package domain

import "time"

type PaymentTransaction struct {
	ID                string    `json:"id,omitempty"`
	PaymentID         string    `json:"payment_id"`
	DeviceID          string    `json:"device_id"`
	Monto             float64   `json:"monto"`
	Estado            string    `json:"estado"`
	MetodoPago        string    `json:"metodo_pago"`
	Cuotas            int       `json:"cuotas"`
	EstadoVinculacion string    `json:"estado_vinculacion"`
	Metadata          any       `json:"metadata"`
	CreatedAt         time.Time `json:"created_at,omitempty"`
}

type MPWebhookPayload struct {
	Action string `json:"action"`
	Type   string `json:"type"`
	Data   struct {
		ID string `json:"id"`
	} `json:"data"`
}

type MPPaymentDetail struct {
	ID             int64   `json:"id"`
	Status         string  `json:"status"`
	TransactionAmt float64 `json:"transaction_amount"`
	PaymentMethod  struct {
		ID   string `json:"id"`
		Type string `json:"type"`
	} `json:"payment_method"`
	Installments int    `json:"installments"`
	PosID        int    `json:"pos_id"`
	ExternalRef  string `json:"external_reference"`
	IntegratorID string `json:"integrator_id"`
}
