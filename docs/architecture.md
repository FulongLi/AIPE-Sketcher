# Architecture

AIPE Sketcher generates a schematic from an electrical circuit graph, the
master symbol library and a general drawing grammar. The schematic is a view
of the circuit: nothing downstream of Circuit IR may change connectivity.

## Pipeline

```
Circuit IR → graph analysis → coordinate-free AutoPlan
           → drawing grammar → placement → Manhattan routing → global labels
           → score geometry candidates → connectivity validation → SVG
```

`Schematic.from_netlist()` is the primary API. Converter names are never inputs
to the planner or scorer. Reference converters and synthetic networks are test
inputs. The master `assets/master/Inkscape_Symbols_All.svg` remains authoritative.

| Layer | Modules | Responsibility |
| --- | --- | --- |
| Electrical IR | `netlist.py`, `electrical.py` | Components, named ports, nets, interfaces, roles and electrical attributes |
| Graph planning | `analysis.py`, `planner.py` | Recognise motifs, infer power flow, describe relationships without coordinates |
| Drawing grammar | `grammar.py`, `plan.py`, `config.py` | Translate relationships into rows, slots, orientations and spacing |
| Symbol library | `parts.py`, `pins.py`, master SVG | Kind-to-symbol mapping, port geometry, margins and provenance |
| Geometry | `placement.py`, `router.py`, `labels.py` | Visual cells, coordinates, paths and collision-free labels |
| Selection and validation | `candidates.py`, `score.py`, `validate.py` | Rank 12 deterministic geometry candidates; reject electrical mismatches |
| Presentation | `presentation.py`, `pipeline.py` | Optional text styling and rendering |

`AutoPlan` contains no coordinates or spacing. The older `LayoutPlan` is a
geometric constraint language retained for expert overrides and baseline tests.
See [the audit and migration notes](#circuit-ir-architecture-audit) below.

Ground domains are explicit electrical kinds. Use `power_ground` for the IEC
earth-bar symbol and `digital_ground` (aliases `digital_gnd`, `dgnd`, or
`signal_ground`) for the open inverted-triangle symbol. Legacy `gnd` and
`ground` inputs resolve to `power_ground`; separate ground components remain on
separate nets unless the circuit IR deliberately connects those nets.

## Plugin and CLI layer

```
user request -> agent Skill (skills/schematic) -> Circuit IR JSON
             -> aipe_sketch.cli (validate / render) -> Schematic.from_netlist
             -> SVG + <name>.report.json
```

Codex and Claude Code load the same Skill and the same engine; neither host
has its own drawing logic. `circuit_io.py` checks hand-written Circuit IR and
reports every problem at once; `cli.py` wraps validation, rendering and the
Engineering State adapter; `paths.py` locates the master symbol sheet in a
source checkout, an installed wheel, or `$AIPE_SKETCHER_SYMBOLS`. See
[plugins.md](plugins.md) and [cli.md](cli.md).

## Netlist as source of truth

```python
n = Netlist('Half Bridge')
n.add('Q1', 'nmos')
n.add('Q2', 'nmos')
n.connect('DC_POS', 'V1.p', 'Cdc.a', 'Q1.d')
n.connect('SW_A',   'Q1.s', 'Q2.d', 'OUT.t')
n.connect('DC_NEG', 'V1.n', 'Cdc.b', 'Q2.s', 'GND1.t')
```

A port belongs to exactly one net and the netlist refuses to let it join a
second. `Netlist.validate()` rejects unknown ports, floating ports and
one-terminal nets before any geometry exists.

### Checking the drawing against it

`validate.py` rebuilds the connectivity from the drawn geometry alone —
ignoring net names and the router's intentions — by unioning wire segments that
share an endpoint or meet at a tee, attaching component ports that land on a
segment, and **refusing to union two segments that merely cross**. The
resulting partition must equal `Netlist.partition()` exactly.

This is what proves a visual crossing never became an electrical node. Two
tests deliberately inject a short and a break to confirm the checker catches
them.

## Regression coverage

Seven reference converters and seven synthetic circuits exercise the default
path. Tests also rename every component and net, reverse insertion order,
verify isolated net partitions, compare manual connectivity, and inject shorts.
[Regression results](auto-planning-results.md) record automatic/manual
scores and validity. A passing score is not a proof that every arbitrary graph
will have an acceptable layout; the renderer rejects invalid candidates.

## Known limits

* Power-path inference is structural, not an operating-point or energy-flow
  simulation. Multi-source, cyclic and disconnected graphs may have ambiguous
  ordering; deterministic tie-breaking is reported in plan diagnostics.
* The current bridge grammar recognises two-device legs. Arbitrary multilevel
  stacks and overlapping motifs need additional general grammar rules.
* Twelve candidates explore small adjacent/bridge spacing and shunt-position
  changes. They do not exhaust group permutations, routing corridors or every
  symmetric orientation. Some candidates may be identical for a simple graph.
* Label bounds use conservative font estimates. Unsupported symbols and layouts
  with no valid candidate fail explicitly; `force=True` never bypasses electrical
  connectivity validation.
* Recognised repeated bridge legs get equal geometry. Graph equivalence alone
  does not solve all arrangements of repeated multi-component modules.
* The registry uses curated port geometry from the master sheet. Most symbols
  in the full sheet still lack an engineering port map and cannot yet render.
* Simulation, SPICE and other exporters are future backends. This version adds
  their electrical validation and serialization boundary, not those backends.

---

## Circuit IR architecture audit

### Phase 1: baseline (before implementation)

The baseline passes 177 unittest checks. `Netlist` owns components and named
hyperedges and enforces single-net port membership, but its components also
store label text, subscripts and italic styling. Port validation and graph
colour refinement depend on the symbol registry. There is no independent
electrical component schema or serialization contract.

`parts.Registry`, `pins`, and the canonical master SVG already own symbol
geometry, port offsets, provenance, labels and visual margins. These remain
authoritative for drawing; electrical port names and equivalence belong in
an independent electrical schema.

`analysis` discovers legs, rail candidates and graph equivalence classes.
`LayoutPlan` is a manual geometric constraint language: despite its docstring,
rows, offsets and spacing are geometric. Every reference and synthetic builder
constructs one, and some provide routing trunks. No automatic planner exists.

`placement` handles relationship-aware spacing; `router` handles Manhattan
paths; `labels` searches collision-free candidates; `score` measures general
properties; `validate` reconstructs connectivity. `repair` only reports missing
labels. These are schematic backend concerns, not Circuit IR concerns.

### Ownership contract

| Layer | Owns | Must not own |
| --- | --- | --- |
| Circuit IR | kinds, named ports, nets, roles, external interfaces, electrical attributes | symbols, coordinates, labels, spacing |
| Electrical schema | port names, control/power semantics, interchangeable ports | SVG or port offsets |
| Symbol registry | master symbol mapping, body/port geometry, margins, typography, provenance | circuit connectivity |
| Analysis / automatic plan | graph motifs, energy-transfer ordering, branch and interface relationships | coordinates, SVG, converter-name dispatch |
| Drawing grammar / manual plan | symbolic relationships translated into rows, slots, orientations, corridors | electrical changes |
| Placement / routing / labels | visual cells, coordinates, wire paths, collision-free labels | electrical changes |
| Scoring / candidate search | deterministic geometry alternatives, validation and ranking | electrical changes |

Manual plans remain expert overrides and regression baselines. The new default
must derive its schematic entirely from the electrical graph and the global
grammar. Simulation execution is outside this refactor; independent validation
and versioned electrical serialization establish the future backend boundary.

### Implemented migration

1. The baseline audit above was recorded before changing behavior.
2. `planner.graph_analysis` contracts electrical bridge and parallel motifs,
   removes return/control shortcuts, and derives an ordered transfer graph.
   `AutoPlan` records block ordering, incoming nets, local branch relationships,
   references, interfaces, equivalent classes and a dominant source-to-sink path.
3. `grammar.lower` applies global series, shunt, bridge, transverse-branch,
   parallel and interface rules. No converter name or builder is consulted.
   All seven reference converters now use this path by default.
4. The grammar covers isolated passive networks, primary/secondary bridges,
   rectifying devices and repeated leg families. Transformer alignment uses the
   registry's actual port offset. Each isolation-domain return remains separate.
5. `Schematic.from_netlist` searches up to 12 candidates (12 by default), ranks
   valid drawings first, and keeps manual `LayoutPlan` support. Candidate repairs
   change adjacent spacing, repeated bridge spacing and local shunt displacement;
   every trial is placed, rerouted, relabelled and electrically validated.
   Series and parallel gap scales stay fixed. Rendering revalidates the winner.
6. Electrical kinds, port declarations and port equivalence live in
   `electrical.py`. `Netlist.validate()` and version-1 JSON interchange do not
   depend on SVGs. Importing `Netlist` does not load schematic modules. Custom
   kinds can declare ports and electrical attributes for other backends.

Placed components expose `body_bbox`, `visual_bbox`, `label_keepout` and `ports`.
Placement reserves provisional visual margins and horizontal label projections;
relationship gaps absorb those margins instead of accumulating arbitrary padding.
The global label solver computes the final label keepouts after routing.

### Compatibility and limitations

The public functions in `topologies.py` and `synthetic.py` now return Netlist.
Their `CIRCUITS` mappings drive the default build. The historic tuple-returning
`CATALOGUE` / `SYNTHETIC` mappings point at preserved `manual_*` fixtures so old
comparison tests and expert callers can migrate independently. `--manual` only
lists fixtures with a saved baseline.

Legacy label keywords and read-only component label accessors delegate to a weak
presentation sidecar. They are absent from component slots, electrical attributes
and JSON. New code should pass `SchematicText` to the schematic backend.
Electrical interface `name` and `direction` are optional semantic attributes;
marker geometry and typography are backend decisions.

Power flow is a deterministic structural inference, not proof of operating-point
energy transfer. Equal-cost choices may depend on stable reference ordering.
Recognised bridge families get identical geometry; general graph equivalence does
not yet synthesize every possible repeated multi-component module. The bounded
search does not exhaust permutations or routing corridors. Unsupported graphs
remain explicit validation failures rather than silently altered circuits.
No simulation execution or SPICE/PLECS/Simulink exporter is implemented here.
