from datetime import datetime, timezone
from http import HTTPStatus

from routes.auth import get_session
from supabase import rest_request


def handle_stats(handler) -> None:
    token = handler.get_bearer_token()
    session = get_session(token)

    if not session:
        handler.send_json(
            HTTPStatus.UNAUTHORIZED,
            {"error": "Session not found or expired."},
        )
        return

    try:
        rules = rest_request(
            method="GET",
            path="/rest/v1/rules",
            query={
                "select": "id",
                "approval_status": "eq.approved",
            },
            use_service_role=True,
        ) or []

        violations = rest_request(
            method="GET",
            path="/rest/v1/violations",
            query={"select": "id,broken_by,created_at"},
            use_service_role=True,
        ) or []
    except RuntimeError as error:
        handler.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(error)})
        return

    violations_a = sum(1 for violation in violations if violation.get("broken_by") == "A")
    violations_b = sum(1 for violation in violations if violation.get("broken_by") == "B")

    last_violation = None
    if violations:
        last_violation = max(
            (
                violation.get("created_at")
                for violation in violations
                if violation.get("created_at")
            ),
            default=None,
        )

    streak_days = 0
    if last_violation:
        try:
            last_violation_dt = datetime.fromisoformat(
                str(last_violation).replace("Z", "+00:00")
            )
            streak_days = max(
                0,
                int((datetime.now(timezone.utc) - last_violation_dt).total_seconds() // 86400),
            )
        except ValueError:
            streak_days = 0

    handler.send_json(
        HTTPStatus.OK,
        {
            "stats": {
                "totalRules": len(rules),
                "totalViolations": len(violations),
                "violationsByPartner": {
                    "A": violations_a,
                    "B": violations_b,
                },
                "streakDays": streak_days,
                "lastViolationDate": last_violation,
            }
        },
    )
