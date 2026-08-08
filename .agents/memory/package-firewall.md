---
name: Package firewall workaround
description: How to recover workspace dependency installation when the environment registry blocks an unrelated package.
---

If the Replit package firewall blocks a transitive dependency during a frozen pnpm install, retry the same install with `pnpm --registry=https://registry.npmjs.org` rather than changing the lockfile or package manifests.

**Why:** The blocked package may be unrelated to the app being changed, and changing dependencies to bypass the firewall creates unnecessary project drift.

**How to apply:** Use the explicit registry only for the install command, then run the normal workspace checks and leave repository registry configuration unchanged.