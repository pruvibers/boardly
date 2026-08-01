import json

import httpx
import pytest

from app.buddy.ollama import BuddyModelUnavailable, OllamaBuddyClient


def test_ollama_adapter_uses_configured_chat_endpoint_and_model() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        payload = json.loads(request.content)
        assert str(request.url) == "http://127.0.0.1:11434/api/chat"
        assert payload["model"] == "qwen2.5:7b"
        assert payload["stream"] is False
        assert payload["format"] == "json"
        assert payload["messages"] == [
            {"role": "user", "content": "Question"}
        ]
        return httpx.Response(
            200,
            json={"message": {"content": '{"message":"ok"}'}},
        )

    client = OllamaBuddyClient(
        base_url="http://127.0.0.1:11434/",
        model="qwen2.5:7b",
        timeout_seconds=5,
        transport=httpx.MockTransport(handler),
    )

    assert client.generate(
        [{"role": "user", "content": "Question"}]
    ) == '{"message":"ok"}'


def test_ollama_adapter_accepts_docker_host_environment(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv(
        "OLLAMA_BASE_URL", "http://host.docker.internal:11434/"
    )
    monkeypatch.setenv("OLLAMA_MODEL", "qwen2.5:7b")
    monkeypatch.setenv("OLLAMA_TIMEOUT_SECONDS", "120")

    def handler(request: httpx.Request) -> httpx.Response:
        payload = json.loads(request.content)
        assert str(request.url) == (
            "http://host.docker.internal:11434/api/chat"
        )
        assert payload["model"] == "qwen2.5:7b"
        return httpx.Response(
            200,
            json={"message": {"content": '{"message":"ok"}'}},
        )

    client = OllamaBuddyClient(transport=httpx.MockTransport(handler))

    assert client.timeout_seconds == 120
    assert client.generate(
        [{"role": "user", "content": "Question"}]
    ) == '{"message":"ok"}'


def test_ollama_timeout_is_reported_as_model_unavailable() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("timed out", request=request)

    client = OllamaBuddyClient(
        base_url="http://127.0.0.1:11434",
        model="qwen2.5:7b",
        timeout_seconds=1,
        transport=httpx.MockTransport(handler),
    )

    with pytest.raises(BuddyModelUnavailable):
        client.generate([{"role": "user", "content": "Question"}])


def test_ollama_requires_endpoint_and_model() -> None:
    client = OllamaBuddyClient(base_url=" ", model=" ", timeout_seconds=5)

    with pytest.raises(BuddyModelUnavailable):
        client.generate([{"role": "user", "content": "Question"}])
