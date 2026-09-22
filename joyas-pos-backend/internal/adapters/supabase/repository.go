package supabase

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"joyas-urbina-backend/internal/core/domain"
	"joyas-urbina-backend/internal/core/ports"
)

type Repository struct {
	url        string
	apiKey     string
	httpClient *http.Client
}

func NewRepository(url, apiKey string) ports.TransactionRepository {
	return &Repository{
		url:        url,
		apiKey:     apiKey,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

func (r *Repository) SaveTransaction(ctx context.Context, tx *domain.PaymentTransaction) error {
	endpoint := fmt.Sprintf("%s/rest/v1/pago_transaccion", r.url)
	body, err := json.Marshal(tx)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewBuffer(body))
	if err != nil {
		return err
	}

	req.Header.Set("apikey", r.apiKey)
	req.Header.Set("Authorization", "Bearer "+r.apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Prefer", "resolution=merge-duplicates")

	resp, err := r.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		return fmt.Errorf("supabase rest falló con status: %d", resp.StatusCode)
	}

	return nil
}
