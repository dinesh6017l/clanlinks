# ClanLinks

ClanLinks is a mobile-first sharing board for Clash of Clans base layouts, player links, and clan profiles. It uses Next.js App Router, TypeScript, Tailwind, and Supabase.

## Files

- `src/app` — App Router page, styles, and API routes
- `src/components/clanlinks-app.tsx` — responsive feed, post modal, members view, and QR dialog
- `src/lib` — link validation and Supabase client/types
- `supabase/schema.sql` — database tables, indexes, view, and RLS policies
- `.env.example` — deployment environment variables

## Local setup

1. Create a Supabase project and run `supabase/schema.sql` in its SQL Editor.
2. Copy `.env.example` to `.env.local` and add the project URL, anon key, and service role key.
3. Set `CLAN_PASSCODE` to a private passcode, or leave blank for a public board.
4. Install packages with `npm install`.
5. Start locally with `npm run dev` and open `http://localhost:3000`.

## Deploy to Vercel

1. Import `dinesh6017l/clanlinks` at [vercel.com/new](https://vercel.com/new); Vercel detects Next.js automatically.
2. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in the Vercel project environment settings. Set `CLAN_PASSCODE` only if the board should require a passcode.
3. Deploy. Vercel builds the Next.js app and runs its API routes; GitHub Pages only supports static sites and cannot host this app's API routes.
4. New commits pushed to `main` deploy automatically after the GitHub repository is connected.

Display names are stored in localStorage. The API validates links and text, deduplicates URLs, and applies the 5-post/10-minute limit per display name. Treat the optional passcode as a convenience gate, not identity verification: display names are anonymous and user supplied.
