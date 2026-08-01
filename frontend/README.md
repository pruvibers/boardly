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

## UI Foundation

The UI now uses the Boardly dashboard visual foundation. The underlying onboarding and setup-preview flows remain connected to the real backend, and unsupported prototype screens were intentionally not included.

Successful generated plans are summarized in a session-only dashboard. Session records exist only in React memory, refreshing the page clears them, and all dashboard metrics are derived from real backend responses.

## Generated Plan Views

The newcomer experience is the primary generated-plan presentation and uses real backend plan data. A full operator review remains available as a secondary view. This preview is session-only, is not a persistent invitation route, and refreshing the page clears all generated session plans.

## Application Routes

- `/workspace` is the HR/IT control plane for verified employee entry, plan generation and detailed operator review.
- `/onboard` is the isolated newcomer experience and does not include workspace controls or raw operator output.
- `/` redirects to `/workspace`.

Client-side navigation between `/workspace` and `/onboard` preserves the selected plan in React memory because both routes share the root onboarding session provider. Refreshing either route clears the session naturally. `/onboard` is currently a session preview rather than a persistent invitation link, and authentication has not been implemented yet.
