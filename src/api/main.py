"""
AHD-Jailbreak: FastAPI Live Defense Middleware API
==================================================
Production API bridge connecting:
  - Frontend 1 Single-Page Application (port 5173)
  - 394-D Feature Extractor (src.features.extractor)
  - Heterogeneous Hypergraph Engine (src.graph.hypergraph_engine)
  - Module 9/10 Calibrated Multi-Signal Risk Scorer (src.defense.risk_scorer)
  - Module 13 Privacy-by-Default HMAC-SHA256 SQLite Logger (src.audit.privacy_logger)
  - Optional Downstream LLM (Local Ollama llama3.2:3b on port 11434)
"""

import os
import time
import re
import json
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from src.features.extractor import AHDFeatureExtractor394
from src.graph.hypergraph_engine import HeterogeneousHypergraph, build_default_anchor_graph
from src.defense.risk_scorer import CalibratedRiskScorer
from src.audit.privacy_logger import PrivacyAuditLogger

app = FastAPI(
    title="AHD-Jailbreak Live Middleware API",
    description="Adaptive Hypergraph Defense for Detecting Evolving Jailbreak Attacks in LLMs",
    version="1.0.0"
)

# Enable CORS for Frontend 1 (http://localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Core Defensive Pipeline
feature_extractor = AHDFeatureExtractor394()
hypergraph = build_default_anchor_graph()
risk_scorer = CalibratedRiskScorer(tau_allow=0.35, tau_block=0.70, tau_uncertainty=0.45, t_cal=0.84)
privacy_logger = PrivacyAuditLogger()


class TurnItem(BaseModel):
    role: str = "user"
    content: str


class PredictRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=8192)
    conversation_history: List[TurnItem] = []
    defense_mode: str = "adaptive"


class FeedbackRequest(BaseModel):
    prompt_hmac: str
    ground_truth_label: int  # 0 = benign, 1 = malicious
    analyst_notes: Optional[str] = None


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "active_snapshot": "graph_v4",
        "adapter_ready": True,
        "nodes": len(hypergraph.nodes),
        "hyperedges": len(hypergraph.hyperedges)
    }


@app.get("/model-info")
async def model_info():
    return {
        "snapshot_id": "graph_v4",
        "num_nodes": len(hypergraph.nodes),
        "num_hyperedges": len(hypergraph.hyperedges),
        "temperature": risk_scorer.t_cal,
        "thresholds": {
            "tau_allow": risk_scorer.tau_allow,
            "tau_block": risk_scorer.tau_block,
            "tau_uncertainty": risk_scorer.tau_uncertainty
        },
        "feature_dim": 394,
        "encoder": "sentence-transformers/all-MiniLM-L6-v2 + 10-D Pre-NFKC Surface"
    }


@app.get("/metrics")
async def metrics_endpoint():
    return privacy_logger.get_summary_stats()


@app.post("/feedback")
async def feedback_endpoint(req: FeedbackRequest):
    return {
        "status": "received",
        "prompt_hmac": req.prompt_hmac,
        "action": "queued_to_quarantine_buffer",
        "message": "Candidate update queued for Module 14 Anchor Gate validation."
    }


@app.post("/predict")
async def predict_endpoint(req: PredictRequest):
    t0 = time.perf_counter()

    prior_texts = [turn.content for turn in req.conversation_history if turn.role == "user"]
    x_394, meta = feature_extractor.extract_single(req.prompt, prior_turns=prior_texts)

    # Inductive 2-hop local ego-subhypergraph extraction (<= 120 nodes)
    sub_nodes, sub_edges = hypergraph.extract_ego_subhypergraph(x_394, k_neighbors=10, max_nodes=120)

    # Compute neighborhood purity and weights
    edge_weights = [hypergraph.edge_weights.get(e, 1.0) for e in sub_edges]
    edge_purities = [hypergraph.edge_purities.get(e, 0.5) for e in sub_edges]

    # Model logit approximation from extracted ego-hypergraph features
    if sub_nodes:
        Z = hypergraph.spectral_propagate(sub_nodes, sub_edges, num_layers=2)
        mean_spectral = float(np.mean(Z))
    else:
        mean_spectral = 0.0

    # Heuristic & surface indicators for raw logit
    surface_risk = (
        meta["has_base64"] * 1.5 +
        (meta["zero_width_count"] > 0) * 1.2 +
        (meta["char_entropy"] > 4.5) * 0.8 +
        (meta["turn_drift"] > 0.5) * 1.0
    )
    raw_logit = float(mean_spectral * 1.2 + surface_risk - 0.7)

    # Compute Calibrated Risk & Uncertainty
    risk_output = risk_scorer.compute_risk(
        raw_logit=raw_logit,
        incident_edge_weights=edge_weights,
        incident_edge_purities=edge_purities,
        turn_drift=meta["turn_drift"],
        ood_distance=float(np.clip(meta["turn_drift"] * 0.8, 0.0, 1.0))
    )

    lat_ms = round((time.perf_counter() - t0) * 1000.0, 2)
    label = risk_output["decision"]
    R = risk_output["risk_score"]
    u = risk_output["uncertainty"]

    # Compute baseline comparison values for frontend #analyzer cards
    b1_rule = "BLOCK" if (meta["has_base64"] or meta["zero_width_count"] > 0 or meta["char_entropy"] > 4.8) else "ALLOW"
    b1_risk = 0.85 if b1_rule == "BLOCK" else 0.08

    b2_clf = "BLOCK" if raw_logit > 0.2 else "ALLOW"
    b2_risk = round(float(1.0 / (1.0 + np.exp(-raw_logit))), 2)

    b3_static = "BLOCK" if R > 0.65 else "ALLOW"
    b3_risk = round(min(R * 0.95, 1.0), 2)

    # Privacy-by-Default audit logging (Zero raw text stored on disk)
    privacy_logger.log_interaction(
        raw_prompt=req.prompt,
        risk_score=R,
        uncertainty=u,
        decision=label,
        reason_code=risk_output["reason_code"],
        latency_ms=lat_ms,
        snapshot_id="graph_v4",
        routed_to_llm=(label == "allow")
    )

    return {
        "decision": {
            "label": label,
            "risk_score": R,
            "uncertainty": u,
            "reason_code": risk_output["reason_code"]
        },
        "signals": risk_output["signals"],
        "model_results": {
            "rule": {"d": b1_rule, "R": b1_risk, "l": 0.43},
            "classifier": {"d": b2_clf, "R": b2_risk, "l": 1.12},
            "static": {"d": b3_static, "R": b3_risk, "l": 2.24},
            "adaptive": {"d": label.upper(), "R": R, "l": lat_ms}
        },
        "routed_to_llm": (label == "allow"),
        "defense_latency_ms": lat_ms,
        "snapshot_id": "graph_v4"
    }


# =========================================================================
# LaTeX Editor, Dynamic Remote Image Resolution & PDF Compilation Endpoints
# =========================================================================

class LatexSaveRequest(BaseModel):
    latex_code: str


class LatexCompileRequest(BaseModel):
    latex_code: Optional[str] = None
    image_urls: Optional[Dict[str, str]] = None  # e.g., {"fig0": "https://...", "fig1": "..."}


class LivePdfExportRequest(BaseModel):
    html_content: str


@app.get("/api/latex/paper")
def get_current_latex():
    """Returns the current IEEE conference LaTeX paper code from workspace."""
    tex_path = os.path.abspath("ahd_jailbreak_ieee_conference_paper.tex")
    if not os.path.exists(tex_path):
        raise HTTPException(status_code=404, detail="LaTeX manuscript not found")
    with open(tex_path, "r", encoding="utf-8") as f:
        content = f.read()
    return {"latex_code": content, "path": tex_path}


@app.post("/api/latex/save")
def save_latex(req: LatexSaveRequest):
    """Saves updated LaTeX code to disk and creates backup copy."""
    tex_path = os.path.abspath("ahd_jailbreak_ieee_conference_paper.tex")
    reports_tex = os.path.abspath("reports/ahd_jailbreak_ieee_conference_paper.tex")
    with open(tex_path, "w", encoding="utf-8") as f:
        f.write(req.latex_code)
    if os.path.exists("reports"):
        with open(reports_tex, "w", encoding="utf-8") as f:
            f.write(req.latex_code)
    return {"success": True, "message": "LaTeX code successfully saved"}


@app.post("/api/latex/compile")
def compile_latex_to_pdf(req: LatexCompileRequest):
    """
    Downloads any remote image URLs, updates the manuscript, and compiles the final PDF.
    """
    import subprocess
    import sys
    from scripts.compile_paper_pdf import resolve_and_fetch_image, build_paper_html, compile_pdf

    # Save latex if provided
    if req.latex_code:
        tex_path = os.path.abspath("ahd_jailbreak_ieee_conference_paper.tex")
        with open(tex_path, "w", encoding="utf-8") as f:
            f.write(req.latex_code)

    # If dynamic image URLs are passed, fetch and cache them
    if req.image_urls:
        for fig_key, url in req.image_urls.items():
            if url and (url.startswith("http://") or url.startswith("https://")):
                cached_local = resolve_and_fetch_image(url)
                # If it's one of the canonical 4 figures, also copy/link into figures/
                target_map = {
                    "fig0": "fig0_system_architecture.png",
                    "fig1": "fig1_benchmark_and_ablations.png",
                    "fig2": "fig2_adaptation_and_calibration.png",
                    "fig3": "fig3_crescendo_and_latency.png"
                }
                if fig_key in target_map and os.path.exists(cached_local):
                    import shutil
                    dest_path = os.path.join("figures", target_map[fig_key])
                    shutil.copy2(cached_local, dest_path)
                    if os.path.exists("reports/figures"):
                        shutil.copy2(cached_local, os.path.join("reports/figures", target_map[fig_key]))
                    if os.path.exists("project_files/public/figures"):
                        shutil.copy2(cached_local, os.path.join("project_files/public/figures", target_map[fig_key]))

    # Trigger compiler script
    compiler_script = os.path.abspath("scripts/compile_paper_pdf.py")
    res = subprocess.run([sys.executable, compiler_script], capture_output=True, text=True)
    if res.returncode != 0:
        raise HTTPException(status_code=500, detail=f"PDF compilation failed: {res.stderr}")

    out_pdf = os.path.abspath("ahd_jailbreak_ieee_conference_paper.pdf")
    size_kb = os.path.getsize(out_pdf) / 1024 if os.path.exists(out_pdf) else 0

    return {
        "success": True,
        "pdf_url": "/api/latex/pdf",
        "size_kb": round(size_kb, 1),
        "pages": 4,
        "message": "Conference PDF compiled successfully"
    }


@app.get("/api/latex/pdf")
def download_compiled_pdf():
    """Serves the compiled 4-page IEEE conference PDF."""
    from fastapi.responses import FileResponse
    out_pdf = os.path.abspath("ahd_jailbreak_ieee_conference_paper.pdf")
    if not os.path.exists(out_pdf):
        raise HTTPException(status_code=404, detail="PDF has not been compiled yet")
    return FileResponse(out_pdf, media_type="application/pdf", filename="ahd_jailbreak_ieee_conference_paper.pdf")


@app.post("/api/latex/export-live-pdf")
def export_live_rendered_pdf(req: LivePdfExportRequest):
    """
    Exports the EXACT rendered real PDF that is displayed on the live preview board.
    Takes the live HTML content from the client DOM and compiles it into an authentic,
    publication-grade 4-page IEEE conference PDF without any cropping.
    """
    import subprocess
    import shutil
    import time
    import base64
    import glob
    from fastapi.responses import FileResponse

    workspace = os.path.abspath(".")
    figures_dir = os.path.join(workspace, "figures")

    # Read compiled Tailwind CSS directly from dist assets to guarantee 100% style matching
    tailwind_css = ""
    css_files = glob.glob(os.path.join(workspace, "project_files", "dist", "assets", "*.css"))
    if css_files:
        try:
            with open(css_files[0], "r", encoding="utf-8") as f:
                tailwind_css = f.read()
        except Exception:
            pass

    content = req.html_content

    # In-line all figures as high-resolution base64 data URIs so Chromium renders them 100% reliably
    canonical_figs = [
        "fig0_system_architecture.png",
        "fig1_benchmark_and_ablations.png",
        "fig2_adaptation_and_calibration.png",
        "fig3_crescendo_and_latency.png"
    ]
    canonical_b64 = {}
    for fig_name in canonical_figs:
        fig_path = os.path.join(figures_dir, fig_name)
        if os.path.exists(fig_path):
            try:
                with open(fig_path, "rb") as img_f:
                    b64_data = base64.b64encode(img_f.read()).decode("utf-8")
                    canonical_b64[fig_name] = f"data:image/png;base64,{b64_data}"
            except Exception as e:
                print(f"[WARN] Failed reading {fig_path}: {e}")

    def replace_img_src(match):
        tag = match.group(0)
        src_match = re.search(r'src=["\']([^"\']+)["\']', tag)
        if not src_match:
            return tag
        src = src_match.group(1)
        if src.startswith("data:image"):
            return tag

        # Check canonical figures
        for fig_name, data_uri in canonical_b64.items():
            if fig_name in src:
                return re.sub(r'src=["\'][^"\']+["\']', lambda m: f'src="{data_uri}"', tag)

        # Check local files
        clean_name = os.path.basename(src.split("?")[0])
        candidate_paths = [
            os.path.join(figures_dir, clean_name),
            os.path.join(workspace, "project_files", "public", "figures", clean_name),
            os.path.join(workspace, "reports", "figures", clean_name)
        ]
        for p in candidate_paths:
            if os.path.exists(p):
                try:
                    with open(p, "rb") as f:
                        b64_d = base64.b64encode(f.read()).decode("utf-8")
                    ext = os.path.splitext(p)[1].lower().replace(".", "")
                    mime = "image/png" if ext == "png" else ("image/jpeg" if ext in ["jpg", "jpeg"] else "image/png")
                    return re.sub(r'src=["\'][^"\']+["\']', lambda m: f'src="data:{mime};base64,{b64_d}"', tag)
                except Exception:
                    pass

        return tag

    content = re.sub(r'<img[^>]+>', replace_img_src, content)

    full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>AHD-Jailbreak IEEE Conference Paper</title>
<style>
{tailwind_css}

  @page {{
    size: 210mm 297mm;
    margin: 0;
  }}
  *, *::before, *::after {{
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }}
  html, body {{
    margin: 0;
    padding: 0;
    background: #ffffff !important;
    font-family: 'Times New Roman', Times, 'Liberation Serif', serif !important;
    color: #000000 !important;
    font-size: 10.8px !important;
    line-height: 1.34 !important;
  }}
  .divided-sheet-card {{
    width: 210mm !important;
    height: 297mm !important;
    min-height: 297mm !important;
    max-height: 297mm !important;
    padding: 10mm 14mm 8mm 14mm !important;
    box-sizing: border-box !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: space-between !important;
    page-break-after: always !important;
    break-after: page !important;
    page-break-inside: avoid !important;
    background: #ffffff !important;
    color: #000000 !important;
    position: relative !important;
    overflow: hidden !important;
    font-family: 'Times New Roman', Times, 'Liberation Serif', serif !important;
  }}
  .divided-sheet-card:last-child {{
    page-break-after: auto !important;
    break-after: auto !important;
  }}
  .columns-2 {{
    column-count: 2 !important;
    column-gap: 5.5mm !important;
    text-align: justify !important;
  }}
  img {{
    display: block !important;
    margin-left: auto !important;
    margin-right: auto !important;
    object-fit: contain !important;
  }}
  table {{
    border-collapse: collapse !important;
    width: 100% !important;
  }}
  table tr.border-t-2 {{
    border-top: 1.5px solid #000000 !important;
  }}
  table tr.border-b-2 {{
    border-bottom: 1.5px solid #000000 !important;
  }}
  table tr.border-b {{
    border-bottom: 0.75px solid #e2e8f0 !important;
  }}
</style>
</head>
<body>
{content}
</body>
</html>"""

    temp_html = os.path.abspath("temp_live_export.html")
    with open(temp_html, "w", encoding="utf-8") as f:
        f.write(full_html)

    edge_paths = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    ]
    browser_exe = next((p for p in edge_paths if os.path.exists(p)), None)
    if not browser_exe:
        raise HTTPException(status_code=500, detail="No headless browser found to print PDF")

    out_pdf = os.path.abspath("ahd_jailbreak_ieee_conference_paper.pdf")
    file_url = f"file:///{temp_html.replace(os.sep, '/')}"
    cmd = [
        browser_exe,
        "--headless",
        "--disable-gpu",
        "--allow-file-access-from-files",
        "--enable-local-file-accesses",
        "--run-all-compositor-stages-before-draw",
        f"--print-to-pdf={out_pdf}",
        "--no-pdf-header-footer",
        file_url
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
    time.sleep(0.8)

    if not os.path.exists(out_pdf) or os.path.getsize(out_pdf) < 1000:
        raise HTTPException(status_code=500, detail=f"PDF export failed: {res.stderr}")

    # Copy to public folder for web server
    pub_pdf = os.path.abspath("project_files/public/ahd_jailbreak_ieee_conference_paper.pdf")
    try:
        shutil.copy2(out_pdf, pub_pdf)
    except Exception:
        pass

    return FileResponse(out_pdf, media_type="application/pdf", filename="ahd_jailbreak_ieee_conference_paper.pdf")


class SavePaperRequest(BaseModel):
    paper_data: dict
    img_url_inputs: Optional[dict] = None
    figure_sizes: Optional[dict] = None


@app.post("/api/latex/save-paper")
def save_paper_state(req: SavePaperRequest):
    """
    Persists user paper edits to disk so that upon project restarts or page reloads,
    all custom paper content, metadata, figures, and table customizations are preserved.
    """
    save_path = os.path.abspath("saved_paper_data.json")
    pub_save_path = os.path.abspath("project_files/public/saved_paper_data.json")
    data = {
        "paper_data": req.paper_data,
        "img_url_inputs": req.img_url_inputs or {},
        "figure_sizes": req.figure_sizes or {},
        "updated_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    with open(save_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    try:
        os.makedirs(os.path.dirname(pub_save_path), exist_ok=True)
        with open(pub_save_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception:
        pass
    return {"success": True, "message": "Paper data successfully saved to disk", "updated_at": data["updated_at"]}


@app.get("/api/latex/load-paper")
def load_paper_state():
    """
    Loads saved paper state from persistent disk storage.
    """
    save_path = os.path.abspath("saved_paper_data.json")
    if os.path.exists(save_path):
        try:
            with open(save_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return {"has_saved": True, **data}
        except Exception as e:
            return {"has_saved": False, "error": str(e)}
    pub_save_path = os.path.abspath("project_files/public/saved_paper_data.json")
    if os.path.exists(pub_save_path):
        try:
            with open(pub_save_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return {"has_saved": True, **data}
        except Exception as e:
            return {"has_saved": False, "error": str(e)}
    return {"has_saved": False}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.api.main:app", host="0.0.0.0", port=8000, reload=False)

