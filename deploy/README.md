# Autumn deployment assets

This directory contains the user-facing deployment assets for Autumn.

**Documentation:** https://Norman-bury.github.io/autumn/

For the public install guides, start with:
- https://Norman-bury.github.io/autumn/install/

## Structure

- `compose/` — Docker Compose install files for published container images
- `helm/autumn/` — Helm chart for Kubernetes installs

## Purpose

Deployment assets live here so the public install surface is separated from the source tree used for development and contribution.

End users should not need to clone the full repository just to get:

- Docker Compose install files
- Helm chart files
- environment file examples for packaged installs
