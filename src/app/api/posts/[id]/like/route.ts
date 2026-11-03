import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
const db = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key) : null;
};
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) { const client = db(); if (!client) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 }); const { id } = await params; const body = await req.json().catch(() => ({})); const user = typeof body.user === "string" ? body.user.slice(0, 24) : ""; if (!user) return NextResponse.json({ error: "Set a display name first." }, { status: 400 }); const { error } = await client.from("likes").upsert({ post_id: id, user_name: user }, { onConflict: "post_id,user_name" }); if (error) return NextResponse.json({ error: "Could not like post." }, { status: 500 }); await client.rpc("refresh_post_likes", { target_post: id }); return NextResponse.json({ ok: true }); }
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) { const client = db(); if (!client) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 }); const { id } = await params; const body = await req.json().catch(() => ({})); const user = typeof body.user === "string" ? body.user.slice(0, 24) : ""; const { error } = await client.from("likes").delete().eq("post_id", id).eq("user_name", user); if (error) return NextResponse.json({ error: "Could not remove like." }, { status: 500 }); await client.rpc("refresh_post_likes", { target_post: id }); return NextResponse.json({ ok: true }); }
