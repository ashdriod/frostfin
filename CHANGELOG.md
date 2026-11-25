# Changelog

All notable changes are listed here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed
- The demo and screenshots now use the Blender Foundation's open movies (CC BY) instead of generated artwork.

## [1.0.0] - 2026-11-24

### Added
- Glass layer on top of ElegantFin: glass tab bar, floating sidebar, focus
  lift, capsule buttons, glass menus and player controls, TV and mobile layouts,
  and accessibility preferences.
- Home: large Continue Watching tiles with a gradient, the title on the art and
  an always-visible play button. The "My Media" row is hidden (option to show it).
- `theme.js` companion script:
  - Featured hero with logo, metadata, summary and Resume / Favorite / Info buttons.
  - Ambient backdrop that follows the hovered or focused card.
  - Sharp Continue Watching artwork with title logos.
  - "See All" links that open the full library.
- Demo with a fictional library, browser smoke test, CI, CodeQL and attested releases.
- Verified on Jellyfin Server 12.4.0.
