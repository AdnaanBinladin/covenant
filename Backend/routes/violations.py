from http import HTTPStatus

from routes.auth import get_session
from supabase import rest_request


VALID_PARTNERS = {"A", "B"}
EMAIL_TO_PARTNER = {
    "adaubdool@gmail.com": "A",
    "hibah0403@gmail.com": "B",
}


def serialize_violation(row: dict[str, object]) -> dict[str, object]:
    return {
        "id": str(row.get("id", "")),
        "ruleId": str(row.get("rule_id", "")),
        "brokenBy": str(row.get("broken_by", "")),
        "note": row.get("note"),
        "forgiven": bool(row.get("forgiven", False)),
        "createdAt": row.get("created_at"),
    }


def _load_rule(rule_id: str) -> dict[str, object] | None:
    rows = rest_request(
        method="GET",
        path="/rest/v1/rules",
        query={
            "select": "id,status",
            "id": f"eq.{rule_id}",
            "limit": "1",
        },
        use_service_role=True,
    )
    return rows[0] if rows else None


def _set_rule_status(rule_id: str, status: str) -> None:
    rest_request(
        method="PATCH",
        path="/rest/v1/rules",
        query={"id": f"eq.{rule_id}"},
        body={"status": status},
        use_service_role=True,
    )


def handle_list_violations(handler) -> None:
    token = handler.get_bearer_token()
    session = get_session(token)

    if not session:
        handler.send_json(
            HTTPStatus.UNAUTHORIZED,
            {"error": "Session not found or expired."},
        )
        return

    try:
        rows = rest_request(
            method="GET",
            path="/rest/v1/violations",
            query={
                "select": "id,rule_id,broken_by,note,forgiven,created_at",
                "order": "created_at.desc",
            },
            use_service_role=True,
        )
    except RuntimeError as error:
        handler.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(error)})
        return

    handler.send_json(
        HTTPStatus.OK,
        {"violations": [serialize_violation(row) for row in rows or []]},
    )


def handle_create_violation(handler) -> None:
    token = handler.get_bearer_token()
    session = get_session(token)

    if not session:
        handler.send_json(
            HTTPStatus.UNAUTHORIZED,
            {"error": "Session not found or expired."},
        )
        return

    try:
        body = handler.read_json()
    except Exception:
        handler.send_json(HTTPStatus.BAD_REQUEST, {"error": "Invalid JSON body."})
        return

    rule_id = str(body.get("ruleId", "")).strip()
    broken_by = str(body.get("brokenBy", "")).strip()
    note = body.get("note")
    note_value = str(note).strip() if note is not None else None

    if not rule_id or broken_by not in VALID_PARTNERS:
        handler.send_json(
            HTTPStatus.BAD_REQUEST,
            {"error": "Rule and partner are required."},
        )
        return

    user = session.get("user") or {}
    reporter_email = str(user.get("email", "")).strip().lower()
    reporter_partner = EMAIL_TO_PARTNER.get(reporter_email)

    if reporter_partner and reporter_partner == broken_by:
        handler.send_json(
            HTTPStatus.FORBIDDEN,
            {"error": "You cannot report yourself."},
        )
        return

    try:
        rule = _load_rule(rule_id)
        if not rule:
          handler.send_json(HTTPStatus.NOT_FOUND, {"error": "Covenant not found."})
          return

        inserted = rest_request(
            method="POST",
            path="/rest/v1/violations",
            body={
                "rule_id": rule_id,
                "broken_by": broken_by,
                "note": note_value or None,
                "forgiven": False,
            },
            use_service_role=True,
            prefer="return=representation",
        )
        _set_rule_status(rule_id, "broken")
    except RuntimeError as error:
        handler.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(error)})
        return

    violation = inserted[0] if inserted else None
    if not violation:
        handler.send_json(
            HTTPStatus.INTERNAL_SERVER_ERROR,
            {"error": "Failed to record violation."},
        )
        return

    handler.send_json(HTTPStatus.CREATED, {"violation": serialize_violation(violation)})


def handle_forgive_violation(handler, violation_id: str) -> None:
    token = handler.get_bearer_token()
    session = get_session(token)

    if not session:
        handler.send_json(
            HTTPStatus.UNAUTHORIZED,
            {"error": "Session not found or expired."},
        )
        return

    try:
        current_rows = rest_request(
            method="GET",
            path="/rest/v1/violations",
            query={
                "select": "id,rule_id,broken_by,note,forgiven,created_at",
                "id": f"eq.{violation_id}",
                "limit": "1",
            },
            use_service_role=True,
        )
    except RuntimeError as error:
        handler.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(error)})
        return

    if not current_rows:
        handler.send_json(HTTPStatus.NOT_FOUND, {"error": "Violation not found."})
        return

    current = current_rows[0]
    rule_id = str(current.get("rule_id", ""))

    try:
        updated = rest_request(
            method="PATCH",
            path="/rest/v1/violations",
            query={
                "id": f"eq.{violation_id}",
                "select": "id,rule_id,broken_by,note,forgiven,created_at",
            },
            body={"forgiven": True},
            use_service_role=True,
            prefer="return=representation",
        )

        remaining = rest_request(
            method="GET",
            path="/rest/v1/violations",
            query={
                "select": "id",
                "rule_id": f"eq.{rule_id}",
                "forgiven": "eq.false",
                "limit": "1",
            },
            use_service_role=True,
        )

        if not remaining:
            _set_rule_status(rule_id, "active")
    except RuntimeError as error:
        handler.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(error)})
        return

    handler.send_json(HTTPStatus.OK, {"violation": serialize_violation(updated[0])})
