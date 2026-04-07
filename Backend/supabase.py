import json
import os
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")


def get_supabase_key(use_service_role: bool = False) -> str:
    key = SUPABASE_SERVICE_ROLE_KEY if use_service_role else SUPABASE_ANON_KEY
    if not SUPABASE_URL or not key:
        raise RuntimeError("Missing Supabase configuration.")
    return key


def rest_request(
    method: str,
    path: str,
    query: dict[str, str] | None = None,
    body: dict | list | None = None,
    use_service_role: bool = False,
    prefer: str | None = None,
) -> object:
    key = get_supabase_key(use_service_role=use_service_role)
    url = f"{SUPABASE_URL}{path}"

    if query:
        url = f"{url}?{urlencode(query)}"

    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Accept": "application/json",
    }

    payload = None
    if body is not None:
        headers["Content-Type"] = "application/json"
        payload = json.dumps(body).encode("utf-8")

    if prefer:
        headers["Prefer"] = prefer

    request = Request(url=url, headers=headers, data=payload, method=method)

    try:
        with urlopen(request, timeout=15) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else None
    except HTTPError as error:
        try:
            raw_error = error.read().decode("utf-8")
            payload = json.loads(raw_error) if raw_error else {}
            message = (
                payload.get("message")
                or payload.get("error_description")
                or payload.get("error")
                or raw_error
                or f"HTTP {error.code}"
            )
        except Exception:
            message = f"HTTP {error.code}"

        raise RuntimeError(f"Supabase request failed: {message}") from error
    except URLError as error:
        raise RuntimeError("Supabase request failed: unable to reach Supabase.") from error
