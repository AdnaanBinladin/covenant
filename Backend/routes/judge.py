from http import HTTPStatus

from gemini import generate_json
from routes.auth import get_session
from supabase import rest_request


SYSTEM_PROMPT = """You are an impartial relationship judge AI.
Your role is to fairly evaluate situations between two people based on predefined rules.
You must remain neutral, logical, and unbiased at all times.

You are NOT allowed to take sides emotionally.
You must base your judgment strictly on:

The defined rules
The described actions
Evidence (if provided)

If the situation is unclear, you must say so instead of guessing.

Return valid JSON with this exact shape:
{
  "decision": "violation" | "no_violation" | "unclear",
  "summary": "short verdict sentence",
  "reasoning": "brief explanation grounded in the rule and facts",
  "confidence": "high" | "medium" | "low"
}
"""


def _load_rule(rule_id: str) -> dict[str, object] | None:
    rows = rest_request(
        method="GET",
        path="/rest/v1/rules",
        query={
            "select": "id,number,title,description,category,consequence,approval_status",
            "id": f"eq.{rule_id}",
            "limit": "1",
        },
        use_service_role=True,
    )
    return rows[0] if rows else None


def handle_judge_violation(handler) -> None:
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
    accused_name = str(body.get("accusedName", "")).strip()
    happened = str(body.get("happened", "")).strip()

    if not rule_id or not accused_name or not happened:
        handler.send_json(
            HTTPStatus.BAD_REQUEST,
            {"error": "Rule, accused person, and incident description are required."},
        )
        return

    try:
        rule = _load_rule(rule_id)
    except RuntimeError as error:
        handler.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(error)})
        return

    if not rule:
        handler.send_json(HTTPStatus.NOT_FOUND, {"error": "Covenant not found."})
        return

    if str(rule.get("approval_status", "pending")) != "approved":
        handler.send_json(
            HTTPStatus.BAD_REQUEST,
            {"error": "Only approved covenants can be judged for violations."},
        )
        return

    prompt = (
        f"{SYSTEM_PROMPT}\n"
        f"Accused person: {accused_name}\n"
        f"Covenant number: {rule.get('number')}\n"
        f"Covenant title: {rule.get('title')}\n"
        f"Covenant definition: {rule.get('description')}\n"
        f"Covenant category: {rule.get('category')}\n"
        f"Consequence if broken: {rule.get('consequence')}\n"
        f"Reported incident:\n{happened}\n"
        "If the report lacks enough detail, return decision='unclear'."
    )

    try:
        judgment = generate_json(prompt)
    except RuntimeError as error:
        handler.send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(error)})
        return

    decision = str(judgment.get("decision", "")).strip()
    summary = str(judgment.get("summary", "")).strip()
    reasoning = str(judgment.get("reasoning", "")).strip()
    confidence = str(judgment.get("confidence", "")).strip()

    if decision not in {"violation", "no_violation", "unclear"}:
        handler.send_json(
            HTTPStatus.INTERNAL_SERVER_ERROR,
            {"error": "Gemini returned an unsupported decision."},
        )
        return

    if confidence not in {"high", "medium", "low"}:
        confidence = "low"

    handler.send_json(
        HTTPStatus.OK,
        {
            "judgment": {
                "decision": decision,
                "summary": summary or "No summary provided.",
                "reasoning": reasoning or "No reasoning provided.",
                "confidence": confidence,
            }
        },
    )
