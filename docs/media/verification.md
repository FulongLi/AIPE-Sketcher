# Quick Start video: verification report

## V2 (current), 2026-10-20

| Check | Result | Evidence |
| --- | --- | --- |
| Codex install actions shown (Plugins → Add a marketplace → Install) | UI labels read from the Codex app 26.1013 string catalog. The underlying operations succeeded via the Codex CLI (V1 table below). The GUI clicks themselves were not performed: no recording or control of the desktop apps was possible here | `video/verified/v2/ui-labels.md` |
| Claude Code install actions shown (+ → Add plugins) | "Add plugins" read from the Claude desktop 2.42304 bundle; flow from the Claude Code docs. The install succeeded via the CLI (V1 table). The browser layout, its add-marketplace control and the confirmation are unverified and not shown | `video/verified/v2/ui-labels.md` |
| Chat-based install in Codex ("Please install AIPE Sketcher from …") | Tested and **not** used: the agent cloned the repository and hand-copied the skill instead of installing the plugin | `video/verified/v2/codex-chat-install-test.log` |
| Usage: exact prompt "Using AIPE Sketcher, draw a Dual Active Bridge converter schematic and export it as SVG." | Passed. Codex loaded the skill, ran `examples`, `validate`, `render`; electrical validation, symbol support and drawing connectivity passed; layout 97/100 | `video/verified/v2/codex-exec-dab.log`, `codex-exec-dab-final-message.md` |
| Schematic shown | Output of that run, byte-identical to `video/public/dab.svg` (`e3da9cc6…`) | `video/verified/v2/sha256.txt` |
| Brand | Colours, fonts, radii, shadows and hero glow copied from `https://aipel.co.uk/assets/style.css`; logo `AIPE_logo_black.svg` from the site | `video/src/brand/tokens.ts` |
| MP4 | H.264 High, 1920×1080, yuv420p BT.709, 30 fps, 2980 frames, 99.3 s, 3.6 MB, no audio. All frames decode; macOS reads it; plays in Chromium | ffprobe, ffmpeg, mdls, browser `<video>` |
| Readability | Stills of every step checked at 1080p: captions 34 px, app text 19–25 px, nothing clipped or overlapping | rendered stills |

V2 limitations: the app screens are labelled reconstructions, not
recordings, so the layout, icons and the exact location of **Add a
marketplace** may differ from your app version. The Claude Code agent run
remains untested (CLI not signed in). Reply text is shortened: the
assumptions paragraph of the final reply is omitted.

## V1, 2026-10-20

Run on 2026-10-20, macOS (Apple silicon), Python 3.9.6, against
`github.com/FulongLi/AIPE-Sketcher` at `a6447c7` (AIPE Sketcher 0.2.0). Each
host was given a throwaway configuration directory (`CODEX_HOME`,
`CLAUDE_CONFIG_DIR`), so the installs started from nothing. Raw evidence is in
[video/verified/](video/verified/). Throwaway paths there are shown as their
default locations (`~/.codex`, `~/.claude`, `<project>`).

| Check | Result | Evidence |
| --- | --- | --- |
| Codex install (`codex-cli 0.163.0-alpha.10.2`): `codex plugin marketplace add FulongLi/AIPE-Sketcher`, `codex plugin add aipe-sketcher@aipe-sketcher` | Passed, both exit 0; plugin copied to `plugins/cache/aipe-sketcher/aipe-sketcher/0.2.0` | `codex-install.log` |
| Claude Code install (`2.1.299`): `claude plugin marketplace add FulongLi/AIPE-Sketcher`, `claude plugin install aipe-sketcher@aipe-sketcher`, `claude plugin list` | Passed, all exit 0; plugin 0.2.0 enabled, one skill (`schematic`) | `claude-install.log`, `claude-plugin-details.log` |
| End-to-end agent request in Codex: `codex exec` with the Scene 3 prompt, plugin from the GitHub install | Passed. The agent read the skill, ran `examples dab --ir-only`, `validate` and `render`, and wrote `schematics/dab.svg`, `dab.json` and `dab.report.json` | `codex-exec.log`, `codex-exec-final-message.md`, `dab.report.json` |
| Report values shown in the video | Electrical validation, symbol support and drawing connectivity passed. Layout acceptable, score 97/100, two spacing warnings (PRI_B, SEC_A). 23 components, 16 nets, 12 layout candidates | `dab.report.json` |
| Same engine from the Claude Code install: launcher in the installed plugin's `skills/schematic/scripts/` run with the commands the skill prescribes | SVG and Circuit IR byte-identical to the Codex run | `sha256.txt` |
| Same engine from the repository checkout | SVG byte-identical (`e3da9cc6…`) | `sha256.txt` |
| MP4 file | H.264 High, 1920×1080, yuv420p (BT.709, limited range), 30 fps, 2223 frames, 74.1 s, 2.5 MB, no audio track. All frames decode with FFmpeg; macOS metadata reads it; plays in Chromium | `ffprobe`, `ffmpeg -c:v png`, `mdls`, browser `<video>` |
| Readability | Frames checked at 1080p: terminal text 22–26 px monospace, captions 32 px, nothing clipped | Rendered stills |

## Limitations

- **Claude Code model run not tested.** The standalone `claude` CLI on the
  test machine was not signed in (`Not logged in · Please run /login`), so no
  Claude Code agent session could be run headlessly. The install and the
  plugin's skill and engine were verified as listed above. V1 shows the
  agent run in Codex only and labels it as such ("Codex shown · same skill in
  Claude Code"). To confirm the Claude Code agent run, ask a signed-in session:
  `claude -p "Using AIPE Sketcher, generate a Dual Active Bridge converter schematic, validate its electrical connections, and export it as SVG."`
- **The in-session form (`/plugin marketplace add …`, `/plugin install …`) was
  not tested** and is not shown in the video. The README still documents it.
- **No screen recordings.** The interactive Codex and Claude Code interfaces
  could not be captured here. The terminals in the video are re-created from
  the logs above and carry an on-screen note saying so. The Codex run was the
  non-interactive `codex exec`, which is what Scene 4 shows.
- **Condensed transcript.** Scene 4 shortens the plugin cache path in each
  command to the script name. It leaves out one exploratory command the agent
  ran (`rg --files …`, exit 1, nothing found). The agent's final message keeps
  its summary and validation sentences. The file links and the assumptions
  and limitation paragraphs are left out. Scene 6 shows the file locations and
  the limitation; the reference-DAB assumptions are not shown in the video.
- **"Restart Codex"** comes from the plugin documentation. It was not exercised,
  because `codex exec` starts a fresh process that loads the plugin.
