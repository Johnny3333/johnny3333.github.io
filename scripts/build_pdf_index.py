#!/usr/bin/env python3
"""Rebuild page search data from the exact PDFs distributed by this website.

Usage: python3 scripts/build_pdf_index.py [proclip|scanyomics]
Requires pypdf. With no argument, rebuild both indexes.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import logging
import re
from pathlib import Path
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
SC_SECTIONS = {
    1: 'Abstract & Introduction', 2: 'Framework & Introduction',
    3: 'Introduction & Reconstruction Results', 4: 'Cross-modal Reconstruction Results',
    5: 'Protein Prediction & Teacher Ablations', 6: 'Distillation Results & Study Design',
    7: 'Preprocessing & Evaluation Splits', 8: 'Datasets & Foundation Teachers',
    9: 'Modality Fusion & Sample Context', 10: 'Decoders & Masked Reconstruction',
    11: 'Training Objectives & Technical Controls', 12: 'Training, Representation Probes & Metrics',
    13: 'Evaluation & Discussion', 14: 'Limitations, Conclusion & References',
}

def clean_text(text: str) -> str:
    text = re.sub(r'(\w)-\n(\w)', r'\1\2', text)
    for source, target in {'\u00ad':'', '\ufb00':'ff', '\ufb01':'fi', '\ufb02':'fl', '\ufb03':'ffi', '\ufb04':'ffl'}.items():
        text = text.replace(source, target)
    return re.sub(r'\s+', ' ', text).strip()

def build(slug: str) -> None:
    path = ROOT / 'assets/data' / f'{slug}-pages.json'
    data = json.loads(path.read_text())
    pdf_path = ROOT / data['document']['pdf']
    reader = PdfReader(pdf_path, strict=False)
    pages = []
    for number, page in enumerate(reader.pages, 1):
        text = clean_text(page.extract_text() or '')
        if slug == 'scanyomics':
            header = data['document']['title'] + ' '
            if number > 1 and text.startswith(header):
                text = text[len(header):]
            section = SC_SECTIONS.get(number, 'Manuscript')
        else:
            section = 'Abstract & Introduction' if number == 1 else ('References' if number >= 17 else 'Manuscript')
        pages.append({'page': number, 'section': section, 'text': text, 'wordCount':len(re.findall(r'[A-Za-z0-9]+', text))})
    data['pages'] = pages
    data['document']['pageCount'] = len(pages)
    data['document']['sha256'] = hashlib.sha256(pdf_path.read_bytes()).hexdigest()
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    path.with_suffix('.js').write_text('window.PAPER_INDEX = ' + json.dumps(data, ensure_ascii=False).replace('</', '<\\/') + ';\n')
    print(f'{slug}: {len(pages)} source pages indexed')

if __name__ == '__main__':
    logging.getLogger('pypdf').setLevel(logging.ERROR)
    parser = argparse.ArgumentParser()
    parser.add_argument('paper', nargs='?', choices=['proclip','scanyomics'])
    args = parser.parse_args()
    for slug in [args.paper] if args.paper else ['proclip','scanyomics']:
        build(slug)
