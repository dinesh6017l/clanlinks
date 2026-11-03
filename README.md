# ClanLinks

ClanLinks is a mobile-first board where a Clash of Clans clan can collect and share base layouts, player profiles, friend invites, and clan links. Members can paste a game link, add a short note and tags, and copy or open the link from the feed.

- **Live app:** https://clanlinks-pbum.vercel.app
- **GitHub:** https://github.com/dinesh6017l/clanlinks
- **Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Supabase Postgres, Vercel

ClanLinks is fan-made and is not affiliated with Supercell. It uses original interface styling and does not include Supercell game assets.

## Features

- Feed ordered by pinned status and newest first, with a 15-second refresh, type filters, text search, Town Hall and tag filters, and sorting.
- Link parsing accepts HTTPS URLs on `link.clashofclans.com` with supported actions: `OpenLayout`, `OpenPlayerProfile`, and `OpenClanProfile`. Layout IDs can provide a Town Hall level when they contain a `TH` or `TownHall` number.
- Posts support an author display name, optional member mention, 140-character note, War/CWL/Farming/Trophy tags, and optional expiry after 1, 7, or 30 days.
- Copy, QR/share, and open-in-game actions; likes, saved links, comments, and 1–5 star base ratings.
- Member profiles include a Town Hall level and short bio. The Members page shows post counts and contributors.
- Reports include a reason. Three reports hide a post; board admins can review reports and pin, hide, restore, or delete posts. Expired posts can be relisted by an admin.
- Clan boards have separate member and admin passcodes, board-specific posts and members, and invite URLs.
- Mobile bottom navigation, a floating post action, action toasts, and animated cards and buttons.

## How board access works

1. Open the app and choose **Create a clan board**. Choose a unique clan name, a member passcode of at least 6 characters, and a different admin passcode of at least 8 characters.
2. Share the invite URL and member passcode with clanmates. The passcode is not embedded in the invite URL.
3. Members choose **Join a board**, enter the board slug and member passcode, then choose a display name. Admins can enter the admin passcode to access moderation tools.
4. The passcodes are stored as salted scrypt hashes in Supabase. A browser remembers the passcodes in localStorage for convenience.

The existing `main` board is named **Clan Board** and its existing posts remain on it. It is public by default and has no admin passcode unless one is configured separately. Creating a new board is the supported way to start a passcode-protected clan space with an admin.

## Run locally

### Requirements

- Node.js 20 or newer and npm
- A Supabase project

### Setup

1. Clone the repository and install packages:

   ```bash
   git clone https://github.com/dinesh6017l/clanlinks.git
   cd clanlinks
   npm install
   ```

2. In Supabase, open **SQL Editor** and run [`supabase/schema.sql`](supabase/schema.sql). It creates the tables, indexes, view, and row-level security policies. On a project that already has ClanLinks data, take a backup and review the migration statements before running it.
3. Copy `.env.example` to `.env.local` and fill in the project URL, anon key, and service-role key from Supabase **Project Settings → API**.
4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

The app can render without database configuration, but database-backed board and post actions will not work until the environment variables are valid.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL used by the app. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key; safe for browser use when RLS is configured. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only key used by API routes for validated database operations. Never expose it in client code or use a `NEXT_PUBLIC_` prefix. |
| `CLAN_PASSCODE` | Optional | Optional legacy passcode gate for the `main` board. Most boards use their own member and admin passcodes. |

Never commit `.env.local` or publish a service-role key. Configure production variables in Vercel under the project’s **Settings → Environment Variables**, then redeploy.

## Database and access control

The SQL schema defines:

- `boards`: board names and salted member/admin passcode hashes.
- `posts`: link, type, author, mention, note, tags, Town Hall level, likes count, board, moderation, expiry, and timestamp.
- `members`: board-scoped display names, profile fields, and last activity.
- `likes`, `reports`, `saved_posts`, `comments`, and `base_ratings`: per-post community actions.
- `member_post_counts`: a view used to show contributor counts.

RLS allows anonymous reads for the public `main` board. Private board data and all database writes go through Next.js API routes, which validate the board passcode and use the server-side service-role key. The service-role key bypasses RLS, so keep it private and deploy only trusted server code.

## API routes

| Route | Purpose |
| --- | --- |
| `GET/POST /api/boards` | List and create boards. |
| `POST /api/boards/[slug]/join` | Verify a member or admin passcode. |
| `GET /api/boards/[slug]/moderation` | Load a board’s report queue and hidden posts for admins. |
| `GET/PATCH /api/members` | List contributors or save a profile. |
| `GET/POST /api/posts` | Load the board feed or create a post. |
| `POST/DELETE /api/posts/[id]/like` | Add or remove a like. |
| `POST/DELETE /api/posts/[id]/saved` | Save or unsave a post. |
| `GET/POST /api/posts/[id]/comments` | Read or add comments. |
| `POST /api/posts/[id]/rating` | Save a base rating. |
| `POST /api/posts/[id]/report` | Submit a report. |
| `PATCH /api/posts/[id]/manage` | Perform permitted admin actions on a post. |

Mutating requests for a private board include `boardSlug`, `memberCode`, and, for admin actions, `adminCode` in the JSON body. The browser app sends these automatically after joining.

## Deploy to Vercel

1. Push the repository to GitHub and import it into Vercel as a Next.js project.
2. Add the four environment variables above in Vercel. Do not make `SUPABASE_SERVICE_ROLE_KEY` public.
3. Run `supabase/schema.sql` in the production Supabase project.
4. Deploy. Vercel builds the app on each push to the connected branch.

You can also build and run the production bundle locally:

```bash
npm run build
npm run start
```

## Project structure

```text
src/
  app/
    api/                 Next.js route handlers
    globals.css          Global styles, components, and animations
    layout.tsx           Root document and font setup
    page.tsx             App entry point
  components/
    clanlinks-app.tsx    Main interactive client application
  lib/
    board-auth.ts        Database access, passcode hashing, board roles
    detect-link.ts       Link validation and text sanitization
    supabase.ts          Supabase client configuration
    types.ts             Shared TypeScript types
supabase/
  schema.sql             Database schema, indexes, view, and RLS
```

## Notes

- Display names are user-selected, not authenticated identities. A visitor can choose another person's name, so names alone should not be treated as proof of identity or as a strong abuse-prevention mechanism.
- The post limit is five posts per 10 minutes per board and display name. Since there is no login, it is a community guardrail rather than identity-based protection.
- The feed refreshes every 15 seconds. The schema includes a note about enabling Supabase Realtime publications, but the current feed uses periodic fetching.
- Main-board access can be restricted with the optional `CLAN_PASSCODE`; private boards use their board-specific passcodes.

## License

See [`LICENSE`](LICENSE).
