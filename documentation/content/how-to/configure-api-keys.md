---
title: Configure API keys
sidebar_position: 2
description: Create and use Autumn API keys for the CLI, extension, and automation clients.
---

Use this guide to create Autumn API keys for machine clients.

## What API keys are for

Autumn API keys are the supported auth model for machine clients such as:

- the Autumn CLI
- the browser extension
- other automation or integration clients

## Create an API key in the web app

1. Sign in to Autumn in the browser.
2. Open **Settings**.
3. Open the **API Keys** section.
4. Create a new key.
5. Copy the raw key value immediately.

You will not get the raw key value back later from the server.

## Choose the right preset

The backend currently supports preset families including:

- full access
- CLI
- extension
- read only
- import/export
- custom

### Recommended preset choices

- use **CLI** for the Autumn CLI
- use **extension** for the browser extension
- use **read only** for dashboards or reporting-style integrations
- use **import/export** for narrow data portability workflows

## Use the key with the CLI

```bash
autumn auth init --api-key 'your-api-key'
autumn auth doctor
autumn auth whoami
```

## Use the key with the extension

1. Open the extension settings page.
2. Enter the Autumn app URL.
3. Enter the API key.
4. Save the settings.

## Rotate or revoke keys

Because the web app is the source of truth for API key lifecycle, rotate or revoke keys there rather than expecting the CLI or extension to do it remotely.

## Related pages

- [Auth and API keys](../explanation/auth-and-api-keys.md)
- [Use the CLI](./use-the-cli.md)
- [Use the browser extension](./use-the-browser-extension.md)
