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

`NEXT_PUBLIC_API_URL` points the frontend to the Boardly backend API.

This branch contains only the frontend foundation and does not call the backend yet.
