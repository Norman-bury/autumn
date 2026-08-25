---
title: Install with Helm
description: Deploy Autumn on Kubernetes with the published OCI Helm chart.
---

Use this install method if you already run Kubernetes and want:

- the published Autumn OCI chart
- namespace and secret based configuration
- a production-style path that can grow past a single local container host

## Before you begin

You need:

- Kubernetes 1.23 or newer
- Helm 3.8 or newer
- `kubectl` access to the target cluster
- a working default `StorageClass`, or an explicit storage class you plan to use

## Quick evaluation install

If you want to evaluate Autumn quickly with the chart defaults:

```bash
helm install autumn oci://ghcr.io/Norman-bury/charts/autumn \
  --namespace autumn \
  --create-namespace
kubectl port-forward -n autumn svc/autumn 5577:5577
```

Then open `http://localhost:5577`.

## The values file used in the production-style example

For a PostgreSQL-backed install, the file you edit is a values file rather than the chart itself.

Create the required secrets first:

```bash
kubectl create namespace autumn
kubectl create secret generic autumn-secrets \
  -n autumn \
  --from-literal=secret-key="$(openssl rand -hex 32)"
kubectl create secret generic autumn-db \
  -n autumn \
  --from-literal=password='replace-with-a-strong-password'
```

Save this as `values-production.yaml`:

```yaml
postgresql:
  enabled: true
  host: postgres.example.com
  port: 5432
  database: autumn
  user: autumn
  existingSecret: autumn-db
  existingSecretPasswordKey: password

secretKey:
  existingSecret: autumn-secrets
  existingSecretKey: secret-key
```

If you already know the public hostname, extend the same file with ingress settings:

```yaml
ingress:
  enabled: true
  className: nginx
  host: jobs.example.com
  tls:
    enabled: true
```

## Install Autumn with the values file

```bash
helm install autumn oci://ghcr.io/Norman-bury/charts/autumn \
  --namespace autumn \
  --values values-production.yaml
```

If ingress is not enabled yet, access Autumn locally:

```bash
kubectl port-forward -n autumn svc/autumn 5577:5577
```

## Verify the install

Check the Helm release:

```bash
helm status -n autumn autumn
```

Watch the pods:

```bash
kubectl get pods -n autumn -w
```

Inspect the app logs if needed:

```bash
kubectl logs -n autumn deploy/autumn
```

## Where your data lives

In Helm installs:

- Autumn uploads are stored on the PVC mounted at `/app/data`
- relational data lives in PostgreSQL when `postgresql.enabled=true`

For a real production deployment, you need backups for both the uploads volume and the PostgreSQL database.

## Important scaling note

Multiple replicas require more than just PostgreSQL.

You also need shared uploads storage, either:

- a chart-managed PVC with `persistence.accessMode=ReadWriteMany`
- or an existing shared claim with `persistence.sharedAccess=true`

## Troubleshooting

If the deployment does not become ready:

```bash
kubectl logs -n autumn deploy/autumn -c migrate
kubectl logs -n autumn deploy/autumn
```

Then continue with [Deployment and startup problems](../troubleshooting/deployment-and-startup.md).

## Related reference

For a chart-facing reference to the Autumn values, metadata, and scaling rules, see [Helm chart reference](../reference/helm-chart-reference.md).

## Next step

Continue with [Create your admin account](../get-started/create-admin-account.md).
