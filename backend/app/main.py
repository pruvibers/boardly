import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.demo_auth import router as demo_auth_router
from app.api.onboarding import router as onboarding_router
from app.api.setup_scripts import router as setup_scripts_router


DEFAULT_ALLOWED_ORIGINS = ("http://localhost:3000",)


def get_allowed_origins() -> list[str]:
    configured_origins = os.getenv("BOARDLY_ALLOWED_ORIGINS")
    if configured_origins is None:
        return list(DEFAULT_ALLOWED_ORIGINS)
    return [
        origin.strip()
        for origin in configured_origins.split(",")
        if origin.strip()
    ]


def create_app() -> FastAPI:
    fastapi_app = FastAPI(title="Boardly Backend")
    fastapi_app.add_middleware(
        CORSMiddleware,
        allow_origins=get_allowed_origins(),
        allow_credentials=False,
        allow_methods=["GET", "POST", "PUT", "OPTIONS"],
        allow_headers=["Content-Type"],
    )
    fastapi_app.include_router(onboarding_router)
    fastapi_app.include_router(setup_scripts_router)
    fastapi_app.include_router(demo_auth_router)

    @fastapi_app.get("/")
    def read_root() -> dict[str, str]:
        return {
            "product": "Boardly",
            "status": "ok",
            "docs": "API documentation: /docs",
        }

    @fastapi_app.get("/health")
    def health() -> dict[str, str]:
        return {
            "status": "ok",
            "service": "boardly-backend",
        }

    return fastapi_app


app = create_app()
