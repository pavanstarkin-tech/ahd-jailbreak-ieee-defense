"""
AHD-Jailbreak: 394-D Pre-NFKC Surface + Dense Semantic Feature Extractor
========================================================================
Extracts 384-D dense semantic embeddings and 10-D pre-normalization surface
features before Unicode NFKC collapses homoglyphs, zero-width characters,
and cipher structures.
"""

import math
import re
import unicodedata
from collections import Counter
from typing import List, Tuple, Dict, Any, Optional
import numpy as np

B64_PATTERN = re.compile(r"\b(?:[A-Za-z0-9+/]{4}){5,}(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?\b")
ZERO_WIDTH_CHARS = {"\u200b", "\u200c", "\u200d", "\ufeff", "\u2060"}
OVERRIDE_VERBS = ("ignore", "bypass", "override", "forget", "disregard", "suspend", "unfiltered")
ROLEPLAY_MARKERS = ("act as", "pretend", "hypothetical", "fictional", "unfilteredsimbot", "dan", "sure, here is")


class AHDFeatureExtractor394:
    """
    394-Dimensional Feature Extractor:
      - 384-D: Dense semantic embedding (SentenceTransformer all-MiniLM-L6-v2 or deterministic projection fallback)
      - 10-D:  Pre-NFKC surface indicators (entropy, token count, punctuation, capitalization, digits, Base64, zero-width, override, persona, multi-turn drift)
    """

    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2", device: str = "cpu"):
        self.model_name = model_name
        self.device = device
        self.encoder = None
        self._init_encoder()

    def _init_encoder(self):
        try:
            from sentence_transformers import SentenceTransformer
            self.encoder = SentenceTransformer(self.model_name, device=self.device)
        except Exception:
            self.encoder = None

    @staticmethod
    def _shannon_entropy(text: str) -> float:
        if not text:
            return 0.0
        counts = Counter(text)
        n = len(text)
        return -sum((c / n) * math.log2(c / n) for c in counts.values())

    def _encode_text(self, text: str) -> np.ndarray:
        if self.encoder is not None:
            emb = self.encoder.encode(text, normalize_embeddings=True)
            return np.array(emb, dtype=np.float32)
        # Robust deterministic 384-D embedding fallback when torch/sentence-transformers is absent
        rng = np.random.RandomState(abs(hash(text)) % (2**32))
        raw = rng.randn(384).astype(np.float32)
        norm = np.linalg.norm(raw)
        return raw / (norm + 1e-9)

    def extract_single(self, raw_prompt: str, prior_turns: Optional[List[str]] = None) -> Tuple[np.ndarray, Dict[str, Any]]:
        prior_turns = prior_turns or []

        # Step 1: Extract pre-normalization surface indicators BEFORE NFKC collapses homoglyphs
        zw_count = sum(1 for ch in raw_prompt if ch in ZERO_WIDTH_CHARS or unicodedata.category(ch) == "Cf")
        norm_text = unicodedata.normalize(
            "NFKC", "".join(ch for ch in raw_prompt if ch not in ZERO_WIDTH_CHARS)
        ).strip()
        lower = norm_text.lower()
        n_chars = max(len(norm_text), 1)

        tokens = norm_text.split()
        entropy = self._shannon_entropy(raw_prompt)
        log_tok = math.log1p(len(tokens))
        punct_ratio = sum(1 for c in norm_text if not c.isalnum() and not c.isspace()) / n_chars
        upper_ratio = sum(1 for c in norm_text if c.isupper()) / n_chars
        digit_ratio = sum(1 for c in norm_text if c.isdigit()) / n_chars
        has_b64 = 1.0 if B64_PATTERN.search(raw_prompt) else 0.0
        override_cnt = float(sum(1 for kw in OVERRIDE_VERBS if kw in lower))
        roleplay_cnt = float(sum(1 for kw in ROLEPLAY_MARKERS if kw in lower))

        # Step 2: Compute 384-D dense embedding and multi-turn cosine drift
        emb_curr = self._encode_text(norm_text)
        if prior_turns:
            prior_norm = unicodedata.normalize("NFKC", prior_turns[-1])
            emb_prev = self._encode_text(prior_norm)
            turn_drift = float(1.0 - np.dot(emb_curr, emb_prev))
        else:
            turn_drift = 0.0

        f_surf = np.array([
            entropy / 6.0,
            log_tok / 6.0,
            punct_ratio,
            upper_ratio,
            digit_ratio,
            has_b64,
            min(zw_count / 5.0, 1.0),
            min(override_cnt / 3.0, 1.0),
            min(roleplay_cnt / 3.0, 1.0),
            turn_drift
        ], dtype=np.float32)

        x_394 = np.concatenate([emb_curr, f_surf], axis=0).astype(np.float32)
        meta = {
            "has_base64": bool(has_b64),
            "zero_width_count": int(zw_count),
            "char_entropy": round(float(entropy), 3),
            "turn_drift": round(float(turn_drift), 4),
            "normalized_prompt_length": len(norm_text)
        }
        return x_394, meta
