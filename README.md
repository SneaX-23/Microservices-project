# Microservices E-Commerce Backend

A robust, event-driven **E-Commerce Backend** built on a **Microservices Architecture**.  
This system demonstrates advanced distributed-systems patterns including atomic inventory control, Kafka-based communication, API Gateway routing, background cron jobs, and resilient payment workflows.

## Architecture Overview
The backend handles user authentication, product inventory management, payment processing, and email notifications through decoupled, event-driven services.

## Services

### Gateway (Nginx)
- Acts as the single entry point
- Reverse proxies to internal services
- Performs authentication verification

### User Service
- Registration & Login
- JWT Access/Refresh token lifecycle
- Emits `user-created` Kafka events

### Inventory Service
- Product and stock management
- Atomic stock reservations using Redis Lua scripts
- PostgreSQL-backed persistent storage
- Zombie reservation cleanup via cron
- Handles payment success/failure events

### Payment Service
- Simulated payment processor
- Emits `PAYMENT_CONFIRMED` or `PAYMENT_FAILED`
- Processes refunds triggered by Inventory Service

### Email Service
- Kafka consumer
- Sends transactional emails (Welcome, Payment Success/Failure, Refund) via Resend

### Worker / Task / Notification Services
- Utility skeletons for future expansion

## Infrastructure
- PostgreSQL for durable storage
- Redis for atomic reservations, caching, idempotency keys
- Kafka for asynchronous messaging
- Docker Compose for full-stack orchestration

## Tech Stack

| Category | Technology |
|---------|------------|
| Language | TypeScript / Node.js (v20) |
| Framework | Express.js |
| Database | PostgreSQL (Prisma ORM) |
| Caching/Locking | Redis (ioredis) |
| Message Broker | Apache Kafka (kafkajs) |
| Validation | Zod |
| Logging | Winston |
| Email Provider | Resend |
| Gateway | Nginx |

# Getting Started

## 1. Prerequisites
- Docker & Docker Compose
- Node.js (for test scripts)

## 2. Environment Setup

Create a `.env` file at the project root.

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=user_db
INVENTORY_DB_USER=postgres
INVENTORY_DB_PASSWORD=password
INVENTORY_DB_NAME=inventory_db
JWT_ACCESS_SECRET=your_super_secret_key
KAFKA_BROKER=kafka:9092
REDIS_HOST=redis
RESEND_API_KEY=re_123456789
```

## 3. Start the Stack

```bash
docker-compose up --build
```

## 4. Database Migrations

```bash
docker-compose exec user-service npx prisma migrate deploy
docker-compose exec inventory-service npx prisma migrate deploy
```

# API Endpoints

Base URL: http://localhost:80

## Authentication
- POST /api/v1/auth/signup
- POST /api/v1/auth/login
- POST /api/v1/auth/refresh

## Inventory
- GET /api/v1/products
- POST /api/v1/inventory
- POST /api/v1/inventory/reserve

## Payment
- POST /api/v1/payment

# Key Logic

## Atomic Inventory Reservation
- Validate stock via Redis Lua
- Atomic decrement
- Create PENDING reservation
- Rollback on DB failure

## Zombie Reservation Cleanup
- Cron job runs every 10s
- Expires stale reservations
- Restores stock to Redis

## Payment & Refund Logic
- On `PAYMENT_CONFIRMED`: finalize stock
- On `PAYMENT_FAILED`: restore stock
- On late payment: trigger refund

# Testing

## Zombie Flow Test

```bash
npx ts-node microservices-project/testZombieFlow.ts
```

# Project Structure

```bash
microservices-project/
├── gateway/
├── user-service/
│   ├── prisma/
│   └── src/
│       ├── controllers/
│       ├── services/
│       ├── utils/
│       └── index.ts
├── inventory-service/
│   ├── prisma/
│   └── src/
│       ├── services/
│       ├── events/
│       └── utils/
├── payment-service/
│   └── src/
│       └── index.ts
├── email-service/
│   └── src/
│       ├── consumers/
│       ├── templates/
│       └── services/
└── docker-compose.yml
```
<div align ="center">
HAPPY CODING🎉
</div>