# Release Checklist

1. Update version in package.json and src/runtime.ts.
2. Run pnpm install to refresh the lockfile if dependencies changed.
3. pnpm check
4. pnpm test
5. pnpm build
6. pnpm build:bun
7. tar -C dist-bun -czf dist-bun/mcporter-macos-arm64-v<version>.tar.gz mcporter
8. shasum -a 256 dist-bun/mcporter-macos-arm64-v<version>.tar.gz
9. npm pack --dry-run to inspect the npm tarball.
10. Verify git status is clean.
11. git commit && git push.
12. pnpm publish --tag latest
13. Create a GitHub release, upload mcporter-macos-arm64-v<version>.tar.gz (with the SHA from step 8), and record the release URL.
14. Tag the release (git tag v<version> && git push --tags).
15. Update `steipete/homebrew-tap` → `Formula/mcporter.rb` with the new version, tarball URL, and SHA256; adjust tap README highlights if needed.
16. Commit and push the tap update.
17. Verify the Homebrew flow (after GitHub release assets propagate):
    ```bash
    brew update
    brew install steipete/tap/mcporter
    mcporter list --help
    ```
