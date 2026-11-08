"""
FastAPI / Starlette Drop-In ASGI Middleware for AHD-Jailbreak.
Intercepts incoming HTTP POST requests, extracts user prompts, executes pre-inference screening,
and rejects jailbreak attacks with an HTTP 403 before downstream routes execute.
"""

import json
import time
from typing import Callable, Optional, Any, List
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse


class AHDMiddleware(BaseHTTPMiddleware):
    """
    Drop-in ASGI security middleware:
      app.add_middleware(AHDMiddleware, guard=ahd_guard)
    """

    def __init__(
        self,
        app: Callable,
        guard: Any = None,
        intercept_paths: Optional[list] = None
    ) -> None:
        super().__init__(app)
        self.guard = guard
        self.intercept_paths = intercept_paths or ["/chat/completions", "/predict", "/generate", "/api/chat"]

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Only intercept targeted POST API endpoints
        if request.method == "POST" and any(request.url.path.startswith(p) for p in self.intercept_paths):
            try:
                body_bytes = await request.body()
                if body_bytes:
                    payload = json.loads(body_bytes.decode("utf-8"))
                    prompt = ""
                    history = []

                    # OpenAI / Standard format
                    if "messages" in payload and isinstance(payload["messages"], list):
                        messages = payload["messages"]
                        if messages:
                            prompt = messages[-1].get("content", "")
                            history = messages[:-1]
                    elif "prompt" in payload:
                        prompt = payload["prompt"]
                        history = payload.get("conversation_history", [])

                    if prompt and self.guard:
                        eval_result = self.guard.evaluate(prompt, history=history)

                        if eval_result.action == "BLOCK":
                            return JSONResponse(
                                status_code=403,
                                content={
                                    "error": "Forbidden",
                                    "message": "Security policy violation: Request blocked by AHD-Jailbreak.",
                                    "risk_score": eval_result.risk_score,
                                    "uncertainty": eval_result.uncertainty,
                                    "reason_code": eval_result.reason_code,
                                    "defense_latency_ms": eval_result.latency_ms,
                                    "relational_explanation": eval_result.explanation
                                }
                            )

                    # Re-populate body for downstream handlers
                    async def receive():
                        return {"type": "http.request", "body": body_bytes}
                    request._receive = receive

            except Exception as e:
                # In production, continue on payload parse error
                pass

        return await call_next(request)
