from http import HTTPStatus

from routes.auth import get_session
from supabase import rest_request


VALID_CATEGORIES = {
    "communication",
    "trust",
    "respect",
    "affection",
    "growth",
    "boundaries",
}


def serialize_rule(row: dict[str, object]) -> dict[str, object]:
    return {
        "id": str(row.get("id", "")),
        "number": int(row.get("number", 0)),
        "title": str(row.get("title", "")),
        "description": str(row.get("description", "")),
        "category": str(row.get("category", "")),
        "consequence": str(row.get("consequence", "")),
        "status": str(row.get("status", "active")),
        "approvalStatus": str(row.get("approval_status", "pending")),
        "approvalConfirmedBy": row.get("approval_confirmed_by", []) or [],
        "lockedForDeletion": bool(row.get("locked_for_deletion", True)),
        "deletionConfirmedBy": row.get("deletion_confirmed_by", []) or [],
        "createdBy": str(row.get("created_by", "")),
        "createdAt": row.get("created_at"),
    }


def handle_list_covenants(handler) -> None:
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
            path="/rest/v1/rules",
            query={
                "select": "id,number,title,description,category,consequence,status,approval_status,approval_confirmed_by,locked_for_deletion,deletion_confirmed_by,created_at,created_by",
                "order": "number.asc",
            },
            use_service_role=True,
        )
    except RuntimeError as error:
        handler.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(error)})
        return

    handler.send_json(
        HTTPStatus.OK,
        {"rules": [serialize_rule(row) for row in rows or []]},
    )


def handle_create_covenant(handler) -> None:
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

    title = str(body.get("title", "")).strip()
    description = str(body.get("description", "")).strip()
    category = str(body.get("category", "")).strip()
    consequence = str(body.get("consequence", "")).strip()

    if not title or not description or not consequence or category not in VALID_CATEGORIES:
        handler.send_json(
            HTTPStatus.BAD_REQUEST,
            {"error": "Title, description, category, and consequence are required."},
        )
        return

    user = session.get("user") or {}
    created_by = str(user.get("id", ""))
    if not created_by:
        handler.send_json(HTTPStatus.UNAUTHORIZED, {"error": "Invalid session."})
        return

    try:
        current = rest_request(
            method="GET",
            path="/rest/v1/rules",
            query={
                "select": "number",
                "order": "number.desc",
                "limit": "1",
            },
            use_service_role=True,
        )
        next_number = (int(current[0]["number"]) if current else 0) + 1

        inserted = rest_request(
            method="POST",
            path="/rest/v1/rules",
            body={
                "number": next_number,
                "title": title,
                "description": description,
                "category": category,
                "consequence": consequence,
                "status": "active",
                "approval_status": "pending",
                "approval_confirmed_by": [created_by],
                "locked_for_deletion": True,
                "deletion_confirmed_by": [],
                "created_by": created_by,
            },
            use_service_role=True,
            prefer="return=representation",
        )
    except RuntimeError as error:
        handler.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(error)})
        return

    rule = inserted[0] if inserted else None
    if not rule:
        handler.send_json(
            HTTPStatus.INTERNAL_SERVER_ERROR,
            {"error": "Failed to create covenant."},
        )
        return

    handler.send_json(HTTPStatus.CREATED, {"rule": serialize_rule(rule)})


def handle_approve_covenant_addition(handler, rule_id: str) -> None:
    token = handler.get_bearer_token()
    session = get_session(token)

    if not session:
        handler.send_json(
            HTTPStatus.UNAUTHORIZED,
            {"error": "Session not found or expired."},
        )
        return

    user = session.get("user") or {}
    user_id = str(user.get("id", ""))
    if not user_id:
        handler.send_json(HTTPStatus.UNAUTHORIZED, {"error": "Invalid session."})
        return

    try:
        rows = rest_request(
            method="GET",
            path="/rest/v1/rules",
            query={
                "select": "id,number,title,description,category,consequence,status,approval_status,approval_confirmed_by,locked_for_deletion,deletion_confirmed_by,created_at,created_by",
                "id": f"eq.{rule_id}",
                "limit": "1",
            },
            use_service_role=True,
        )
    except RuntimeError as error:
        handler.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(error)})
        return

    if not rows:
        handler.send_json(HTTPStatus.NOT_FOUND, {"error": "Covenant not found."})
        return

    rule = rows[0]
    if str(rule.get("created_by", "")) == user_id:
        handler.send_json(
            HTTPStatus.FORBIDDEN,
            {"error": "You cannot approve your own covenant request."},
        )
        return

    confirmed_by = list(rule.get("approval_confirmed_by", []) or [])
    if user_id not in confirmed_by:
        confirmed_by.append(user_id)

    try:
        updated = rest_request(
            method="PATCH",
            path="/rest/v1/rules",
            query={
                "id": f"eq.{rule_id}",
                "select": "id,number,title,description,category,consequence,status,approval_status,approval_confirmed_by,locked_for_deletion,deletion_confirmed_by,created_at,created_by",
            },
            body={
                "approval_status": "approved",
                "approval_confirmed_by": confirmed_by,
            },
            use_service_role=True,
            prefer="return=representation",
        )
    except RuntimeError as error:
        handler.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(error)})
        return

    handler.send_json(HTTPStatus.OK, {"rule": serialize_rule(updated[0])})


def handle_cancel_covenant_addition(handler, rule_id: str) -> None:
    token = handler.get_bearer_token()
    session = get_session(token)

    if not session:
        handler.send_json(
            HTTPStatus.UNAUTHORIZED,
            {"error": "Session not found or expired."},
        )
        return

    user = session.get("user") or {}
    user_id = str(user.get("id", ""))
    if not user_id:
        handler.send_json(HTTPStatus.UNAUTHORIZED, {"error": "Invalid session."})
        return

    try:
        rows = rest_request(
            method="GET",
            path="/rest/v1/rules",
            query={
                "select": "id,approval_status,created_by",
                "id": f"eq.{rule_id}",
                "limit": "1",
            },
            use_service_role=True,
        )
    except RuntimeError as error:
        handler.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(error)})
        return

    if not rows:
        handler.send_json(HTTPStatus.NOT_FOUND, {"error": "Covenant not found."})
        return

    rule = rows[0]
    if str(rule.get("approval_status", "")) != "pending":
        handler.send_json(
            HTTPStatus.BAD_REQUEST,
            {"error": "Only pending covenant requests can be cancelled."},
        )
        return

    try:
        rest_request(
            method="DELETE",
            path="/rest/v1/rules",
            query={"id": f"eq.{rule_id}"},
            use_service_role=True,
        )
    except RuntimeError as error:
        handler.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(error)})
        return

    handler.send_json(HTTPStatus.OK, {"deleted": True, "ruleId": rule_id})


def handle_request_covenant_deletion(handler, rule_id: str) -> None:
    token = handler.get_bearer_token()
    session = get_session(token)

    if not session:
        handler.send_json(
            HTTPStatus.UNAUTHORIZED,
            {"error": "Session not found or expired."},
        )
        return

    user = session.get("user") or {}
    user_id = str(user.get("id", ""))
    if not user_id:
        handler.send_json(HTTPStatus.UNAUTHORIZED, {"error": "Invalid session."})
        return

    try:
        rows = rest_request(
            method="GET",
            path="/rest/v1/rules",
            query={
                "select": "id,number,title,description,category,consequence,status,approval_status,approval_confirmed_by,locked_for_deletion,deletion_confirmed_by,created_at,created_by",
                "id": f"eq.{rule_id}",
                "limit": "1",
            },
            use_service_role=True,
        )
    except RuntimeError as error:
        handler.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(error)})
        return

    if not rows:
        handler.send_json(HTTPStatus.NOT_FOUND, {"error": "Covenant not found."})
        return

    rule = rows[0]
    confirmed_by = list(rule.get("deletion_confirmed_by", []) or [])
    if user_id not in confirmed_by:
        confirmed_by.append(user_id)

    try:
        if len(confirmed_by) >= 2:
            rest_request(
                method="DELETE",
                path="/rest/v1/rules",
                query={"id": f"eq.{rule_id}"},
                use_service_role=True,
            )
            handler.send_json(HTTPStatus.OK, {"deleted": True, "ruleId": rule_id})
            return

        updated = rest_request(
            method="PATCH",
            path="/rest/v1/rules",
            query={
                "id": f"eq.{rule_id}",
                "select": "id,number,title,description,category,consequence,status,approval_status,approval_confirmed_by,locked_for_deletion,deletion_confirmed_by,created_at,created_by",
            },
            body={"deletion_confirmed_by": confirmed_by},
            use_service_role=True,
            prefer="return=representation",
        )
    except RuntimeError as error:
        handler.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(error)})
        return

    handler.send_json(
        HTTPStatus.OK,
        {"deleted": False, "rule": serialize_rule(updated[0])},
    )


def handle_cancel_covenant_deletion(handler, rule_id: str) -> None:
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
            path="/rest/v1/rules",
            query={
                "select": "id,number,title,description,category,consequence,status,approval_status,approval_confirmed_by,locked_for_deletion,deletion_confirmed_by,created_at,created_by",
                "id": f"eq.{rule_id}",
                "limit": "1",
            },
            use_service_role=True,
        )
    except RuntimeError as error:
        handler.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(error)})
        return

    if not rows:
        handler.send_json(HTTPStatus.NOT_FOUND, {"error": "Covenant not found."})
        return

    rule = rows[0]
    if not list(rule.get("deletion_confirmed_by", []) or []):
        handler.send_json(
            HTTPStatus.BAD_REQUEST,
            {"error": "There is no deletion request to cancel."},
        )
        return

    try:
        updated = rest_request(
            method="PATCH",
            path="/rest/v1/rules",
            query={
                "id": f"eq.{rule_id}",
                "select": "id,number,title,description,category,consequence,status,approval_status,approval_confirmed_by,locked_for_deletion,deletion_confirmed_by,created_at,created_by",
            },
            body={"deletion_confirmed_by": []},
            use_service_role=True,
            prefer="return=representation",
        )
    except RuntimeError as error:
        handler.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(error)})
        return

    handler.send_json(HTTPStatus.OK, {"rule": serialize_rule(updated[0])})
