# Maestro Deck — Reportly plugin

Turns the last Run or Run All in [Maestro Deck](https://github.com/BlueShork/maestro-deck)
into a branded status card: copy it and paste it into Teams, Slack or an email,
or save it as a PNG. Needs Maestro Deck 1.3.0 or later.

## Development

```bash
pnpm install
pnpm test
pnpm dev      # vite build --watch into dist/
```

In a development build of Maestro Deck, open **Plugins → Load local plugin** and
pick `dist/`. Reopen the panel after each rebuild.

## Release

1. Bump `version` in `public/manifest.json` and `package.json`, then commit.
2. Tag and push: `git tag vX.Y.Z && git push origin vX.Y.Z`.
3. The `release` workflow tests, builds and publishes `plugin.zip`, and prints its sha256 in the release notes.
4. Add or update the entry in [`BlueShork/maestro-deck-plugins`](https://github.com/BlueShork/maestro-deck-plugins) `registry.json` (`version`, `url`, `sha256`).
