# Verified Campus Marketplace

Full-stack marketplace for students with seller onboarding, admin controls, carts/orders, and AI-powered chat/review analysis.

## Features
- Auth with role-based access (student, seller, admin) and JWT httpOnly cookies.
- Product catalog with reviews, carts, checkout, and order history.
- Seller application + dashboards for sellers/admins; student dashboard for buyers.
- AI services: chatbot, review analyzer, fake/abuse detector (OpenAI or Gemini).
- Firebase storage integration for media uploads.
- Frontend React + Vite + Tailwind with protected routes and chat widget.
- Hardened API middleware (helmet, compression, validation, centralized errors) with MongoDB persistence.

## Tech Stack
- Backend: Node.js, Express, MongoDB/Mongoose, Firebase Admin, JWT, Multer, OpenAI / Google Gen AI.
- Frontend: React 18, Vite, TailwindCSS, React Router, Axios, Headless UI / Heroicons.

## Project Structure
- [backend](backend): Express API, auth, products, orders, reviews, cart, AI services.
- [frontend](frontend): React SPA, routing, dashboards, chat widget.

## Prerequisites
- Node.js 18+ and npm
- MongoDB instance (local or Atlas)
- Firebase service account for storage (if using uploads)
- OpenAI or Gemini API key (for AI features)

## Backend Setup
1) Install deps:
```bash
cd backend
npm install
```
2) Copy env template and fill values:
```bash
cp .env.example .env
```
Key vars (see [backend/.env.example](backend/.env.example)):
- `PORT` (default 5000)
- `MONGODB_URI`
- `JWT_SECRET`, `JWT_EXPIRE`
- `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_STORAGE_BUCKET`
- `OPENAI_API_KEY` and/or `GEMINI_API_KEY`
- `FRONTEND_URL` (for CORS)
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` (default admin bootstrap)
3) Seed demo data (optional):
```bash
npm run seed
```
4) Start API:
```bash
npm run dev    # with nodemon
# or
npm start
```
API runs at http://localhost:5000 (health: `/api/health`).

## Frontend Setup
1) Install deps:
```bash
cd frontend
npm install
```
2) Create env file:
```bash
cp .env.example .env.local  # if you add one
```
Set `VITE_API_URL` (defaults to `http://localhost:5000/api`).
3) Run dev server:
```bash
npm run dev
```
App runs at http://localhost:5173.

## Development Notes
- Backend entry: [backend/server.js](backend/server.js); app config/middleware: [backend/app.js](backend/app.js).
- Routes mounted under `/api` in [backend/routes](backend/routes).
- Frontend entry: [frontend/src/main.jsx](frontend/src/main.jsx); routing in [frontend/src/router.jsx](frontend/src/router.jsx); shared layout in [frontend/src/App.jsx](frontend/src/App.jsx).
- Axios client uses `VITE_API_URL` and sends credentials; see [frontend/src/api/axios.js](frontend/src/api/axios.js).

## Testing & Validation
- Manual: hit `GET /api/health` after starting API; smoke key flows (auth, product browse, cart/checkout, dashboards, chat assistant).
- Linting/formatting not configured; add as needed (ESLint/Prettier).

## Deployment Checklist
- Set strong `JWT_SECRET`, production `MONGODB_URI`, and API keys.
- Configure HTTPS and secure cookies; set CORS origin to deployed frontend.
- Provision Firebase bucket and update env vars.
- Build frontend (`npm run build`) and serve via CDN or static host; point it to deployed API URL.
