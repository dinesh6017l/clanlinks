# ClanLinks

ClanLinks is a mobile-first sharing board for Clash of Clans base layouts, player links, and clan profiles. It uses Next.js App Router, TypeScript, Tailwind, and Supabase.

## Files

- `src/app` — App Router page, styles, and API routes
- `src/components/clanlinks-app.tsx` — responsive feed, post modal, members view, and QR dialog
- `src/lib` — link validation and Supabase client/types
- `supabase/schema.sql` — database tables, indexes, view, and RLS policies
- `.env.example` — deployment environment variables

## Setup and deploy (8 steps)

1. Create a Supabase project and run `supabase/schema.sql` in its SQL Editor.
2. Copy `.env.example` to `.env.local` and add the project URL, anon key, and service role key.
3. Set `CLAN_PASSCODE` to a private passcode, or leave blank for a public board.
4. Install packages with `npm install`.
5. Start locally with `npm run dev` and open `http://localhost:3000`.
6. Push the folder to a Git repository and import it into Vercel.
7. Add the same environment variables in Vercel Project Settings.
8. Deploy; the feed refreshes every 12 seconds so new posts appear without manual reloads.

Display names are stored in localStorage. The API validates links and text, deduplicates URLs, and applies the 5-post/10-minute limit per display name. Treat the optional passcode as a convenience gate, not identity verification: display names are anonymous and user supplied.
