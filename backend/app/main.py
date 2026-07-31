from fastapi import FastAPI

from app.api.onboarding import router as onboarding_router

app = FastAPI(title="Boardly Backend")
app.include_router(onboarding_router)


@app.get("/")
def read_root() -> dict[str, str]:
    return {
        "product": "Boardly",
        "status": "ok",
        "docs": "API documentation: /docs",
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "boardly-backend",
    }
