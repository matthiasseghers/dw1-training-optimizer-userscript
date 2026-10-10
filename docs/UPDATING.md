# Adopting template updates

How to pull improvements from the template repository into a project you created from it.

## Updates are optional

This template is a **starting point** - most users heavily customize it. Updates are **optional** and typically only needed if you want new features from the template. A fork is a frozen snapshot: it never breaks when the template changes.

## What changed upstream?

Your `package.json` records the template version you started from (unless you declined during setup):

```bash
npm pkg get templateProvenance
```

Then check the [template repository](https://github.com/matthiasseghers/typescript-userscript-template) for releases newer than that version — the release notes describe what changed.

## Adopting updates

```bash
git remote add template https://github.com/matthiasseghers/typescript-userscript-template.git
git fetch template
git checkout template/main -- .github/workflows rollup.config.js eslint.config.js tsconfig.json vitest.config.ts scripts/
```

This pulls whole files, which is safe when you never customized them. For a single fix, use `git cherry-pick <commit-sha>` instead.

> **Note:** GitHub's **Sync fork** button only exists on true forks. Repos created via **Use this template** are independent repositories, so the git remote recipe above is the reliable update path.

| Template-owned (safe to pull wholesale) | Yours (never touched by updates) |
|---|---|
| `.github/workflows/`, `scripts/`, `rollup.config.js`, `eslint.config.js`, `tsconfig.json`, `vitest.config.ts`, `.prettierrc`, `.jscpd.json` | `src/`, `tests/`, `meta.json`, `README.md`, `package.json` identity fields |

### Starting fresh instead

When an in-place update isn't enough — major template jumps, a fork history you'd rather not carry — start over from the latest template and move only what's yours:

1. Create a new repository from the latest template (**Use this template**) and run `npm run setup`.
2. Copy from your old repository:
   - `src/` — your userscript code
   - `tests/` — your own tests (skip the template's example tests if your `src/` no longer matches them)
   - `meta.json` identity fields — `name`, `match`, `grant`, `connect`, `run-at`
   - `package.json` identity — `name`, `description`, `author`, `repository.url`, plus any runtime dependencies you added
3. **Restore your version train**: setup resets `meta.json` to `0.1.0`, but an existing userscript with installed users must not ship a lower version — Tampermonkey refuses downgrades and your users would stop receiving updates. Set `meta.json`'s `version` to your last released version (or one patch above) before your first release from the new repository.
4. Rename the old repository (e.g. append `-old`) instead of deleting it — the rename preserves your users' install/update URLs via GitHub's redirect and keeps the old history, tags, and issues as an archive.
5. Push, let CI go green, then release with the Release workflow (`bump=patch` continues your version train).

Choose this over the in-place recipe when the template has moved far ahead or the old history is noise; choose the in-place recipe for routine updates.

## Maintaining multiple scripts from this template

As your collection of userscripts grows, escalate in stages — each stage has a trigger, so don't build ahead of the triggers:

1. **Git-native sync** (always available) — the remote recipe above, per repository
2. **Reusable workflows in a separate central repo** — when you maintain 3+ actively developed scripts and have manually replicated the same CI change more than once; keep the template self-contained for adopters
3. **Shared utils as an npm package** — when real shared runtime code emerges across scripts
4. **Config presets / scaffold CLI** — when config churn or onboarding repetition justifies it

## Dependency updates

Dependency updates are handled by Dependabot (configured in `.github/dependabot.yml`): weekly minor/patch and security updates for npm and GitHub Actions, grouped into batched PRs. Semver-major updates are not ignored: they arrive as individual reviewable Dependabot PRs (the vitest family arrives grouped in one PR so the coverage provider stays in lockstep). Closing a major PR with `@dependabot ignore this major version` suppresses it until the next major — the PR queue is the dashboard.