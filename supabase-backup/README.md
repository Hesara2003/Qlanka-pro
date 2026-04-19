# QueueLanka Supabase Backup Backend

This folder provides a demo-safe backup backend using Supabase Postgres.
Use it when the main microservices stack is unavailable.

## What This Backup Covers

- Login and register
- Service center list/details
- Counter operations for officer demo:
  - call next
  - mark served/skipped
  - waiting list
  - dashboard stats
- Citizen token and booking flows:
  - my tokens
  - cancel token
  - book appointment
  - my bookings

## Quick Setup

1. Create a Supabase project.
2. In Supabase SQL Editor, run:
   - sql/001_schema.sql
   - sql/002_seed.sql
3. Set secret environment variables in your shell (do not commit them):
  - SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY
  - BACKUP_JWT_SECRET
4. Start backend:
   - npm install
   - npm run start

Backup API default URL: http://localhost:7000

## Demo Accounts

- admin / Demo@123
- officer1 / Demo@123
- citizen1 / Demo@123

## Frontend Failover Switch

Set frontend API base URL to this backup service.

Example in frontend .env:

VITE_API_BASE_URL=http://localhost:7000

No frontend code change is required because this service exposes /api/* routes compatible with existing API modules.

## Security Notes

- This backup backend is intended for demo and emergency fallback.
- Passwords in seed are plain text for quick demo startup.
- Use strong secrets and hashed passwords before production use.
- Keep SUPABASE_SERVICE_ROLE_KEY server-side only.
