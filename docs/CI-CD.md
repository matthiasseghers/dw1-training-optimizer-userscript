# Workflows and releases

How the template's GitHub Actions workflows fit together, how to cut a release, and how to recover when a release goes wrong.

## The three workflows

**`.github/workflows/ci.yml`** - Continuous Integration:
- Runs on every push and pull request
- **Dependency audit** (fails on high/critical vulnerabilities)
- Linting, formatting, type checking (TypeScript + scripts)
- **Runs test suite to catch bugs**
- Grant validation and markdown link checks (advisory — link failures never block the build)
- **Coverage thresholds enforced** — `npm run test:coverage` must meet 80% minimums
- **Post-setup job** — runs the real setup wizard and asserts the post-setup state
- Builds the project to ensure everything works
- Ensures code quality and catches issues early

**`.github/workflows/security.yml`** - Security Scanning:
- Runs on push/PR and weekly schedule
- **CodeQL analysis** for JavaScript/TypeScript security vulnerabilities (public repositories only — private forks will see this job skipped)
- **Semgrep scanning** for XSS and JavaScript-specific security issues
- Reports findings to GitHub Security tab

**`.github/workflows/release.yml`** - Release:
- **Triggered automatically** when a `v*` tag is pushed
- Can also be triggered manually from the Actions UI: choose a bump type (patch/minor/major) to bump `meta.json`, tag, build, and publish in one run — or `none` to re-release the latest tag (retry after a failed release)

## How it fits together

```
Release (manual, bump: patch/minor/major) → bumps meta.json → tags vX.Y.Z → builds → publishes
Release (manual, bump: none) → re-releases the latest tag
Release (automatic) → any v* tag push validates and publishes
```

> **Warning:** Manually pushed tags must match `meta.json`'s version or the release fails with both versions printed.

## Creating a Release

1. Go to **Actions** tab in your GitHub repository
2. Select the **Release** workflow
3. Click **Run workflow**
4. Choose the bump type:
   - **patch**: 0.1.0 → 0.1.1 (bug fixes)
   - **minor**: 0.1.0 → 0.2.0 (new features)
   - **major**: 0.1.0 → 1.0.0 (breaking changes)
   - **none**: re-release the latest tag
5. Click **Run workflow**

This automatically:
- Validates your `repository.url` points at this repository
- Bumps `meta.json`, commits, and pushes the `v*` tag (unless bump is `none`)
- Builds the userscript and creates the GitHub Release with the artifact attached

## Alternative release paths

**From the CLI** (same as the UI path):

```bash
gh workflow run release.yml -f bump=patch
```

**By pushing a tag manually** — bump `meta.json`, commit, tag, push; the workflow validates the tag against `meta.json` and publishes:

```bash
node scripts/update-meta-version.js 0.1.1
git add meta.json && git commit -m "chore: bump version to v0.1.1"
git tag v0.1.1
git push origin main v0.1.1
```

A tag whose version does not match `meta.json` fails the release with both versions printed. There is no local publish command by design: releases are always built in CI from a tagged state, so every release is reproducible.

Users can then install directly from the release:
```
https://github.com/user/repo/releases/latest/download/userscript.user.js
```

## Re-releasing or recovering a failed release

If the release step failed after the bump (e.g. a flaky runner or build error), the tag is already in place — you don't need to bump again. Re-run **Actions → Release → Run workflow** with bump type `none` to re-release the existing tag.

## Removing CI/CD

Simply delete the `.github/workflows/` folder if you don't need it.