"""AIPE Sketcher command line: Circuit IR JSON in, SVG schematic and report out.

    aipe-sketcher validate circuit.json             electrical checks, no drawing
    aipe-sketcher render circuit.json -o out/       SVG plus <name>.report.json
    aipe-sketcher examples --list                   reference circuits
    aipe-sketcher examples buck dab -o out/         render reference circuits
    aipe-sketcher examples dab --ir-only -o ir/     write their Circuit IR JSON
    aipe-sketcher kinds                             component kinds and ports
    aipe-sketcher state state.json out/sch.svg      AIPE Engineering State mode

Every command accepts --json for machine-readable output on stdout.
Exit status: 0 success, 1 the circuit or drawing failed validation,
2 bad arguments or unreadable / malformed input.
"""
import argparse
import hashlib
import json
import os
import re
import sys

from . import __version__

TOOL = {'name': 'AIPE Sketcher', 'id': 'aipe.sketch', 'version': __version__}
LIMITATIONS = [
    'Connectivity validation proves the drawing matches the supplied Circuit IR; '
    'it does not establish that the circuit is correct, safe or fit for purpose.',
    'No component ratings, losses, thermal behaviour, control stability or '
    'circuit performance are evaluated.',
]
EXIT_OK, EXIT_INVALID, EXIT_USAGE = 0, 1, 2


class UsageError(Exception):
    """Unreadable input or impossible arguments (exit status 2)."""


# ------------------------------------------------------------------ helpers
def _digest(value):
    data = json.dumps(value, sort_keys=True, ensure_ascii=False,
                      separators=(',', ':'), allow_nan=False)
    return hashlib.sha256(data.encode('utf-8')).hexdigest()


def _slug(text):
    return re.sub(r'[^A-Za-z0-9_-]+', '_', text).strip('_').lower() or 'circuit'


def _read(path):
    from .circuit_io import read_json
    try:
        return read_json(path)
    except FileNotFoundError:
        raise UsageError(f'{path}: file not found')
    except json.JSONDecodeError as exc:
        raise UsageError(f'{path}: malformed JSON: {exc}')
    except (OSError, UnicodeDecodeError) as exc:
        raise UsageError(f'{path}: cannot read: {exc}')


def _out_dir(path):
    path = os.path.abspath(path or os.getcwd())
    if os.path.exists(path) and not os.path.isdir(path):
        raise UsageError(f'{path}: output path exists and is not a directory')
    os.makedirs(path, exist_ok=True)
    return path


def _write_json(path, value):
    with open(path, 'w', encoding='utf-8', newline='\n') as fh:
        json.dump(value, fh, indent=2, sort_keys=True, ensure_ascii=False)
        fh.write('\n')


def _svg_is_wellformed(path):
    import xml.etree.ElementTree as ET
    try:
        root = ET.parse(path).getroot()
    except ET.ParseError:
        return False
    return root.tag.endswith('svg')


def _catalogue():
    from .synthetic import CIRCUITS as SYNTHETIC
    from .topologies import CIRCUITS as CONVERTERS
    return dict(CONVERTERS, **SYNTHETIC)


# ------------------------------------------------------------- operations
def validate_document(data, symbols=True):
    """Electrical validation of a Circuit IR document; nothing is drawn."""
    from .circuit_io import check_circuit, symbol_problems
    circuit, problems = check_circuit(data)
    report = {'tool': TOOL, 'command': 'validate',
              'electrical_validation': {'status': 'failed' if problems else 'passed',
                                        'problems': problems}}
    if circuit is not None:
        report['circuit'] = {'name': circuit.name,
                             'components': len(circuit.components),
                             'nets': len(circuit.nets),
                             'sha256': _digest(circuit.to_dict())}
        if symbols:
            unsupported = symbol_problems(circuit)
            report['symbol_support'] = {
                'status': 'failed' if unsupported else 'passed',
                'problems': unsupported}
    ok = not problems and report.get('symbol_support', {}).get('status') != 'failed'
    report['status'] = 'ok' if ok else 'failed'
    report['limitations'] = LIMITATIONS
    return report


def render_circuit(circuit, out_dir, stem, candidates=12, force_layout=False,
                   title=None):
    """Render a validated Netlist; write ``<stem>.svg`` and ``<stem>.report.json``."""
    from .circuit_io import symbol_problems
    from .pipeline import Schematic
    svg = os.path.join(out_dir, f'{stem}.svg')
    report_path = os.path.join(out_dir, f'{stem}.report.json')
    report = {'tool': TOOL, 'command': 'render',
              'circuit': {'name': circuit.name,
                          'components': len(circuit.components),
                          'nets': len(circuit.nets),
                          'sha256': _digest(circuit.to_dict())},
              'electrical_validation': {'status': 'passed', 'problems': []},
              'drawing_connectivity': {'status': 'not_run', 'faults': []},
              'outputs': {'report': report_path}}
    unsupported = symbol_problems(circuit)
    report['symbol_support'] = {'status': 'failed' if unsupported else 'passed',
                                'problems': unsupported}
    schematic = None
    if not unsupported:
        try:
            schematic = Schematic.from_netlist(circuit, candidates=candidates,
                                               title=title)
            card, log = schematic.render(svg, force=force_layout)
        except (RuntimeError, ValueError) as exc:
            message = str(exc)
            report['error'] = message
            if message.startswith('CONNECTIVITY FAULT'):
                report['drawing_connectivity'] = {
                    'status': 'failed', 'faults': message.splitlines()[1:]}
            elif schematic is not None:
                report['drawing_connectivity']['status'] = 'passed'
                report['layout'] = _layout(schematic, schematic.evaluate(), [], False)
            card = None
        else:
            report['drawing_connectivity']['status'] = 'passed'
            report['layout'] = _layout(schematic, card, log, force_layout)
            report['outputs']['svg'] = svg
            with open(svg, 'rb') as fh:
                digest = hashlib.sha256(fh.read()).hexdigest()
            report['svg'] = {'sha256': digest, 'well_formed': _svg_is_wellformed(svg)}
    report['status'] = 'ok' if 'svg' in report['outputs'] else 'failed'
    report['limitations'] = LIMITATIONS
    _write_json(report_path, report)
    return report


def _layout(schematic, card, log, forced):
    attention = {q: f'{verdict}: {detail}' if detail else verdict
                 for q, (verdict, detail) in card.checks.items()
                 if verdict not in ('PASS', 'N/A')}
    return {'acceptable': card.acceptable, 'forced': forced and not card.acceptable,
            'overall_score': card.overall, 'scores': dict(card.sub),
            'faults': list(card.faults), 'checklist_attention': attention,
            'selected_candidate': schematic.selected_candidate,
            'candidates_evaluated': len(schematic.candidate_report) or 1,
            'notes': list(log)}


# --------------------------------------------------------------- printing
def _emit(args, report, human):
    if args.json:
        print(json.dumps(report, indent=2, sort_keys=True, ensure_ascii=False))
    else:
        print(human(report))


def _human_validation(report):
    lines = [f'electrical validation: {report["electrical_validation"]["status"]}']
    lines += [f'  - {p}' for p in report['electrical_validation']['problems']]
    if 'symbol_support' in report:
        lines.append(f'symbol support:        {report["symbol_support"]["status"]}')
        lines += [f'  - {p}' for p in report['symbol_support']['problems']]
    if 'drawing_connectivity' in report:
        lines.append(f'drawing connectivity:  {report["drawing_connectivity"]["status"]}')
        lines += [f'  - {f}' for f in report['drawing_connectivity']['faults']]
    layout = report.get('layout')
    if layout:
        state = 'acceptable' if layout['acceptable'] else (
            'NOT acceptable (forced)' if layout['forced'] else 'NOT acceptable')
        lines.append(f'layout:                {state}, score {layout["overall_score"]}/100')
        lines += [f'  - {f}' for f in layout['faults']]
        lines += [f'  ! {q}: {v}' for q, v in layout['checklist_attention'].items()]
    if report.get('error') and 'drawing_connectivity' in report and \
            report['drawing_connectivity']['status'] != 'failed':
        lines.append('error: ' + report['error'].splitlines()[0])
    if report.get('outputs', {}).get('svg'):
        lines.append(f'svg:    {report["outputs"]["svg"]}')
    if report.get('outputs', {}).get('report'):
        lines.append(f'report: {report["outputs"]["report"]}')
    lines.append(f'status: {report["status"]}')
    return '\n'.join(lines)


# --------------------------------------------------------------- commands
def cmd_validate(args):
    report = validate_document(_read(args.circuit), symbols=not args.no_symbols)
    _emit(args, report, _human_validation)
    return EXIT_OK if report['status'] == 'ok' else EXIT_INVALID


def cmd_render(args):
    from .circuit_io import check_circuit
    data = _read(args.circuit)
    circuit, problems = check_circuit(data)
    if args.output and not args.output.lower().endswith('.svg'):
        raise UsageError('--output must name a .svg file')
    if args.output:
        out_dir = _out_dir(os.path.dirname(os.path.abspath(args.output)))
        stem = os.path.splitext(os.path.basename(args.output))[0]
    else:
        out_dir = _out_dir(args.out_dir)
        stem = args.name or (_slug(os.path.splitext(os.path.basename(args.circuit))[0])
                             if args.circuit != '-' else
                             _slug(circuit.name if circuit else 'circuit'))
    if problems:
        report = {'tool': TOOL, 'command': 'render', 'status': 'failed',
                  'electrical_validation': {'status': 'failed', 'problems': problems},
                  'drawing_connectivity': {'status': 'not_run', 'faults': []},
                  'limitations': LIMITATIONS}
        _emit(args, report, _human_validation)
        return EXIT_INVALID
    report = render_circuit(circuit, out_dir, stem, candidates=args.candidates,
                            force_layout=args.force_layout, title=args.title)
    _emit(args, report, _human_validation)
    return EXIT_OK if report['status'] == 'ok' else EXIT_INVALID


def cmd_examples(args):
    catalogue = _catalogue()
    if args.list or not (args.names or args.all):
        from .topologies import CIRCUITS as CONVERTERS
        rows = [{'name': name, 'title': build().name,
                 'group': 'converter' if name in CONVERTERS else 'synthetic'}
                for name, build in catalogue.items()]
        if args.json:
            print(json.dumps(rows, indent=2))
        else:
            for row in rows:
                print(f'{row["name"]:<30} {row["group"]:<10} {row["title"]}')
            if not args.list:
                print('\nname circuits to render them, or pass --all')
        return EXIT_OK
    names = list(catalogue) if args.all else args.names
    unknown = [n for n in names if n not in catalogue]
    if unknown:
        raise UsageError(f'unknown example(s) {", ".join(unknown)}; '
                         f'choose from {", ".join(catalogue)}')
    out_dir = _out_dir(args.out_dir)
    results, failed = [], False
    for name in names:
        circuit = catalogue[name]()
        if args.ir_only:
            path = os.path.join(out_dir, f'{name}.json')
            _write_json(path, circuit.to_dict())
            results.append({'name': name, 'status': 'ok', 'circuit_ir': path})
            continue
        report = render_circuit(circuit, out_dir, name, candidates=args.candidates)
        failed |= report['status'] != 'ok'
        results.append(dict(report, name=name))
    if args.json:
        print(json.dumps(results, indent=2, sort_keys=True, ensure_ascii=False))
    else:
        for r in results:
            if args.ir_only:
                print(f'{r["name"]:<30} -> {r["circuit_ir"]}')
                continue
            layout = r.get('layout', {})
            print(f'{r["name"]:<30} {r["status"]:<7} '
                  f'connectivity {r["drawing_connectivity"]["status"]:<7} '
                  f'score {layout.get("overall_score", "-")}  '
                  f'-> {r["outputs"].get("svg", r.get("error", ""))}')
    return EXIT_INVALID if failed else EXIT_OK


def cmd_kinds(args):
    from . import electrical, symlib
    from .parts import port_table
    from .paths import master_path
    table = port_table(symlib.load(master_path())[1])
    aliases = {}
    for alias, kind in electrical.ALIASES.items():
        aliases.setdefault(kind, []).append(alias)
    rows = [{'kind': kind, 'ports': list(ports),
             'control_ports': list(electrical.CONTROL_PORTS.get(kind, ())),
             'role': electrical.ROLES.get(kind),
             'aliases': sorted(aliases.get(kind, [])),
             'renderable': set(table.get(kind, ())) == set(ports)}
            for kind, ports in electrical.PORTS.items()]
    if args.json:
        print(json.dumps(rows, indent=2))
    else:
        for r in rows:
            extra = f'  aliases: {", ".join(r["aliases"])}' if r['aliases'] else ''
            flag = '' if r['renderable'] else '  (not drawable)'
            print(f'{r["kind"]:<15} ports {",".join(r["ports"]):<12} '
                  f'{r["role"] or "":<13}{flag}{extra}')
    return EXIT_OK


def cmd_state(args):
    from .state import render_engineering_state
    state = _read(args.state)
    if not args.output.lower().endswith('.svg'):
        raise UsageError('output must name a .svg file')
    try:
        provenance = render_engineering_state(state, args.output)
    except (ValueError, KeyError, TypeError, RuntimeError) as exc:
        report = {'tool': TOOL, 'command': 'state', 'status': 'failed', 'error': str(exc)}
        _emit(args, report, lambda r: f'status: failed\nerror: {r["error"]}')
        return EXIT_INVALID
    report = {'tool': TOOL, 'command': 'state', 'status': 'ok', 'provenance': provenance,
              'outputs': {'svg': os.path.abspath(args.output),
                          'provenance': os.path.abspath(
                              os.path.splitext(args.output)[0] + '.provenance.json')}}
    _emit(args, report, lambda r: '\n'.join([
        'status: ok', f'svg:        {r["outputs"]["svg"]}',
        f'provenance: {r["outputs"]["provenance"]}']))
    return EXIT_OK


# ------------------------------------------------------------------ parser
def build_parser():
    parser = argparse.ArgumentParser(
        prog='aipe-sketcher', description='AIPE Sketcher: connectivity-checked SVG '
        'schematics from explicit electrical Circuit IR.', epilog=__doc__.split('\n\n', 1)[1],
        formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--version', action='version', version=f'aipe-sketcher {__version__}')
    common = argparse.ArgumentParser(add_help=False)
    common.add_argument('--json', action='store_true', help='machine-readable output')
    sub = parser.add_subparsers(dest='command', metavar='command')
    sub.required = True

    p = sub.add_parser('validate', parents=[common], help='check Circuit IR without drawing')
    p.add_argument('circuit', help='Circuit IR JSON file, or - for stdin')
    p.add_argument('--no-symbols', action='store_true',
                   help='skip the check that every kind can be drawn')
    p.set_defaults(func=cmd_validate)

    p = sub.add_parser('render', parents=[common], help='render Circuit IR to SVG')
    p.add_argument('circuit', help='Circuit IR JSON file, or - for stdin')
    p.add_argument('-o', '--out-dir', help='output directory (default: current directory)')
    p.add_argument('--output', help='exact SVG path instead of --out-dir/<name>.svg')
    p.add_argument('--name', help='output file stem (default: input file name)')
    p.add_argument('--title', help='drawing title (default: circuit name)')
    p.add_argument('--candidates', type=int, default=12, choices=range(1, 13),
                   metavar='1-12', help='geometry candidates to search (default 12)')
    p.add_argument('--force-layout', action='store_true',
                   help='write a layout that fails soft quality gates; '
                        'never bypasses connectivity validation')
    p.set_defaults(func=cmd_render)

    p = sub.add_parser('examples', parents=[common], help='list or render reference circuits')
    p.add_argument('names', nargs='*')
    p.add_argument('--all', action='store_true', help='every reference circuit')
    p.add_argument('--list', action='store_true')
    p.add_argument('--ir-only', action='store_true', help='write Circuit IR JSON, no SVG')
    p.add_argument('-o', '--out-dir', help='output directory (default: current directory)')
    p.add_argument('--candidates', type=int, default=12, choices=range(1, 13), metavar='1-12')
    p.set_defaults(func=cmd_examples)

    p = sub.add_parser('kinds', parents=[common], help='list component kinds and ports')
    p.set_defaults(func=cmd_kinds)

    p = sub.add_parser('state', parents=[common],
                       help='render an AIPE Engineering State with explicit circuit IR')
    p.add_argument('state', help='Engineering State JSON (schema 0.1.0), or - for stdin')
    p.add_argument('output', help='output .svg; a .provenance.json is written beside it')
    p.set_defaults(func=cmd_state)
    return parser


def main(argv=None):
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(errors='replace')
        except (AttributeError, ValueError):
            pass
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return args.func(args)
    except UsageError as exc:
        if getattr(args, 'json', False):
            print(json.dumps({'tool': TOOL, 'status': 'error', 'error': str(exc)}, indent=2))
        else:
            print(f'aipe-sketcher: error: {exc}', file=sys.stderr)
        return EXIT_USAGE


if __name__ == '__main__':
    sys.exit(main())
