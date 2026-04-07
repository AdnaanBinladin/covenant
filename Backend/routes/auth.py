from datetime import datetime, timedelta, timezone
from http import HTTPStatus
from uuid import uuid4
from supabase import rest_request


SESSION_TTL_HOURS = 12
SESSIONS: dict[str, dict[str, object]] = {}


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def expires_at_timestamp() -> int:
    return int((now_utc() + timedelta(hours=SESSION_TTL_HOURS)).timestamp() * 1000)


def title_from_email(email: str) -> str:
    local_part = email.split("@", 1)[0].replace(".", " ").replace("_", " ")
    cleaned = " ".join(part for part in local_part.split() if part)
    return cleaned.title() or email


def build_public_user(user: dict[str, object]) -> dict[str, str]:
    email = str(user.get("email", ""))
    return {
        "id": str(user.get("id", "")),
        "name": title_from_email(email),
        "email": email,
    }


def fetch_user_by_email(email: str) -> dict[str, object] | None:
    try:
        payload = rest_request(
            method="GET",
            path="/rest/v1/users",
            query={
                "select": "id,email,password",
                "email": f"eq.{email}",
                "limit": "1",
            },
            use_service_role=True,
        )
    except RuntimeError as error:
        raise RuntimeError("Unable to reach Supabase users table.") from error

    if not payload:
        return None

    return payload[0]


def get_session(token: str | None) -> dict[str, object] | None:
    if not token:
        return None

    session = SESSIONS.get(token)
    if not session:
        return None

    if int(session["expires_at"]) < int(now_utc().timestamp() * 1000):
        SESSIONS.pop(token, None)
        return None

    return session


def handle_login(handler) -> None:
    try:
        body = handler.read_json()
    except Exception:
        handler.send_json(HTTPStatus.BAD_REQUEST, {"error": "Invalid JSON body."})
        return

    email = str(body.get("email", "")).strip().lower()
    password = str(body.get("password", ""))

    if not email or not password:
        handler.send_json(
            HTTPStatus.BAD_REQUEST,
            {"error": "Email and password are required."},
        )
        return

    try:
        user = fetch_user_by_email(email)
    except RuntimeError as error:
        handler.send_json(
            HTTPStatus.INTERNAL_SERVER_ERROR,
            {"error": str(error)},
        )
        return

    if not user or str(user.get("password", "")) != password:
        handler.send_json(
            HTTPStatus.UNAUTHORIZED,
            {"error": "Invalid email or password."},
        )
        return

    token = str(uuid4())
    expires_at = expires_at_timestamp()
    public_user = build_public_user(user)

    SESSIONS[token] = {
        "user": public_user,
        "expires_at": expires_at,
    }

    handler.send_json(
        HTTPStatus.OK,
        {
            "token": token,
            "expiresAt": expires_at,
            "user": public_user,
        },
    )


def handle_session(handler) -> None:
    token = handler.get_bearer_token()
    session = get_session(token)

    if not session:
        handler.send_json(
            HTTPStatus.UNAUTHORIZED,
            {"error": "Session not found or expired."},
        )
        return

    handler.send_json(
        HTTPStatus.OK,
        {
            "token": token,
            "expiresAt": session["expires_at"],
            "user": session["user"],
        },
    )


def handle_logout(handler) -> None:
    token = handler.get_bearer_token()
    if token:
        SESSIONS.pop(token, None)

    handler.send_json(HTTPStatus.OK, {"success": True})
