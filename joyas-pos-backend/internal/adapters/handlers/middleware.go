package handlers

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type JWK struct {
	Kty string `json:"kty"`
	Kid string `json:"kid"`
	Use string `json:"use"`
	Alg string `json:"alg"`
	Crv string `json:"crv"`
	X   string `json:"x"`
	Y   string `json:"y"`
}

type JWKSResponse struct {
	Keys []JWK `json:"keys"`
}

var (
	jwksCache     = make(map[string]*ecdsa.PublicKey)
	jwksMutex     sync.RWMutex
	lastJWKSFetch time.Time
)

// fetchSupabasePublicKey descarga y almacena en caché las claves públicas de Supabase
func fetchSupabasePublicKey(kid string) (*ecdsa.PublicKey, error) {
	jwksMutex.RLock()
	key, found := jwksCache[kid]
	cacheFresh := time.Since(lastJWKSFetch) < 1*time.Hour
	jwksMutex.RUnlock()

	if found && cacheFresh {
		return key, nil
	}

	jwksMutex.Lock()
	defer jwksMutex.Unlock()

	// Doble chequeo después de adquirir el lock de escritura
	if key, found := jwksCache[kid]; found && time.Since(lastJWKSFetch) < 1*time.Hour {
		return key, nil
	}

	// Extraer referencia o usar URL estándar de tu proyecto Supabase
	// Si tienes SUPABASE_URL en tu .env la toma de ahí, de lo contrario usa tu ID actual
	baseURL := os.Getenv("SUPABASE_URL")
	if baseURL == "" {
		baseURL = "https://zrvilghkjblxpjdikfrp.supabase.co"
	}
	jwksURL := strings.TrimRight(baseURL, "/") + "/auth/v1/.well-known/jwks.json"

	resp, err := http.Get(jwksURL)
	if err != nil {
		return nil, fmt.Errorf("error solicitando JWKS de Supabase: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("código inesperado al obtener JWKS: %d", resp.StatusCode)
	}

	var jwks JWKSResponse
	if err := json.NewDecoder(resp.Body).Decode(&jwks); err != nil {
		return nil, fmt.Errorf("error parseando JSON de JWKS: %w", err)
	}

	for _, k := range jwks.Keys {
		if k.Kty == "EC" && k.Crv == "P-256" {
			xBytes, errX := base64.RawURLEncoding.DecodeString(k.X)
			yBytes, errY := base64.RawURLEncoding.DecodeString(k.Y)
			if errX == nil && errY == nil {
				pubKey := &ecdsa.PublicKey{
					Curve: elliptic.P256(),
					X:     new(big.Int).SetBytes(xBytes),
					Y:     new(big.Int).SetBytes(yBytes),
				}
				jwksCache[k.Kid] = pubKey
			}
		}
	}

	lastJWKSFetch = time.Now()

	pubKey, exists := jwksCache[kid]
	if !exists {
		return nil, errors.New("clave pública (kid) no encontrada en JWKS de Supabase")
	}

	return pubKey, nil
}

func SupabaseAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Falta el token de autorización"})
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
			// Soporte para tokens firmados con ES256 (Supabase moderno)
			if _, ok := t.Method.(*jwt.SigningMethodECDSA); ok {
				kid, ok := t.Header["kid"].(string)
				if !ok || kid == "" {
					return nil, errors.New("el token ES256 no contiene header kid")
				}
				return fetchSupabasePublicKey(kid)
			}

			// Soporte de compatibilidad para tokens simétricos HS256
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); ok {
				jwtSecret := os.Getenv("SUPABASE_JWT_SECRET")
				if jwtSecret == "" {
					return nil, errors.New("SUPABASE_JWT_SECRET no configurado en entorno")
				}
				return []byte(jwtSecret), nil
			}

			return nil, fmt.Errorf("algoritmo de token no soportado: %v", t.Header["alg"])
		})

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error":   "Token inválido o expirado",
				"details": err.Error(),
			})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "No se pudieron extraer los claims del token"})
			return
		}

		sub, ok := claims["sub"].(string)
		if !ok || sub == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token no contiene un ID de usuario válido (sub)"})
			return
		}

		c.Set("userID", sub)
		c.Next()
	}
}
