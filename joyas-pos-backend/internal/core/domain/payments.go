package domain

import "time"

// PaymentTransaction refleja 1:1 las columnas de la tabla public.pago_transaccion.
// id_transaccion y creado_en los genera Postgres (omitempty / no se envían al insertar).
type PaymentTransaction struct {
	IDTransaccion     int64     `json:"id_transaccion,omitempty"`
	PaymentID         string    `json:"payment_id"`
	Monto             int64     `json:"monto"`
	Cuotas            int       `json:"cuotas"`
	MontoCuota        float64   `json:"monto_cuota"`
	MontoLiquido      float64   `json:"monto_liquido"`
	MetodoPago        string    `json:"metodo_pago"`
	TipoTarjeta       string    `json:"tipo_tarjeta"`
	EstadoVinculacion string    `json:"estado_vinculacion"`
	CreadoEn          time.Time `json:"creado_en,omitempty"`
}

type MPWebhookPayload struct {
	Action string `json:"action"`
	Type   string `json:"type"`
	Data   struct {
		ID string `json:"id"`
	} `json:"data"`
}

// MPPaymentDetail mapea la respuesta real de GET /v1/payments/{id} de Mercado
// Pago. payment_method_id y payment_type_id son campos planos (no un objeto
// anidado "payment_method"), y los montos post-comisión vienen en
// transaction_details.
type MPPaymentDetail struct {
	ID              int64      `json:"id"`
	Status          string     `json:"status"`
	TransactionAmt  float64    `json:"transaction_amount"`
	PaymentMethodID string     `json:"payment_method_id"` // ej: "visa", "master", "account_money"
	PaymentTypeID   string     `json:"payment_type_id"`   // ej: "credit_card", "debit_card"
	Installments    int        `json:"installments"`
	ExternalRef     string     `json:"external_reference"`
	IntegratorID    string     `json:"integrator_id"`
	DateApproved    *time.Time `json:"date_approved"` // <-- Fecha y hora exacta de aprobación en la máquina
	DateCreated     *time.Time `json:"date_created"`

	TransactionDetails struct {
		NetReceivedAmount float64 `json:"net_received_amount"`
		InstallmentAmount float64 `json:"installment_amount"`
		TotalPaidAmount   float64 `json:"total_paid_amount"`
	} `json:"transaction_details"`
}
