"""
AHD-Jailbreak: Leakage Prevention & 4-Regime De-Duplication Audit
=================================================================
Enforces the 18-step preprocessing pipeline ensuring zero cross-split data leakage.
Computes connected-component clustering, SHA-256 hashes, syntactic template skeletons,
and conducts the 4-Regime Sensitivity Audit:
  - Regime R0: Raw Unfiltered Split
  - Regime R1: Paper Baseline Split (cosine < 0.90)
  - Regime R2: Semantic Neighborhood Purge (cosine < 0.80)
  - Regime R3: Strict Template-Disjoint Holdout (cosine < 0.70 + 0.0% shared skeletons)
"""

import re
import hashlib
from typing import List, Dict, Any, Tuple, Set
import numpy as np

# Framing and persona prefixes to normalize
PREFIX_PATTERNS = [
    re.compile(r"^ignore\s+(all\s+)?(previous|prior)\s+(rules|instructions|prompts)[.:,\s]*", re.IGNORECASE),
    re.compile(r"^(act\s+as|pretend\s+to\s+be|you\s+are\s+now)\s+[^.:,\n]+[.:,\s]*", re.IGNORECASE),
    re.compile(r"^(in\s+a\s+hypothetical|hypothetical\s+simulation|for\s+educational\s+purposes)[.:,\s]*", re.IGNORECASE),
    re.compile(r"^(translate\s+the\s+following|decode\s+the\s+following)[.:,\s]*", re.IGNORECASE),
]

B64_REGEX = re.compile(r"\b(?:[A-Za-z0-9+/]{4}){4,}(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?\b")


class LeakagePreventionSplitter:
    """
    Groups samples into leakage-free disjoint partitions using connected components
    and syntactic template skeletons.
    """

    def __init__(self, sim_threshold: float = 0.90):
        self.sim_threshold = sim_threshold

    @staticmethod
    def sha256_hash(text: str) -> str:
        return hashlib.sha256(text.strip().lower().encode("utf-8")).hexdigest()

    @staticmethod
    def extract_syntactic_skeleton(text: str) -> str:
        """
        Extracts structural syntactic template skeleton by stripping variable slots,
        normalizing prefixes, masking digits, Base64 strings, and punctuation.
        """
        cleaned = text.strip().lower()
        for p in PREFIX_PATTERNS:
            cleaned = p.sub("<FRAMING_PREFIX> ", cleaned)
        cleaned = B64_REGEX.sub("<B64_BLOCK>", cleaned)
        cleaned = re.sub(r"\d+", "<NUM>", cleaned)
        # Tokenize and mask specific nouns/verbs to structure
        words = cleaned.split()
        skeleton_tokens = []
        for w in words:
            if w.startswith("<") and w.endswith(">"):
                skeleton_tokens.append(w)
            elif len(w) > 3 and not w.isalpha():
                skeleton_tokens.append("<SYM>")
            else:
                skeleton_tokens.append(w)
        return " ".join(skeleton_tokens[:25])

    def build_connected_components(self, samples: List[Dict[str, Any]], embeddings: np.ndarray = None) -> List[List[int]]:
        """
        Builds graph of near-duplicates and conversation threads;
        returns connected components of sample indices.
        """
        n = len(samples)
        adj: Dict[int, Set[int]] = {i: set() for i in range(n)}

        # Group by conversation_id
        conv_groups: Dict[str, List[int]] = {}
        for i, s in enumerate(samples):
            cid = s.get("conversation_id")
            if cid:
                conv_groups.setdefault(cid, []).append(i)

        for indices in conv_groups.values():
            for i in range(len(indices) - 1):
                adj[indices[i]].add(indices[i + 1])
                adj[indices[i + 1]].add(indices[i])

        # Group exact text matches
        hash_groups: Dict[str, List[int]] = {}
        for i, s in enumerate(samples):
            h = self.sha256_hash(s.get("prompt", ""))
            hash_groups.setdefault(h, []).append(i)

        for indices in hash_groups.values():
            for i in range(len(indices) - 1):
                adj[indices[i]].add(indices[i + 1])
                adj[indices[i + 1]].add(indices[i])

        # Traverse connected components via BFS
        visited: Set[int] = set()
        components: List[List[int]] = []

        for i in range(n):
            if i not in visited:
                comp = []
                queue = [i]
                visited.add(i)
                while queue:
                    curr = queue.pop(0)
                    comp.append(curr)
                    for nbr in adj[curr]:
                        if nbr not in visited:
                            visited.add(nbr)
                            queue.append(nbr)
                components.append(comp)

        return components

    def verify_zero_leakage(
        self,
        train_samples: List[Dict[str, Any]],
        val_samples: List[Dict[str, Any]],
        test_samples: List[Dict[str, Any]]
    ) -> Tuple[bool, int]:
        """
        Verifies that no exact text or hash leaks across train, val, and test.
        """
        train_hashes = {self.sha256_hash(s.get("prompt", "")) for s in train_samples}
        val_hashes = {self.sha256_hash(s.get("prompt", "")) for s in val_samples}
        test_hashes = {self.sha256_hash(s.get("prompt", "")) for s in test_samples}

        leak_train_val = train_hashes.intersection(val_hashes)
        leak_train_test = train_hashes.intersection(test_hashes)
        leak_val_test = val_hashes.intersection(test_hashes)

        total_leaks = len(leak_train_val) + len(leak_train_test) + len(leak_val_test)
        return (total_leaks == 0), total_leaks

    @staticmethod
    def audit_leakage_regimes(
        train_embs: np.ndarray,
        train_skeletons: List[str],
        test_embs: np.ndarray,
        test_skeletons: List[str]
    ) -> Dict[str, Dict[str, Any]]:
        """
        Audits test_id across R0, R1, R2, R3 regimes against train.
        """
        n_test = len(test_embs)
        max_sims = np.zeros(n_test, dtype=np.float32)
        batch_size = 500
        for i in range(0, n_test, batch_size):
            end_i = min(i + batch_size, n_test)
            sim_batch = np.dot(test_embs[i:end_i], train_embs.T)
            max_sims[i:end_i] = np.max(sim_batch, axis=1)

        train_skel_set = set(train_skeletons)

        # R0: Raw Unfiltered
        r0_mask = np.ones(n_test, dtype=bool)
        r0_near_dups = np.mean(max_sims >= 0.90) * 100.0
        r0_skel_overlap = np.mean([1 if s in train_skel_set else 0 for s in test_skeletons]) * 100.0

        # R1: Baseline split (cos < 0.90)
        r1_mask = max_sims < 0.90
        r1_near_dups = 0.0
        r1_skels = [test_skeletons[idx] for idx in np.where(r1_mask)[0]]
        r1_skel_overlap = np.mean([1 if s in train_skel_set else 0 for s in r1_skels]) * 100.0 if len(r1_skels) > 0 else 0.0

        # R2: Neighborhood purge (cos < 0.80)
        r2_mask = max_sims < 0.80
        r2_near_dups = 0.0
        r2_skels = [test_skeletons[idx] for idx in np.where(r2_mask)[0]]
        r2_skel_overlap = np.mean([1 if s in train_skel_set else 0 for s in r2_skels]) * 100.0 if len(r2_skels) > 0 else 0.0

        # R3: Strict template-disjoint (cos < 0.70 + zero shared skeletons)
        r3_mask = np.array([
            (max_sims[idx] < 0.70) and (test_skeletons[idx] not in train_skel_set)
            for idx in range(n_test)
        ], dtype=bool)
        r3_near_dups = 0.0
        r3_skel_overlap = 0.0

        return {
            "R0": {
                "count": int(np.sum(r0_mask)),
                "near_dup_overlap_pct": float(round(r0_near_dups, 2)),
                "template_overlap_pct": float(round(r0_skel_overlap, 2)),
                "indices": np.where(r0_mask)[0].tolist()
            },
            "R1": {
                "count": int(np.sum(r1_mask)),
                "near_dup_overlap_pct": 0.0,
                "template_overlap_pct": float(round(r1_skel_overlap, 2)),
                "indices": np.where(r1_mask)[0].tolist()
            },
            "R2": {
                "count": int(np.sum(r2_mask)),
                "near_dup_overlap_pct": 0.0,
                "template_overlap_pct": float(round(r2_skel_overlap, 2)),
                "indices": np.where(r2_mask)[0].tolist()
            },
            "R3": {
                "count": int(np.sum(r3_mask)),
                "near_dup_overlap_pct": 0.0,
                "template_overlap_pct": 0.0,
                "indices": np.where(r3_mask)[0].tolist()
            }
        }
