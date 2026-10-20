---
name: schematic
description: Generate connectivity-checked SVG electrical schematics with AIPE Sketcher. Use when the user asks to draw, sketch, generate, render or export a circuit schematic or circuit diagram - power converters (buck, boost, half bridge, full bridge, dual active bridge / DAB, LLC resonant, three-phase inverter) or any custom circuit described as components and connections, a netlist or Circuit IR JSON - or asks to validate a circuit's electrical connections. Converts the request into explicit Circuit IR, runs the bundled AIPE Sketcher Python engine, and reports validation results, assumptions and limitations.
---

# AIPE Sketcher: electrical schematic generation

Pipeline: **request -> explicit Circuit IR (JSON) -> validate -> render SVG ->
report**. The engine places, routes and labels the drawing, then reads the
drawn wires back and refuses to write an SVG whose connectivity differs from
the Circuit IR. Your job is to produce faithful Circuit IR and report honestly.

## Run the engine

`<SKILL_DIR>` below is a placeholder: replace it with the absolute path of
the directory containing this `SKILL.md` (in Claude Code:
`${CLAUDE_SKILL_DIR}`). The engine needs Python 3.9+ and nothing else.

```bash
python3 "<SKILL_DIR>/scripts/aipe_sketcher.py" --version
```

On Windows use `py -3` or `python` instead of `python3`. If `aipe-sketcher`
is on `PATH` (pip-installed) it is the same CLI. Every command below is an
argument to that launcher. Pass `--json` and read the JSON, not the human
summary.

| Command | Purpose |
| --- | --- |
| `kinds --json` | Supported component kinds, ports and aliases |
| `examples --list` | The 14 reference circuits |
| `examples NAME --ir-only -o DIR` | Write a reference circuit's exact Circuit IR |
| `validate FILE.json --json` | Electrical and symbol checks; draws nothing |
| `render FILE.json -o DIR --json` | `DIR/<name>.svg` plus `DIR/<name>.report.json` |
| `state STATE.json OUT.svg --json` | AIPE Engineering State mode (`extensions["aipe.sketch"]`) |

Exit status: 0 success, 1 circuit or drawing failed validation, 2 bad input.

## Workflow

1. **Choose the source of connectivity.**
   - *Named reference topology* (buck, boost, half_bridge, full_bridge,
     three_phase_inverter, dab, llc_resonant): run `examples --list`, then
     `examples NAME --ir-only -o DIR`, and use that file unchanged. Tell the
     user which reference configuration it is, using the assumptions listed
     in [references/reference-circuits.md](references/reference-circuits.md)
     (for example: the reference DAB has no separate series inductor; the
     reference LLC uses a single-diode rectifier). Change it only when the
     user asks, and say what you changed.
   - *Custom circuit*: read [references/circuit-ir.md](references/circuit-ir.md)
     first, then write the JSON. Every net must come from the user's
     description.
   - *User-supplied Circuit IR or Engineering State*: use it as given.
2. **Never invent electrical connections.** If a node, return path, polarity,
   ground, transformer winding, rectifier arrangement or interface is not
   determined by the request, ask a short, specific question before
   rendering. Only the conventions written in `circuit-ir.md` may be applied
   without asking (for example, a `control` terminal on each switch gate);
   list every one you applied as an assumption.
3. **Validate**: `validate FILE.json --json`. If a problem comes from your own
   transcription, fix the JSON and validate again. If it comes from the
   user's description (a floating port, a missing return), ask; do not patch
   it silently.
4. **Render** into the directory the user chose (default `./schematics`):
   `render FILE.json -o DIR --json`. Keep the Circuit IR JSON next to the SVG.
5. **Report**, quoting values from the JSON report:
   - SVG path (and the Circuit IR path).
   - `electrical_validation`, `symbol_support` and `drawing_connectivity`
     status; `layout.acceptable`, `layout.overall_score`, and any
     `layout.faults` or `layout.checklist_attention` items as warnings.
   - Every assumption you made or that the reference circuit carries.
   - This limitation, in substance: the check proves the drawing matches the
     supplied circuit description; it does not establish that the circuit
     is correct, safe, rated or that it will perform as intended.

## When something fails

- `symbol_support` failed: the kind cannot be drawn yet. Show `kinds`; offer a
  supported equivalent only with the user's agreement (it changes the circuit).
- Layout `NOT acceptable` / `layout rejected`: the drawing breaks a hard
  quality rule (overlap, unplaced label, ...). Report the faults. You may retry
  with `--force-layout` (soft gates only; connectivity is still enforced) and
  must say the layout was forced. Never alter connectivity to make a layout pass.
- `drawing_connectivity` failed: no SVG is written. Report it as an engine
  limitation for that circuit; do not hand-draw or edit SVG geometry instead.
- Never edit a generated SVG's wires or symbols by hand: that voids the
  connectivity check and the hashes in the report.

## Do not

- Claim physical correctness, component ratings, efficiency, losses, thermal
  or control performance, or simulation results. None are computed.
- Report a validation result you did not read from the engine's output.
- Use a topology name alone as a circuit: connectivity is always explicit.
