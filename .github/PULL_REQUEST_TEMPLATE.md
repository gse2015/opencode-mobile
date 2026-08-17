## Related issue

- closes # (if this PR fixes an issue)
- links # (if this PR is part of a larger effort)

## Summary of changes

What this PR changes and why. A few sentences is enough; for large changes, link the issue or discussion that describes the design.

## UI changes

If this PR changes the UI, attach screenshots of before and after in this description. PRs that touch the UI without screenshots will be asked for them during review.

- [ ] UI unchanged (safe to skip screenshots), or screenshots added below:

## Testing

What you ran and the results. Expected before merge:

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] CUA smoke test passes if the change touches UI, connectivity, or chat (see `scripts/android-cua-smoke.py` and `.github/workflows/cua-smoke.yml`)

Note anything you could not test, e.g. hardware-dependent paths (biometric auth, secure store) or a platform you do not have access to.

## New dependencies

This project reviews new dependencies carefully. If this PR adds or bumps npm packages, list each one and explain:

1. Why it is needed
2. Which alternatives you ruled out
3. Rough bundle size impact, if known

Prefer built-in APIs and small, well-maintained packages. If no dependencies are added, write "none".
