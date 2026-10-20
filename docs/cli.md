# Command line and Python API

## Installing the CLI

The plugin needs no installation step: its Skill runs
`skills/schematic/scripts/aipe_sketcher.py`, which uses the engine bundled in
the plugin. To use AIPE Sketcher on its own, install the package (Python 3.9+,
no third-party dependencies):

```bash
python3 -m pip install "git+https://github.com/FulongLi/AIPE-Sketcher"
aipe-sketcher --version
```

From a source checkout, `python3 -m aipe_sketch` runs the same CLI, and
`python3 -m pip install .` installs it. The wheel carries the master symbol
sheet as package data, so the CLI works from any directory. Set
`AIPE_SKETCHER_SYMBOLS=/path/to/sheet.svg` to use another copy of the sheet.

## Commands

| Command | What it does |
| --- | --- |
| `aipe-sketcher validate FILE.json` | Electrical checks on Circuit IR plus a check that every kind can be drawn. Draws nothing. `--no-symbols` skips the symbol check |
| `aipe-sketcher render FILE.json -o DIR` | Writes `DIR/<name>.svg` and `DIR/<name>.report.json`. `--output PATH.svg` names the file; `--name`, `--title`, `--candidates 1-12`, `--force-layout` |
| `aipe-sketcher examples --list` | Lists the 14 reference circuits |
| `aipe-sketcher examples NAME... -o DIR` | Renders reference circuits (`--all` for every one) |
| `aipe-sketcher examples NAME --ir-only -o DIR` | Writes their Circuit IR JSON instead |
| `aipe-sketcher kinds` | Component kinds, ports, aliases and whether each can be drawn |
| `aipe-sketcher state STATE.json OUT.svg` | Renders an AIPE Engineering State; see [engineering-state.md](engineering-state.md) |

`FILE.json` may be `-` to read standard input. Every command accepts `--json`.

Exit status: `0` success; `1` the circuit failed electrical validation, a kind
cannot be drawn, or the drawing failed connectivity or layout gates; `2` bad
arguments, a missing file or malformed JSON.

`--force-layout` writes a drawing that fails soft layout gates (for example an
unplaced label) and marks it `forced` in the report. It never bypasses
connectivity validation: a drawing whose wires do not reproduce the Circuit IR
is never written.

The Circuit IR format, the kind table and the modelling conventions are in
[skills/schematic/references/circuit-ir.md](../skills/schematic/references/circuit-ir.md).

## Report

`render` writes a JSON report next to the SVG (and prints it with `--json`):

| Field | Meaning |
| --- | --- |
| `status` | `ok` when an SVG was written, otherwise `failed` |
| `circuit` | name, component and net counts, SHA-256 of the canonical Circuit IR |
| `electrical_validation` | ports, nets and interfaces checked against the kinds |
| `symbol_support` | every kind and port exists in the symbol registry |
| `drawing_connectivity` | `passed` when connectivity read back from the drawn geometry equals the Circuit IR; `failed` lists the faults; `not_run` when nothing was drawn |
| `layout` | `acceptable`, `forced`, `overall_score` (0-100), per-metric `scores`, soft `faults`, `checklist_attention`, the selected geometry candidate |
| `outputs`, `svg` | file paths, SVG SHA-256 and an XML well-formedness check |
| `limitations` | what the checks do not establish |

Connectivity validation proves that the drawing matches the circuit it was
given. It does not show that the circuit is correct, safe, rated or that it
performs as intended.

## Python API

```python
from aipe_sketch import Netlist, Schematic

circuit = Netlist('Inductive branch')
circuit.add('V1', 'voltage_source')
circuit.add('L1', 'inductor', inductance=0.001)
circuit.add('R1', 'resistor', resistance=10)
circuit.connect('input', 'V1.p', 'L1.a')
circuit.connect('output', 'L1.b', 'R1.a')
circuit.connect('return', 'V1.n', 'R1.b')

schematic = Schematic.from_netlist(circuit)
schematic.render('out/branch.svg')
```

Developer commands from a source checkout:

```bash
python3 build.py                         # automatic planning for every example, into out/
python3 build.py buck dab                # a subset
python3 build.py --plan buck             # electrical analysis and relational plan
python3 build.py --manual buck           # preserved manual baseline
python3 build.py --checks
python3 -m unittest discover -s tests
```

On Windows, use `python -X utf8 -m unittest discover -s tests` so existing
UTF-8 symbol/library fixtures are read consistently across system locales.

`topologies.CIRCUITS` and `synthetic.CIRCUITS` contain Netlist-only builders.
The old `CATALOGUE` / `SYNTHETIC` tuple-returning maps remain compatibility
aliases to `manual_topologies.py` / `manual_synthetic.py`.

For an explicit override use `Schematic.from_netlist(circuit, plan=manual_plan)`.
For a single deterministic plan use `candidates=1`. The default searches 12
small spacing and shunt-position variants. Every variant is rerouted, relabelled,
scored and validated; valid candidates always outrank invalid ones. Inspect
`candidate_report` and `selected_candidate` to see the decision.

Electrical validation requires no SVG: `circuit.validate()` checks the declared
ports. `Netlist.from_dict(circuit.to_dict())` round-trips versioned electrical
JSON without drawing metadata. Unknown electrical kinds can declare `ports=`;
a schematic additionally requires a matching symbol registry entry.

Optional notation belongs to the backend:

```python
from aipe_sketch import SchematicText
schematic = Schematic.from_netlist(
    circuit, text={'V1': SchematicText('V', 'supply')})
```

Legacy `add(label=..., sub=..., italic=...)` arguments are accepted through a
weak presentation sidecar, never stored or serialized as electrical attributes.
New regression builders do not use them.
