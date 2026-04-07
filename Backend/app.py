import json
import os
from pathlib import Path
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


def load_env_file() -> None:
    env_path = Path(__file__).with_name(".env")
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


load_env_file()


from routes.auth import handle_login, handle_logout, handle_session
from routes.covenants import (
    handle_approve_covenant_addition,
    handle_cancel_covenant_addition,
    handle_cancel_covenant_deletion,
    handle_create_covenant,
    handle_list_covenants,
    handle_request_covenant_deletion,
)
from routes.violations import (
    handle_create_violation,
    handle_forgive_violation,
    handle_list_violations,
)
from routes.stats import handle_stats


PORT = int(os.getenv("PORT", "4000"))
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")


class AuthHandler(BaseHTTPRequestHandler):
    server_version = "CovenantAuthPython/0.1"

    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", FRONTEND_ORIGIN)
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        super().end_headers()

    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self.end_headers()

    def do_GET(self) -> None:
        if self.path == "/api/health":
            self.send_json(
                HTTPStatus.OK,
                {
                    "status": "ok",
                    "service": "covenant-auth-python",
                    "time": datetime.now(timezone.utc).isoformat(),
                },
            )
            return

        if self.path == "/api/auth/session":
            handle_session(self)
            return

        if self.path == "/api/covenants":
            handle_list_covenants(self)
            return

        if self.path == "/api/violations":
            handle_list_violations(self)
            return

        if self.path == "/api/stats":
            handle_stats(self)
            return

        self.send_json(HTTPStatus.NOT_FOUND, {"error": "Route not found."})

    def do_POST(self) -> None:
        if self.path == "/api/auth/login":
            handle_login(self)
            return

        if self.path == "/api/auth/logout":
            handle_logout(self)
            return

        if self.path == "/api/covenants":
            handle_create_covenant(self)
            return

        if self.path.startswith("/api/covenants/") and self.path.endswith("/delete-request"):
            rule_id = (
                self.path.removeprefix("/api/covenants/")
                .removesuffix("/delete-request")
                .strip("/")
            )
            handle_request_covenant_deletion(self, rule_id)
            return

        if self.path.startswith("/api/covenants/") and self.path.endswith("/approve-addition"):
            rule_id = (
                self.path.removeprefix("/api/covenants/")
                .removesuffix("/approve-addition")
                .strip("/")
            )
            handle_approve_covenant_addition(self, rule_id)
            return

        if self.path.startswith("/api/covenants/") and self.path.endswith("/cancel-addition"):
            rule_id = (
                self.path.removeprefix("/api/covenants/")
                .removesuffix("/cancel-addition")
                .strip("/")
            )
            handle_cancel_covenant_addition(self, rule_id)
            return

        if self.path.startswith("/api/covenants/") and self.path.endswith("/cancel-deletion"):
            rule_id = (
                self.path.removeprefix("/api/covenants/")
                .removesuffix("/cancel-deletion")
                .strip("/")
            )
            handle_cancel_covenant_deletion(self, rule_id)
            return

        if self.path == "/api/violations":
            handle_create_violation(self)
            return

        if self.path.startswith("/api/violations/") and self.path.endswith("/forgive"):
            violation_id = (
                self.path.removeprefix("/api/violations/")
                .removesuffix("/forgive")
                .strip("/")
            )
            handle_forgive_violation(self, violation_id)
            return

        self.send_json(HTTPStatus.NOT_FOUND, {"error": "Route not found."})

    def read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length > 0 else b"{}"
        return json.loads(raw.decode("utf-8"))

    def get_bearer_token(self) -> str | None:
        header = self.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return None
        return header.removeprefix("Bearer ").strip() or None

    def send_json(self, status: HTTPStatus, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format: str, *args) -> None:
        return


def run() -> None:
    server = ThreadingHTTPServer(("0.0.0.0", PORT), AuthHandler)
    print(f"Covenant backend listening on http://localhost:{PORT}")
    print(f"Allowed frontend origin: {FRONTEND_ORIGIN}")
    print("Auth routes loaded from Backend/routes/auth.py")
    server.serve_forever()


if __name__ == "__main__":
    run()
