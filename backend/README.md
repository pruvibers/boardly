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
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Onboarding Domain

Verified employee profiles are trusted records created by an authorized system. Employee notes are untrusted input and must never control authorization. Catalogs are deterministic allowlists for planned roles, resources, software, and documents. AI integration is not implemented yet. Deterministic policy enforcement is implemented separately in the policy module.

## Deterministic Policy Engine

AI recommendations are untrusted inputs. The policy engine validates them using verified role IDs and fixed catalogs, and employee notes never control authorization. Critical resources are blocked, while allowed recommendations still require human approval. No real provisioning is implemented.

## Deterministic Onboarding Planner

The planner creates a safe baseline onboarding plan from a verified employee role. Software, documents and access recommendations come from deterministic templates and catalogs, and every access recommendation is validated by the policy engine. Employee notes do not influence planning or authorization. AI integration and real provisioning are not implemented yet.
