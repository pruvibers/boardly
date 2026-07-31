from fastapi import FastAPI

app = FastAPI(title="Boardly Backend")


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
