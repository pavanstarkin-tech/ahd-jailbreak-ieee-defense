"""
Module 13: Privacy-by-Default Audit Logger with Salted HMAC-SHA256
==================================================================
Guarantees:
  - ZERO raw user prompt text stored on disk (LOG_RAW_PROMPTS=false)
  - Salted HMAC-SHA256 cryptographic digests for auditable non-reversible tracking
  - SQLite Write-Ahead Logging (WAL) mode for concurrency and zero lock contention
"""

import os
import hmac
import hashlib
import sqlite3
import time
from typing import Dict, Any, Optional


class PrivacyAuditLogger:
    """
    Module 13 Privacy-Preserving Audit Logger.
    """

    def __init__(
        self,
        db_path: str = "data/audit/privacy_audit.db",
        salt: Optional[str] = None,
        log_raw_prompts: bool = False
    ):
        self.db_path = db_path
        self.salt = salt or os.getenv("AHD_HMAC_SALT", "9f8e7d6c5b4a3210a8f4c9123b7d51e09f8e7d6c5b4a3210a8f4c9123b7d51e0")
        self.log_raw_prompts = log_raw_prompts or (os.getenv("LOG_RAW_PROMPTS", "false").lower() == "true")
        self._init_db()

    def _init_db(self):
        os.makedirs(os.path.dirname(self.db_path) or ".", exist_ok=True)
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("PRAGMA journal_mode=WAL;")
            conn.execute("PRAGMA synchronous=NORMAL;")
            conn.execute("""
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp REAL NOT NULL,
                    prompt_hmac TEXT NOT NULL,
                    risk_score REAL NOT NULL,
                    uncertainty REAL NOT NULL,
                    decision TEXT NOT NULL,
                    reason_code TEXT NOT NULL,
                    latency_ms REAL NOT NULL,
                    snapshot_id TEXT NOT NULL,
                    routed_to_llm INTEGER NOT NULL
                );
            """)
            conn.commit()

    def hash_prompt(self, raw_prompt: str) -> str:
        return hmac.new(self.salt.encode("utf-8"), raw_prompt.encode("utf-8"), hashlib.sha256).hexdigest()

    def log_interaction(
        self,
        raw_prompt: str,
        risk_score: float,
        uncertainty: float,
        decision: str,
        reason_code: str,
        latency_ms: float,
        snapshot_id: str = "graph_v4",
        routed_to_llm: bool = True
    ) -> str:
        prompt_digest = self.hash_prompt(raw_prompt)
        ts = time.time()
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT INTO audit_logs (
                    timestamp, prompt_hmac, risk_score, uncertainty, decision,
                    reason_code, latency_ms, snapshot_id, routed_to_llm
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                ts, prompt_digest, float(risk_score), float(uncertainty),
                decision, reason_code, float(latency_ms), snapshot_id,
                1 if routed_to_llm else 0
            ))
            conn.commit()
        return prompt_digest

    def get_summary_stats(self) -> Dict[str, Any]:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*), AVG(risk_score), AVG(latency_ms) FROM audit_logs;")
            total, avg_risk, avg_lat = cursor.fetchone()
            cursor.execute("SELECT decision, COUNT(*) FROM audit_logs GROUP BY decision;")
            dec_counts = dict(cursor.fetchall())

        return {
            "total_requests": total or 0,
            "avg_risk_score": round(avg_risk or 0.0, 4),
            "avg_latency_ms": round(avg_lat or 0.0, 2),
            "decisions": dec_counts,
            "privacy_mode": "LOG_RAW_PROMPTS=false (HMAC-SHA256)"
        }
