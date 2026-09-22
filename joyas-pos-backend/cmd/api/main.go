package main

import (
	"log"
	"os"

	"joyas-urbina-backend/internal/adapters/handlers"
	"joyas-urbina-backend/internal/adapters/mercadopago"
	"joyas-urbina-backend/internal/adapters/supabase"

	"github.com/gin-gonic/gin"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	gin.SetMode(gin.ReleaseMode)
	router := gin.Default()

	mpToken := os.Getenv("MP_ACCESS_TOKEN")
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

	mpClient := mercadopago.NewClient(mpToken)
	supabaseRepo := supabase.NewRepository(supabaseURL, supabaseKey)
	handler := handlers.NewGinHandler(mpClient, supabaseRepo)

	// Rutas base
	router.GET("/health", handler.HealthCheck)
	router.POST("/webhook", handler.HandleWebhook)

	// Aquí podrás sumar tus futuros módulos:
	// api := router.Group("/api/v1")
	// {
	//     api.GET("/joyas", handler.GetJoyas)
	//     api.POST("/ventas", handler.CreateVenta)
	// }

	log.Printf("Iniciando API Joyas Urbina con Gin en puerto %s...", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Error al iniciar el servidor: %v", err)
	}
}
