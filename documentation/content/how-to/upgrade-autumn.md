---
title: Upgrade Autumn
description: Upgrade Autumn safely for Docker Compose and Helm deployments.
---

Use this guide when you want to move a running Autumn deployment to a newer version.

## Before you begin

Before upgrading:

1. Read the target release notes.
2. Take a backup first.
3. Make sure you know which deployment mode you are running.

Start with [Back up and restore Autumn](./backup-and-restore-autumn.md).

## Upgrade a Docker Compose install

### If you follow the default `latest` tag flow

Pull the newest image and recreate the stack:

```bash
docker compose pull
docker compose up -d
```

### If you pin a specific Autumn image tag

Update `AUTUMN_IMAGE` in your `.env` file or shell environment, then pull and recreate the stack.

Example:

```env
AUTUMN_IMAGE=ghcr.io/Norman-bury/autumn:0.1.7
```

Then run:

```bash
docker compose pull
docker compose up -d
```

## Upgrade a Helm install

If you manage Autumn with Helm, run:

```bash
helm upgrade autumn oci://ghcr.io/Norman-bury/charts/autumn \
  --namespace autumn \
  --values values-production.yaml
```

If you pin chart versions explicitly, include `--version` with the target chart version.

## What Autumn does during upgrade

For Helm installs, the chart runs database migrations through an init container before the Autumn app starts.

For Compose-based installs, Autumn still applies its normal startup flow after the new container comes up.

## Verify after upgrade

Check that Autumn is healthy:

```bash
curl http://localhost:5577/health
```

Then confirm:

- the app loads in the browser
- you can sign in
- existing applications and files are still present

## If the upgrade goes badly

Use the backup you took before upgrading and restore Autumn to the previous known-good state.

## Related pages

- [Back up and restore Autumn](./backup-and-restore-autumn.md)
- [Install with Docker Compose](../install/docker-compose.md)
- [Install with PostgreSQL Docker Compose](../install/postgresql-docker-compose.md)
- [Install with Helm](../install/helm.md)
