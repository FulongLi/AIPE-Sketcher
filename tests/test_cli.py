"""Command-line contract: Circuit IR JSON in, SVG plus report out.

Covers the circuits the plugin is expected to handle (buck, DAB, LLC and a
small hand-written custom circuit) and the failure modes an agent will hit:
invalid connections, unsupported kinds and malformed input.
"""
import contextlib
import io
import json
import os
import subprocess
import sys
import tempfile
import unittest
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from aipe_sketch import cli
from aipe_sketch.circuit_io import CircuitError, check_circuit, load_circuit
from aipe_sketch.topologies import CIRCUITS

CUSTOM = {
    'version': 1, 'name': 'RC low-pass',
    'components': [
        {'ref': 'V1', 'kind': 'voltage_source'},
        {'ref': 'R1', 'kind': 'resistor', 'attrs': {'resistance_ohm': 1000}},
        {'ref': 'C1', 'kind': 'capacitor', 'attrs': {'capacitance_f': 1e-7}},
        {'ref': 'VOUT', 'kind': 'terminal', 'interface': 'power', 'attrs': {'name': 'VOUT'}},
        {'ref': 'GND1', 'kind': 'power_ground'},
    ],
    'nets': {'IN': ['V1.p', 'R1.a'], 'OUT': ['R1.b', 'C1.a', 'VOUT.t'],
             'RTN': ['V1.n', 'C1.b', 'GND1.t']},
}


def run(*argv):
    """Run the CLI in-process; return (exit status, stdout)."""
    out, err = io.StringIO(), io.StringIO()
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
        status = cli.main(list(argv))
    return status, out.getvalue() + err.getvalue()


def run_json(*argv):
    status, text = run(*argv, '--json')
    return status, json.loads(text)


class TempDir(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.dir = self._tmp.name

    def tearDown(self):
        self._tmp.cleanup()

    def write(self, name, data):
        path = os.path.join(self.dir, name)
        with open(path, 'w', encoding='utf-8') as fh:
            fh.write(data if isinstance(data, str) else json.dumps(data))
        return path


class TestRender(TempDir):
    def assert_rendered(self, report, components):
        self.assertEqual(report['status'], 'ok', report)
        self.assertEqual(report['electrical_validation']['status'], 'passed')
        self.assertEqual(report['drawing_connectivity']['status'], 'passed')
        self.assertTrue(report['layout']['acceptable'])
        self.assertEqual(report['layout']['scores']['connectivity'], 100)
        self.assertEqual(report['circuit']['components'], components)
        svg = report['outputs']['svg']
        self.assertTrue(report['svg']['well_formed'])
        root = ET.parse(svg).getroot()
        self.assertTrue(root.tag.endswith('svg'))
        self.assertTrue(any(el.tag.endswith('path') for el in root.iter()))
        with open(report['outputs']['report'], encoding='utf-8') as fh:
            self.assertEqual(json.load(fh), report)

    def test_reference_converters_render_and_validate(self):
        for name in ('buck', 'dab', 'llc_resonant'):
            with self.subTest(name):
                status, _ = run('examples', name, '--ir-only', '-o', self.dir)
                self.assertEqual(status, 0)
                ir = os.path.join(self.dir, f'{name}.json')
                status, report = run_json('render', ir, '-o', os.path.join(self.dir, 'svg'))
                self.assertEqual(status, 0)
                self.assert_rendered(report, len(CIRCUITS[name]().components))
                self.assertTrue(report['outputs']['svg'].endswith(f'{name}.svg'))

    def test_custom_circuit_renders(self):
        path = self.write('rc.json', CUSTOM)
        status, report = run_json('render', path, '-o', self.dir)
        self.assertEqual(status, 0)
        self.assert_rendered(report, 5)

    def test_explicit_output_path_and_stdin(self):
        target = os.path.join(self.dir, 'nested', 'drawing.svg')
        path = self.write('rc.json', CUSTOM)
        status, report = run_json('render', path, '--output', target)
        self.assertEqual(status, 0)
        self.assertEqual(report['outputs']['svg'], target)
        stdin = sys.stdin
        try:
            sys.stdin = io.StringIO(json.dumps(CUSTOM))
            status, report = run_json('render', '-', '-o', self.dir)
        finally:
            sys.stdin = stdin
        self.assertEqual(status, 0)
        self.assertTrue(report['outputs']['svg'].endswith('rc_low-pass.svg'))

    def test_examples_render_into_chosen_directory(self):
        status, results = run_json('examples', 'buck', '-o', self.dir)
        self.assertEqual(status, 0)
        self.assertEqual(results[0]['status'], 'ok')
        self.assertTrue(os.path.isfile(os.path.join(self.dir, 'buck.svg')))
        self.assertTrue(os.path.isfile(os.path.join(self.dir, 'buck.report.json')))

    def test_reference_example_matches_tracked_artefact(self):
        """The CLI path must not change the reference drawings."""
        run('examples', 'dab', '-o', self.dir)
        with open(os.path.join(self.dir, 'dab.svg'), 'rb') as a, \
                open(os.path.join(ROOT, 'out', 'dab.svg'), 'rb') as b:
            # A Windows checkout may convert the tracked file to CRLF.
            self.assertEqual(a.read().replace(b'\r\n', b'\n'),
                             b.read().replace(b'\r\n', b'\n'))

    def test_json_round_trip_draws_the_same_geometry(self):
        """Exported IR sorts nets, which may reorder drawing elements but
        must not change what is drawn."""
        run('examples', 'buck', '-o', os.path.join(self.dir, 'a'))
        run('examples', 'buck', '--ir-only', '-o', self.dir)
        run('render', os.path.join(self.dir, 'buck.json'), '-o', os.path.join(self.dir, 'b'))

        def elements(path):
            return sorted(ET.tostring(el) for el in ET.parse(path).getroot().iter()
                          if not list(el))
        self.assertEqual(elements(os.path.join(self.dir, 'a', 'buck.svg')),
                         elements(os.path.join(self.dir, 'b', 'buck.svg')))


class TestValidate(TempDir):
    def test_valid_circuit(self):
        status, report = run_json('validate', self.write('rc.json', CUSTOM))
        self.assertEqual(status, 0)
        self.assertEqual(report['status'], 'ok')
        self.assertEqual(report['symbol_support']['status'], 'passed')
        self.assertFalse(os.path.exists(os.path.join(self.dir, 'rc.svg')))

    def test_every_problem_is_reported_together(self):
        bad = json.loads(json.dumps(CUSTOM))
        bad['nets']['OUT'].remove('C1.a')                  # floating capacitor port
        bad['nets']['IN'].append('R1.x')                   # no such port
        bad['nets']['RTN'].append('Z9.t')                  # unknown component
        bad['components'].append({'ref': 'Q1', 'kind': 'nmos', 'x': 3})  # drawing hint
        status, report = run_json('validate', self.write('bad.json', bad))
        self.assertEqual(status, 1)
        problems = '\n'.join(report['electrical_validation']['problems'])
        for needle in ("C1 (cap): unconnected port(s) ['a']", "no such port(s) ['x']",
                       'unknown component Z9', "unknown field(s) ['x']"):
            self.assertIn(needle, problems)

    def test_port_on_two_nets_is_rejected(self):
        bad = json.loads(json.dumps(CUSTOM))
        bad['nets']['RTN'].append('V1.p')
        circuit, problems = check_circuit(bad)
        self.assertIsNone(circuit)
        self.assertTrue(any('exactly one net' in p for p in problems), problems)

    def test_render_refuses_invalid_circuit_and_writes_nothing(self):
        bad = json.loads(json.dumps(CUSTOM))
        bad['nets']['OUT'].remove('VOUT.t')
        status, report = run_json('render', self.write('bad.json', bad), '-o', self.dir)
        self.assertEqual(status, 1)
        self.assertEqual(report['drawing_connectivity']['status'], 'not_run')
        self.assertFalse([f for f in os.listdir(self.dir) if f.endswith('.svg')])

    def test_unsupported_kind_is_reported_separately(self):
        odd = json.loads(json.dumps(CUSTOM))
        odd['components'].append({'ref': 'U1', 'kind': 'opamp', 'ports': ['in', 'out']})
        odd['nets']['IN'].append('U1.in')
        odd['nets']['OUT'].append('U1.out')
        status, report = run_json('validate', self.write('odd.json', odd))
        self.assertEqual(status, 1)
        self.assertEqual(report['electrical_validation']['status'], 'passed')
        self.assertEqual(report['symbol_support']['status'], 'failed')
        status, report = run_json('render', self.write('odd.json', odd), '-o', self.dir)
        self.assertEqual(status, 1)
        self.assertNotIn('svg', report['outputs'])

    def test_terminal_needs_an_interface(self):
        bad = json.loads(json.dumps(CUSTOM))
        bad['components'][3].pop('interface')
        with self.assertRaises(CircuitError) as caught:
            load_circuit(bad)
        self.assertTrue(any('interface' in p for p in caught.exception.problems))


class TestMalformedInput(TempDir):
    def test_malformed_json(self):
        status, text = run('render', self.write('m.json', '{"version": 1,'))
        self.assertEqual(status, 2)
        self.assertIn('malformed JSON', text)

    def test_missing_file(self):
        status, report = run_json('validate', os.path.join(self.dir, 'nope.json'))
        self.assertEqual(status, 2)
        self.assertEqual(report['status'], 'error')

    def test_wrong_shapes(self):
        for doc, needle in (([1, 2], 'expected a JSON object'),
                            ({'version': 2, 'components': [], 'nets': {}}, 'version: must be 1'),
                            ({'version': 1, 'components': [{'ref': 'R1'}],
                              'nets': {'N': 'R1.a'}}, 'kind must be')):
            with self.subTest(needle):
                status, report = run_json('validate', self.write('w.json', doc))
                self.assertEqual(status, 1)
                self.assertIn(needle, '\n'.join(report['electrical_validation']['problems']))

    def test_bad_arguments(self):
        status, _ = run('render', self.write('rc.json', CUSTOM), '--output', 'x.png')
        self.assertEqual(status, 2)
        status, _ = run('examples', 'not_a_circuit')
        self.assertEqual(status, 2)


class TestDiscovery(unittest.TestCase):
    def test_kinds_lists_drawable_kinds(self):
        status, rows = run_json('kinds')
        self.assertEqual(status, 0)
        kinds = {r['kind']: r for r in rows}
        self.assertEqual(kinds['transformer']['ports'], ['p1', 'p2', 's1', 's2'])
        self.assertTrue(all(r['renderable'] for r in rows))

    def test_examples_list_has_the_fourteen_reference_circuits(self):
        status, rows = run_json('examples', '--list')
        self.assertEqual(status, 0)
        self.assertEqual(len(rows), 14)
        self.assertEqual(sum(r['group'] == 'converter' for r in rows), 7)

    def test_version(self):
        from aipe_sketch import __version__
        out = io.StringIO()
        with contextlib.redirect_stdout(out), self.assertRaises(SystemExit):
            cli.main(['--version'])
        self.assertIn(__version__, out.getvalue())


class TestOutsideRepository(TempDir):
    """The launcher bundled with the skill must work from any directory."""

    def test_skill_launcher_from_foreign_directory(self):
        launcher = os.path.join(ROOT, 'skills', 'schematic', 'scripts', 'aipe_sketcher.py')
        path = self.write('rc.json', CUSTOM)
        env = {k: v for k, v in os.environ.items() if k != 'PYTHONPATH'}
        result = subprocess.run(
            [sys.executable, launcher, 'render', path, '-o', 'drawn', '--json'],
            cwd=self.dir, env=env, capture_output=True, text=True, timeout=300)
        self.assertEqual(result.returncode, 0, result.stderr)
        report = json.loads(result.stdout)
        self.assertEqual(report['status'], 'ok')
        self.assertTrue(os.path.isfile(os.path.join(self.dir, 'drawn', 'rc.svg')))


if __name__ == '__main__':
    unittest.main()
