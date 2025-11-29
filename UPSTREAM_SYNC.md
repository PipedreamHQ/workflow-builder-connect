# Tracking Upstream workflow-builder-template Changes

This project is forked from
[vercel-labs/workflow-builder-template](https://github.com/vercel-labs/workflow-builder-template).
Upstream ships frequent fixes, so keep a clean workflow for merging those
updates while preserving our Pipedream integration.

## 1. Add the Upstream Remote

```bash
git remote add upstream https://github.com/vercel-labs/workflow-builder-template.git
git fetch upstream
```

> Run `git remote -v` to confirm it’s configured once.

## 2. Maintain an `upstream-sync` Branch

```bash
git checkout main
git fetch upstream
git checkout -B upstream-sync upstream/main
```

This branch should mirror upstream and remain clean (no local edits).

## 3. Bring Updates Into `main`

When upstream releases changes:

```bash
git fetch upstream
git checkout upstream-sync
git reset --hard upstream/main

git checkout main
git pull origin main            # ensure local main is current
git merge upstream-sync         # or `git rebase upstream-sync`
```

Resolve conflicts, run `pnpm install` if dependencies changed, then:

```bash
pnpm type-check
pnpm lint
```

## 4. Watch Pipedream-Specific Touch Points

Conflicts usually appear in:

- `components/pipedream/**`
- `lib/pipedream/**`
- `lib/steps/pipedream-action.ts`
- `lib/workflow-executor.workflow.ts`
- `app/globals.css`

Keep `lib/codegen-templates/pipedream-action.ts` aligned with
`lib/steps/pipedream-action.ts` whenever upstream tweaks code generation.

## 5. Document Divergences

If we intentionally diverge from upstream (e.g., to support Connect React),
note it in `pipedream-readme.md` or an issue so future merges
understand the rationale.

Following this playbook lets us stay close to upstream while layering on
Pipedream-specific functionality safely.
