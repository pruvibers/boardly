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

- `/onboard` is the default application entry and isolated newcomer experience. Its UI contains no direct navigation to the HR/IT workspace.
- `/workspace` is the separate backstage HR/IT demo control plane for verified employee entry, plan generation and detailed operator review.
- `/` redirects to `/onboard`.

For a presentation, `/workspace` can remain open in a separate presenter tab while HR/IT generates a plan and opens its newcomer preview. Client-side navigation preserves the selected plan in React memory because both routes share the root onboarding session provider, while refreshing either route clears the session naturally. This is route and UI separation only: authentication and role-based authorization are not implemented, and production separation requires authentication and RBAC. Setup scripts remain preview-only and are never executed by Boardly.

## Phase 2D Newcomer Journey

`/onboard` now supports session-only checklist interaction, with progress and deterministic next-step guidance derived from real checklist data. Task completion does not persist after refresh. Resources remain planned requirements rather than installed or accessible items, and access statuses remain review-only. Setup generation is still preview-only and Windows-only, with advanced commands hidden by default for newcomers. Authentication and persistent invitation flows are not implemented.
