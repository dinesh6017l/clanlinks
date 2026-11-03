import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cleanText, detectLink } from "@/lib/detect-link";
const db = () => process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY) : null;
export async function GET() { const client = db(); if (!client) return NextResponse.json({ posts: [] }); const { data, error } = await client.from("posts").select("*").eq("hidden", false).order("created_at", { ascending: false }).limit(100); if (error) return NextResponse.json({ error: "Could not load posts" }, { status: 500 }); return NextResponse.json({ posts: data }); }
export async function POST(req: NextRequest) {
  const client = db(); if (!client) return NextResponse.json({ error: "Supabase is not configured yet." }, { status: 503 });
  const body = await req.json().catch(() => null); const author = cleanText(body?.author, 24); const mention = cleanText(body?.mention, 24).replace(/^@/, "") || null; const note = cleanText(body?.note, 140); const link = detectLink(body?.url ?? "");
  if (!author || !link) return NextResponse.json({ error: "Add your name and a valid Clash of Clans link." }, { status: 400 });
  const passcode = process.env.CLAN_PASSCODE; if (passcode && req.headers.get("x-clan-passcode") !== passcode) return NextResponse.json({ error: "That clan passcode is incorrect." }, { status: 403 });
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString(); const { count } = await client.from("posts").select("id", { count: "exact", head: true }).eq("author", author).gte("created_at", since);
  if ((count ?? 0) >= 5) return NextResponse.json({ error: "Posting limit reached. Try again in a few minutes." }, { status: 429 });
  const { data: existing } = await client.from("posts").select("id").eq("url", link.url).maybeSingle(); if (existing) return NextResponse.json({ error: "This link has already been shared." }, { status: 409 });
  const tags = Array.isArray(body?.tags) ? body.tags.filter((tag: unknown) => ["War", "CWL", "Farming", "Trophy"].includes(String(tag))).slice(0, 4) : [];
  const { data, error } = await client.from("posts").insert({ url: link.url, type: link.type, th_level: link.th, author, mention, note, tags }).select().single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "This link has already been shared." : "Could not save this post." }, { status: 500 });
  await client.from("members").upsert({ name: author, last_active: new Date().toISOString() }, { onConflict: "name" }); return NextResponse.json({ post: data }, { status: 201 });
}
