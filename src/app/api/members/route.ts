import { NextRequest, NextResponse } from "next/server";
import { boardRole } from "@/lib/board-auth";
import { cleanText } from "@/lib/detect-link";

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams;
  const slug = cleanText(q.get("board") || "main", 36);
  const { client, board, role } = await boardRole(slug, req.headers.get("x-clan-passcode") || "", req.headers.get("x-clan-admin-passcode") || "");
  if (!client || !board || !role) return NextResponse.json({ members: [] });
  const { data } = await client.from("member_post_counts").select("name,post_count,last_active,town_hall,bio,player_tag,coc_verified_at").eq("board_slug", slug).order("post_count", { ascending: false });
  return NextResponse.json({ members: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const slug = cleanText(body.boardSlug || "main", 36);
  const { client, board, role } = await boardRole(slug, typeof body.memberCode === "string" ? body.memberCode : "", typeof body.adminCode === "string" ? body.adminCode : "");
  if (!client || !board || !role) return NextResponse.json({ error: "Join this clan board first." }, { status: 403 });
  const name = cleanText(body.name, 24);
  if (!name) return NextResponse.json({ error: "Choose a display name first." }, { status: 400 });
  const townHall = Number(body.townHall);
  const town_hall = townHall >= 1 && townHall <= 18 ? townHall : null;
  const bio = cleanText(body.bio, 140);
  const { data: existing } = await client.from("members").select("player_tag,coc_verified_at").eq("board_slug", slug).eq("name", name).maybeSingle();
  const { error } = await client.from("members").upsert({ board_slug: slug, name, town_hall, bio, player_tag: existing?.player_tag ?? null, coc_verified_at: existing?.coc_verified_at ?? null, last_active: new Date().toISOString() }, { onConflict: "board_slug,name" });
  if (error) return NextResponse.json({ error: "Could not save your profile." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
