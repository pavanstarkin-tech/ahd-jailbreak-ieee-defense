"""
394-D Dual-Stage Feature Extractor for AHD-Jailbreak.
Computes 10-D Pre-NFKC Surface Indicator Vector and 384-D NFKC-Normalized MiniLM Embedding.
Supports PyTorch FP32, ONNX FP32, and Quantized ONNX INT8 backends.
"""

import os
import re
import math
import unicodedata
from typing import List, Dict, Any, Optional, Tuple, Union
import numpy as np


class AHDFeatureExtractor:
    """
    Dual-stage feature extractor strictly following Section III-A of the AHD-Jailbreak paper:
      - Stage 2a: 10-D Pre-NFKC Surface Indicator Vector (f_surf in R^10)
      - Stage 2b: 384-D NFKC-Normalized Dense Embedding (e_sem in R^384)
      - Output: Concatenated representation x_v = [e_sem || f_surf] in R^394
    """

    BASE64_PATTERN = re.compile(
        r'\b(?:[A-Za-z0-9+/]{4}){5,}(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?\b'
    )

    OVERRIDE_VERBS = [
        "ignore", "disregard", "override", "bypass", "forget", "disable",
        "drop", "clear", "dismiss", "negate", "overwrite", "cancel"
    ]

    ROLEPLAY_MARKERS = [
        "dan", "jailbreak", "unfiltered", "unrestricted", "evil", "dark",
        "roleplay", "pretend", "hypothetical", "game", "actor", "fictional",
        "story", "mode", "unaligned", "unshackled", "freed", "raw"
    ]

    def __init__(
        self,
        base_encoder: str = "sentence-transformers/all-MiniLM-L6-v2",
        runtime: str = "onnx-int8",
        onnx_model_path: Optional[str] = None
    ) -> None:
        self.base_encoder_name = base_encoder
        self.runtime = runtime
        self.onnx_model_path = onnx_model_path
        self._pytorch_model = None
        self._onnx_session = None
        self._tokenizer = None

        self._init_runtime()

    def _init_runtime(self) -> None:
        if self.runtime in ("onnx-int8", "onnx-fp32"):
            try:
                import onnxruntime as ort
                from transformers import AutoTokenizer

                # Resolve model path
                path = self.onnx_model_path
                if path is None or not os.path.exists(path):
                    candidates = [
                        os.path.join(os.path.dirname(__file__), "..", "models", "minilm_int8.onnx"),
                        os.path.join(os.path.dirname(__file__), "..", "..", "data", "models", "minilm_int8.onnx"),
                        os.path.join(os.getcwd(), "models", "minilm_int8.onnx"),
                        os.path.join(os.getcwd(), "data", "models", "minilm_int8.onnx")
                    ]
                    for cand in candidates:
                        if os.path.exists(cand):
                            path = cand
                            break

                if path and os.path.exists(path):
                    sess_options = ort.SessionOptions()
                    sess_options.intra_op_num_threads = max(1, os.cpu_count() or 4)
                    sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
                    self._onnx_session = ort.InferenceSession(path, sess_options, providers=["CPUExecutionProvider"])
                    self._tokenizer = AutoTokenizer.from_pretrained(self.base_encoder_name)
                    return
            except Exception as e:
                # Fallback to PyTorch
                pass

        # Fallback to SentenceTransformers / PyTorch
        from sentence_transformers import SentenceTransformer
        self._pytorch_model = SentenceTransformer(self.base_encoder_name)
        self.runtime = "pytorch"

    @staticmethod
    def _compute_shannon_entropy(text: str) -> float:
        if not text:
            return 0.0
        length = len(text)
        freq = {}
        for c in text:
            freq[c] = freq.get(c, 0) + 1
        entropy = -sum((count / length) * math.log2(count / length) for count in freq.values())
        return min(entropy / 6.0, 1.0)

    def extract_surface_features(
        self,
        raw_text: str,
        prior_turns: Optional[List[str]] = None
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Extracts 10-D Pre-NFKC Surface Indicator Vector f_surf in R^10.
        Must be computed BEFORE Unicode NFKC normalization to preserve homoglyphs and ZW characters.
        """
        if not raw_text:
            return np.zeros(10, dtype=np.float32), {}

        # 1. Shannon Character Entropy
        ent = self._compute_shannon_entropy(raw_text)

        # 2. Normalized Token Length
        words = raw_text.split()
        token_len = min(math.log(1.0 + len(words)) / 6.0, 1.0)

        # 3, 4, 5. Punctuation, Uppercase, and Digit Ratios
        total_chars = max(len(raw_text), 1)
        punct_count = sum(1 for c in raw_text if c in "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~")
        upper_count = sum(1 for c in raw_text if c.isupper())
        digit_count = sum(1 for c in raw_text if c.isdigit())

        punct_ratio = min(punct_count / total_chars, 1.0)
        upper_ratio = min(upper_count / total_chars, 1.0)
        digit_ratio = min(digit_count / total_chars, 1.0)

        # 6. Base64 Indicator (Contiguous or Obfuscated Payload Blocks)
        has_b64 = 1.0 if bool(
            self.BASE64_PATTERN.search(raw_text) or
            (re.search(r'(?i)\b(?:base64|b64|decode)\b', raw_text) and re.search(r'[A-Za-z0-9+/_-]{10,}', raw_text))
        ) else 0.0

        # 7. Zero-Width & Unicode Homoglyphs
        zw_chars = sum(1 for c in raw_text if ord(c) in (0x200B, 0x200C, 0x200D, 0xFEFF, 0x00AD, 0x2060))
        zw_indicator = min(zw_chars / 5.0, 1.0)

        # 8. Instruction Override Verb Count
        lower_text = raw_text.lower()
        override_count = sum(1 for verb in self.OVERRIDE_VERBS if re.search(rf"\b{verb}\b", lower_text))
        override_indicator = min(override_count / 3.0, 1.0)

        # 9. Roleplay / Persona Markers
        roleplay_count = sum(1 for marker in self.ROLEPLAY_MARKERS if re.search(rf"\b{marker}\b", lower_text))
        roleplay_indicator = min(roleplay_count / 3.0, 1.0)

        # 10. Turn-to-Turn Semantic Drift (1 - cos(e_t, e_{t-1}))
        turn_drift = 0.0
        if prior_turns and len(prior_turns) > 0:
            last_turn = prior_turns[-1]
            e_curr = self._encode_dense_semantic(raw_text)
            e_prev = self._encode_dense_semantic(last_turn)
            cos_sim = float(np.dot(e_curr, e_prev))
            turn_drift = max(0.0, 1.0 - cos_sim)

        f_surf = np.array([
            ent,
            token_len,
            punct_ratio,
            upper_ratio,
            digit_ratio,
            has_b64,
            zw_indicator,
            override_indicator,
            roleplay_indicator,
            turn_drift
        ], dtype=np.float32)

        meta = {
            "char_entropy": ent,
            "token_length_norm": token_len,
            "punctuation_ratio": punct_ratio,
            "uppercase_ratio": upper_ratio,
            "digit_ratio": digit_ratio,
            "has_base64": bool(has_b64),
            "zero_width_count": zw_chars,
            "override_verb_count": override_count,
            "roleplay_marker_count": roleplay_count,
            "turn_drift": turn_drift
        }

        return f_surf, meta

    def _encode_dense_semantic(self, text: str) -> np.ndarray:
        """
        Stage 2b: Apply Unicode NFKC normalization and encode into 384-D dense embedding.
        L2-normalized.
        """
        # Apply NFKC Normalization
        norm_text = unicodedata.normalize("NFKC", text or "")

        if self._onnx_session is not None and self._tokenizer is not None:
            inputs = self._tokenizer(
                norm_text,
                padding=True,
                truncation=True,
                max_length=512,
                return_tensors="np"
            )
            ort_inputs = {
                "input_ids": inputs["input_ids"].astype(np.int64),
                "attention_mask": inputs["attention_mask"].astype(np.int64)
            }
            if "token_type_ids" in [o.name for o in self._onnx_session.get_inputs()]:
                ort_inputs["token_type_ids"] = inputs.get("token_type_ids", np.zeros_like(inputs["input_ids"])).astype(np.int64)

            outputs = self._onnx_session.run(None, ort_inputs)
            token_embeddings = outputs[0]  # [1, seq_len, 384]
            # Mean pooling with attention mask
            mask = inputs["attention_mask"][:, :, np.newaxis]
            summed = np.sum(token_embeddings * mask, axis=1)
            counts = np.clip(np.sum(mask, axis=1), a_min=1e-9, a_max=None)
            embedding = (summed / counts)[0]
            norm = np.linalg.norm(embedding)
            if norm > 1e-9:
                embedding = embedding / norm
            return embedding.astype(np.float32)

        # PyTorch fallback
        emb = self._pytorch_model.encode(norm_text, normalize_embeddings=True)
        return np.array(emb, dtype=np.float32)

    def extract(
        self,
        raw_text: str,
        prior_turns: Optional[List[str]] = None
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Extracts concatenated 394-D representation x_v = [e_sem || f_surf] in R^394.
        """
        f_surf, meta = self.extract_surface_features(raw_text, prior_turns=prior_turns)
        e_sem = self._encode_dense_semantic(raw_text)
        x_394 = np.concatenate([e_sem, f_surf], axis=0).astype(np.float32)
        return x_394, meta

    def extract_batch(
        self,
        texts: List[str]
    ) -> Tuple[np.ndarray, List[Dict[str, Any]]]:
        """
        Batch extraction for high-throughput evaluation.
        """
        features = []
        metadata = []
        for text in texts:
            x, m = self.extract(text)
            features.append(x)
            metadata.append(m)
        return np.stack(features, axis=0), metadata

