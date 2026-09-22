# Etapa 1: Build
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Instalar certificados CA necesarios para llamadas HTTPS a Supabase/MP
RUN apk add --no-cache ca-certificates git

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Compilar binario estático optimizado
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /server ./cmd/api/main.go

# Etapa 2: Imagen final ultra ligera
FROM alpine:3.19

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /root/
COPY --from=builder /server .

# Cloud Run inyecta la variable PORT automáticamente (por defecto 8080)
EXPOSE 8080

CMD ["./server"]