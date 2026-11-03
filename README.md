# ClanLinks

ClanLinks is a mobile-first link board for Clash of Clans clans, built with Next.js App Router, TypeScript, Tailwind CSS, and Supabase.

## Features

- Create multiple clan boards with separate member and administrator passcodes; share a board invite URL and give its member passcode to clanmates.
- Share valid game links, tag a member, add notes and tags, and optionally auto-expire posts.
- Search and filter by link type, Town Hall, and tags; sort by newest, likes, or ratings.
- Like, bookmark, comment on, rate, copy, share, and open links with a QR code.
- Member profiles, contributor rankings, mention/war notifications, reporting, pinning, hiding, restoring, and moderator review tools.
- Per-board rate limits and duplicate-link checks. Display names are anonymous and user supplied.

## Setup

1. Create a Supabase project and run `supabase/schema.sql` in its SQL Editor. On an already-running project, run the file as a migration; it preserves posts and assigns them to the `main` board.
2. Set `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (or use the Vercel Supabase integration for deployment).
3. Run `npm install`, then `npm run dev`, and open `http://localhost:3000`.
4. Push `main` to GitHub; the connected Vercel project deploys each commit automatically.

Board passcodes are stored as salted hashes. The service role key must stay server-side and must never use a `NEXT_PUBLIC_` prefix.
