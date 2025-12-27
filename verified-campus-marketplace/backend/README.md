# Verified Campus Marketplace - Backend

## Getting Started

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

## API Base
`/api`

## Key Endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/products`
- `POST /api/products` (seller)
- `POST /api/orders` (authenticated)
- `POST /api/chat` (AI assistant)

## Run seed
```bash
npm run seed
```
