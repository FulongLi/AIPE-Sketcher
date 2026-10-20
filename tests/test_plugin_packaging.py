"""Plugin packaging: manifests, skill discovery, bundled assets, licensing.

These are structural checks that run anywhere with the standard library.
The authoritative host checks (``claude plugin validate`` and Codex
marketplace installation) are run separately; see docs/plugins.md.
"""
import json
import os
import re
import sys
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from aipe_sketch import __version__

NAME = 'aipe-sketcher'
LICENSE_ID = 'LicenseRef-AIPE-Sketcher-Personal-NonCommercial-0.1 AND CC0-1.0'
REPOSITORY = 'https://github.com/FulongLi/AIPE-Sketcher'


def load(*parts):
    with open(os.path.join(ROOT, *parts), encoding='utf-8') as fh:
        return json.load(fh)


def text(*parts):
    with open(os.path.join(ROOT, *parts), encoding='utf-8') as fh:
        return fh.read()


def frontmatter(path):
    body = text(path)
    match = re.match(r'^---\n(.*?)\n---\n', body, re.S)
    if not match:
        return None, body
    fields = {}
    for line in match.group(1).splitlines():
        key, _, value = line.partition(':')
        fields[key.strip()] = value.strip()
    return fields, body[match.end():]


class TestManifests(unittest.TestCase):
    def test_portable_manifest_for_codex(self):
        m = load('plugin.json')
        self.assertEqual(m['$schema'],
                         'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json')
        allowed = {'$schema', 'name', 'version', 'description', 'author', 'homepage',
                   'repository', 'license', 'keywords', 'extensions'}
        self.assertLessEqual(set(m), allowed)
        self.assertRegex(m['name'], r'^(?!.*(?:--|\.\.))[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$')
        self.assertLessEqual(set(m['author']), {'name', 'email', 'url'})
        ui = m['extensions']['com.openai']['interface']
        self.assertEqual(ui['displayName'], 'AIPE Sketcher')
        for key in ('composerIcon', 'logo'):
            if key in ui:
                self.assertTrue(os.path.isfile(os.path.join(ROOT, ui[key])), key)

    def test_claude_manifest(self):
        m = load('.claude-plugin', 'plugin.json')
        self.assertEqual(m['displayName'], 'AIPE Sketcher')
        self.assertTrue(m['homepage'].startswith('https://'))
        for prefix in ('claude-', 'anthropic-'):
            self.assertFalse(m['name'].startswith(prefix))
        # No other files belong inside .claude-plugin/.
        self.assertEqual(sorted(os.listdir(os.path.join(ROOT, '.claude-plugin'))),
                         ['marketplace.json', 'plugin.json'])

    def test_identity_is_consistent(self):
        manifests = [load('plugin.json'), load('.claude-plugin', 'plugin.json')]
        for m in manifests:
            self.assertEqual(m['name'], NAME)
            self.assertEqual(m['version'], __version__)
            self.assertEqual(m['license'], LICENSE_ID)
            self.assertEqual(m['repository'], REPOSITORY)
        self.assertEqual(manifests[0]['description'], manifests[1]['description'])
        pyproject = text('pyproject.toml')
        self.assertIn(f'name = "{NAME}"', pyproject)
        self.assertIn(f'license = "{LICENSE_ID}"', pyproject)
        self.assertIn('path = "aipe_sketch/__init__.py"', pyproject)

    def test_claude_marketplace(self):
        m = load('.claude-plugin', 'marketplace.json')
        self.assertTrue(m['name'] and m['owner']['name'])
        entry, = m['plugins']
        self.assertEqual(entry['name'], NAME)
        self.assertNotIn('..', entry['source'])
        source = os.path.normpath(os.path.join(ROOT, entry['source']))
        self.assertEqual(load(os.path.relpath(source, ROOT), '.claude-plugin',
                              'plugin.json')['name'], entry['name'])

    def test_codex_marketplace(self):
        m = load('.agents', 'plugins', 'marketplace.json')
        self.assertEqual(m['interface']['displayName'], 'AIPE Sketcher')
        entry, = m['plugins']
        self.assertEqual(entry['name'], NAME)
        self.assertIn(entry['policy']['installation'],
                      {'AVAILABLE', 'INSTALLED_BY_DEFAULT', 'NOT_AVAILABLE'})
        self.assertTrue(entry['policy']['authentication'] and entry['category'])
        path = entry['source']['path']
        self.assertTrue(path.startswith('./') and '..' not in path)
        # Resolved from the marketplace root, not from .agents/plugins/.
        self.assertEqual(load(os.path.normpath(path), 'plugin.json')['name'], NAME)


class TestSkill(unittest.TestCase):
    SKILLS = os.path.join(ROOT, 'skills')

    def test_skills_are_discoverable(self):
        names = sorted(os.listdir(self.SKILLS))
        self.assertEqual(names, ['schematic'])
        for name in names:
            fields, body = frontmatter(os.path.join('skills', name, 'SKILL.md'))
            self.assertIsNotNone(fields, name)
            self.assertEqual(fields['name'], name)
            self.assertRegex(name, r'^[a-z0-9]+(-[a-z0-9]+)*$')
            self.assertTrue(0 < len(fields['description']) <= 1024)
            # Portable frontmatter only (Codex and Claude Code both accept these).
            self.assertLessEqual(set(fields), {'name', 'description', 'license',
                                               'compatibility', 'metadata'})
            self.assertLess(len(body.splitlines()), 500)

    def test_skill_links_resolve(self):
        base = os.path.join(self.SKILLS, 'schematic')
        _, body = frontmatter(os.path.join('skills', 'schematic', 'SKILL.md'))
        links = re.findall(r'\]\(([^)#]+)\)', body)
        self.assertTrue(links)
        for link in links:
            self.assertTrue(os.path.isfile(os.path.join(base, link)), link)
        self.assertTrue(os.path.isfile(os.path.join(base, 'scripts', 'aipe_sketcher.py')))

    def test_skill_commands_exist_in_the_cli(self):
        from aipe_sketch.cli import build_parser
        commands = set(build_parser()._subparsers._group_actions[0].choices)
        _, body = frontmatter(os.path.join('skills', 'schematic', 'SKILL.md'))
        used = set(re.findall(r'^\| `([a-z]+)[ `]', body, re.M))
        self.assertTrue(used)
        self.assertLessEqual(used, commands)

    def test_launcher_finds_the_plugin_root(self):
        launcher = text('skills', 'schematic', 'scripts', 'aipe_sketcher.py')
        self.assertIn('os.pardir, os.pardir, os.pardir', launcher)
        self.assertTrue(os.path.isfile(os.path.join(ROOT, 'aipe_sketch', 'cli.py')))


class TestPackagedFiles(unittest.TestCase):
    PLUGIN_FILES = ['plugin.json', '.claude-plugin/plugin.json',
                    '.claude-plugin/marketplace.json', '.agents/plugins/marketplace.json',
                    'pyproject.toml', 'aipe.yaml']

    def test_symbol_sheet_is_shipped(self):
        self.assertTrue(os.path.isfile(os.path.join(
            ROOT, 'assets', 'master', 'Inkscape_Symbols_All.svg')))
        self.assertIn('"assets/master/Inkscape_Symbols_All.svg" = '
                      '"aipe_sketch/_data/Inkscape_Symbols_All.svg"', text('pyproject.toml'))

    def test_master_override_and_missing_sheet(self):
        from aipe_sketch import paths
        old = os.environ.get('AIPE_SKETCHER_SYMBOLS')
        try:
            os.environ['AIPE_SKETCHER_SYMBOLS'] = os.path.join(ROOT, 'no-such.svg')
            with self.assertRaisesRegex(FileNotFoundError, 'AIPE_SKETCHER_SYMBOLS'):
                paths.master_path()
            os.environ['AIPE_SKETCHER_SYMBOLS'] = paths.MASTER
            self.assertEqual(paths.master_path(), paths.MASTER)
        finally:
            if old is None:
                os.environ.pop('AIPE_SKETCHER_SYMBOLS', None)
            else:
                os.environ['AIPE_SKETCHER_SYMBOLS'] = old

    def test_no_developer_specific_paths(self):
        files = list(self.PLUGIN_FILES)
        for base, _, names in os.walk(os.path.join(ROOT, 'skills')):
            files += [os.path.relpath(os.path.join(base, n), ROOT) for n in names
                      if not n.endswith('.pyc')]
        for path in files:
            content = text(path)
            for pattern in (r'/Users/', r'/home/[a-z]', r'[A-Z]:\\\\Users'):
                self.assertIsNone(re.search(pattern, content), f'{path}: {pattern}')

    def test_licence_files(self):
        licence = text('LICENSE')
        self.assertIn('NOT an open-source license', licence)
        self.assertIn('LicenseRef-AIPE-Sketcher-Personal-NonCommercial-0.1', licence)
        notices = text('THIRD_PARTY_NOTICES.md')
        self.assertIn('CC0 1.0', notices)
        self.assertIn('https://github.com/upb-lea/Inkscape_electric_Symbols', notices)

    def test_capability_manifest(self):
        manifest = text('aipe.yaml')
        # The registry identifier and Engineering State namespace are stable.
        self.assertRegex(manifest, r'(?m)^id: aipe\.sketch$')
        self.assertRegex(manifest, r'(?m)^name: AIPE Sketcher$')
        self.assertRegex(manifest, r'(?m)^repository: ' + re.escape(REPOSITORY) + '$')
        self.assertNotIn('NOASSERTION', manifest)
        self.assertIn(LICENSE_ID, manifest)
        listed = re.findall(r'(?m)^\s+- ((?:docs|tests|skills|README|LICENSE|THIRD)[^\s#]*)$',
                            manifest)
        self.assertTrue(listed)
        for path in listed:
            self.assertTrue(os.path.exists(os.path.join(ROOT, path)), path)


if __name__ == '__main__':
    unittest.main()
