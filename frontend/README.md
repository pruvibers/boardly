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

## Demo Boundaries

Plans and interactive demo progress are stored in the local Boardly SQLite database and restored after refresh. Demo IT tickets are local only and are not sent externally. Document acknowledgments are non-binding, software confirmations are self-reported, and PDF review summaries contain demo summary data rather than source company documents.

Setup previews require explicit user action and currently support Windows PowerShell. Boardly never executes, copies, launches, or downloads setup scripts. Access recommendations remain read-only: no access is approved or provisioned from the frontend.
