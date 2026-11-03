import { NextRequest, NextResponse } from "next/server";
import { boardRole } from "@/lib/board-auth";
import { cleanText, detectLink } from "@/lib/detect-link";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const slug = cleanText(url.searchParams.get("board") || "main", 36);
  const user = cleanText(url.searchParams.get("user"), 24);
  const memberCode = req.headers.get("x-clan-passcode") || "";
  const { client, board, role } = await boardRole(slug, memberCode, req.headers.get("x-clan-admin-passcode") || "");
  if (!client) return NextResponse.json({ posts: [] });
  if (!board || !role) return NextResponse.json({ error: "Join this clan board first." }, { status: 403 });
  const { data, error } = await client.from("posts").select("*").eq("board_slug", slug).eq("hidden", false).order("is_pinned", { ascending: false }).order("created_at", { ascending: false }).limit(200);
  if (error) return NextResponse.json({ error: "Could not load posts." }, { status: 500 });
  const active = (data ?? []).filter(post => !post.expires_at || new Date(post.expires_at).getTime() > Date.now());
  if (!active.length) return NextResponse.json({ posts: active });
  const ids = active.map(post => post.id);
  const [{ data: liked }, { data: saved }, { data: ratings }, { data: comments }] = await Promise.all([
    user ? client.from("likes").select("post_id").eq("user_name", user).in("post_id", ids) : Promise.resolve({ data: [] }),
    user ? client.from("saved_posts").select("post_id").eq("user_name", user).in("post_id", ids) : Promise.resolve({ data: [] }),
    client.from("base_ratings").select("post_id,rating").in("post_id", ids),
    client.from("comments").select("post_id").in("post_id", ids),
  ]);
  const likedIds = new Set((liked ?? []).map(row => row.post_id));
  const savedIds = new Set((saved ?? []).map(row => row.post_id));
  const ratingMap = new Map<string, number[]>();
  for (const item of ratings ?? []) ratingMap.set(item.post_id, [...(ratingMap.get(item.post_id) ?? []), item.rating]);
  const commentCounts = new Map<string, number>();
  for (const item of comments ?? []) commentCounts.set(item.post_id, (commentCounts.get(item.post_id) ?? 0) + 1);
  return NextResponse.json({ posts: active.map(post => {
    const rs = ratingMap.get(post.id) ?? [];
    return { ...post, liked: likedIds.has(post.id), saved: savedIds.has(post.id), rating_avg: rs.length ? rs.reduce((a, b) => a + b, 0) / rs.length : 0, rating_count: rs.length, comment_count: commentCounts.get(post.id) ?? 0 };
  }) });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const slug = cleanText(body.boardSlug || "main", 36);
  const { client, board, role } = await boardRole(slug, typeof body.memberCode === "string" ? body.memberCode : "", typeof body.adminCode === "string" ? body.adminCode : "");
  if (!client || !board) return NextResponse.json({ error: "Clan board not found." }, { status: 404 });
  if (!role) return NextResponse.json({ error: "Enter the clan member passcode first." }, { status: 403 });
  if (slug === "main" && process.env.CLAN_PASSCODE && body.memberCode !== process.env.CLAN_PASSCODE) return NextResponse.json({ error: "That clan passcode is incorrect." }, { status: 403 });
  const author = cleanText(body.author, 24);
  const mention = cleanText(body.mention, 24).replace(/^@/, "") || null;
  const note = cleanText(body.note, 140);
  const link = detectLink(body.url ?? "");
  if (!author || !link) return NextResponse.json({ error: "Add your name and a valid Clash of Clans link." }, { status: 400 });
  if (link.type !== "Base") {
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await client.from("posts").select("id", { count: "exact", head: true }).eq("board_slug", slug).eq("author", author).gte("created_at", since);
    if ((count ?? 0) >= 5) return NextResponse.json({ error: "Posting limit reached. Try again in a few minutes." }, { status: 429 });
  }
  const { data: existing } = await client.from("posts").select("id").eq("board_slug", slug).eq("url", link.url).maybeSingle();
  if (existing) return NextResponse.json({ error: "This link has already been shared." }, { status: 409 });
  const tags = Array.isArray(body.tags) ? body.tags.filter((tag: unknown) => ["War", "CWL", "Farming", "Trophy"].includes(String(tag))).slice(0, 4) : [];
  const expiration = Number(body.expireDays);
  const expires_at = [1, 7, 30].includes(expiration) ? new Date(Date.now() + expiration * 86400000).toISOString() : null;
  const { data, error } = await client.from("posts").insert({ board_slug: slug, url: link.url, type: link.type, th_level: link.th, author, mention, note, tags, expires_at }).select().single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "This link has already been shared." : "Could not save this post." }, { status: 500 });
  await client.from("members").upsert({ board_slug: slug, name: author, last_active: new Date().toISOString() }, { onConflict: "board_slug,name" });
  return NextResponse.json({ post: data }, { status: 201 });
}
