# Reference circuits

`examples NAME --ir-only -o DIR` writes the exact Circuit IR of each circuit
below. They are idealised **illustrative** configurations, not designs: no
values, ratings or part numbers are included. When you use one, tell the user
which configuration it is and list its assumptions from this file.

All switches have a `control` gate terminal (`G1`, `G2`, ...). Sources are
ideal voltage sources; loads are single resistors.

## Converters

| Name | Configuration | Assumptions to state |
| --- | --- | --- |
| `buck` | V1, input C1, high-side Q1 (n-MOSFET), freewheel diode D1, L1, output C2, load R1, GND1 | Asynchronous (diode) buck; low-side switch not included |
| `boost` | V1, L1, low-side Q1, diode D1, output C1, load R1, GND1 | Asynchronous boost; no input capacitor |
| `half_bridge` | V1, DC-link C1, Q1/Q2 leg, switching node exposed as power terminal `VOUT` | No load drawn; single DC-link capacitor (no split capacitors) |
| `full_bridge` | V1, C1, two legs Q1/Q2 and Q3/Q4, load R1 across the leg midpoints | Resistive load stands in for the AC load |
| `three_phase_inverter` | V1, C1, three IGBT legs Q1-Q6, phase terminals `A`, `B`, `C` | Two-level inverter; no output filter or motor drawn |
| `dab` | V1, C1, primary full bridge Q1-Q4, two-winding T1, secondary full bridge Q5-Q8, C2, load R1, separate grounds GND1/GND2 | **No separate series (leakage) inductor**: the energy-transfer inductance is assumed inside T1. Add an explicit inductor in series with a winding if the user wants it shown |
| `llc_resonant` | V1, C1, half bridge Q1/Q2, series Cr and Lr, T1 (primary return to DC-), **single diode D1** half-wave rectifier, C2, R1, separate grounds | Magnetising inductance Lm is not drawn separately; rectifier is one diode, not centre-tapped or full-bridge (centre-tapped transformers are not supported) |

## Structural test circuits

`series_rlc`, `twin_shunt_branches`, `three_repeated_legs`,
`parallel_rc_block`, `transformer_between_networks`, `source_l_r` and
`isolated_series_chain` exercise the layout grammar without converter
semantics. They are useful starting points for small custom circuits.

## Variants

When a user asks for a variant (synchronous buck, centre-tapped LLC, DAB with
series inductor, split DC link, ...), start from the closest reference IR and
make only the changes the user specified, then list them. If the variant needs
an unsupported kind, say so instead of approximating it.
