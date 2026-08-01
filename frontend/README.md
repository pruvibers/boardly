# Boardly Frontend

Next.js frontend foundation for Boardly.

## Local Installation

```powershell
cd frontend
npm install
```

## Development Server

```powershell
npm run dev
```

## Production Build

```powershell
npm run build
```

## Environment

Create `frontend/.env.local` when local overrides are needed.

```text
NEXT_PUBLIC_API_URL=http://localhost:8000
```

`NEXT_PUBLIC_API_URL` points the frontend to the Boardly backend API. The backend must be running on port `8000` by default for local integration.

The employee form now calls the onboarding-plan API and renders deterministic onboarding results.

Setup-preview integration uses `POST /onboarding/setup-script/preview`. Preview generation requires explicit user action after a plan is generated, supports Windows PowerShell only in this MVP, and Boardly never executes returned scripts.
