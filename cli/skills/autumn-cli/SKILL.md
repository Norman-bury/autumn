---
name: autumn-cli
description: Use this skill whenever the user wants to operate Autumn through the CLI, inspect or change applications, job leads, rounds, profile, settings, analytics, import/export, or admin data, or automate Autumn from an agent. Prefer this skill even for general Autumn operational requests if the work should happen through the `autumn` command instead of the browser UI.
---

# Autumn CLI

Use the Autumn CLI as the primary interface to Autumn's server-backed product surface.

The CLI covers the full server-backed Autumn surface:

- `auth`
- `applications`
- `job-leads`
- `dashboard`
- `analytics`
- `statuses`
- `round-types`
- `rounds`
- `profile`
- `preferences`
- `user-settings`
- `export`
- `import`
- `admin`

The CLI covers server-backed data/actions from the product. It does not reproduce browser-rendered presentation or browser-only behavior such as charts, modals, page navigation, extension popups, or DOM automation.

## Preflight

1. Check the CLI version:
   - `autumn --version`
2. Check auth state:
   - `autumn --json auth status`
   - if not authenticated, create/rotate a key in the Autumn web app, then run:
     - `autumn auth init --api-key '...'`
     - `autumn --json auth doctor`
3. If the target environment is ambiguous, prefer explicit targeting:
   - `--profile`
   - `--base-url`

## Operating Defaults

- prefer `--json` for agent use.
- prefer explicit `--profile` when more than one Autumn environment may exist.
- Prefer explicit `--base-url` when operating against a one-off instance.
- Prefer structured `--body-file` JSON for writes instead of constructing many ad hoc flags.
- Add `--yes` for destructive commands.
- Use only when you need privileged access.
  This applies to `autumn admin ...`.

## Core Workflows

### Read Data

Use read commands with `--json` whenever the output will be consumed by an agent.

Common starting points:

- Applications:
  - `autumn --json applications list`
  - `autumn --json statuses list`
  - use `autumn --json statuses list` before filtering applications by `status_id`
  - `autumn --json applications get <application-id>`
- Job leads:
  - `autumn --json job-leads list`
  - `autumn --json job-leads get <job-lead-id>`
- Dashboard and analytics:
  - `autumn --json dashboard summary`
  - `autumn --json analytics kpis --period 30d`
  - `autumn --json analytics weekly --period 30d`
  - `autumn --json analytics sankey`
- Profile and settings:
  - `autumn --json auth whoami`
  - `autumn --json auth doctor`
  - `autumn --json profile get`
  - `autumn --json dashboard summary`
  - `autumn --json user-settings get`
  - `autumn --json preferences get`

If you need exact flags for a command group, use:

- `autumn <command> --help`

### Write Data

For create and update flows, prefer checked-in or generated JSON body files.

Examples:

- Create an application:
  - `autumn applications create --body-file create-application.json`
- Extract and create an application from source text or URL:
  - `autumn applications extract --body-file extract-application.json`
- Create a job lead:
  - `autumn job-leads create --body-file create-job-lead.json`
- Convert a lead into an application:
  - `autumn job-leads convert <job-lead-id>`
- Update a profile:
  - `autumn profile update --body-file profile-update.json`

When changing data, keep commands explicit and avoid relying on interactive behavior.

### Destructive Actions

Destructive commands require deliberate confirmation.

Examples:

- `autumn applications delete <application-id> --yes`
- `autumn job-leads delete <job-lead-id> --yes`
- `autumn admin users delete <user-id> --yes`

Do not omit `--yes` in automated flows.

### Admin Surface

Treat `admin` as privileged.

Use it only when the task genuinely requires administrative access.

Common admin reads:

- `autumn --json admin stats`
- `autumn --json admin users list`
- `autumn --json admin applications list`
- `autumn --json admin ai-settings get`

Common admin writes:

- `autumn admin users create --body-file admin-user.json`
- `autumn admin users update <user-id> --body-file admin-user-update.json`
- `autumn admin ai-settings update --body-file ai-settings.json`

## Additional Surfaces

The CLI also covers:

- `rounds`
- `round-types`
- application CV / cover-letter flows
- transcript and media upload/download flows
- `export`
- `import`
- API key management via `autumn auth api-key ...`

Useful operator recipes:

- Signed application document URLs:
  - `autumn applications cv url <application-id>`
  - `autumn applications cover-letter url <application-id>`
- Round transcript and media flows:
  - `autumn rounds transcript upload <round-id> --file-path transcript.txt`
  - `autumn rounds media upload <round-id> --file-path interview.wav`
  - `autumn rounds transcript url <round-id>`
  - `autumn rounds media url <round-id>`
- Import safety:
  - `autumn import validate <export-file>`
  - `autumn import run <export-file> --wait`

Use command-group help for exact syntax:

- `autumn rounds --help`
- `autumn export --help`
- `autumn import --help`

## Safety Rules

- Prefer read commands first when you need to inspect state before mutating it.
- Prefer `--json` whenever a downstream agent or tool will parse the output.
- Prefer explicit environment targeting with `--profile` or `--base-url` rather than assuming the default target.
- Do not use `admin` unless the task requires privileged operations.
- Do not describe the CLI as reproducing browser UI behavior; it exposes server-backed data/actions, not browser-rendered presentation.
