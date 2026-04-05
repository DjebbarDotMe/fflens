# AffiliateHub — Full Technical Documentation

> **Last updated:** 2026-04-05
> **Stack:** React 18 · TypeScript · Vite 5 · Tailwind CSS · shadcn/ui · Lovable Cloud (Supabase)

This file is a mirror of the comprehensive documentation in `/mnt/documents/DOCUMENTATION.md`.
For the full version, see that file.

## Database Schema & Security (RLS)
All tables are protected by Row Level Security (RLS).
- **profiles**: Users can read their own profile.
- **affiliate_links**: Users can only CRUD links belonging to their `user_id`.
- **clicks**: Publicly insertable (for tracking), but restricted read access.

## API References
- **Supabase Client**: Used for all DB interactions.
- **Auth**: Managed via `supabase.auth`.
- **Edge Functions**: Used for webhook processing and external API integrations.
