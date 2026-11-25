# Contributing

Issues and pull requests are welcome.

## Making a change

1. Fork, then create a branch.
2. Edit `src/`. Never edit `dist/` by hand:
   - `src/css/10-glass.css`: the theme. Keep `00-elegantfin-base.css`
     verbatim; override it in the glass layer instead.
   - `src/js/theme.js`: the companion script. Plain ES5-style JavaScript, no dependencies.
3. Build and test:
   ```sh
   npm ci
   npm run build
   npx playwright install chromium   # once
   npm test
   npm run demo                      # look at it: http://127.0.0.1:8099/
   ```
4. Test on a real Jellyfin server as well. The demo copies Jellyfin's markup but isn't Jellyfin.
5. Commit `src/` and `dist/` together. CI fails if `dist/` doesn't match `src/`.
6. Add a line under **Unreleased** in `CHANGELOG.md`, then open a pull request.

Rules for `theme.js`:
- No `innerHTML`, `insertAdjacentHTML`, `eval` or `new Function`. Build elements and set `textContent`.
- Don't add requests to any host other than the Jellyfin server.
- Guard against Jellyfin re-rendering the page: everything must be idempotent.

## Releasing (maintainers)

1. Move the **Unreleased** notes in `CHANGELOG.md` under a new version heading.
2. Bump the version and rebuild, so the banner in `dist/` shows it:
   ```sh
   npm version 1.1.0 --no-git-tag-version
   npm run build
   git commit -am "Release v1.1.0"
   git tag v1.1.0
   git push && git push --tags
   ```
3. The **Release** workflow tests the tag, builds the assets, checksums and
   attests them, publishes the GitHub release and refreshes jsDelivr's `@latest`.

## Recommended repository settings

- **Branches:** protect `main`. Require a pull request with 1 approval,
  require the `test` and `analyze` checks, and block force pushes.
- **Security:** turn on private vulnerability reporting, Dependabot alerts and
  secret scanning.
- **Actions:** set the default workflow token to read-only.
