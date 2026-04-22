# Reporter Features

Checklist for authors building a Flakiness Report generator, and for users
assessing how complete an existing reporter is. Each row names a capability;
the clarification describes what "supported" means in practice.

1. **Report metadata** — `commitId`, `flakinessProject`, CI run URL, config path, run start time, run duration.
2. **Environment metadata** — environment `name` and OS name/version/arch on each environment.
3. **Multiple environments** — emits multiple entries in `environments[]` when the runner supports multiple projects (like ViTest or Playwright), and attributes each attempt via `environmentIdx`.
4. **Custom environments** (`FK_ENV_*`) — parses `FK_ENV_*` environment variables into `environment.metadata`.
5. **Test hierarchy / suites** — supports all suite types (`file` / `suite` / `anonymous suite`) and properly encodes nesting.
6. **Per-attempt reporting (retries)** — each retry emits its own `RunAttempt` with its own status, duration, and errors (rather than collapsing retries into a single attempt).
7. **Per-attempt timeout** — `RunAttempt.timeout` populated from the runner's effective timeout for the test.
8. **Test steps** — constructs steps at the run-attempt level, including nested sub-steps.
9. **Expected status** (`expectedStatus`) — supports tests marked as expected-to-fail.
10. **Attachments** — emits file and binary (`buffer`) attachments referenced by ID, with actual content stored under `attachments/<id>`.
11. **Step-level attachments** — attributes attachments to the specific step that produced them, not just to the attempt.
12. **Timed StdIO** — `TimedSTDIOEntry` with `dts` deltas; supports both text and binary (`buffer`) entries.
13. **Annotations** — emits `skip` / `fixme` / `fail` / `slow` / `owner`, plus custom annotation types, with descriptions and optional source location.
14. **Tags** — extracts test tags from the runner's native tagging mechanism.
15. **`parallelIndex`** — identifies which parallel worker executed each attempt.
16. **`FLAKINESS_TITLE`** — honors the env var as the report title when no explicit title is provided.
17. **`FLAKINESS_OUTPUT_DIR`** - report output directory
18. **Sources** — populates top-level `sources[]` with embedded code covering all `Location` references in the report.
19. **Error snippets** — `ReportError.snippet` with ANSI-highlighted excerpts where the runner produces them.
20. **Errors support** — multiple errors per attempt (soft assertions); proper Error objects with `message`/`stack`, plus thrown values (`value`) for non-Error throws; error locations parsed from stacks.
21. **Unattributed errors** — report-level `unattributedErrors` for infrastructure/setup failures that don't belong to a specific test.
22. **Source locations** — populated on tests, suites, steps, errors, and annotations.
23. **Auto-upload** — Github OIDC (via `flakinessProject`) and
    `FLAKINESS_ACCESS_TOKEN` for uploading the report to Flakiness.io after the
    run. Respects `FLAKINESS_DISABLE_UPLOAD` env variable to disable
    auto-upload behavior.
24. **CPU / RAM telemetry** — samples `cpuAvg`, `cpuMax`, `ram` as time series during the run. Also provides `cpuCount` and `ramBytes`.

# Implementation Notes

1. All locations must be relative to the git-root, POSIX-style.
