import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
const db = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key) : null;
};
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) { const client = db(); if (!client) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 }); const { id } = await params; const body = await req.json().catch(() => ({})); const user = typeof body.user === "string" ? body.user.slice(0, 24) : "anonymous"; const { error } = await client.from("reports").upsert({ post_id: id, user_name: user }, { onConflict: "post_id,user_name" }); if (error) return NextResponse.json({ error: "Could not report post." }, { status: 500 }); const { count } = await client.from("reports").select("id", { count: "exact", head: true }).eq("post_id", id); if ((count ?? 0) >= 3) await client.from("posts").update({ hidden: true }).eq("id", id); return NextResponse.json({ ok: true, hidden: (count ?? 0) >= 3 }); }
