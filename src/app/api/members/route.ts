import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ members: [] });
  const db = createClient(url, key);
  const { data, error } = await db.from("member_post_counts").select("name,post_count,last_active").order("post_count", { ascending: false });
  if (error) return NextResponse.json({ members: [] });
  return NextResponse.json({ members: data });
}
