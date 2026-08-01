# Boardly Backend

Minimal FastAPI backend foundation for Boardly.

## Local Development

Create and activate a Python 3.14 virtual environment:

```powershell
cd backend
python --version
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

Run tests:

```powershell
pytest
```

Start the API:

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Onboarding Domain

Verified employee profiles are trusted records created by an authorized system. Employee notes are untrusted input and must never control authorization. Catalogs are deterministic allowlists for planned roles, resources, software, and documents. AI integration is not implemented yet. Deterministic policy enforcement is implemented separately in the policy module.

## Deterministic Policy Engine

AI recommendations are untrusted inputs. The policy engine validates them using verified role IDs and fixed catalogs, and employee notes never control authorization. Critical resources are blocked, while allowed recommendations still require human approval. No real provisioning is implemented.

## Deterministic Onboarding Planner

The planner creates a safe baseline onboarding plan from a verified employee role. Software, documents and access recommendations come from deterministic templates and catalogs, and every access recommendation is validated by the policy engine. Employee notes do not influence planning or authorization. AI integration and real provisioning are not implemented yet.

## Onboarding API

`POST /onboarding/plans/generate` creates a deterministic onboarding plan for a verified employee profile. The endpoint currently uses deterministic planning only; no access is provisioned, and returned policy decisions still require human approval.

Example request:

```powershell
curl.exe -X POST http://localhost:8000/onboarding/plans/generate `
  -H "Content-Type: application/json" `
  -d '{"employee_id":"emp-001","full_name":"Aylin Demir","work_email":"aylin.demir@example.com","role_id":"backend-junior","department":"Engineering","team_id":"backend","seniority":"junior","operating_system":"windows","location":"Istanbul","manager_id":"mgr-001","notes":null}'
```

## CORS

`BOARDLY_ALLOWED_ORIGINS` configures allowed browser origins as a comma-separated list. Empty entries are ignored, wildcard origins are not used, and credentials are not allowed. The default local frontend origin is `http://localhost:3000`.

## Safe Setup Script Preview

`POST /onboarding/setup-script/preview` previews a Windows PowerShell setup script for a verified employee profile. The MVP supports Windows PowerShell only. Software selections come from the deterministic onboarding planner, commands are generated through a strict `winget` allowlist, and Company VPN installation remains a manual IT-approved step. Scripts are previewed only: Boardly never executes generated scripts, and human review is required.

Example request:

```powershell
curl.exe -X POST http://localhost:8000/onboarding/setup-script/preview `
  -H "Content-Type: application/json" `
  -d '{"employee_id":"emp-001","full_name":"Aylin Demir","work_email":"aylin.demir@example.com","role_id":"backend-junior","department":"Engineering","team_id":"backend","seniority":"junior","operating_system":"windows","location":"Istanbul","manager_id":"mgr-001","notes":null}'
```

## SQLite Demo Persistence

Boardly stores the latest validated plan and local demo progress in SQLite. `BOARDLY_DB_PATH` may override the database location; the safe default is `backend/data/boardly-demo.sqlite3`, and generated database files are ignored by Git. Tables are initialized automatically.

Persisted endpoints:

- `GET /onboarding/plans`
- `GET /onboarding/plans/{employee_id}`
- `GET /onboarding/plans/{employee_id}/demo-state`
- `PUT /onboarding/plans/{employee_id}/demo-state`

Demo state includes checklist, document, acknowledgment, software, local ticket, and setup-preview progress. Submitted IDs are validated against the employee's real deterministic plan. Regenerating one employee replaces that plan and resets only that employee's demo state. Normalized work emails are unique across employees.

## Demo Authentication

`POST /demo-auth/login` validates the hackathon credentials used by the Next.js server. Admin credentials are `admin@boardly.demo` / `123`; newcomers use the normalized work email on a persisted plan with password `123`. The backend resolves the newcomer employee ID without exposing it in the form.

This is hackathon demo authentication, not production authentication. The Next.js layer creates a signed HTTP-only cookie that guards Next.js demo routes. The cookie does not authorize FastAPI endpoints.

FastAPI remains a local demo API and must not be exposed publicly. Bind it to `127.0.0.1` for presentations. Production requires backend authorization on every protected endpoint, real identity management, RBAC, CSRF review, secret management, and hardened session handling.

Demo IT tickets remain in SQLite and are not sent externally. Acknowledgments are non-binding, generated PDF summaries are demo-only, no access is provisioned, and setup scripts are never executed or downloaded.
