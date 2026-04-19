# Supabase Backup Demo Guide

This guide enables a fallback path using Supabase when the main QueueLanka backend is down during a demo.

## Architecture

- Backup API service: supabase-backup/server.js
- Database: Supabase Postgres
- Frontend points to backup API by setting VITE_API_BASE_URL

## One-Time Preparation

1. Create a Supabase project.
2. Run SQL scripts:
   - supabase-backup/sql/001_schema.sql
   - supabase-backup/sql/002_seed.sql
3. Configure secrets as local environment variables (not in tracked files):
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - BACKUP_JWT_SECRET

## Start Backup Backend

From supabase-backup:

- npm install
- npm run start

Service starts on http://localhost:7000

## Switch Frontend to Backup

In frontend .env set:

VITE_API_BASE_URL=http://localhost:7000

Restart frontend.

## Rollback to Main Backend

Set frontend variable back to your gateway URL, for example:

VITE_API_BASE_URL=http://localhost:5000

Restart frontend.

## Demo Validation Checklist

- Login as officer1 and open officer dashboard
- Call next token
- Mark token served/skipped
- Login as citizen1 and view my tokens
- Create a booking and verify token appears

## Limitations

- This backup service focuses on demo-critical routes.
- SignalR realtime hub is not part of this fallback.
- Use production-grade auth/password handling before non-demo usage.
