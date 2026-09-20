# Portfolio Release Workflow

This repository uses a workbench-first release flow to avoid unnecessary Vercel deployments.

## Branches

- `main` is the production branch.
- `workbench-*` branches are for active design, content, animation, security, and performance changes.
- Vercel Git deployments are disabled for `workbench-*` branches in `vercel.json`.

## Working rule

1. Create or reuse a `workbench-*` branch.
2. Commit as many changes as needed there.
3. Review source, responsive behavior, accessibility, security, and performance before release.
4. Merge the finished batch into `main` only when it is ready for production.
5. The merge to `main` is the deployment event.

## Current workbench

`workbench-ui-polish`

This branch is the staging area for the current responsive UI, animation, morphing, and rendering improvements.

## Release checklist

- No secrets, tokens, credentials, or private repository URLs exposed.
- Mobile and desktop breakpoints reviewed.
- Reduced-motion behavior remains supported.
- Continuous animations are paused or simplified when they are not useful.
- No unnecessary Vercel preview deployment has been triggered.
- Merge to `main` only after final review.
