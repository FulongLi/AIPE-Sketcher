# Engineering State and schematic artifacts

AIPE Sketcher (registry id `aipe.sketch`) is a **Tool**: it turns an explicit
electrical Circuit IR into a schematic artifact. It runs standalone; this page
covers the optional AIPE-integrated mode. AIPE-Core owns shared Engineering State schemas. Registry owns
the `aipe.yaml` discovery contract. The existing planner, symbol library and renderer
remain the source of truth for schematic generation.

| Core state field | Sketch mapping |
| --- | --- |
| `id`, `schema_version` | Source identity/version; adapter accepts `0.1.0` |
| `converter.topology` | Context only; never enough to infer exact connectivity |
| `semiconductors`, `magnetics`, `passives` | Selection context; no automatic substitution or sizing |
| `extensions.aipe.sketch.circuit_ir` | Explicit versioned `Netlist.to_dict()` payload |
| `extensions.aipe.sketch.evidence_refs` | Nonempty references explaining where the circuit came from |
| `evidence` | References must exist and must not be rejected |

Validate the complete state with `AIPE-Core/scripts/validate.py` before rendering.
The adapter checks its consumed fields and Circuit IR; it does not duplicate Core's
full schema or transform domain database records. Integration is declared `mapped`.

```python
import json
from aipe_sketch.topologies import dab
from aipe_sketch.state import render_engineering_state

state = json.load(open('../AIPE-Core/examples/dab-10kw/engineering-state.json'))
state.setdefault('extensions', {})['aipe.sketch'] = {
    'circuit_ir': dab().to_dict(),
    'evidence_refs': ['evidence.design-brief'],
}
# The reference DAB is an explicitly chosen illustrative circuit, not a derived
# or validated 10 kW design. Record that assumption when using the example.
report = render_engineering_state(state, 'out/dab-concept.svg')
```

For a saved state carrying that extension:

```sh
aipe-sketcher state state.json out/schematic.svg        # installed CLI or plugin launcher
python -m aipe_sketch.state state.json out/schematic.svg  # unchanged module entry point
```

The adjacent `.provenance.json` records source-state and Circuit IR SHA-256 hashes,
evidence references, adapter attribution, SVG hash and validation limitations.
Hashes of JSON use UTF-8, sorted keys and compact separators. Paths in the sidecar
are relative to the artifact directory. No wall-clock time is added; callers may
wrap the artifact in their own Core evidence with an explicit timestamp. Keep the
source state and Circuit IR alongside published artifacts to reproduce them.

The renderer checks drawing connectivity. It does **not** establish device ratings,
safe clearances, control stability, losses, efficiency, thermal performance or a
manufacturable PCB. No simulation or measurement evidence is fabricated. Python
and the existing SVG implementation form the default local path; Inkscape is an
optional editor. Licensing: project code is under the AIPE Sketcher personal,
non-commercial licence ([LICENSE](../LICENSE)); the master symbol sheet keeps its
upstream CC0 1.0 dedication ([THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md)).

## Identifiers after the rename

The product was renamed from AIPE Sketch to AIPE Sketcher in 0.2.0. Every
machine identifier is unchanged, so existing states, artifacts and registry
entries need no migration:

| Identifier | Value |
| --- | --- |
| Registry id (`aipe.yaml`) | `aipe.sketch` |
| Engineering State extension | `extensions["aipe.sketch"]` with `circuit_ir` and `evidence_refs` |
| Provenance `tool.id` / `adapter_version` | `aipe.sketch` / `0.1.0` |
| Python package | `aipe_sketch` |
| Plugin and PyPI-style distribution name | `aipe-sketcher` (new) |
