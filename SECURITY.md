# Security policy

## Supported versions

Only the latest release gets fixes.

## Reporting a vulnerability

Please **don't open a public issue**. Use GitHub's private reporting instead:
**Security → Report a vulnerability** on this repository
(`/security/advisories/new`).

Include the theme version, Jellyfin version, browser, and steps to reproduce.
You should get a reply within 7 days.

## Scope

In scope:
- `theme.js` running in the user's browser. For example: server-provided text
  being run as HTML or script, requests to hosts other than the Jellyfin server,
  or actions taken without the user clicking.
- CSS that loads resources from hosts not listed in the README's "Privacy and security" section.
- The build and release pipeline (`.github/workflows`).

Out of scope: bugs in Jellyfin, the JavaScript Injector plugin, or ElegantFin
upstream. Report those to their projects.

## What the project does

- `theme.js` only calls the Jellyfin web client's own `ApiClient`. It sets
  text with `textContent` and uses no `innerHTML` or `eval`. It escapes ids and
  tags before using them in selectors, URLs and CSS.
- The CI smoke test feeds the script hostile item names and ids, and fails if
  the page contacts any host other than the server and the documented font hosts.
- Workflows pin third-party actions to full commit SHAs and run with read-only
  tokens by default. Dependabot keeps actions and dev dependencies up to date.
  CodeQL scans the JavaScript and the workflows.
- Release assets are built in CI from the tagged commit, checksummed
  (`SHA256SUMS.txt`) and attested. Check one with:
  `gh attestation verify <file> --repo <owner>/frostfin`
