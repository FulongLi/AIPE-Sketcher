Generated the reference DAB schematic with AIPE Sketcher.

- [SVG schematic](schematics/dab.svg)
- [Circuit IR](schematics/dab.json)
- [Validation report](schematics/dab.report.json)

Electrical validation, symbol support, and drawing connectivity all **passed**. Layout is acceptable, scoring **97/100**, with two spacing warnings on PRI_B and SEC_A; no checklist attention items.

Assumptions: two full bridges, a two-winding transformer with energy-transfer inductance included internally, separate primary/secondary grounds, ideal voltage source, resistive load, and control terminals for all gates. No component values or ratings are specified.

Validation confirms the drawing matches the circuit description; it does not establish safety, ratings, or operating performance.