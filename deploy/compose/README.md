# Autumn Docker Compose install files

This directory contains the user-facing Docker Compose install files for Autumn.

## Files

- `docker-compose.yml` — default SQLite-backed install
- `docker-compose.postgres.yml` — local PostgreSQL-backed install
- `.env.example` — optional environment overrides for Compose installs

## Install model

These Compose files are intended to pull the published Autumn image from GitHub Container Registry by default.

Override the image tag with `AUTUMN_IMAGE` if you want to pin a specific version.
