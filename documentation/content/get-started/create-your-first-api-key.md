---
title: Create your first API key
description: Create a Autumn API key for the CLI, browser extension, or other machine clients.
---

Use this guide after you can already sign in to Autumn in the browser.

## What API keys are for

Autumn API keys are the supported authentication model for machine clients such as:

- the Autumn CLI
- the browser extension
- other automation or integration clients

## Create the key in Autumn

1. Sign in to Autumn.
2. Open **Settings**.
3. Open the **API Keys** section.
4. Create a new API key.
5. Choose the preset that matches the client you plan to use.
6. Copy the raw key value immediately.

You will not get the raw key value back later from the server.

## Choose the right preset

Use:

- **CLI** for the Autumn CLI
- **extension** for the browser extension
- **read only** for narrow reporting-style integrations
- **import/export** for focused data portability workflows

## Verify the key with the CLI

If you are using the Autumn CLI:

```bash
autumn auth init --api-key 'your-api-key'
autumn auth doctor
autumn auth whoami
```

## Use the key with the browser extension

Open the extension settings and enter:

- the Autumn app URL
- the API key you just created

## Next steps

- [Configure API keys](../how-to/configure-api-keys.md)
- [Use the CLI](../how-to/use-the-cli.md)
- [Use the browser extension](../how-to/use-the-browser-extension.md)
