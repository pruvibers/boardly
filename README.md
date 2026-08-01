# Boardly

Boardly is a local-first onboarding operations platform that turns a verified employee role into a clear, explainable onboarding plan.

New employees often lose time waiting for access, guessing which tools they need, and searching across scattered documentation. Teams also need a controlled way to translate role requirements into onboarding actions without allowing automation to bypass security review.

Boardly will generate role-based onboarding recommendations for access, required software, relevant documentation, checklists, and safe setup packages. AI will assist with discovery and planning, while deterministic controls keep sensitive actions governed and auditable.

Core security principle: "AI recommends, policy engine restricts, humans approve."

Code determines facts. The local model interprets the situation. Humans approve actions.

## Planned Technology Stack

- Frontend: Next.js, TypeScript, Tailwind CSS
- Frontend runtime: Node.js 20 LTS
- Backend: Python 3.14, FastAPI
- Demo persistence: SQLite
- Planned production database: PostgreSQL
- Local AI: Ollama with Qwen2.5:7b
- Runtime orchestration: Docker Compose

## Planned Architecture

- Frontend web app for onboarding plan review and approval workflows
- Backend API for role verification, recommendation orchestration, and workflow coordination
- PostgreSQL database for persisted onboarding plans, approvals, and audit data
- Ollama local model runtime for AI-generated recommendations
- Deterministic policy engine for restricting sensitive actions before human approval

This repository contains the working Boardly hackathon demo and its local development and Docker foundations.

The onboarding domain contracts and deterministic mock catalogs now exist in the backend.

Deterministic access-policy validation now exists for onboarding recommendations.

Deterministic onboarding-plan generation now exists for verified employee profiles.

The deterministic onboarding planner is now exposed through a FastAPI endpoint.

Safe Windows setup-script previews can now be generated for deterministic onboarding plans.

The Next.js frontend foundation now exists in the frontend workspace.

The frontend now submits employee profiles and renders deterministic onboarding results.

Windows setup-script previews can now be requested from the onboarding result UI.

The demo application now provides role-separated Operator and Newcomer experiences, signed HTTP-only demo sessions, and local SQLite persistence for plans and demo progress.

JedAI now uses configurable local Qwen inference to interpret and prioritize each employee's current deterministic plan and persisted demo state.

## JedAI

JedAI is Boardly's local, state-aware onboarding copilot. Deterministic code provides verified employee state, while the local Qwen model interprets that state to prioritize work, explain blockers and recommend practical next actions. JedAI cannot perform tasks, approve access or execute setup.

For every question, FastAPI reloads only the route employee's verified plan and persisted demo state, computes task and resource status in code, and sends that bounded context to the configured local Qwen model through Ollama. The model may explain priorities, sequence useful work, and reason around blockers, but it cannot complete tasks, sign documents, approve or provision access, create tickets, or execute setup. The response is validated as structured JSON; unknown item IDs are discarded and application code maps accepted items to existing Boardly routes.

Boardly does not currently implement RAG or a company knowledge base, and JedAI does not claim knowledge of company-document content. When Ollama is unavailable, the UI explicitly shows limited basic plan guidance instead of presenting the fallback as model-generated. JedAI conversations remain in React memory for the open drawer session and are not persisted in browser storage.

Configure the backend process before starting FastAPI:

```powershell
$env:OLLAMA_BASE_URL="http://127.0.0.1:11434"
$env:OLLAMA_MODEL="qwen2.5:7b"
$env:OLLAMA_TIMEOUT_SECONDS="120"
```

Ollama and the selected model must already be running locally; Boardly does not start or download them. Example questions include `I have 30 minutes. What should I do?`, `What can I finish while VPN access is waiting?`, and `What can I prepare before an operator helps?`.

## Docker

Docker Compose runs the frontend and backend while connecting the backend to an Ollama instance that is already running on the host. It does not define an Ollama service, start Ollama, or download a model.

Create a root `.env` from `.env.example`, set `BOARDLY_DEMO_SESSION_SECRET` to a private value containing at least 32 characters, and then start Boardly:

```powershell
Copy-Item .env.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
docker compose up --build
```

Place the generated value only in the ignored root `.env`. The Compose backend uses `http://host.docker.internal:11434` for host Ollama, `qwen2.5:7b`, and a 120-second timeout. Linux receives the `host.docker.internal:host-gateway` mapping. The browser reaches FastAPI at `http://localhost:8000`, while server-side Next.js routes use the private Compose address `http://backend:8000`.

Open `http://localhost:3000`. Both published service ports are bound to `127.0.0.1`. Direct non-Docker backend development instead uses `OLLAMA_BASE_URL=http://127.0.0.1:11434`.

## Backend Development

Create and activate a Python 3.14 virtual environment:

```powershell
cd backend
python --version
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install backend dependencies:

```powershell
pip install -r requirements.txt
```

Run backend tests:

```powershell
pytest
```

Start the backend API:

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Demo Security Scope

Boardly's signed HTTP-only cookie guards Next.js demo routes only. This is hackathon demo authentication, not production authentication, and the cookie does not authorize FastAPI endpoints. FastAPI remains a local demo API that must not be exposed publicly; bind it to `127.0.0.1` for presentations.

Production requires backend authorization on every protected endpoint, real identity management, RBAC, CSRF review, secret management, and hardened session handling.

## Phase 3 Demo Experience

Boardly now derives organization department and manager choices from persisted plan data. New manager details include name, normalized work email, and optional title; the normalized email is used as a deterministic manager ID when no explicit ID exists. Legacy manager-ID-only plans remain compatible, and custom organization labels do not bypass deterministic role policy.

Newcomer software progress is synchronized through the local demo-state API. Deterministic operator panels explain recommendation and policy rationale without claiming a live model call. Operator and newcomer review surfaces may download a reviewed Windows PowerShell setup handoff ZIP containing documentation, the exact backend preview, a manifest, and SHA-256 checksums. Boardly never executes the package, and Linux shell export is not implemented.

Document review, demo-summary receipt, and demo acknowledgment remain distinct. Signing a non-binding demo acknowledgment marks that demo preview reviewed. Successfully generating and initiating the local PDF download marks `demo_summary_received` for that employee and document. The PDF contains only the local review and acknowledgment summary; Boardly does not claim that an original company document was received.

## Employee Identity And Roles

Company `job_title` is stored as visible employee metadata and may be extended from persisted plan data. The closed `role_id` catalog remains Boardly's verified policy role template and continues to determine software, access, documents, and policy decisions.

Operator newcomer-preview URLs are generated directly from each employee row's stable ID. The route employee ID is used to load both the persisted plan and demo state from SQLite; a mismatched response is rejected rather than rendering another employee.
