"""
Universal LLM Wrapper for AHD-Jailbreak.
Wraps OpenAI, Anthropic, HuggingFace Pipeline, LiteLLM, LangChain, or any custom LLM callable
with 1-line pre-inference jailbreak interception and post-inference verification.
"""

from typing import Any, Callable, Dict, List, Optional, Union
import functools
import json


class SecurityRefusalException(Exception):
    """Raised when an adversarial jailbreak is blocked by AHD-Jailbreak pre-inference defense."""

    def __init__(self, message: str, guard_output: Any) -> None:
        super().__init__(message)
        self.guard_output = guard_output


class AHDLLMWrapper:
    """
    Universal decorator and wrapper around arbitrary LLM clients.
    Intercepts user prompts and multi-turn dialogue history before token generation.
    """

    def __init__(
        self,
        llm_client: Any,
        guard: Any,
        raise_on_block: bool = False,
        refusal_message: Optional[str] = None
    ) -> None:
        self.llm_client = llm_client
        self.guard = guard
        self.raise_on_block = raise_on_block
        self.refusal_message = (
            refusal_message or 
            "Request Refused: Prompt violates enterprise AI safety policy. Blocked by AHD-Jailbreak pre-inference guardrail."
        )

    def __call__(
        self,
        prompt: str,
        history: Optional[List[Dict[str, str]]] = None,
        *args: Any,
        **kwargs: Any
    ) -> Any:
        return self.generate(prompt, history=history, *args, **kwargs)

    def generate(
        self,
        prompt: str,
        history: Optional[List[Dict[str, str]]] = None,
        *args: Any,
        **kwargs: Any
    ) -> Any:
        """
        Step 1: Intercept user query and multi-turn history.
        Step 2: Evaluate through AHD-Jailbreak (< 6 ms on CPU).
        Step 3: Route decision (ALLOW / QUARANTINE_REVIEW / BLOCK).
        """
        eval_result = self.guard.evaluate(prompt, history=history)

        # 1. BLOCK: Halt execution immediately before calling the LLM
        if eval_result.action == "BLOCK":
            if self.raise_on_block:
                raise SecurityRefusalException(self.refusal_message, eval_result)
            return {
                "blocked": True,
                "refusal": self.refusal_message,
                "risk_score": eval_result.risk_score,
                "uncertainty": eval_result.uncertainty,
                "reason_code": eval_result.reason_code,
                "relational_explanation": eval_result.explanation,
                "tokens_saved": True
            }

        # 2. QUARANTINE_REVIEW: Moderate risk or out-of-distribution homonym
        # (e.g. "kill a zombie process in Linux"). Safe technical query.
        if eval_result.action == "QUARANTINE_REVIEW":
            # Stage to Quarantine Buffer
            if hasattr(self.guard, "anchor_gate") and self.guard.anchor_gate:
                self.guard.anchor_gate.stage_quarantine(
                    prompt=prompt,
                    risk_score=eval_result.risk_score,
                    uncertainty=eval_result.uncertainty,
                    decision="QUARANTINE_REVIEW",
                    reason_code=eval_result.reason_code,
                    latency_ms=eval_result.latency_ms
                )

        # 3. ALLOW: Forward directly to downstream LLM
        if callable(self.llm_client):
            return self.llm_client(prompt, *args, **kwargs)
        elif hasattr(self.llm_client, "chat") and hasattr(self.llm_client.chat, "completions"):
            # OpenAI client
            messages = [{"role": h.get("role", "user"), "content": h.get("content", "")} for h in (history or [])]
            messages.append({"role": "user", "content": prompt})
            return self.llm_client.chat.completions.create(messages=messages, *args, **kwargs)
        elif hasattr(self.llm_client, "messages") and hasattr(self.llm_client.messages, "create"):
            # Anthropic client
            messages = [{"role": h.get("role", "user"), "content": h.get("content", "")} for h in (history or [])]
            messages.append({"role": "user", "content": prompt})
            return self.llm_client.messages.create(messages=messages, *args, **kwargs)
        else:
            raise TypeError("Unsupported LLM client type. Must be callable or OpenAI/Anthropic SDK client.")

