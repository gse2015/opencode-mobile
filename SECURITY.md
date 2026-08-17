# Security Policy

## Reporting a vulnerability

If you believe you have found a security vulnerability in OpenCode Mobile, **do not file a public issue or pull request**. Public issues and PRs are visible to everyone and are the wrong channel for security reports.

Please report directly to:

**[support@agentlabs.cc](mailto:support@agentlabs.cc)**

Email is the preferred and most reliable path to a maintainer.

## What to include

To help us triage the report quickly, please provide:

- **App version** (visible in the app's Settings screen)
- **opencode server version** (output of `opencode --version` on the machine running the server)
- **OS and version** (e.g. Android 14, iOS 17.4)
- **Steps to reproduce**, or a clear description of the vulnerable behavior
- Relevant logs, screenshots, or a minimal proof of concept, if you have them

Do not include real credentials, API keys, or tokens in your report. If a proof of concept requires them, use dummy values.

## How we handle reports

- We will confirm receipt of your report **within 24 hours**.
- We will follow up with an **initial assessment within 5 days**, including whether we consider it a security issue and our plan for a fix or mitigation.
- We will keep you informed as we work on a fix. We will credit you in the release notes or advisory unless you ask us not to.

## Private vulnerability reports

We track and coordinate vulnerability reports using **GitHub private security advisories**. If the repo has private vulnerability reporting enabled (Security tab in the repo), you may file the report there instead of emailing; the same response commitments apply. When in doubt, email is the safest path.

## Scope

This policy covers the mobile client in this repository (Android, React Native / Expo). Vulnerabilities in the opencode server itself should be reported upstream to the [opencode project](https://github.com/sst/opencode).

## Supported releases

We backport verified fixes to the latest release on each live channel (Google Play, F-Droid, direct APK). We do not commit to supporting older releases after a new one ships.
