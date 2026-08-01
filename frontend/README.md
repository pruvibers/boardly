# Boardly Frontend

Boardly's Next.js frontend provides two role-separated hackathon demo surfaces: an HR/IT control plane and a personal newcomer onboarding portal. It uses the real deterministic FastAPI planner and local SQLite-backed demo progress; no mock plans or external integrations are used.

## Local Development

```powershell
cd frontend
npm install
npm run dev
```

Create `frontend/.env.local` and configure the backend URL plus a private demo-session secret containing at least 32 characters. The committed example intentionally contains no secret value.

```text
NEXT_PUBLIC_API_URL=http://localhost:8000
Set `BOARDLY_DEMO_SESSION_SECRET` to a private value containing at least 32 characters.
```

Run validation with:

```powershell
npm run lint
npm run build
```

## Demo Sign-In

This is hackathon demo authentication, not production authentication.

- HR/IT Admin: `admin@boardly.demo` / `123`
- Newcomer: the normalized `work_email` on a persisted plan / `123`

The signed HTTP-only cookie guards Next.js demo routes and contains only the demo role, resolved newcomer employee ID when applicable, and normalized work email. Admins may access `/workspace/...` and open employee newcomer previews. Newcomers may access only their own `/onboard/{employeeId}/...` routes and cannot access the workspace.

The cookie does not authorize FastAPI endpoints. FastAPI remains a local demo API and must not be exposed publicly; bind it to `127.0.0.1` for presentations. Production requires backend authorization on every protected endpoint, real identity management, RBAC, CSRF review, secret management, and secure session lifecycle controls.

## Routes

HR/IT routes:

- `/workspace/overview`
- `/workspace/new-onboarding`
- `/workspace/employees`
- `/workspace/employees/{employeeId}`
- `/workspace/operator-review/{employeeId}`

Newcomer routes:

- `/onboard/{employeeId}/overview`
- `/onboard/{employeeId}/tasks`
- `/onboard/{employeeId}/resources`
- `/onboard/{employeeId}/access`
- `/onboard/{employeeId}/setup`

Admin newcomer-preview links open in a new tab and hydrate the requested employee from the backend rather than relying on shared React state.

Each preview URL is generated directly from the employee row ID. The route ID is the source of truth for both plan and demo-state hydration, and Boardly rejects a loaded plan whose employee ID does not match the route.

## Demo Boundaries

Plans and interactive demo progress are stored in the local Boardly SQLite database and restored after refresh. Demo IT tickets are local only and are not sent externally. Document acknowledgments are non-binding, software confirmations are self-reported, and PDF review summaries contain demo summary data rather than source company documents.

Setup previews require explicit user action and currently support Windows PowerShell. Boardly never executes, copies to the clipboard, or launches setup commands. Newcomers cannot download setup scripts; the reviewed admin handoff described below is the only download path. Access recommendations remain read-only: no access is approved or provisioned from the frontend.

## Organization-Aware Onboarding

The HR/IT form builds its department options from a small default catalog plus distinct departments found in persisted plans. Operators may add a trimmed custom department inline; case-insensitive duplicates reuse the existing visible label. Department extension does not change role policy, so incompatible role and department combinations remain rejected by the deterministic planner.

New submissions collect manager full name and normalized work email, with an optional title. Existing managers are derived from persisted plan data and can be selected again. The normalized manager email becomes the deterministic `manager_id` for a new manager unless an existing explicit ID is available. Legacy plans containing only `manager_id` remain compatible.

Company job titles are visible organization metadata. The form offers defaults and distinct `job_title` values found in persisted plans, with an inline custom-add option that trims values and avoids case-insensitive duplicates. Legacy plans without `job_title` display a friendly fallback derived from their existing role ID.

The separate Policy role template selector contains only backend-supported `role_id` values. Custom job titles never become policy role IDs and do not alter deterministic software, access, document, or policy behavior.

Software confirmation is self-reported and synchronized through the persisted demo-state API across newcomer Overview, Resources, Setup, and the HR employee dashboard. Boardly does not detect or verify installed software.

## Boardly Intelligence

Boardly intelligence and the onboarding guide use deterministic plan, policy, verified-input, and progress data. They do not make a live AI request and should not be described as a live AI assistant unless a real provider is added later.

## Admin Setup Handoff

The HR employee dashboard can prepare a fresh real backend setup preview and, after explicit command-review acknowledgment, download an admin-only ZIP containing `README.md`, `boardly-setup.ps1`, `manifest.json`, and `SHA256SUMS.txt`. The PowerShell content is exactly the backend preview response; the browser does not generate additional commands.

Boardly never executes the package. Execution, if approved, happens outside Boardly under authorized IT controls. Windows PowerShell is currently the only supported executable format, and Linux shell export is not implemented.

## Multi-Employee Preview Regression

With the backend and frontend running and an HR/IT admin session active:

1. Open `/workspace/employees`.
2. Open the newcomer preview for `EMP-1003 / At Aygunes` and confirm the new tab URL is `/onboard/EMP-1003/overview` and the page identifies At Aygunes.
3. Open the newcomer preview for `EMP-1002 / Abdulkerim Akten` and confirm the new tab URL is `/onboard/EMP-1002/overview` and the page identifies Abdulkerim Akten.
4. Keep both tabs open and navigate within each portal. Confirm neither tab switches to the other employee and each tab loads progress for its own route employee ID.
5. Visit a nonexistent employee preview URL and confirm Boardly shows the unavailable-plan state rather than another persisted employee.
