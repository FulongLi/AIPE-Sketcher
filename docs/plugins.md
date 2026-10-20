# Plugins: installation, verification and packaging

AIPE Sketcher is one repository that is simultaneously a Codex plugin, a
Claude Code plugin, a marketplace for each host, and a Python package. Both
hosts load the same Skill and the same engine:

```
user request -> skills/schematic/SKILL.md -> Circuit IR JSON
             -> skills/schematic/scripts/aipe_sketcher.py -> aipe_sketch (bundled engine)
             -> <name>.svg + <name>.report.json
```

| File | Read by | Purpose |
| --- | --- | --- |
| `plugin.json` | Codex | Portable Agent Plugins manifest, with `extensions.com.openai.interface` |
| `.agents/plugins/marketplace.json` | Codex | Marketplace listing the plugin at the repository root |
| `.claude-plugin/plugin.json` | Claude Code | Plugin manifest |
| `.claude-plugin/marketplace.json` | Claude Code | Marketplace listing the plugin at the repository root |
| `skills/schematic/` | both | Shared Skill, its references and the launcher |
| `pyproject.toml` | pip / uv | Optional standalone `aipe-sketcher` CLI |

No MCP server, hook, API key or network access is used. The launcher needs
`python3` 3.9+ on `PATH` (`py -3` or `python` on Windows) and imports the
engine from the installed plugin directory, so nothing is pip-installed.

## OpenAI Codex

```bash
codex plugin marketplace add FulongLi/AIPE-Sketcher
codex plugin add aipe-sketcher@aipe-sketcher
```

Restart Codex or the ChatGPT desktop app, then ask for a schematic in a new
chat. Codex copies the plugin to
`~/.codex/plugins/cache/aipe-sketcher/aipe-sketcher/<version>/`.

- Update: `codex plugin marketplace upgrade aipe-sketcher`
- Remove: `codex plugin remove aipe-sketcher@aipe-sketcher` and
  `codex plugin marketplace remove aipe-sketcher`
- Local checkout: `codex plugin marketplace add /path/to/AIPE-Sketcher`.
  A local-path install copies the working tree, including untracked files.

## Anthropic Claude Code

From a shell:

```bash
claude plugin marketplace add FulongLi/AIPE-Sketcher
claude plugin install aipe-sketcher@aipe-sketcher
```

or inside a session: `/plugin marketplace add FulongLi/AIPE-Sketcher`, then
`/plugin install aipe-sketcher@aipe-sketcher` (Claude Code 2.1.275 or later
also accepts `/plugin install aipe-sketcher --marketplace FulongLi/AIPE-Sketcher`).
The skill appears as `/aipe-sketcher:schematic`; Claude also loads it on its
own when you ask for a schematic.

- Check: `claude plugin list`, `claude plugin details aipe-sketcher`
- Update: `claude plugin marketplace update aipe-sketcher`
- Remove: `claude plugin uninstall aipe-sketcher@aipe-sketcher`
- Develop without installing: `claude --plugin-dir /path/to/AIPE-Sketcher`

## Verifying a change

```bash
python3 -m unittest discover -s tests            # engine, CLI and packaging tests
claude plugin validate --strict .                # marketplace + plugin manifest
claude plugin validate --strict .claude-plugin/plugin.json
python3 tools/check_manifest.py                  # aipe.yaml vs AIPE-Registry schema (needs pyyaml, jsonschema)
```

To test a host install without touching your own configuration, point the
host at a throwaway home: `CODEX_HOME=$(mktemp -d) codex plugin marketplace
add .` or `CLAUDE_CONFIG_DIR=$(mktemp -d) claude plugin marketplace add .`.
Model invocations need a logged-in host.

Keep `version` equal in `aipe_sketch/__init__.py`, `plugin.json` and
`.claude-plugin/plugin.json` (a test enforces it). Claude Code pins installs
to the manifest `version`, so bump it for every release users should receive.

## Packaging convention for AIPE engineering plugins

AIPE Sketcher is the reference layout for standalone AIPE plugins (Magnetics,
PCB, CAD, ...):

1. One repository is the plugin root for both hosts; the engine, its data and
   the skills live in it, so an installed plugin is self-contained.
2. Root `plugin.json` (Agent Plugins schema) for Codex and
   `.claude-plugin/plugin.json` for Claude Code carry identical name, version,
   description and licence; each host has its own marketplace file pointing at
   `./`.
3. Skills live once in `skills/<task>/`, use only portable frontmatter
   (`name`, `description`), stay short, and push detail into `references/`.
   Bundled scripts are referenced from the skill directory, never by absolute
   paths.
4. Engineering numbers and validation always come from the engine (CLI or
   MCP), never from the model. Reports state assumptions and limitations.
5. Registry identifiers (`aipe.<tool>`) are stable across product renames;
   display names may change.
6. `README.md` follows: one-line description, Overview, Watch Quick Start
   Tutorial (optional), Installation (Codex, Claude Code), Quick Start,
   Documentation, License. Tutorial media lives in `docs/media/`; videos are
   release assets, not Git files.
