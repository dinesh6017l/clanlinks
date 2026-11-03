import { NextRequest, NextResponse } from "next/server";
import { boardRole, db, hashCode, slugify } from "@/lib/board-auth";
import { cleanText } from "@/lib/detect-link";

export async function GET() {
  const client = db();
  if (!client) return NextResponse.json({ boards: [] }, { status: 503 });
  const { data } = await client.from("boards").select("slug,name,created_at").order("created_at", { ascending: false });
  return NextResponse.json({ boards: data ?? [] });
}

export async function POST(req: NextRequest) {
  const client = db();
  if (!client) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  const body = await req.json().catch(() => ({}));
  const name = cleanText(body.name, 36);
  const memberCode = typeof body.memberCode === "string" ? body.memberCode : "";
  const adminCode = typeof body.adminCode === "string" ? body.adminCode : "";
  if (name.length < 2 || memberCode.length < 6 || adminCode.length < 8 || memberCode === adminCode) {
    return NextResponse.json({ error: "Use a clan name, a member passcode (6+ characters), and a different admin passcode (8+ characters)." }, { status: 400 });
  }
  const slug = slugify(name);
  const { data: existing } = await client.from("boards").select("slug").eq("slug", slug).maybeSingle();
  if (existing) return NextResponse.json({ error: "That clan board name is already taken. Try another name." }, { status: 409 });
  const { error } = await client.from("boards").insert({ slug, name, member_code_hash: hashCode(memberCode), admin_code_hash: hashCode(adminCode) });
  if (error) return NextResponse.json({ error: "Could not create the board." }, { status: 500 });
  return NextResponse.json({ board: { slug, name }, role: "admin" }, { status: 201 });
}
