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
