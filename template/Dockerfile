# Frontend build stage
FROM node:22-alpine AS frontend-builder

WORKDIR /app/web

# Limit Node.js memory to prevent OOM in CI environments
ENV NODE_OPTIONS="--max-old-space-size=3072"

# Copy package files first for better caching
COPY web/package*.json ./
RUN npm ci

# Copy frontend source and build
# Uses build:docker (vite only) since tsc already runs in pipeline lint step
COPY web/ ./
RUN npm run build:docker

# Backend build stage
FROM golang:1.25-alpine AS backend-builder

WORKDIR /app

# Install git (required for some Go modules)
RUN apk add --no-cache git

# Copy go mod files first for better caching
COPY go.mod go.sum* ./
RUN go mod download

# Copy source code
COPY . .

# Build the application with optimized flags
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o main ./cmd/api

# Final stage
FROM alpine:3.21

WORKDIR /app

# Install ca-certificates for HTTPS requests
RUN apk --no-cache add ca-certificates tzdata

# Create non-root user for security
RUN addgroup -g 1000 appgroup && \
    adduser -D -u 1000 -G appgroup appuser

# Copy the binary from backend builder
COPY --from=backend-builder /app/main .

# Copy the frontend build from frontend builder
COPY --from=frontend-builder /app/web/dist ./static

# Copy migrations folder for auto-migration on startup
COPY --from=backend-builder /app/migrations ./migrations

# Set ownership and switch to non-root user
RUN chown -R appuser:appgroup /app
USER appuser

# Expose port
EXPOSE 8080

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/api/health || exit 1

# Run the application
CMD ["./main"]
