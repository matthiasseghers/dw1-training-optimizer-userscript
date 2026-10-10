# Digimon World 1 Training Calculator+

[![CI](https://github.com/matthiasseghers/dw1-training-optimizer-userscript/actions/workflows/ci.yml/badge.svg)](https://github.com/matthiasseghers/dw1-training-optimizer-userscript/actions/workflows/ci.yml)
[![Release](https://github.com/matthiasseghers/dw1-training-optimizer-userscript/actions/workflows/release.yml/badge.svg)](https://github.com/matthiasseghers/dw1-training-optimizer-userscript/actions/workflows/release.yml)
[![Latest Release](https://img.shields.io/github/v/release/matthiasseghers/dw1-training-optimizer-userscript)](https://github.com/matthiasseghers/dw1-training-optimizer-userscript/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A TypeScript userscript that optimizes training sessions for Digimon World 1, calculating the minimal number of training sessions needed to reach your stat goals.

## Features

- 🎯 **Optimal training calculator** — uses linear programming ([javascript-lp-solver](https://github.com/JWally/jsLPSolver)) to find the minimum number of training sessions needed
- 🔢 **Input validation** — enforces game limits (HP/MP: 0-9999, other stats: 0-999)
- 🔴 **Visual feedback** — color-coded warnings and error messages in the table
- 🔄 **Manual recalculation** — a Calculate button avoids expensive solves on every keystroke
- 🔁 **Auto-recalculation** — a `MutationObserver` re-solves automatically when the page's own training table changes
- 🎨 **Integrated UI** — adds a Current/Goal/Result table directly on the training calculator page

## Installation

Install from [GitHub Releases](https://github.com/matthiasseghers/dw1-training-optimizer-userscript/releases/latest):

```
https://github.com/matthiasseghers/dw1-training-optimizer-userscript/releases/latest/download/userscript.user.js
```

**Requirements:**

- [Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), or [Greasemonkey](https://www.greasespot.net/)
- Visit: https://fliegenfuerst.github.io/dw1/training/

## Usage

1. Navigate to the [Digimon World 1 Training Calculator](https://fliegenfuerst.github.io/dw1/training/)
2. The optimizer table appears at the top of the page
3. Enter your **Current** stats and **Goal** stats
4. Click **Calculate**
5. The **# Trainings** column shows how many sessions of each training type you need

### Example

To reach 1000 HP from 0:

- Current HP: `0`, Goal HP: `1000`
- Click Calculate
- Result: 13 HP training sessions (1000 ÷ 80 = 12.5, rounded up)

### How it works

The optimizer uses **linear programming** to minimize the total number of training sessions while meeting your stat goals. It reads the page's own training table to account for:

- Primary stat gains (e.g. HP training gives 80 HP)
- Secondary stat gains (e.g. HP training also gives 2 OFF)
- The most efficient combination of training types when multiple stats are needed

### Input validation

- HP and MP: maximum 9999
- OFF, DEF, SPD, BRN: maximum 999
- Values exceeding limits are clamped automatically
- Only positive stat increases are considered (current > goal is treated as 0 training needed)

## Configuration

Edit `meta.json` to configure the userscript metadata:

- **name** — display name shown in your userscript manager
- **version** — managed automatically by the Release workflow
- **match** — URL patterns where the script runs
- **require** — the `javascript-lp-solver` library, loaded as a page `<script>` and exposed as `window.solver`
- **grant** — GM APIs the script uses (currently `none`)

## Development

```bash
npm install           # Install dependencies
npm run dev            # Watch mode with inline sourcemaps
npm run build           # Production build -> dist/userscript.user.js
npm run type-check       # TypeScript type checking
npm test               # Run tests (coverage gate: 80%)
npm run validate         # All checks (run before pushing)
npm run lint            # Lint src and test files
```

See [docs/DEVELOPING.md](docs/DEVELOPING.md) for the full day-to-day workflow.

## Documentation

This project is built on the [TypeScript Userscript Template](https://github.com/matthiasseghers/typescript-userscript-template) and ships with its guides under `docs/`:

- [docs/DEVELOPING.md](docs/DEVELOPING.md) — writing and building the userscript
- [docs/CI-CD.md](docs/CI-CD.md) — workflows, releases, and recovery
- [docs/UPDATING.md](docs/UPDATING.md) — adopting template updates
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) — common problems and fixes

## Project structure

```
src/
  index.ts            # Entry point — wires up the table, listeners, and observer
  constants.ts         # Stat names/limits, element IDs, inlined loading sprite
  state.ts             # Current/goal stats and last optimization result
  dom-utils.ts          # Thin querySelector helpers
  training-parser.ts      # Reads the page's own training table
  optimizer.ts          # Builds and solves the LP model (javascript-lp-solver)
  ui-renderer.ts         # Builds the optimizer table and loading overlay
  event-handlers.ts       # Input + button wiring, orchestrates a calculation
  observers.ts          # MutationObserver that re-triggers calculation
  utils.ts             # log / parseNumber / debounce / waitForElement
  types/              # Stats, solver, and asset-import types
  assets/loading.gif       # Inlined to base64 at build time (@rollup/plugin-image)
```

## Checking GM API grants

Run `npm run check-grants` after adding any new `GM_*`/`GM.*` API call. It scans the source files and warns if a grant is missing from `meta.json`, or if a declared grant is unused.

## CI/CD & releases

1. Go to **Actions → Release** and select a bump type: patch, minor, or major (or `none` to re-release the latest tag)
2. The workflow bumps `meta.json`, commits, pushes the `v*` tag, builds the userscript, and creates a GitHub Release with the artifact attached

Prefer the terminal? Bump `meta.json` yourself, commit, and push a matching `v*` tag — the workflow validates it and publishes. A tag whose version doesn't match `meta.json` fails the release.

## Acknowledgments

- Built on the [TypeScript Userscript Template](https://github.com/matthiasseghers/typescript-userscript-template)
- Uses [javascript-lp-solver](https://github.com/JWally/jsLPSolver) for linear programming
- Training data from the [Digimon World 1 Training Calculator](https://fliegenfuerst.github.io/dw1/training/)

## License

MIT
