# CLAUDE.md

## Package manager

**This is a PNPM repo. ALWAYS use `pnpm`, NEVER `npm`.**

- `pnpm install` — install deps
- `pnpm run build` — build (via `kubik` → emits `lib/` JS + `types/` d.ts)
- `pnpm run watch` — rebuild on change
- `pnpm version minor` / `pnpm version preminor --preid=alpha` — bump version for release

Do not run `npm install`, `npm run ...`, or commit an `package-lock.json`. The lockfile is `pnpm-lock.yaml`.

## What this repo is

`@flakiness/flakiness-report` is the **specification** for the Flakiness.io report format. The TypeScript types and Zod schema in `src/` ARE the spec — changes here are spec changes, not just code changes.

- `src/flakinessReport.ts` — `FlakinessReport` namespace: all report types with inline JSDoc that serves as the human-readable spec.
- `src/schema.ts` — `Schema` namespace: Zod v4 runtime validators that mirror the types.
- `src/index.ts` — re-exports both namespaces.
- `README.md` — user-facing spec document (keep in sync with type-level changes when relevant).

## Rules when editing the spec

- **Types and Zod schema must stay in sync.** Any field added/removed/renamed in `flakinessReport.ts` needs the matching change in `schema.ts`, and vice versa.
- **Do not remove deprecated fields.** Mark with `@deprecated` JSDoc and keep them — old reports in the wild still use them.
- **Prefer additive changes.** New fields should be `optional` on both the type and the schema. Breaking changes need an explicit version bump discussion.
- **Branded primitives** (`CommitId`, `AttachmentId`, `UnixTimestampMS`, `DurationMS`, `GitFilePath`, `Number1Based`, `Stream`) are declared via the `Brand<T, ...>` helper — reuse them rather than using raw `string`/`number`.
- **Peer dep:** `zod ^4.1.12`. Import from `zod/v4` in `schema.ts`.

## Build output

`lib/` and `types/` are generated — don't hand-edit them. Re-run `pnpm run build` after changing `src/`.
