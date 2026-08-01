import os

import httpx


class BuddyModelUnavailable(RuntimeError):
    """Raised when the configured local model cannot answer."""


class BuddyModelProtocolError(RuntimeError):
    """Raised when Ollama returns an unusable transport response."""


class OllamaBuddyClient:
    def __init__(
        self,
        base_url: str | None = None,
        model: str | None = None,
        timeout_seconds: float | None = None,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        self.base_url = (base_url or os.getenv("OLLAMA_BASE_URL", "")).strip()
        self.model = (model or os.getenv("OLLAMA_MODEL", "")).strip()
        self.timeout_seconds = (
            timeout_seconds
            if timeout_seconds is not None
            else _configured_timeout_seconds()
        )
        self.transport = transport

    def generate(self, messages: list[dict[str, str]]) -> str:
        if not self.base_url or not self.model:
            raise BuddyModelUnavailable(
                "OLLAMA_BASE_URL and OLLAMA_MODEL must be configured"
            )

        try:
            with httpx.Client(
                timeout=httpx.Timeout(self.timeout_seconds),
                transport=self.transport,
            ) as client:
                response = client.post(
                    f"{self.base_url.rstrip('/')}/api/chat",
                    json={
                        "model": self.model,
                        "stream": False,
                        "format": "json",
                        "messages": messages,
                        "options": {
                            "temperature": 0.2,
                            "num_predict": 450,
                        },
                    },
                )
                response.raise_for_status()
        except (httpx.TimeoutException, httpx.NetworkError) as error:
            raise BuddyModelUnavailable("local Ollama model is unavailable") from error
        except httpx.HTTPError as error:
            raise BuddyModelUnavailable("local Ollama request failed") from error

        try:
            payload = response.json()
            message = payload["message"]
            content = message["content"]
        except (KeyError, TypeError, ValueError) as error:
            raise BuddyModelProtocolError(
                "Ollama returned an unexpected response"
            ) from error
        if not isinstance(content, str) or not content.strip():
            raise BuddyModelProtocolError("Ollama returned an empty response")
        if len(content) > 20_000:
            raise BuddyModelProtocolError("Ollama response exceeded the safe limit")
        return content.strip()


def _configured_timeout_seconds() -> float:
    configured = os.getenv("OLLAMA_TIMEOUT_SECONDS", "120").strip()
    try:
        timeout = float(configured)
    except ValueError as error:
        raise BuddyModelUnavailable(
            "OLLAMA_TIMEOUT_SECONDS must be a number"
        ) from error
    if timeout < 1 or timeout > 120:
        raise BuddyModelUnavailable(
            "OLLAMA_TIMEOUT_SECONDS must be between 1 and 120"
        )
    return timeout
