# UI labels used in the V2 reconstructions

Read on 2026-10-20 from the apps installed on the production Mac. Only these
labels, the plugin's own manifest text and the real agent replies appear
inside the reconstructed windows. Other plugins are shown as grey
placeholders, not invented names.

## Codex (ChatGPT desktop app 26.1013.40934)

Source: English message catalog inside
`/Applications/ChatGPT.app/Contents/Resources/app.asar`.

| Shown | Message id |
| --- | --- |
| New chat | `sidebarElectron.newThread` |
| Plugins | `sidebarElectron.skillsAppsRouteNavLink`, `skills.appsPage.browseIntro.title` |
| Skills | `sidebarElectron.skillsRouteNavLink` |
| Connect plugins to let Codex work across your tools | `skills.appsPage.browseIntro.codexSubtitle` |
| Search plugins | `skills.appsPage.search.plugins` |
| Create plugin | `skills.appsPage.createPlugin` |
| Add a marketplace | `skills.appsPage.addMarketplace` |
| Add plugin marketplace | `skills.appsPage.addMarketplace.title` |
| Add from a GitHub repo, Git URL, or local folder. Learn more | `skills.appsPage.addMarketplace.subtitle` |
| Source / Git ref / Sparse paths (and placeholders) | `skills.appsPage.addMarketplace.sourceLabel`, `.refLabel`, `.sparsePathsLabel`, `*Placeholder` |
| Cancel / Add marketplace | `skills.appsPage.addMarketplace.cancel`, `.submit` |
| {name} marketplace added | `skills.appsPage.addMarketplace.success` |
| {count} plugin | `skills.appsPage.marketplace.pluginCount` |
| Install {pluginName} / Installing {pluginName} | `plugins.installModal.title`, `plugins.installModal.installing` |
| Developed by {developerName} | `plugins.installModal.developedBy` |
| About / Includes / Skills / Category: {category} | `plugins.installModal.about`, `.includes`, `.includes.skills`, `.metadata.category` |
| {pluginName} plugin installed · Try now | `plugins.install.success`, `plugins.install.tryInChatToast` |
| Installed | `plugins.dependencies.installedStatus` |
| Ask Codex to do anything | `composer.placeholder.newTask.doAnything` |
| Working… | `composer.placeholder.working` |

Not taken from the app: the exact position of **Add a marketplace** (shown in
the menu beside **Create plugin**, as third-party setup guides describe), the
window layout, icons and colours.

## Claude desktop (2.42304.2), Code tab

Source: the app's cached claude.ai bundle (`Code Cache/js`), + menu strings
`addPlugins` = "Add plugins", `browsePlugins` = "Browse plugins",
`managePlugins` = "Manage plugins"; Claude Code docs
([desktop](https://code.claude.com/docs/en/desktop),
[install plugins](https://code.claude.com/docs/en/plugins/install)):
"click **+** next to the prompt box and select **Add plugins**".

Not verified: the plugin browser's layout, how it adds a GitHub marketplace,
and its install confirmation. The video therefore shows only the + menu, a
simplified browser with the plugin's real name and description, and tells the
viewer to add the marketplace once as the README describes. It shows no
Claude install confirmation.

## Plugin text

`plugin.json` (`interface.displayName`, `shortDescription`, `longDescription`
shortened, `developerName`, `category`) and `.claude-plugin/plugin.json`
(`description`, as printed by `claude plugin details aipe-sketcher`).
