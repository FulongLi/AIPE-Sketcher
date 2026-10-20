# Circuit IR reference

Circuit IR is the electrical source of truth: components with named ports,
joined by named nets. It carries **no** coordinates, symbols, label positions
or routing hints; the engine decides all geometry.

```json
{
  "version": 1,
  "name": "RC low-pass",
  "components": [
    {"ref": "V1", "kind": "vsource"},
    {"ref": "R1", "kind": "res", "attrs": {"resistance_ohm": 1000}},
    {"ref": "C1", "kind": "cap", "attrs": {"capacitance_f": 1e-7}},
    {"ref": "VOUT", "kind": "terminal", "interface": "power", "attrs": {"name": "VOUT"}},
    {"ref": "GND1", "kind": "power_ground"}
  ],
  "nets": {
    "IN":  ["V1.p", "R1.a"],
    "OUT": ["R1.b", "C1.a", "VOUT.t"],
    "RTN": ["V1.n", "C1.b", "GND1.t"]
  }
}
```

| Field | Required | Meaning |
| --- | --- | --- |
| `version` | yes | Always `1` |
| `name` | no | Circuit name; also the drawing title |
| `components[].ref` | yes | Unique designator. The label is drawn from it: first letter plus subscript (`Q1` -> Q<sub>1</sub>, `Lr` -> L<sub>r</sub>) |
| `components[].kind` | yes | A kind or alias from the table below |
| `components[].ports` | no | Defaults to the kind's ports; must match them for built-in kinds |
| `components[].interface` | terminals only | `"power"` (drawn with an open boundary circle) or `"control"` |
| `components[].role` | no | Optional semantic role; normally omit |
| `components[].attrs` | no | Electrical attributes (values, part numbers). Stored and hashed, **not drawn** in this version. For a power terminal, `attrs.name` sets its label |
| `nets` | yes | `net name -> ["REF.port", ...]` |

## Rules the validator enforces

- Every declared port is on exactly one net; no port is left floating.
- Every net joins at least two ports.
- A `terminal` must declare `interface`; only a terminal may be an interface.
- Unknown fields and drawing attributes (`x`, `y`, `rotation`, `label_side`,
  `svg_symbol`, ...) are rejected.

## Component kinds (`kinds --json` is authoritative)

| Kind | Ports | Notes / aliases |
| --- | --- | --- |
| `vsource` | `p`, `n` | Voltage source, `+` at `p`. Alias `voltage_source` |
| `isource` | `p`, `n` | Current source; arrow from `n` to `p`. Alias `current_source` |
| `battery` | `p`, `n` | |
| `res` | `a`, `b` | Alias `resistor` |
| `cap` | `a`, `b` | Alias `capacitor` |
| `cap_pol` | `a`, `b` | Polarised; `a` is `+`. Alias `polarised_capacitor` |
| `ind` | `a`, `b` | Alias `inductor` |
| `ind_core` | `a`, `b` | Cored inductor. Alias `cored_inductor` |
| `diode` | `a`, `k` | Anode, cathode. Alias `rectifier` |
| `nmos` | `d`, `s`, `g` | n-channel MOSFET (enhancement). Aliases `mosfet`, `n_mosfet`, `switch` |
| `nmos_don` | `d`, `s`, `g` | Depletion-mode n-MOSFET |
| `igbt` | `c`, `e`, `g` | |
| `transformer` | `p1`, `p2`, `s1`, `s2` | Two windings; `p1` and `s1` are the dot-marked terminals |
| `power_ground` | `t` | Earth-bar symbol. Aliases `gnd`, `ground`, `pgnd` |
| `digital_ground` | `t` | Open triangle. Aliases `dgnd`, `digital_gnd`, `signal_ground` |
| `terminal` | `t` | External interface; needs `interface` |

Anything else (op-amps, controllers, multi-winding or centre-tapped
transformers, p-channel devices, coupled inductors, sensors) cannot be drawn
yet: `validate` reports it under `symbol_support`. Do not substitute a
different kind without the user's agreement.

## Conventions you may apply without asking (state them as assumptions)

1. **Gate drives.** A switch's gate port must be connected. If the user gives
   no gate-drive circuit, add one `terminal` with `"interface": "control"` per
   gate (`G1` for `Q1`, ...) on its own net (`G_1: ["Q1.g", "G1.t"]`). It is
   drawn on the switch's own gate lead, with no extra wire.
2. **Ground symbol.** When the user names a ground, return or 0 V node, put
   one `power_ground` on that net. Galvanically isolated sides get separate
   grounds on separate nets (`GND1`, `GND2`) unless the user says they are
   joined.
3. **Designators.** Use conventional refs (`V1`, `C1`, `L1`, `Q1`, `D1`,
   `T1`, `R1`) or the user's own names.
4. **Outputs.** Do not add an output terminal to a node that already ends in a
   load. Add a `power` terminal only where the user wants an exposed port
   (for example a half-bridge switching node, or inverter phases).

Everything else that defines connectivity — which node each terminal joins,
polarity, winding ends, rectifier type, where a load sits — must come from the
user or from a reference circuit they chose. Ask when it is missing.

## Engine limits worth knowing

- Layout inference is structural. Multi-source, cyclic or very irregular
  graphs may fail layout gates; the engine then refuses or flags the drawing
  rather than altering the circuit.
- Bridge recognition covers two-device legs; multilevel stacks are not yet
  laid out specially.
- Twelve geometry candidates are searched by default (`--candidates 1-12`).
