package mercadopago

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"joyas-urbina-backend/internal/core/domain"
	"joyas-urbina-backend/internal/core/ports"
)

type Client struct {
	accessToken string
	httpClient  *http.Client
}

func NewClient(accessToken string) ports.PaymentProvider {
	return &Client{
		accessToken: accessToken,
		httpClient:  &http.Client{Timeout: 10 * time.Second},
	}
}

func (c *Client) GetPayment(ctx context.Context, paymentID string) (*domain.MPPaymentDetail, error) {
	url := fmt.Sprintf("https://api.mercadopago.com/v1/payments/%s", paymentID)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+c.accessToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("mp api respondió con status: %d", resp.StatusCode)
	}

	var detail domain.MPPaymentDetail
	if err := json.NewDecoder(resp.Body).Decode(&detail); err != nil {
		return nil, err
	}

	return &detail, nil
}
