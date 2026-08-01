# Boardly

Boardly is a local-first AI onboarding copilot for turning a verified employee role into a clear, explainable onboarding plan.

New employees often lose time waiting for access, guessing which tools they need, and searching across scattered documentation. Teams also need a controlled way to translate role requirements into onboarding actions without allowing automation to bypass security review.

Boardly will generate role-based onboarding recommendations for access, required software, relevant documentation, checklists, and safe setup packages. AI will assist with discovery and planning, while deterministic controls keep sensitive actions governed and auditable.

Core security principle: "AI recommends, policy engine restricts, humans approve."

## Planned Technology Stack

- Frontend: Next.js, TypeScript, Tailwind CSS
- Frontend runtime: Node.js 20 LTS
- Backend: Python 3.14, FastAPI
- Database: PostgreSQL
- Local AI: Ollama with Qwen2.5:7b
- Runtime orchestration: Docker Compose

## Planned Architecture

- Frontend web app for onboarding plan review and approval workflows
- Backend API for role verification, recommendation orchestration, and workflow coordination
- PostgreSQL database for persisted onboarding plans, approvals, and audit data
- Ollama local model runtime for AI-generated recommendations
- Deterministic policy engine for restricting sensitive actions before human approval

This repository currently contains the initial project scaffold and minimal FastAPI backend foundation.

The onboarding domain contracts and deterministic mock catalogs now exist in the backend.

Deterministic access-policy validation now exists for onboarding recommendations.

Deterministic onboarding-plan generation now exists for verified employee profiles.

The deterministic onboarding planner is now exposed through a FastAPI endpoint.

Safe Windows setup-script previews can now be generated for deterministic onboarding plans.

The Next.js frontend foundation now exists in the frontend workspace.

The frontend now submits employee profiles and renders deterministic onboarding results.

Windows setup-script previews can now be requested from the onboarding result UI.

The demo application now provides role-separated HR/IT and newcomer routes, signed HTTP-only demo sessions, and local SQLite persistence for plans and demo progress.

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

Newcomer software progress is synchronized through the local demo-state API. Boardly intelligence explains deterministic recommendation and policy rationale without claiming a live AI call. Admins may download a reviewed Windows PowerShell setup handoff ZIP containing documentation, the exact backend preview, a manifest, and SHA-256 checksums. Boardly never executes the package, and Linux shell export is not implemented.

## Employee Identity And Roles

Company `job_title` is stored as visible employee metadata and may be extended from persisted plan data. The closed `role_id` catalog remains Boardly's verified policy role template and continues to determine software, access, documents, and policy decisions.

Admin newcomer-preview URLs are generated directly from each employee row's stable ID. The route employee ID is used to load both the persisted plan and demo state from SQLite; a mismatched response is rejected rather than rendering another employee.
