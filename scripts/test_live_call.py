import urllib.request
import json
import fitz

with open("temp_live_export.html", "r", encoding="utf-8") as f:
    html = f.read()

req_data = json.dumps({"html_content": html}).encode("utf-8")
req = urllib.request.Request("http://127.0.0.1:8000/api/latex/export-live-pdf", data=req_data, headers={"Content-Type": "application/json"})

try:
    with urllib.request.urlopen(req, timeout=20) as resp:
        pdf_bytes = resp.read()
        print(f"Exported PDF size: {len(pdf_bytes)} bytes")
        with open("test_exported_live.pdf", "wb") as pf:
            pf.write(pdf_bytes)
        doc = fitz.open("test_exported_live.pdf")
        print(f"Total pages: {len(doc)}")
        for i, page in enumerate(doc):
            imgs = page.get_images()
            print(f"  Page {i+1}: {len(imgs)} images")
except Exception as e:
    print(f"Error: {e}")

