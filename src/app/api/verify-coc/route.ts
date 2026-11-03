import { NextRequest, NextResponse } from "next/server";
import { boardRole } from "@/lib/board-auth";
import { cleanText } from "@/lib/detect-link";

const normalizeTag = (value: string) => value.trim().replace(/^#/, "").toUpperCase();
const validTag = (value: string) => /^[0289PYLQGRJCUV]{3,15}$/.test(value);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const slug = cleanText(body.boardSlug || "main", 36);
  const name = cleanText(body.name, 24);
  const tag = normalizeTag(typeof body.playerTag === "string" ? body.playerTag : "");
  const { client, board, role } = await boardRole(
    slug,
    typeof body.memberCode === "string" ? body.memberCode : "",
    typeof body.adminCode === "string" ? body.adminCode : "",
  );

  if (!client || !board || !role) return NextResponse.json({ error: "Join this clan board first." }, { status: 403 });
  if (!name) return NextResponse.json({ error: "Enter your ClanLinks display name first." }, { status: 400 });
  if (!validTag(tag)) return NextResponse.json({ error: "Enter a valid player tag (letters and numbers only)." }, { status: 400 });

  const token = process.env.COC_API_TOKEN;
  const expectedClanTag = normalizeTag(process.env.COC_CLAN_TAG || "");
  if (!token) return NextResponse.json({ error: "Clash of Clans API is not configured yet. Add COC_API_TOKEN in Vercel." }, { status: 503 });
  if (!validTag(expectedClanTag)) return NextResponse.json({ error: "This board has no official clan tag configured. Add COC_CLAN_TAG in Vercel." }, { status: 503 });

  let response: Response;
  try {
    response = await fetch(`https://api.clashofclans.com/v1/players/${encodeURIComponent(`#${tag}`)}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return NextResponse.json({ error: "Could not reach the Clash of Clans API. Check the Vercel outbound IP allowlist." }, { status: 502 });
  }
  if (response.status === 404) return NextResponse.json({ error: "That player tag was not found." }, { status: 404 });
  if (!response.ok) return NextResponse.json({ error: `Clash of Clans API rejected the request (${response.status}). Check the API key and allowed IPs.` }, { status: 502 });

  const player = await response.json().catch(() => null) as {
    name?: string;
    tag?: string;
    townHallLevel?: number;
    currentClan?: { tag?: string; name?: string };
  } | null;
  if (!player?.name || player.name.trim().toLocaleLowerCase() !== name.trim().toLocaleLowerCase()) {
    return NextResponse.json({ error: "The in-game name for that player tag does not match your ClanLinks display name." }, { status: 422 });
  }
  const playerClanTag = normalizeTag(player.currentClan?.tag || "");
  if (!player.currentClan || playerClanTag !== expectedClanTag) {
    return NextResponse.json({ error: "That player is not currently in the clan configured for this board." }, { status: 422 });
  }

  const { data: existing } = await client.from("members").select("bio").eq("board_slug", slug).eq("name", name).maybeSingle();
  const verifiedAt = new Date().toISOString();
  const { error } = await client.from("members").upsert({
    board_slug: slug,
    name,
    player_tag: `#${tag}`,
    coc_verified_at: verifiedAt,
    town_hall: player.townHallLevel ?? null,
    bio: existing?.bio ?? "",
    last_active: verifiedAt,
  }, { onConflict: "board_slug,name" });
  if (error) return NextResponse.json({ error: "The profile matched, but ClanLinks could not save the verification. Apply the latest Supabase schema." }, { status: 500 });

  return NextResponse.json({ verified: true, verifiedAt, player: { name: player.name, tag: player.tag || `#${tag}`, clan: player.currentClan.name, townHall: player.townHallLevel ?? null } });
}
