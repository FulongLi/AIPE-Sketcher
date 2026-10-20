# Quick Start tutorial video (V2)

**AIPE Sketcher — Install & Generate Your First Schematic.** 99 s, 1920×1080,
H.264, captions, no audio.

| Item | Location |
| --- | --- |
| Video | [AIPE-Sketcher-Quick-Start.mp4](https://github.com/FulongLi/AIPE-Sketcher/releases/download/v0.2.0/AIPE-Sketcher-Quick-Start.mp4) (3.6 MB, asset of the [v0.2.0 release](https://github.com/FulongLi/AIPE-Sketcher/releases/tag/v0.2.0); rendered locally as `AIPE-Sketcher-Quick-Start-V2.mp4`, not in Git) |
| Thumbnail | [quick-start-v2-thumbnail.png](quick-start-v2-thumbnail.png) (1280×720) |
| Source project | [video/](video/) (Remotion 4, React, TypeScript) |
| AIPE template | [video/src/brand/](video/src/brand/) (tokens and components) and [video/src/kit/](video/src/kit/) (app-screen kit) |
| Sketcher content | [video/src/sketcher-v2/](video/src/sketcher-v2/); every on-screen string and its source is in [content.ts](video/src/sketcher-v2/content.ts) |
| Evidence | [video/verified/](video/verified/) and [verification.md](verification.md) |

The app windows are **simplified reconstructions**, not screen recordings,
and each one says so on screen. Their labels come from the installed Codex
and Claude apps ([ui-labels.md](video/verified/v2/ui-labels.md)). The agent
replies and the schematic come from a real run.

## Storyboard

| Time | Step | What the viewer sees | Caption |
| --- | --- | --- | --- |
| 0:00 | Intro | AIPE logo, "AIPE Sketcher", "Electrical schematics, powered by AI.", the DAB schematic | — |
| 0:06 | 1 · Open Codex | Codex window, empty chat | Open the Codex app (Codex in the ChatGPT desktop app works too). |
| 0:11 | 2 · Install | Plugins → menu next to Create plugin → Add a marketplace | Go to Plugins. / Open the menu … and choose Add a marketplace. |
| 0:17 | 2 · Install | Add plugin marketplace dialog, Source `FulongLi/AIPE-Sketcher`, Add marketplace | Enter the AIPE Sketcher repository … |
| 0:20 | 2 · Install | "aipe-sketcher marketplace added", AIPE Sketcher card → Install AIPE Sketcher | AIPE Sketcher now appears … Select it. / Click Install. |
| 0:29 | 2 · Install | "AIPE Sketcher plugin installed · Try now", Installed badge | Installed. Start a new chat to use it. / Runs on your computer with Python 3.9 or newer. No API key needed. |
| 0:36 | Claude Code | Code tab, + → Add plugins → aipe-sketcher | Click + …, then Add plugins. / Install it for your user account. / First time? Add the marketplace … as the README shows. |
| 0:47 | 3 · Describe | Prompt typed and sent; real first reply, "AIPE Sketcher schematic skill" highlighted | Describe the circuit you want, in plain English. / Codex recognises the request and uses AIPE Sketcher. |
| 1:01 | Illustration | Your request → AIPE Sketcher → schematic drawn in; "Drawing connectivity passed" | Draws the schematic on your computer … refuses to save a drawing whose wires differ from the circuit. |
| 1:12 | 4 · Result | Real final reply with links to the SVG, Circuit IR and report | Codex replies with the SVG and the validation result. |
| 1:19 | Result | "Your schematic is ready.", full schematic, three passed checks, `schematics/dab.svg` | — |
| 1:30 | Closing | Logo, "Describe it. Generate it. Validate it.", GitHub and aipel.co.uk, AIPE Labs | — |

## Installation actions shown, and how each was verified

| Action shown | Verified by |
| --- | --- |
| Codex: Plugins → Add a marketplace → Source `FulongLi/AIPE-Sketcher` → Add marketplace | Labels from the Codex app catalog. The same operation ran as `codex plugin marketplace add FulongLi/AIPE-Sketcher` (exit 0, marketplace `aipe-sketcher`). The menu position is from third-party guides, not checked in the app. |
| Codex: select AIPE Sketcher → Install AIPE Sketcher → "AIPE Sketcher plugin installed" | Labels from the app catalog. The same operation ran as `codex plugin add aipe-sketcher@aipe-sketcher` (exit 0, version 0.2.0). |
| "Start a new chat to use it" | The app has a "Reload skills before starting a new chat" message for the case where skills fail to refresh. A new chat is the safe instruction. |
| Python 3.9+ needed, no API key | The plugin launcher's requirement (README, docs/plugins.md). |
| Claude Code: + → Add plugins → select AIPE Sketcher → user scope | "Add plugins" is from the app bundle; the steps are from the Claude Code docs. The install ran as `claude plugin install` (exit 0, enabled). The browser layout and confirmation are not verified and are not shown. |
| Claude Code: add the marketplace once | Verified with `claude plugin marketplace add FulongLi/AIPE-Sketcher`. The desktop GUI for this step is not verified, so the video points to the README instead of showing it. |
| The request, Codex's replies, the schematic and the check results | Real `codex exec` run of the exact prompt with the plugin installed from GitHub: [codex-exec-dab.log](video/verified/v2/codex-exec-dab.log). The SVG is byte-identical to the one shown (`e3da9cc6…`). |

**Not shown on purpose:** asking Codex in chat to install the plugin. In a
test ([codex-chat-install-test.log](video/verified/v2/codex-chat-install-test.log))
the agent did not use the plugin system. It cloned the repository, copied the
skill into the workspace and rewrote its launcher. That doesn't match the
documented install, so it isn't presented as a supported path.

## What V2 changes from V1

| | V1 | V2 |
| --- | --- | --- |
| Look | Generic blue/grey | aipel.co.uk tokens: cream `#fdfcf9`, ink `#241c10`, accent `#f5d54a`, Bricolage Grotesque + Inter, black pill captions, official logo |
| Install | Terminal commands with package output | Codex Plugins screen: menu, dialog, Install button; short Claude Code + menu path |
| Audience | Developers | First-time users: no Git, Python, JSON or shell on screen |
| Usage | `codex exec` transcript with script names and JSON fields | Chat: you type a sentence, Codex answers, you get the SVG |
| Pipeline | Five-stage IR/layout/validation diagram | One three-step illustration: request → AIPE Sketcher → schematic |
| Result | Report fields and SHA | "Your schematic is ready.", three plain checks, where the file is saved |
| Reuse | One-off scenes | `brand/` and `kit/` serve as a template for AIPE Magnetics, PCB and other tools |

V1's source stays in [video/src/v1/](video/src/v1/) (`npx remotion render QuickStart`).

## Re-rendering

Needs Node.js 18+. Remotion downloads its own headless Chromium and FFmpeg.

```bash
cd docs/media/video
npm install
npx remotion render QuickStartV2 ../AIPE-Sketcher-Quick-Start-V2.mp4
npx remotion still ThumbnailV2 ../quick-start-v2-thumbnail.png
npm run studio
```

For a new AIPE tool, copy `src/sketcher-v2/` to `src/<tool>/`, replace
`content.ts` and the scenes' content, register the composition in
`src/Root.tsx`, and keep `brand/` and `kit/` unchanged. Remotion is free for
individuals and organisations with up to three employees; larger companies
need a Remotion company licence ([remotion.dev/license](https://www.remotion.dev/license)).

## YouTube

**Title:** AIPE Sketcher Quick Start: Install in Codex and Draw Your First Circuit Schematic

**Description:**

AIPE Sketcher turns a plain-English circuit description into an electrical
schematic, and checks that every wire in the drawing matches the circuit.
This short tutorial shows how to add it to Codex (or Claude Code) and get your
first schematic, with no coding.

0:00 What AIPE Sketcher does
0:06 Open Codex
0:11 Install AIPE Sketcher from the Plugins page
0:36 Using Claude Code instead
0:47 Describe your circuit
1:01 How the schematic is drawn and checked
1:12 Your schematic and where to find it

In Codex: Plugins → Add a marketplace → FulongLi/AIPE-Sketcher → Install.
Then ask: "Using AIPE Sketcher, draw a Dual Active Bridge converter
schematic and export it as SVG."

App screens in this video are simplified reconstructions using the apps'
real labels; the schematic and the assistant's replies are from a real run.
Runs on your computer with Python 3.9 or newer; no API key needed. The
connectivity check confirms the drawing matches the circuit; it does not
verify ratings, safety or performance.

Free for personal, non-commercial use.
https://github.com/FulongLi/AIPE-Sketcher · https://aipel.co.uk
AIPE Labs
