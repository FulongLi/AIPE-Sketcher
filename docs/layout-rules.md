# Layout rules and drawing metrics

How AIPE Sketcher turns a circuit graph into a readable drawing: spacing,
motifs, the main power path, scale, terminals, labels and the metrics that
score every candidate layout. Electrical connectivity always outranks these
aesthetic rules; see [architecture.md](architecture.md) for the pipeline.

## Spacing comes from relationships, not groups

Gap is decided for each **adjacent pair** from how the two are connected,
because a group may hold a series element feeding a parallel block and
classifying the whole group gives neither the right spacing:

| relationship | gap |
|---|---|
| joined by a two-terminal net (series) | 2 G |
| shunted across the same node pair (parallel) | 2 G |
| sharing a node (directly connected) | 4 G |
| unrelated, across a functional boundary | 6 G |
| legs of one bridge | 6 G, uniform pitch |

An electrical relationship crossing a functional boundary overrides the
boundary. Only a bridge keeps a uniform pitch, because its legs must stay
evenly spaced.

## Topology motifs

A switching device is not automatically half of a bridge.
`planner.graph_analysis` discovers source/DC-link blocks, series paths, shunts,
bridge families, parallel blocks, isolation, rectifiers, loads and interfaces.
`analysis.classify_motifs` remains a legacy local diagnostic. Core rules include:

| motif | how it is recognised | placement |
|---|---|---|
| `bridge_leg` | the high device hangs from the positive supply | stacked, midpoint between |
| `shunt_switch` | low port on the reference, high port on a main-path node | centred in its own branch |
| `series_power_path` | passives joined two-at-a-time in series | one horizontal line |
| `parallel_output_block` | two or more shunt parts sharing the same net pair | one compact block |

```
boost          shunts=['Q1']            bridge_legs=[]
buck           shunts=[]                bridge_legs=['Q1/D1']
half_bridge    shunts=[]                bridge_legs=['Q1/Q2']
```

A boost is **not** a half bridge. Its main path stays horizontal and Q1 hangs
from the switching node down to the return rail:

```
Vin ─── L1 ─── ● ─── D1 ─── output
               │
               Q1
               │
              GND
```

`shunt_branch_balance` scores `|L_top - L_bottom| / (L_top + L_bottom)` for
every shunt, and `shunt_verticality` fails any shunt whose power terminals are
not vertically aligned. Before this, the boost scored a **perfect 1.0
imbalance** -- 2.00 cells above the switch and 0.00 below, because bridge-leg
geometry dropped it onto the rail. It is now 1.0 / 1.0, error 0.

> The buck's freewheel diode stays a **bridge-leg member, not a shunt**: a buck
> *is* a half bridge with the low-side switch replaced by a diode, and its
> anode belongs on the rail. Rebalancing it would lift it off the rail, which
> is not how a buck is drawn.

## Main power path

A resonant converter's primary side -- switching node, Cr, Lr, transformer --
should read as one continuous horizontal line. Two metrics enforce that:

* **`centreline_deviation`** finds runs of passives joined in series and
  penalises any vertical step between consecutive members, measured at the
  ports that actually join them.
* **`near_component_bend_penalty`** penalises a corner within one local wire
  length of a passive or magnetic port -- a wire should leave a capacitor,
  inductor or transformer along that component's own axis.
* **`port_connection_geometry`** applies the same convention to every direct
  point-to-point power connection. The first/last segment follows the declared
  port face, and its soft length target is one half of that component's body
  width (side port) or height (top/bottom port). Rails, buses, grounds,
  terminals and control nets are exempt because the floorplan sets their stub
  length.

A *series link* is a net joining exactly two components. A rail or a filter
tap has more, and the parts on it are not in series -- without that
distinction the DC- rail looked like a Cr-to-T1 chain.

The LLC places its transformer half a symbol below the switching-node row, so
`T1.p1` lands exactly on that row and the whole tank stays collinear:

```
Q1/Q2 midpoint ──── Cr ──── Lr ──── T1 ┃ ──── D1 ──── C2 ──── R1
```

### Spacing by relationship

| relation | target | LLC measured |
|---|---|---|
| series passive chain | 2 G | Cr→Lr **2.0**, D1→C2 **2.0** |
| chain across a boundary | 2 G | Lr→T1 **2.8**, T1→D1 **2.8** |
| functional group | 6 G | Q1→Cr **6.5** |

Chain detection crosses functional boundaries -- a tank running into a
transformer is one chain even though they are different blocks -- and
rectifiers count, so a transformer never sits far from the rectifier after
it. A ground glyph sharing a slot is neutral and does not break a chain.

Chain members carry a reduced keep-out (0.5 G) on the facing sides only.

## Visual scale

Every symbol in the library is exactly **4 G tall**, so 4 G is the unit of
visual scale — one component dimension, called `CELL`. Every spacing derives
from it:

| quantity | value |
|---|---|
| clearance between neighbouring bodies | 1 CELL |
| leg midpoint gap | 1 CELL (1.5 where take-off corridors need room) |
| slot pitch inside a group | widest body + 1 CELL |
| functional-group pitch | 10 G |
| around a transformer | 9 G — more clearance than a passive gets |

Slot pitch is derived from the group's own widest body, so narrow passives sit
close together while switching devices keep a full cell apart. Because every
slot of a repeated structure holds the same devices, repeated structures still
come out evenly spaced. Measured body-to-body gaps across the catalogue
are 1.00–1.12 CELL.

The sheet is fitted to its content and the whole drawing is shifted into the
margin by a whole number of grid steps, so nothing is ever clipped and
placement stays on grid.

## Terminals, junctions and boundaries

Four visually distinct things:

| meaning | drawn as |
|---|---|
| exposed power boundary (an output port, a phase terminal) | open circle, r = 0.6 mm |
| electrical junction | filled dot, r = 0.4 mm |
| control port, ordinary connection, crossing | nothing |

**A boundary marker is reserved for main power-side interfaces.** Gate drives,
control ports, switching nodes, transformer connections and every other
internal node carry none — a wire ending somewhere is never reason enough.

Interface status is explicit metadata on the component, one of:

* `interface='power'` — a main power boundary; carries the marker.
* `interface='control'` — a gate drive or sensing port. A switch-gate
  interface stays in Circuit IR for connectivity, but is co-located with the
  gate in the schematic: the library symbol's own gate lead is retained and no
  additional line segment or boundary marker is drawn.
* `None` — not an interface. The netlist refuses a terminal without one, and
  refuses an interface on anything that is not a terminal.

### Marker geometry

The wire stops **at the circumference**, never running to the centre:

```
wire ─────○          not   wire ──────⊕────
```

The circle is placed one radius beyond the wire's end, along the wire's own
axis. The outward direction is taken from the segment that actually arrives,
so nothing has to be declared by hand and the circle is automatically centred
on the wire axis whichever way the connection approaches.

`marker_geometry` checks both halves: the port must sit exactly one radius
from the centre, and no wire may reach into the circle's interior. A test
pushes a wire through a marker to confirm the check can fail.

## VIN and VOUT are semantic, not mandatory ink

A net may be *called* `VOUT` for analysis without that implying any rendered
text. Semantic net name and drawn label are separate concerns, and nothing
creates a label merely because a circuit has an input and an output.

**Input.** When a circuit has an explicit source, the source carries the name
itself — labelled `V_in`, not `V1` with a second `VIN` annotation beside it.

**Output.** No output port is appended just to say "this is the output". A
converter that ends in `Cout + RL` simply ends there. A port appears only
where the output is genuinely exposed:

| topology | output |
|---|---|
| buck, boost, DAB, full bridge | ends at its load network — no port |
| half bridge | `VOUT` exposed: it has no load of its own |
| three-phase inverter | `PHA`, `PHB`, `PHC` exposed |

`redundant_annotation` enforces this rather than trusting the topology
definitions. It catches both anti-patterns by name:

* a source labelled `V1` with a separate `VIN` annotation nearby →
  *"label the source itself instead"*
* an output port on a net that already contains a load →
  *"the output already ends in a load network, so an output terminal adds
  nothing"*

Tests inject both to confirm the check can fail.

## Label placement

All label placement goes through one engine (`labels.py`). Topology
definitions describe the circuit; they never choose a label position -- a test
asserts `topologies.py` contains no `label_side=` or `label_offset=`.

For each component the engine takes the registry's preferred side, generates
candidates in a fixed order (preferred, opposite, above, below, left, right),
rejects any that collide with a body, another label, a wire, a junction dot or
a terminal marker, and keeps the cheapest survivor. Cost weighs departure from
the preferred side, distance from the body and its port, and remaining
clearance. **It never returns an overlapping position** -- if every candidate
fails it returns nothing, and the drawing is rejected.

Preference is per orientation, not per rotation alone:

```python
'filter': dict(side='left', flat='above', offset=1.3)
```

Rotating the upright preference cannot express the convention: a capacitor
prefers `left` standing up, which rotates to `below`, but a horizontal
capacitor should be labelled `above` like every other flat passive. The
registry therefore holds both, and the engine picks by orientation.

Side and offset come from the registry per semantic role, so equivalent
components place their labels at identical distances — `label_distance`
irregularity is 0 across the catalogue. A component laid on its side (a
horizontal L/C/R/D) is labelled above, per convention.

Every label carries a **clearance margin**, not merely a non-overlap
requirement: 0.5 G horizontal and 0.35 G vertical. Nothing — body, other
label, or wire — may enter that box.

An `above` label is anchored by its baseline, so its box still reaches below
that by the descent plus the pad. `MIN_STACK_OFFSET` clamps stacked offsets so
a label can never sit inside its own body; that was a real bug, found when the
transformer's label dipped 0.14 mm into it.

When the repair loop moves a label, it moves **every member of that
equivalence class together** — a repeated structure with one label on a
different side reads worse than the collision did.

## Structure discovery

Repetition is found by colour refinement over the component/net bipartite
graph — no naming conventions, no hints:

```
full bridge   → [San, Sbn], [Sap, Sbp]
three-phase   → [San, Sbn, Scn], [Sap, Sbp, Scp]
DAB           → [Q1, Q3], [Q2, Q4], [Q5, Q7], [Q6, Q8]
```

DAB correctly keeps primary and secondary apart: they face different rails.
Electrically interchangeable ports (both ends of a resistor, the two primary
windings of a transformer) are canonicalised first, or two otherwise identical
legs stop looking identical.

## Symmetry by construction

Items in a slot share one x; slots in a group share one pitch. Alignment,
spacing uniformity and symmetry are therefore exact by construction rather
than repaired afterwards — the scorer verifies them instead of fixing them.
`placement.check_regularity()` raises before rendering if a plan would break a
detected repeated structure.

## Drawing-rule metrics

`drawing_rules.py` measures the general rules. Three of them needed care to
avoid measuring the wrong thing:

* **Rule 22 (rhythm)** counts *distinct local length scales*, not deviation
  from a target length. A converter legitimately uses several — rail stubs,
  leg midpoints and inter-stage runs — each for a different purpose, so
  the threshold is five. Consistency *within* a role is measured exactly and
  separately by `local_consistency` and `wire_uniformity`, both zero
  everywhere.
* **Rule 23 (local consistency)** compares only the power path. A DC rail is a
  long haul set by the floorplan and control nets have no added gate stub;
  neither says anything about local regularity. Including them made every
  switching device look defective.
* **Rule 17 (transformer)** measures the wire runs actually attached to the
  transformer's ports. The first version measured the distance from the
  transformer's centre to its own ports, which is a constant — a check that
  could not fail.
* **Item 12 (length band)** measures the spacing of consecutive ports along a
  net's trunk — the wire between two adjacent components. Measuring individual
  segments instead counted rail stubs, whose length is set by the rail
  separation rather than any local choice. The band edges are inclusive: a run
  at exactly 1.5 D was being flagged by floating-point noise.
* **Item 23 (port leads)** checks direct component-to-component nets. Port-axis
  alignment is required; the half-body lead length is a preference in the
  candidate cost, so obstacle clearance and connectivity still take priority.

## Cost and quality

```
J = 10⁹·connectivity + 10⁵·overlap + 5·10⁴·(wire collision, label overlap)
  + 4000·symmetry + 3000·spacing_variance + 3000·alignment
  + 2000·routing_shape + 1500·wire_uniformity + 300·crossing
  + 120·spacing_target + 60·bend + 1·length
```

Dispersion terms are **scale-free** (relative standard deviation, grid units)
rather than raw variance in mm² — otherwise they are dimensionally
incomparable with a length term in mm, and they punish equivalent branches for
length differences that the topology makes unavoidable. Routing *shape* (bend
count, number of runs) is compared exactly; routing *length* only in relative
terms.

Rendering aborts unless connectivity is 100 and nothing collides.

## Geometric tolerance

Symbol coordinates in the master sheet are rounded to three decimals, so pins
land fractions of a micron off exact grid lines. Every geometric predicate uses
a 0.05 mm tolerance — a fifth of a stroke width. Treating that rounding as real
produced phantom junction dots, invisible dog-legs and false collisions, and
comparing *rounded* coordinates turned exactly equal spacings into unequal
ones. `tests/test_layout.py` pins all of it down.

## Whole-drawing checklist

`python3 build.py --checks` reports the whole-drawing checklist; the CLI report
lists items needing attention under `layout.checklist_attention`. Structural
checks and soft aesthetic penalties remain visible; a high overall score does
not erase a long-wire or spacing warning. Electrical mismatch is always fatal.
