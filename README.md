# API Cost Tracker MVP

This is the MVP backend and frontend for the API Cost Tracker app. It allows users to:

- Manage API integrations (OpenAI, Stripe, Twilio, etc.)
- Record and view usage/cost data
- Set up alerts/thresholds for overusage
- User authentication (signup, login, logout)

---

## Monorepo Structure

/frontend # React or Next.js frontend
/backend # Fastify + Effect-TS backend

---

## Backend

### Setup

```bash
cd backend
pnpm install
cp .env.example .env   # add your env variables (JWT secret, etc.)
pnpm dev               # start the server
```

## Frontend

### Setup

```bash
cd frontend
pnpm install
pnpm dev
```
