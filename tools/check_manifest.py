#!/usr/bin/env python3
"""Validate aipe.yaml against the vendored AIPE-Registry schema.

Needs PyYAML and jsonschema (CI installs them; the engine does not).
    python3 tools/check_manifest.py
"""
import hashlib
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = ROOT / 'tests' / 'fixtures' / 'aipe-registry' / 'capability-manifest.schema.json'
PINNED = '6d0818650937010c12f5b33efcb1adf9246118f80d989ee7d1079fa8e6e24c5a'


def main():
    import jsonschema
    import yaml
    raw = SCHEMA.read_bytes()
    if hashlib.sha256(raw).hexdigest() != PINNED:
        print(f'{SCHEMA}: does not match the pinned Registry schema', file=sys.stderr)
        return 1
    manifest = yaml.safe_load((ROOT / 'aipe.yaml').read_text(encoding='utf-8'))
    validator = jsonschema.Draft202012Validator(
        json.loads(raw), format_checker=jsonschema.FormatChecker())
    errors = sorted(validator.iter_errors(manifest), key=lambda e: list(e.path))
    for error in errors:
        print(f'aipe.yaml {"/".join(map(str, error.path)) or "<root>"}: {error.message}')
    missing = [ref for ref in manifest['documentation'] + manifest['validation']['evidence']
               if not ref.startswith('https://') and not (ROOT / ref).exists()]
    for ref in missing:
        print(f'aipe.yaml: referenced file does not exist: {ref}')
    if errors or missing:
        return 1
    print('aipe.yaml: valid against AIPE-Registry capability manifest v0.1.0')
    return 0


if __name__ == '__main__':
    sys.exit(main())
