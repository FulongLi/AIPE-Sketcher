// Everything shown inside a reconstructed app screen, with its source.
// [codex-ui]  English UI string catalog in /Applications/ChatGPT.app
//             (app.asar, ChatGPT/Codex app 26.1013.40934), message id given.
// [claude-ui] Claude desktop 2.42304.2 cached Code-tab bundle (+ menu).
// [plugin]    this repository's plugin manifests.
// [run]       codex exec run of 2026-10-20 (docs/media/video/verified/v2/).

export const SOURCES_NOTE = 'Simplified reconstruction · labels taken from the Codex app 26.1013';

export const CODEX = {
	appTitle: 'Codex',
	newChat: 'New chat', // [codex-ui] sidebarElectron.newThread
	plugins: 'Plugins', // [codex-ui] sidebarElectron.skillsAppsRouteNavLink
	skills: 'Skills', // [codex-ui] sidebarElectron.skillsRouteNavLink
	composerPlaceholder: 'Ask Codex to do anything', // [codex-ui] composer.placeholder.newTask.doAnything
	working: 'Working…', // [codex-ui] composer.placeholder.working
	pluginsTitle: 'Plugins', // [codex-ui] skills.appsPage.browseIntro.title
	pluginsSubtitle: 'Connect plugins to let Codex work across your tools', // [codex-ui] skills.appsPage.browseIntro.codexSubtitle
	searchPlugins: 'Search plugins', // [codex-ui] skills.appsPage.search.plugins
	createPlugin: 'Create plugin', // [codex-ui] skills.appsPage.createPlugin
	addMarketplaceMenu: 'Add a marketplace', // [codex-ui] skills.appsPage.addMarketplace
	dialogTitle: 'Add plugin marketplace', // [codex-ui] skills.appsPage.addMarketplace.title
	dialogSubtitle: 'Add from a GitHub repo, Git URL, or local folder.', // [codex-ui] ...addMarketplace.subtitle
	sourceLabel: 'Source', // [codex-ui] ...addMarketplace.sourceLabel
	sourcePlaceholder: 'openai/plugins or git@github.com:org/repo.git', // [codex-ui] ...sourcePlaceholder
	refLabel: 'Git ref', // [codex-ui] ...refLabel
	refPlaceholder: 'main', // [codex-ui] ...refPlaceholder
	sparseLabel: 'Sparse paths', // [codex-ui] ...sparsePathsLabel
	sparsePlaceholder: 'plugins/codex', // [codex-ui] ...sparsePathsPlaceholder
	cancel: 'Cancel', // [codex-ui] ...addMarketplace.cancel
	submit: 'Add marketplace', // [codex-ui] ...addMarketplace.submit
	source: 'FulongLi/AIPE-Sketcher', // typed by the user (README install source)
	marketplaceAdded: 'aipe-sketcher marketplace added', // [codex-ui] ...addMarketplace.success; name from `codex plugin marketplace add`
	pluginCount: '1 plugin', // [codex-ui] skills.appsPage.marketplace.pluginCount
	installTitle: 'Install AIPE Sketcher', // [codex-ui] plugins.installModal.title
	installing: 'Installing AIPE Sketcher', // [codex-ui] plugins.installModal.installing
	developedBy: 'Developed by AIPE Labs / Spirit Connect', // [codex-ui] plugins.installModal.developedBy + [plugin] developerName
	about: 'About', // [codex-ui] plugins.installModal.about
	includes: 'Includes', // [codex-ui] plugins.installModal.includes
	includesSkills: 'Skills', // [codex-ui] plugins.installModal.includes.skills
	category: 'Category: Engineering', // [codex-ui] plugins.installModal.metadata.category + [plugin]
	installed: 'AIPE Sketcher plugin installed', // [codex-ui] plugins.install.success
	tryNow: 'Try now', // [codex-ui] plugins.install.tryInChatToast
	installedBadge: 'Installed', // [codex-ui] plugins.dependencies.installedStatus
};

export const PLUGIN = {
	displayName: 'AIPE Sketcher', // [plugin] plugin.json interface.displayName
	short: 'Connectivity-checked SVG circuit schematics', // [plugin] interface.shortDescription
	about:
		'AIPE Sketcher generates electrical schematics for power electronics and general circuits. Describe a circuit or name a reference converter; it renders an SVG and checks that the drawing matches the circuit.', // shortened from [plugin] interface.longDescription
	skill: 'schematic',
	claudeName: 'aipe-sketcher',
	claudeDescription: 'Generate and validate SVG electrical schematics for power electronics and general circuits from explicit Circuit IR.', // [plugin] .claude-plugin/plugin.json via `claude plugin details`
};

export const CLAUDE = {
	appTitle: 'Claude',
	addPlugins: 'Add plugins', // [claude-ui] + menu, id addPlugins
	marketplace: 'FulongLi/AIPE-Sketcher',
};

export const PROMPT = 'Using AIPE Sketcher, draw a Dual Active Bridge converter schematic and export it as SVG.';

// [run] agent messages, verbatim; the final reply keeps its first, second and
// last paragraphs (the assumptions paragraph is omitted).
export const REPLY_START = 'I’ll use the AIPE Sketcher schematic skill to draw the Dual Active Bridge converter and export a connectivity-checked SVG.';
export const REPLY_FINAL = {
	lead: ['Created the ', {link: 'Dual Active Bridge SVG'}, ' using AIPE Sketcher, with ', {link: 'Circuit IR'}, ' and ', {link: 'validation report'}, '.'] as (string | {link: string})[],
	checks: 'Electrical validation, symbol support, and drawing connectivity passed. Layout is acceptable, scoring 97/100, with minor spacing warnings on PRI_B and SEC_A.',
	limit: 'Validation confirms the drawing matches the circuit description; it does not verify safety, ratings, or performance.',
};

// [run] schematics/dab.report.json
export const REPORT = {
	electrical: 'passed',
	connectivity: 'passed',
	score: 97,
	svg: 'schematics/dab.svg',
	svgSize: '28 KB',
	svgSha: 'e3da9cc61263096bbb43a9d5c187023a7100fef3289fb7d8706f909dd7b3c452',
};
