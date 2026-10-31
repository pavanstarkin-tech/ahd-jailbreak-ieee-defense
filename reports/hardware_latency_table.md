# Table 4: Real-World Systems & Hardware Board Latency Benchmark (RQ5 Verification)

| Platform | Processor / Memory | Mode | P50 / P95 Latency | Memory Footprint | Real-World Application |
|:---|:---|:---|:---:|:---:|:---|
| **Raspberry Pi 5 (8 GB)** | Broadcom BCM2712 Quad Cortex-A76 | ONNX INT8 + PyG Sparse | 26.5 / 44.8 ms | < 650 MB | Low-cost inline dual-NIC AI firewall |
| **NVIDIA Jetson Orin Nano** | 6-Core Arm A78AE + Ampere GPU | TensorRT FP16 + Ollama | 9.4 / 18.2 ms | 1.5 GB | Air-gapped robotics, drones, medical carts |
| **Industrial x86_64 Gateway** | Intel Core i5 / Xeon D + Arc NPU | OpenVINO AVX-512 + FastAPI | 14.2 / 28.5 ms | < 1.2 GB | SCADA / PLC operator copilot screening |
| **Zynq UltraScale+ FPGA** | Cortex-A53 + Programmable Fabric | HLS SpMM IP Core | < 3.5 / 6.0 ms | Sub-5W | Hard real-time avionics & defense V2X |
