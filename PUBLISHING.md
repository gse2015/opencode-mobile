# Releasing (fork — direct-APK only)

This fork publishes to **no app store** (Play Store, F-Droid, App Store — all
removed) and has **no in-app update check**. The release channel is a signed
direct-install APK published as a GitHub Release on this repo when a `v*` tag
is pushed.

## CI signing

Every CI build signs with the fork-owned keystore, stored **only** as GitHub
secrets on `gse2015/opencode-mobile`:

| Secret | Meaning |
|--------|---------|
| `KEYSTORE_BASE64` | base64 of the PKCS12 keystore |
| `KEYSTORE_PASSWORD` | keystore password |
| `KEY_ALIAS` | key alias (`upload`) |
| `KEY_PASSWORD` | key password (identical to store password) |

Fingerprint: `AEDF585CBB9DD9B95FDE8E7F6A1E5A041CC195969A98369AB711F9A95BD8E4F0`
(SHA-256). An APK can be updated in place over a previously installed APK
only if both carry this signature.

## Runbook

1. Bump the version in four fields, all in one commit:
   - `package.json` → `version`
   - `app.json` → `expo.version` **and** `expo.android.versionCode` (+1)
   - `android/app/build.gradle` → `versionName` **and** `versionCode`
   `versionCode` must strictly increase — Android only offers the in-place
   update when the new code is higher than the installed one.
2. Add `distribution/changelogs/<new versionCode>.txt`; the first line must
   start with `v<version>` (enforced).
3. Update the "current version" lines in `README.md`.
4. `npm run check:versions` → must print
   `Version metadata aligned: <version> (<code>)`.
5. Merge to `main` — squash the working branch so `main` history stays a
   clean sequence of fix/cleanup/chore commits.
6. Tag + push: `git tag -a vX.Y.Z -m "vX.Y.Z" && git push origin vX.Y.Z`.
7. `build.yml` runs: version-parity / lint / typecheck / unit-test gate →
   signed APK → **GitHub Release with `app-release.apk`**. Verify the run is
   green and the release exists.
8. Install `app-release.apk` on a device (in-place update, no uninstall) and
   confirm the version in Settings.

## CUA smoke test (quality gate, manual)

`scripts/android-cua-smoke.py` drives an emulator through a vision LLM.
Workflow `.github/workflows/cua-smoke.yml` is **workflow_dispatch only** in
this fork because the repo does not hold the required
`AZURE_OPENAI_API_KEY` / `AZURE_OPENAI_ENDPOINT` secrets — an automatic run
would fail on the first LLM call. Until those secrets are added to the repo,
run the script manually from a machine that has the Azure OpenAI
credentials.
