"""
ONNX Export, Dynamic INT8 Quantization, and Latency Profiling for AHD-Jailbreak.
Exports sentence-transformers/all-MiniLM-L6-v2 to ONNX FP32, quantizes to INT8,
and benchmarks 1,000 real forward passes on commodity CPU.
"""

import os
import time
import argparse
from typing import Dict, Any
import numpy as np


def export_and_quantize_minilm(
    output_dir: str = "models",
    model_name: str = "sentence-transformers/all-MiniLM-L6-v2"
) -> Dict[str, str]:
    """
    Exports all-MiniLM-L6-v2 to ONNX FP32 and quantizes to INT8.
    """
    os.makedirs(output_dir, exist_ok=True)
    fp32_path = os.path.join(output_dir, "minilm_fp32.onnx")
    int8_path = os.path.join(output_dir, "minilm_int8.onnx")

    import torch
    from transformers import AutoModel, AutoTokenizer
    from onnxruntime.quantization import quantize_dynamic, QuantType

    print(f"Loading {model_name}...")
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModel.from_pretrained(model_name)
    model.eval()

    dummy_text = "Benchmark text for ONNX export."
    inputs = tokenizer(dummy_text, return_tensors="pt")

    print(f"Exporting FP32 model to {fp32_path}...")
    torch.onnx.export(
        model,
        (inputs["input_ids"], inputs["attention_mask"]),
        fp32_path,
        input_names=["input_ids", "attention_mask"],
        output_names=["last_hidden_state"],
        dynamic_axes={
            "input_ids": {0: "batch_size", 1: "sequence_length"},
            "attention_mask": {0: "batch_size", 1: "sequence_length"},
            "last_hidden_state": {0: "batch_size", 1: "sequence_length"}
        },
        opset_version=14,
        do_constant_folding=True
    )

    print(f"Quantizing to INT8: {int8_path}...")
    quantize_dynamic(
        model_input=fp32_path,
        model_output=int8_path,
        weight_type=QuantType.QInt8
    )

    size_mb = os.path.getsize(int8_path) / (1024 * 1024)
    print(f"Quantized INT8 Model ready: {int8_path} ({size_mb:.2f} MB)")

    return {"fp32": fp32_path, "int8": int8_path}


def benchmark_cpu_latency(
    model_path: str,
    iterations: int = 1000,
    warmup: int = 100
) -> Dict[str, float]:
    """
    Executes real inference profiling over 1,000 warm forward passes on CPU.
    """
    import onnxruntime as ort
    from transformers import AutoTokenizer

    tokenizer = AutoTokenizer.from_pretrained("sentence-transformers/all-MiniLM-L6-v2")
    sess_options = ort.SessionOptions()
    sess_options.intra_op_num_threads = max(1, os.cpu_count() or 4)
    session = ort.InferenceSession(model_path, sess_options, providers=["CPUExecutionProvider"])

    test_prompt = "How do I configure a secure API gateway with rate limiting?"
    inputs = tokenizer(test_prompt, return_tensors="np")
    ort_inputs = {
        "input_ids": inputs["input_ids"].astype(np.int64),
        "attention_mask": inputs["attention_mask"].astype(np.int64)
    }

    # Warmup
    for _ in range(warmup):
        _ = session.run(None, ort_inputs)

    # Benchmark
    latencies = []
    for _ in range(iterations):
        t0 = time.perf_counter()
        _ = session.run(None, ort_inputs)
        latencies.append((time.perf_counter() - t0) * 1000.0)

    p50 = float(np.percentile(latencies, 50))
    p95 = float(np.percentile(latencies, 95))
    p99 = float(np.percentile(latencies, 99))
    rps = float(1000.0 / np.mean(latencies))

    results = {
        "iterations": iterations,
        "mean_ms": round(float(np.mean(latencies)), 2),
        "p50_ms": round(p50, 2),
        "p95_ms": round(p95, 2),
        "p99_ms": round(p99, 2),
        "throughput_rps": round(rps, 1)
    }

    print(f"Latency Profile: P50={p50:.2f} ms | P95={p95:.2f} ms | Throughput={rps:.1f} req/s")
    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--export", action="store_true", help="Export and quantize model")
    parser.add_argument("--profile", action="store_true", help="Profile CPU latency")
    parser.add_argument("--model-path", default="models/minilm_int8.onnx", help="Model path")
    args = parser.parse_args()

    if args.export:
        export_and_quantize_minilm()
    if args.profile:
        benchmark_cpu_latency(args.model_path)
