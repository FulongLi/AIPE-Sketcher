# Symbol library

Where every drawn symbol comes from, how the master sheet is parsed, and how
the derived library and registry are produced and audited. This is also the
history of the extraction work, kept because it explains several design
decisions.

## The master sheet

`assets/master/Inkscape_Symbols_All.svg` is the
[UPB-LEA Inkscape electric symbols](https://github.com/upb-lea/Inkscape_electric_Symbols)
sheet: 196 `<symbol>` definitions with `<title>` names, everything on a
2.6458 mm grid, and nearly every two-terminal symbol exactly 10.583 mm tall —
so half a symbol is exactly 2 G and devices land on rails without fudging.

> **Licensing:** the sheet is third-party material dedicated to the public
> domain under CC0 1.0. See [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md).

Compound parts (`parts.py`) can assemble several symbols plus primitive
strokes. No supported kind currently needs one: the transformer is the sheet's
own `g7138`, cleaned to its device geometry (see [Transformers](#transformers)).

## Extracted component library

The master sheet is split into a clean, per-section library:

```
assets/master/Inkscape_Symbols_All.svg      canonical, never generated
assets/extracted_library/<section>/*.svg    derived, regenerate freely
assets/symbol_registry.json                 the index
out/catalog_<section>.svg                   review catalogues
out/library_report.{txt,json}               inspection report
```

```bash
python3 tools/extract_library.py --report
python3 tools/extract_library.py --section standard_elements --catalog
python3 tools/extract_library.py --all --catalog
```

**191 symbols across 14 sections; 158 clean, 33 need cleaning.** Sections are
detected from the sheet's own headings, not assumed — heading-sized text is
matched against the real section titles so an in-drawing `+`, `n:1` or `f(t)`
is never mistaken for one.

### Clustering is what makes this work

Many `<symbol>` wrappers enclose geometry from neighbouring drawings, so their
bounding boxes are meaningless — `g7138` claims 144 mm for a 10 mm device.
Grouping each wrapper's children by proximity separates the device from the
strays. The largest cluster is the device; the rest are flagged, never
discarded.

Two bugs had to be fixed before this was trustworthy, both found by looking at
the rendered catalogue rather than the numbers:

* **Transforms were only half handled.** First `translate` was ignored
  entirely — `g10556` wraps a diode in a group carrying `translate(19.84)` and
  extracted as a doubled symbol. Then `rotate` and `scale` were still ignored,
  which is what hid the transformer's secondary winding. Geometry is now
  walked with a full affine matrix stack (translate, scale, rotate about a
  centre, matrix, skew).
* **A symbol is placed by its `<use>`, not its own frame.** Section assignment
  read symbol-local coordinates, putting the battery under *Designators*.
  Using the page position fixed the inventory.

The cluster gap is 2 mm: above ~1.6 mm a capacitor's plates stay together,
and much above 2 mm neighbouring components on the sheet start merging — which
is what made `Resistor_US` extract with a MOSFET on top of it.

### Provenance

Every extracted file and registry entry records `semantic_name`,
`original_symbol_id`, `source_section`, `source_file`, `original_bbox`,
`clean_bbox`, `anchor`, `default_orientation`, `status` and
`source_type: extracted_library`. Variants are kept distinct rather than
overwritten (`capacitor` / `capacitor_polarised`, `inductor_air_core` /
`inductor_cored`, `mosfet_n_enhancement` / `mosfet_n_depletion`); where the
`<title>` alone is ambiguous the symbol id is appended.

`source_version` is a digest of the master, so extraction is reproducible — a
test re-runs it and compares bytes.

### Transformers

All ten candidates were extracted, cleaned and rendered. The first pass
concluded no wrapper held a complete two-winding device — that conclusion was
wrong, and the catalogue is what exposed it.

`g7138` draws its **secondary winding as a `rotate(180)` copy** of the primary,
and `path5746` carries `scale(-1)`. The extractor only parsed `translate`, so
the secondary was measured 10 mm away from where it draws and fell outside the
device cluster. With full affine transforms the wrapper yields the complete
symbol:

| | before | after |
|---|---|---|
| `g7138` cleaned | 5.7 × 10.6, primary + core only | **6.6 × 10.6, both windings, core, polarity dots** |
| `g5846`, `g5868` | empty housing boxes | boxes with their windings drawn |
| `g8072`, `g8142`, `g8123`, `g6295`, `g21122`, `g33442` | outlines | complete vector-group symbols |

`g7138` is now the transformer the schematics use, and the hand-assembled
compound is gone. The registry reports it as `cleaned_library g7138`:

```
1 cleaned_library, 1 custom, 14 library
  terminal: the sheet has no open-circle interface marker
  transformer: wrapper also encloses neighbouring geometry, so only the
               device's own children are kept
```

`pins.py` names the six child ids to keep. The coupling arrow and the `n:1`
text are left out — they are annotations, and dropping them keeps the symbol
at the library's 4 G height. Nothing is redrawn.

## Symbol registry

`Inkscape_Symbols_All.svg` → `symlib` parser → `parts.Registry` → renderer,
placement metadata, pin geometry. The master sheet is the authoritative
graphical source and is always parsed directly; **no part of the pipeline
reads an exported file**, and a test builds a drawing with the previews
deleted to prove it.

Components are requested by semantic name, never built as paths:

```python
registry.get('capacitor')       # aliases resolve: cap
registry.get('voltage_source')  # vsource
registry['nmos'].symbol_id      # 'g4046'
```

Each kind exposes `symbol_id`, `bbox`, `ports` with preferred sides,
`default_rotation`, `preferred_orientation`, `semantic_role`, `visual_margin`,
`preferred_label_side`, `preferred_label_offset`, and its provenance.

### Lookup priority

1. **library** — instantiate a `<symbol>` from the master sheet.
2. **compound** — assemble from library primitives.
3. **custom** — only when neither is possible, and the reason is recorded.

`python3 tools/export_symbols.py --report` audits this (output as of 0.2.0):

```
kind            source           symbol      ports
nmos            library          g4046       d,g,s
igbt            library          g13197      c,e,g
cap             library          g8210       a,b
transformer     cleaned_library  g7138       p1,p2,s1,s2
terminal        custom           -           t
...
1 cleaned_library, 1 custom, 14 library
  terminal: the sheet has no open-circle interface marker; its only lone
            circles are filled GND glyphs
  transformer: wrapper also encloses neighbouring geometry, so only the
            device's own children are kept
```

Both non-library-as-is cases were verified against the sheet rather than assumed.
The sheet does carry IEC source forms (`voltage_source`, a bar parallel to the
terminals; `g6663`, perpendicular) — but none shows `+`/`−` polarity or a
current arrow, so the library circle `g11181` supplies the body and only the
missing marks are added over it from `parts.DECOR`. The audit lists the
source as `library g11181`.

### Geometry is preserved

Placement may translate, rotate by a right angle, and mirror. Nothing else.
`symbol_integrity` compares each placed part's drawn extent against its
registry extent and fails on any difference:

```
Q1: drawn x extent 14.817 mm but the library symbol is 10.583 mm -- it has been scaled
Q1: rotated 37 deg, not a right angle
```

Tests inject both to confirm the check can fail.

### Generated previews

`python3 tools/export_symbols.py` writes `assets/generated_symbols/<kind>.svg`
with ports and margin boxes marked, plus `registry.json`. These are generated
artefacts for debugging, documentation, inspection and tests — not the
canonical source, and gitignored.

Each file carries its provenance so a stale preview is obvious:

```xml
<!-- generated from Inkscape_Symbols_All.svg [61f2f1a5919bcf8c] -- library g4046; regenerate, do not edit -->
<aipe:generated source-file="Inkscape_Symbols_All.svg" source-symbol="g4046"
                source-version="61f2f1a5919bcf8c" kind="nmos"
                symbol-source="library" .../>
```

`source-version` is a digest of the master sheet, not a wall-clock time, so
two runs over the same master are byte-identical — a test asserts it.

## Source and transformer symbols

The sheet's source circle carries no polarity and no direction, and
conventional practice requires both, so they are drawn as decoration over the
library symbol: `+` and `\u2212` inside the circle with the plus toward the
positive terminal, and a current source gets a shaft-and-head arrow pointing
from the current-entry terminal to the current-exit one.

The transformer comes from the sheet as well — `g7138`, cleaned to its own six
child elements. It is 2.5 G × 4.0 G, a width-to-height ratio of 0.63;
`transformer_spread` fails anything wider than tall, since a spread-out
transformer reads as two separate inductors.
