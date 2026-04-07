import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta"
DEFAULT_GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")


def _extract_text(payload: dict) -> str:
    candidates = payload.get("candidates", [])
    for candidate in candidates:
        content = candidate.get("content", {})
        parts = content.get("parts", [])
        texts = [part.get("text", "") for part in parts if isinstance(part, dict)]
        combined = "\n".join(text for text in texts if text).strip()
        if combined:
            return combined
    return ""


def generate_json(prompt: str, model: str | None = None) -> dict:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("Missing Gemini API key.")

    target_model = model or DEFAULT_GEMINI_MODEL
    url = f"{GEMINI_API_URL}/models/{target_model}:generateContent?key={api_key}"
    body = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt,
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json",
        },
    }

    request = Request(
        url=url,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urlopen(request, timeout=30) as response:
            raw = response.read().decode("utf-8")
            payload = json.loads(raw) if raw else {}
    except HTTPError as error:
        raw = error.read().decode("utf-8")
        try:
            payload = json.loads(raw) if raw else {}
            message = payload.get("error", {}).get("message") or raw or f"HTTP {error.code}"
        except Exception:
            message = raw or f"HTTP {error.code}"
        raise RuntimeError(f"Gemini request failed: {message}") from error
    except URLError as error:
        raise RuntimeError("Gemini request failed: unable to reach Gemini.") from error

    text = _extract_text(payload)
    if not text:
        raise RuntimeError("Gemini returned an empty judgment.")

    try:
        return json.loads(text)
    except json.JSONDecodeError as error:
        raise RuntimeError("Gemini returned invalid JSON.") from error
