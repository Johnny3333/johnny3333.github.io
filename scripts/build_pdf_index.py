#!/usr/bin/env python3
"""Build the committed page-level search data for the ProCLIP reader."""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = ROOT / "assets" / "docs" / "ProCLIP.pdf"
OUTPUT_PATH = ROOT / "assets" / "data" / "proclip-pages.json"

PAGE_SECTIONS = {
    1: "Abstract & Introduction",
    2: "Introduction & Related Work",
    3: "Related Work & Method",
    4: "ProCLIP Framework",
    5: "Training Objective",
    6: "Experimental Setup",
    7: "Results",
    8: "Ablation & Biological Validation",
    9: "Discussion, Conclusion & References",
    10: "References",
    11: "References",
}


def clean_text(value: str) -> str:
    replacements = {
        "\u00ad": "",
        "\ufb00": "ff",
        "\ufb01": "fi",
        "\ufb02": "fl",
        "\ufb03": "ffi",
        "\ufb04": "ffl",
        "\u2013": "-",
        "\u2014": "-",
    }
    for source, target in replacements.items():
        value = value.replace(source, target)
    return re.sub(r"\s+", " ", value).strip()


def main() -> None:
    reader = PdfReader(PDF_PATH, strict=False)
    pages = []
    for page_number, page in enumerate(reader.pages, start=1):
        text = clean_text(page.extract_text() or "")
        pages.append(
            {
                "page": page_number,
                "section": PAGE_SECTIONS.get(page_number, f"Page {page_number}"),
                "text": text,
                "wordCount": len(re.findall(r"[A-Za-z0-9]+", text)),
            }
        )

    payload = {
        "document": {
            "slug": "proclip",
            "title": (
                "ProCLIP: Contrastive Multimodal Prediction of Spatial "
                "Proteomics from H&E and Spatial Transcriptomics"
            ),
            "shortTitle": "ProCLIP",
            "authors": [
                "Zhaoqi Song",
                "Lecheng Li",
                "Yuxiang Lin",
                "Zixiang Wang",
                "Huimin Zhang",
                "Mengsha Tong",
                "Chaoyong Yang",
            ],
            "pageCount": len(pages),
            "language": "English",
            "published": "2026",
            "pdf": "assets/docs/ProCLIP.pdf",
            "sha256": hashlib.sha256(PDF_PATH.read_bytes()).hexdigest(),
        },
        "pages": pages,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(pages)} pages to {OUTPUT_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
