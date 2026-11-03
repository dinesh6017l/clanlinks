import { NextRequest, NextResponse } from "next/server";
import { boardRole, postIsInBoard } from "@/lib/board-auth";
import { cleanText } from "@/lib/detect-link";
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const body = await req.json().catch(() => ({})); const slug = cleanText(body.boardSlug || "main", 36);
  const { client, board, role } = await boardRole(slug, typeof body.memberCode === "string" ? body.memberCode : "", typeof body.adminCode === "string" ? body.adminCode : "");
  if (!client || !board || !role) return NextResponse.json({ error: "Join this clan board first." }, { status: 403 });
  const user = cleanText(body.user, 24); const rating = Number(body.rating);
  if (!user || !Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: "Choose a rating from 1 to 5." }, { status: 400 });
  const { id } = await params;
  if (!await postIsInBoard(client, id, slug)) return NextResponse.json({ error: "Post not found on this board." }, { status: 404 });
  const { error } = await client.from("base_ratings").upsert({ post_id: id, user_name: user, rating }, { onConflict: "post_id,user_name" });
  if (error) return NextResponse.json({ error: "Could not save rating." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
