Mini Payments Gateway – Full Workflow Prototype

Overview
- Backend: Node.js + Express + MongoDB (JWT with roles, AES-256-CBC mock encryption)
- Frontend: React + Vite + TailwindCSS + Recharts
- Features: Checkout, Transactions with filters, Batch Payouts, Refunds, Analytics

Monorepo Layout
- backend/
- frontend/

Prerequisites
- Node.js 18+
- MongoDB running locally or Atlas URI

Environment (no third‑party API keys required)
Create backend/.env using the example values:

PORT=4000
MONGODB_URI=mongodb://localhost:27017/mini_payments
JWT_SECRET=supersecret_jwt_key_change_me
AES_KEY_HEX=00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff
AES_IV_HEX=00112233445566778899aabbccddeeff
CLIENT_ORIGIN=http://localhost:5173

Frontend env (optional):
Create frontend/.env with:
VITE_API_URL=http://localhost:4000

Install & Run
Backend
1) cd backend
2) npm install
3) npm run dev (or npm start)

Frontend
1) cd frontend
2) npm install
3) npm run dev

Login (roles)
- admin / password → Admin
- merchant / password → Merchant
- auditor / password → Auditor

API Summary
- POST /api/login -> { token }
- POST /api/checkout (auth) -> { txnId, status, paymentLink }
- GET /api/transactions (auth) -> list (supports status/method/date filtering)
- GET /api/analytics (auth) -> totals, revenue, daily trends, settlement/refund counts
- GET /api/analytics/methods (auth) -> per-method stats
- GET /api/analytics/settlement (auth) -> settlement ratio
- POST /api/settle/:txnId (auth) -> updates to SETTLED when eligible
- POST /api/payout (auth) -> bulk settle { txnIds: string[] }
- POST /api/refund/:txnId (auth) -> refund a SUCCESS

Notes
- No external API keys required. Only environment variables listed above.
- Encryption is demo only (fixed key/iv). Do not use as-is in production.
- CORS allowed for CLIENT_ORIGIN.
- Status randomization: SUCCESS 80%, FAILED 15%, PENDING 5%.

Troubleshooting
- Payments failing:
  - Ensure backend is running and frontend `VITE_API_URL` points to it
  - Confirm `JWT_SECRET`, `AES_KEY_HEX` (32 bytes), `AES_IV_HEX` (16 bytes) are set
  - Check MongoDB connectivity at `MONGODB_URI`
  - Login as `admin` or `merchant` before checkout

Deployment 
- Frontend: Vercel (VITE_API_URL points to backend)
- Backend: Render/Railway. Set env vars and allow CORS to frontend domain.


