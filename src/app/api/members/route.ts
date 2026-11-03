import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export async function GET() { if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ members: [] }); const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); const { data, error } = await db.from("member_post_counts").select("name,post_count,last_active").order("post_count", { ascending: false }); if (error) return NextResponse.json({ members: [] }); return NextResponse.json({ members: data }); }
