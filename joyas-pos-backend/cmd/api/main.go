package main

import (
	"database/sql"
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"

	"joyas-urbina-backend/internal/adapters/handlers"
	"joyas-urbina-backend/internal/adapters/mercadopago"
	"joyas-urbina-backend/internal/adapters/postgres"
)

func main() {
	if err := godotenv.Overload(); err != nil {
		log.Println("[WARN] No se encontró el archivo .env, leyendo variables del sistema")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("Falta la variable de entorno DATABASE_URL")
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("Error abriendo conexión a DB: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Error conectando a la base de datos: %v", err)
	}
	log.Println("[OK] Conectado a PostgreSQL exitosamente")

	// Instanciación de Repositorios (Adaptadores secundarios)
	ventasRepo := postgres.NewVentasRepo(db)
	dashRepo := postgres.NewDashboardRepo(db)

	mpToken := os.Getenv("MP_ACCESS_TOKEN")
	mpClient := mercadopago.NewClient(mpToken)

	// Instanciación de Controladores (Adaptadores primarios)
	apiHandler := handlers.NewAPIHandler(ventasRepo, dashRepo)
	webhookHandler := handlers.NewGinHandler(mpClient, nil)

	// Configuración del Router Gin
	gin.SetMode(gin.ReleaseMode)
	router := gin.Default()

	// --- CONFIGURACIÓN DE CORS ---
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true // Permite peticiones desde cualquier origen (Frontend local o en producción)
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	router.Use(cors.New(config))
	// -----------------------------

	// Rutas Públicas (No requieren JWT)
	router.GET("/health", webhookHandler.HealthCheck)
	router.POST("/webhook", webhookHandler.HandleWebhook)

	// Rutas Protegidas (Requieren sesión de usuario válida)
	api := router.Group("/api/v1")
	api.Use(handlers.SupabaseAuthMiddleware())
	{
		// Módulo Ventas
		api.POST("/ventas/vincular", apiHandler.VincularPago)
		api.GET("/ventas", apiHandler.GetVentas)
		api.POST("/ventas", apiHandler.CreateVenta)

		// Catálogos
		api.GET("/catalogos", apiHandler.GetCatalogs)
		api.GET("/metodos-pago", apiHandler.GetMetodosPago)

		// Módulo Dashboard
		api.GET("/dashboard/stats", apiHandler.GetDashboardStats)
	}

	log.Printf("Iniciando API Joyas Urbina con Gin en puerto %s...", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Error al iniciar el servidor: %v", err)
	}
}
