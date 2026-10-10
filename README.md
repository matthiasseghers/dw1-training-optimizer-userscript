# TypeScript Userscript Template

[![CI](https://github.com/matthiasseghers/typescript-userscript-template/actions/workflows/ci.yml/badge.svg)](https://github.com/matthiasseghers/typescript-userscript-template/actions/workflows/ci.yml)
[![Release](https://github.com/matthiasseghers/typescript-userscript-template/actions/workflows/release.yml/badge.svg)](https://github.com/matthiasseghers/typescript-userscript-template/actions/workflows/release.yml)
[![Latest Release](https://img.shields.io/github/v/release/matthiasseghers/typescript-userscript-template)](https://github.com/matthiasseghers/typescript-userscript-template/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A template for building userscripts with TypeScript: modular, type-safe, tested code that compiles into a single userscript file.

## Why Use This Template?

- **Type safety** — catch bugs at compile time, with full autocomplete for GM APIs and go-to-definition across the codebase.
- **Modularity** — split monolithic scripts into focused, reusable modules instead of scrolling through 1000+ line files.
- **Built-in testing** — Vitest is configured; verify your code works before releasing it.
- **Modern tooling** — ESLint, Prettier, Husky, and GitHub Actions already wired up.
- **Tree-shaking** — unused code is stripped out, so importing libraries doesn't bloat the userscript.
- **Maintainability** — clear structure plus types means you can come back months later and still understand what you wrote.
- **Userscript metadata** — injected from `meta.json`, so your script's name, version, and permissions live in one place.

## Installation

Download the latest built userscript from the [GitHub Releases](https://github.com/matthiasseghers/typescript-userscript-template/releases/latest) page and install it in your userscript manager.

*(After running setup, your releases live at `https://github.com/<your-username>/<your-repo>/releases/latest`.)*

> **Note:** `dist/` is gitignored — builds are attached as release artifacts, not committed to the repo.

Prefer to build it yourself? Clone the repo, run `npm install && npm run build`, and install `dist/userscript.user.js` — see [docs/DEVELOPING.md](docs/DEVELOPING.md).

## Using This Template

**Option 1: Use GitHub Template (Recommended)**
1. Click the "**Use this template**" button at the top of this repository
2. Choose a name for your new repository
3. Clone your new repository
4. Run `npm run setup`
5. Start coding.

**Option 2: Clone Directly**
```bash
git clone https://github.com/yourusername/typescript-userscript-template.git my-userscript
cd my-userscript
rm -rf .git  # Remove template git history
git init     # Start fresh
npm run setup
```

### What does `npm run setup` do?

Running `npm run setup` launches an interactive wizard that configures the template for your project in one go:

- Asks for your userscript name, description, author, GitHub username, and repository name
- Confirms your inputs before making any changes — restarts if anything looks wrong
- Patches `package.json`, `meta.json`, and `README.md` with your details
- Resets `meta.json`'s version to `0.1.0` so your project starts its own version line
- Deletes any `v*` tags inherited from the template (relevant when cloning with history)
- Asks whether to keep a `templateProvenance` record in `package.json` — the template version you started from, used as the "since" marker when adopting template updates later
- Runs `npm install` automatically
- Removes template-specific files (`MIGRATION_GUIDE.md`, the README template, and the setup wizard's own test)
- Removes itself — the setup script has no place in your actual project

After setup completes, everything is configured and ready to go.

## Project Structure

```
.
├── .github/
│   ├── workflows/
│   │   ├── ci.yml            # Continuous integration (lint, test, build)
│   │   ├── security.yml      # Security scanning (CodeQL, npm audit, Semgrep)
│   │   └── release.yml       # Bumps version, tags, builds, publishes GitHub Release
│   └── dependabot.yml        # Weekly dependency updates
├── .husky/                   # Git hooks (run validate before commits)
│   └── pre-commit
├── docs/                     # Guides for developing, releasing, updating, troubleshooting
│   ├── DEVELOPING.md         # Writing and building your userscript
│   ├── CI-CD.md              # Workflows, releases, troubleshooting
│   ├── UPDATING.md           # Adopting template updates
│   └── TROUBLESHOOTING.md    # Common problems and fixes
├── scripts/
│   ├── setup.js               # One-time setup wizard (self-deletes after running)
│   ├── update-meta-version.js # Bumps meta.json version (used by the release workflow)
│   ├── check-grants.js        # Validates GM API grants in meta.json
│   └── audit-gate.js          # Gates the security workflow's npm audit
├── src/
│   ├── index.ts       # Main entry point
│   └── utils.ts       # Utility functions (example — replace freely)
├── tests/
│   ├── setup.test.ts  # Tests for the setup wizard (template-only, removed by setup)
│   ├── utils.test.ts  # Example tests for utilities
│   └── index.test.ts  # Example tests for main logic
├── dist/                   # Gitignored — created by build
│   └── userscript.user.js  # Built userscript (auto-generated)
├── meta.json                 # Userscript metadata
├── vitest.config.ts          # Test configuration
├── package.json              # Project dependencies
├── package-lock.json         # Locked dependency versions
├── tsconfig.json             # TypeScript configuration
├── tsconfig.test.json        # Type checking incl. tests
├── rollup.config.js          # Build configuration
├── eslint.config.js          # ESLint configuration
├── .jscpd.json               # Duplicate code detection configuration
├── .prettierrc               # Prettier configuration
├── .markdown-link-check.json # Link check configuration
├── SECURITY.md               # Security policy
└── LICENSE                   # MIT License
```

## Quick Start

### 1. Run Setup

```bash
npm run setup
```

This launches the interactive wizard, patches all files with your project details, and runs `npm install` automatically. See [What does `npm run setup` do?](#what-does-npm-run-setup-do) for details.

### 2. Configure Your Userscript

Edit `meta.json` to customize your userscript metadata:

```json
{
  "name": "My TypeScript Userscript",
  "namespace": "https://github.com/yourusername",
  "version": "0.1.0",
  "description": "A userscript built with TypeScript",
  "author": "Your Name",
  "match": [
    "https://example.com/*"
  ],
  "grant": [
    "GM_addStyle",
    "GM_getValue",
    "GM_setValue"
  ],
  "run-at": "document-end"
}
```

**Key fields:**
- `match`: URLs where your userscript runs
- `grant`: GM API permissions your script needs
- `run-at`: When to run the script (`document-start`, `document-end`, or `document-idle`)
- `connect`: (Optional) Domains allowed for `GM_xmlhttpRequest` cross-origin requests. Only add if you use `GM_xmlhttpRequest`. Example: `["api.example.com", "cdn.example.org"]`
- `version`: **This is your userscript version** - what users see in Tampermonkey. The Release workflow bumps it automatically (see [docs/CI-CD.md](docs/CI-CD.md)); it starts at `0.1.0` after setup.

### 3. Build Your Userscript

```bash
# Production build (optimized, no sourcemaps)
npm run build

# Development mode (watch mode with inline sourcemaps for debugging)
npm run dev
```

The built userscript will be in `dist/userscript.user.js`.

### 4. Install in Your Browser

1. Install a userscript manager extension:
   - [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Firefox, Safari, Edge)
   - [Violentmonkey](https://violentmonkey.github.io/) (Chrome, Firefox, Edge)
   - [Greasemonkey](https://www.greasespot.net/) (Firefox)

2. Open `dist/userscript.user.js` and copy its contents

3. Create a new userscript in your userscript manager and paste the code

## Documentation

| Guide | Contents |
|---|---|
| [docs/DEVELOPING.md](docs/DEVELOPING.md) | Writing and building your userscript: code examples, testing, customization, scripts reference |
| [docs/CI-CD.md](docs/CI-CD.md) | Workflows, releases, and recovery |
| [docs/UPDATING.md](docs/UPDATING.md) | Adopting template updates |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Common problems and fixes |

The full `GM_*` API is typed via `@types/tampermonkey` — autocomplete as you type. Reference: [Tampermonkey documentation](https://www.tampermonkey.net/documentation.php).

## Versioning

`meta.json`'s `version` is the single source of truth — it is the version Tampermonkey shows and the version the Release workflow bumps and tags. The `version` in `package.json` is plain npm metadata: no workflow touches it, and it only matters if you ever publish the project to npm.

In this template repository, releases demonstrate the pipeline using the bundled example script — a fork's releases look exactly the same, with your own script.

## CI/CD

Three GitHub Actions workflows ship with the template: **CI** (lint, test, coverage thresholds, build on every push/PR), **Security** (CodeQL, Semgrep, npm audit — push/PR and weekly), and **Release** (bumps `meta.json`, tags, builds, and publishes a GitHub Release). Full details, release paths (UI, CLI, manual tag), and recovery: [docs/CI-CD.md](docs/CI-CD.md).

## Updating from Template

Updates are optional — a project created from this template is a frozen snapshot and never breaks when the template changes. Two adoption paths are documented in [docs/UPDATING.md](docs/UPDATING.md): in-place updates and starting fresh from the latest template; `npm pkg get templateProvenance` shows which template version you started from.

## License

MIT

## Contributing

Issues and pull requests are welcome. Run `npm run validate` before submitting.
