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
$env:OLLAMA_BASE_URL="http://127.0.0.1:11434"
$env:OLLAMA_MODEL="qwen2.5:7b"
$env:OLLAMA_TIMEOUT_SECONDS="120"
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Onboarding Domain

Verified employee profiles are trusted records created by an authorized system. Employee notes are untrusted input and must never control authorization. Catalogs are deterministic allowlists for planned roles, resources, software, and documents. The onboarding planner remains deterministic, and policy enforcement is implemented separately in the policy module.

## Deterministic Policy Engine

AI recommendations are untrusted inputs. The policy engine validates them using verified role IDs and fixed catalogs, and employee notes never control authorization. Critical resources are blocked, while allowed recommendations still require human approval. No real provisioning is implemented.

## Deterministic Onboarding Planner

The planner creates a safe baseline onboarding plan from a verified employee role. Software, documents and access recommendations come from deterministic templates and catalogs, and every access recommendation is validated by the policy engine. Employee notes do not influence planning or authorization. The planner does not call AI, and real provisioning is not implemented.

## JedAI API

`POST /onboarding/plans/{employee_id}/buddy` powers JedAI, Boardly's local, state-aware onboarding copilot. It answers a bounded onboarding question using a freshly loaded, employee-specific plan and persisted demo state. The request contains only `question` and `current_surface`. Direct host development uses `OLLAMA_BASE_URL=http://127.0.0.1:11434`, `OLLAMA_MODEL=qwen2.5:7b`, and `OLLAMA_TIMEOUT_SECONDS=120`. The configured Ollama model must already be available; Boardly never starts or downloads it.

The backend sends structured facts to local Qwen, validates its JSON response, discards unknown item IDs, and limits recommended actions and blockers to three each. The model interprets state but cannot mutate it, approve access, provision resources, or execute setup. If the local model is unavailable or malformed after one correction attempt, JedAI returns explicitly labeled basic plan guidance. No RAG or company-document knowledge base is implemented.

Code determines facts. The local model interprets the situation. Humans approve actions.

For Docker, Compose supplies `OLLAMA_BASE_URL=http://host.docker.internal:11434`, the same model and timeout, and the Linux-compatible `host.docker.internal:host-gateway` mapping. Ollama remains a host-managed process and is not included in the Compose application.

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

`POST /onboarding/setup-script/preview` previews a Windows PowerShell setup script for a verified employee profile. The MVP supports Windows PowerShell only. Software selections come from the deterministic onboarding planner, commands are generated through a strict `winget` allowlist, and Company VPN installation remains a manual operator-approved step. Scripts are previewed only: Boardly never executes generated scripts, and human review is required.

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

Demo state includes checklist, document review, `demo_summary_received`, acknowledgment, software, local support-request, and setup-preview progress. Legacy SQLite JSON containing `document_receipt_state` is normalized into `demo_summary_received`, so existing databases do not need to be deleted. Submitted IDs are validated against the employee's real deterministic plan. Regenerating one employee replaces that plan and resets only that employee's demo state. Normalized work emails are unique across employees.

## Demo Authentication

`POST /demo-auth/login` validates the hackathon credentials used by the Next.js server. Operator credentials are `admin@boardly.demo` / `123`; the internal session role remains `admin`. Newcomers use the normalized work email on a persisted plan with password `123`. The backend resolves the newcomer employee ID without exposing it in the form.

This is hackathon demo authentication, not production authentication. The Next.js layer creates a signed HTTP-only cookie that guards Next.js demo routes. The cookie does not authorize FastAPI endpoints.

FastAPI remains a local demo API and must not be exposed publicly. Bind it to `127.0.0.1` for presentations. Production requires backend authorization on every protected endpoint, real identity management, RBAC, CSRF review, secret management, and hardened session handling.

Demo support requests remain in SQLite and are not sent externally. Acknowledgments are non-binding, generated PDF summaries are demo-only, no access is provisioned, and the backend never executes setup scripts. The deliberate operator-reviewed frontend handoff described below packages a reviewed preview for execution outside Boardly.

## Organization, Role And Manager Data

`VerifiedEmployeeProfile` supports optional `manager_name`, `manager_work_email`, and `manager_title` fields while preserving legacy `manager_id` payloads. When manager details are supplied, name and email are required, manager email is normalized, and the normalized email deterministically becomes `manager_id` unless an explicit existing ID is supplied. These fields serialize inside the validated plan JSON; no separate manager table is used.

The optional `job_title` field stores a company's visible employee title. Supplied values are trimmed and blank values are rejected; legacy plans without the field remain valid. `job_title` is not a policy key: the existing supported `role_id` remains Boardly's verified policy role template and exclusively controls deterministic planning and access-policy behavior.

Organization department labels are stored directly in each verified employee profile and persisted plan. They do not alter or bypass deterministic role and department validation.

## Setup Handoff Boundary

The frontend's operator-reviewed setup handoff uses the exact response from the existing Windows PowerShell preview endpoint. Boardly does not execute the package or add commands. Windows PowerShell remains the only supported executable setup format, and Linux shell export is not implemented.
