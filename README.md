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
