#!/usr/bin/env bash
# scripts/verify_reproducibility.sh — Single-Command End-to-End Execution & Paper Export
set -euo pipefail

python3 scripts/prepare_data.py --seed 42
pytest tests/ -v
python3 benchmarks/run_full_benchmark.py --seeds 42 100 2026 7 99
python3 benchmarks/run_ablations.py --seed 42
python3 scripts/export_report_artifacts.py --out-dir reports/

echo "[SUCCESS] All 7 Quality Gates Passed & Paper-Ready Tables/Figures Exported to reports/!"
