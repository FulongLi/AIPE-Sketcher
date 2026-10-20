# Third-party notices

AIPE Sketcher's own code and documentation are covered by [LICENSE](LICENSE).
The material below belongs to others, keeps its own licence, and is **not**
restricted by the AIPE Sketcher licence.

## Electric Symbols for Inkscape (UPB-LEA)

| | |
| --- | --- |
| Files | `assets/master/Inkscape_Symbols_All.svg` (also shipped in the Python wheel as `aipe_sketch/_data/Inkscape_Symbols_All.svg`) |
| Source | <https://github.com/upb-lea/Inkscape_electric_Symbols> |
| Authors | Paderborn University, Department of Power Electronics and Electrical Drives (LEA), and the project's contributors |
| Licence | Creative Commons CC0 1.0 Universal (public domain dedication) — <https://creativecommons.org/publicdomain/zero/1.0/> |

The licence was confirmed on 2026-10-20 from the upstream repository's
`LICENSE` file (CC0 1.0 Universal) and from the CC0 declaration embedded in the
sheet's own `<metadata>` block. The local copy has not been matched byte-for-byte
to a specific upstream revision and may have been re-saved or edited; it is
treated as a CC0-derived copy.

CC0 places no conditions on use. This notice is a courtesy credit and a record
of provenance, not a licence condition, and nothing in the AIPE Sketcher licence
restricts, revokes or conditions anyone's rights in this sheet.

### Material derived from the sheet

These files reproduce symbol geometry or metadata taken from the sheet. The
symbol geometry inside them remains CC0; the AIPE Sketcher licence applies only
to the original selection, arrangement, port maps and tooling that produced them.

- `assets/symbol_registry.json` — index of the sheet's symbols with provenance.
- `assets/generated_symbols/` and `assets/extracted_library/` — regenerable
  extracts (not tracked in git; produced by `tools/`).
- `out/*.svg`, `out/transformer_candidates/*.svg` — reference schematics and
  review catalogues rendered from the sheet.
- Every SVG schematic that AIPE Sketcher generates embeds symbols from the sheet.

## Not distributed with AIPE Sketcher

Audited on 2026-10-20. None of the following is bundled; each is listed so the
licensing boundary is explicit.

| Item | Use | Licence |
| --- | --- | --- |
| Python standard library | Run-time; the engine has no third-party Python dependencies | PSF License |
| Hatchling | Build back end, downloaded by `pip`/`uv` at build time only | MIT |
| Times New Roman (by name) | Font family requested in generated SVG text; no font file is embedded | Viewer-supplied |
| GitHub Actions (`actions/checkout`, `actions/setup-python`) | Continuous integration only | MIT |
| OpenAI Codex, Anthropic Claude Code | Optional agent hosts that load the plugin | Their own terms |
