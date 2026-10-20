"""Read Circuit IR JSON and report every problem at once.

``Netlist.from_dict`` stops at the first error, which suits trusted callers.
A person or an agent writing Circuit IR by hand needs the whole list, with
the field each problem belongs to, so this loader checks the document shape
first, then builds the netlist component by component and net by net, and
finally runs the electrical checks.  Nothing here guesses a missing
connection: an incomplete circuit is reported, never completed.

Accepted document (``ports``, ``role``, ``interface`` and ``attrs`` are
optional; ``ports`` defaults to the kind's standard ports)::

    {"version": 1, "name": "Buck",
     "components": [{"ref": "V1", "kind": "vsource"}, ...],
     "nets": {"DC_POS": ["V1.p", "C1.a", "Q1.d"], ...}}
"""
import json

from .netlist import Netlist


class CircuitError(ValueError):
    """Circuit IR that cannot be used, with every problem found."""

    def __init__(self, problems):
        self.problems = list(problems)
        super().__init__('invalid Circuit IR: ' + '; '.join(self.problems))


COMPONENT_FIELDS = {'ref', 'kind', 'ports', 'role', 'interface', 'attrs'}


def _document_problems(data):
    """Problems that leave nothing to check further."""
    if not isinstance(data, dict):
        return ['document: expected a JSON object with version, components and nets']
    problems = []
    if data.get('version') != 1:
        problems.append(f'version: must be 1 (got {data.get("version")!r})')
    if 'name' in data and not isinstance(data['name'], str):
        problems.append('name: must be a string')
    if not isinstance(data.get('components'), list) or not data['components']:
        problems.append('components: must be a nonempty list')
    if not isinstance(data.get('nets'), dict) or not data['nets']:
        problems.append('nets: must be a nonempty object of net name -> ["REF.port", ...]')
    unknown = set(data) - {'version', 'name', 'components', 'nets'}
    if unknown:
        problems.append(f'document: unknown field(s) {sorted(unknown)}')
    return problems


def _component_problems(i, c):
    if not isinstance(c, dict):
        return [f'components[{i}]: must be an object']
    where = f'components[{i}] ({c.get("ref", "?")})'
    problems = []
    if not isinstance(c.get('ref'), str) or not c['ref'].strip():
        problems.append(f'{where}: ref must be a nonempty string')
    if not isinstance(c.get('kind'), str) or not c['kind'].strip():
        problems.append(f'{where}: kind must be a nonempty string')
    ports = c.get('ports')
    if ports is not None and (not isinstance(ports, list) or
                              not all(isinstance(p, str) for p in ports)):
        problems.append(f'{where}: ports must be a list of strings')
    if c.get('interface') not in (None, 'power', 'control'):
        problems.append(f'{where}: interface must be "power", "control" or null')
    if c.get('role') is not None and not isinstance(c['role'], str):
        problems.append(f'{where}: role must be a string or null')
    if not isinstance(c.get('attrs', {}), dict):
        problems.append(f'{where}: attrs must be an object')
    unknown = set(c) - COMPONENT_FIELDS
    if unknown:
        problems.append(f'{where}: unknown field(s) {sorted(unknown)}; electrical '
                        'attributes go in attrs, drawing hints are not accepted')
    return problems


def check_circuit(data):
    """Return ``(netlist or None, problems)`` for a Circuit IR document.

    Every problem is reported together; a component with a malformed entry
    is skipped so the remaining components and nets are still checked.
    """
    problems = _document_problems(data)
    if not isinstance(data, dict) or not isinstance(data.get('components'), list) \
            or not isinstance(data.get('nets'), dict):
        return None, problems
    circuit = Netlist(data['name'] if isinstance(data.get('name'), str) else 'circuit')
    skipped = set()
    for i, c in enumerate(data['components']):
        local = _component_problems(i, c)
        if local:
            problems += local
            if isinstance(c, dict) and isinstance(c.get('ref'), str):
                skipped.add(c['ref'])
            continue
        try:
            circuit.add(c['ref'], c['kind'], role=c.get('role'),
                        ports=c.get('ports'), interface=c.get('interface'),
                        **dict(c.get('attrs') or {}))
        except (TypeError, ValueError) as exc:
            message = str(exc)
            if not message.startswith(c['ref']):
                message = f'{c["ref"]}: {message}'
            problems.append(message)
            skipped.add(c['ref'])
    for net, members in data['nets'].items():
        if (not isinstance(members, list) or
                not all(isinstance(m, str) and '.' in m for m in members)):
            problems.append(f'nets.{net}: must be a list of "REF.port" strings')
            continue
        # Join terminals one at a time, so a single bad terminal is reported
        # on its own instead of discarding the rest of the net.  A component
        # already reported above would only repeat that problem.
        for member in members:
            if member.rsplit('.', 1)[0] in skipped:
                continue
            try:
                circuit.connect(net, member)
            except KeyError as exc:
                problems.append(str(exc.args[0]) if exc.args else f'net {net}: unknown component')
            except ValueError as exc:
                problems.append(f'net {net}: {exc}')
    problems += circuit.validate()
    return (None if problems else circuit), problems


def load_circuit(data):
    """Build a validated Netlist from a Circuit IR document or raise CircuitError."""
    circuit, problems = check_circuit(data)
    if problems:
        raise CircuitError(problems)
    return circuit


def read_json(path):
    """Load JSON from a path, or from standard input when path is ``-``."""
    import sys
    if str(path) == '-':
        return json.load(sys.stdin)
    with open(path, encoding='utf-8') as fh:
        return json.load(fh)


def symbol_problems(circuit, source=None):
    """Kinds or ports that the symbol library cannot draw.  Parses the
    master sheet but performs no placement, routing or rendering."""
    from . import symlib
    from .parts import port_table
    from .paths import master_path
    table = port_table(symlib.load(source or master_path())[1])
    return [p for p in circuit.validate(table) if p not in circuit.validate()]
