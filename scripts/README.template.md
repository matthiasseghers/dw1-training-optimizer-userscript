# {{name}}

{{description}}

## Installation

Install from [GitHub Releases](https://github.com/{{userRepo}}/releases/latest):

```
https://github.com/{{userRepo}}/releases/latest/download/userscript.user.js
```

## Configuration

Edit `meta.json` to configure your userscript metadata before your first release:

- **name** — display name shown in your userscript manager
- **version** — managed automatically by the Release workflow
- **match** — URL patterns where the script runs (e.g. `https://example.com/*`)
- **grant** — GM APIs your script uses (e.g. `GM_setValue`, `GM_xmlhttpRequest`)

## Development

```bash
npm run dev          # Watch mode with sourcemaps
npm run build        # Production build
npm run type-check   # TypeScript type checking
npm test             # Run tests (CI enforces 80% coverage)
npm run validate     # All checks (run before pushing)
npm run lint         # Lint src and test files
```

## Documentation

This project ships with guides under `docs/`:

- [docs/DEVELOPING.md](docs/DEVELOPING.md) — writing and building your userscript
- [docs/CI-CD.md](docs/CI-CD.md) — workflows, releases, and recovery
- [docs/UPDATING.md](docs/UPDATING.md) — adopting template updates
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) — common problems and fixes

## Checking GM API Grants

Run `npm run check-grants` after adding any new `GM_*` or `GM.*` API calls. It scans your source files and warns if a grant is missing from `meta.json`, or if a declared grant is unused.

## CI/CD & Releases

1. Go to **Actions → Release** and select a bump type: patch, minor, or major (or `none` to re-release the latest tag)
2. The workflow bumps `meta.json`, commits, pushes the `v*` tag, builds the userscript, and creates a GitHub Release with the artifact attached

Prefer the terminal? Bump `meta.json` yourself, commit, and push a matching `v*` tag — the workflow validates it and publishes. A tag whose version does not match `meta.json` fails the release.

Your version starts at `0.1.0`. If you kept the `templateProvenance` record during setup, `package.json` notes which template version this project started from — see the template repository's README for how to adopt template updates.

## License

MIT