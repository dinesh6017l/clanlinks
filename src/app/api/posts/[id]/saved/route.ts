import { NextRequest, NextResponse } from "next/server";
import { boardRole, postIsInBoard } from "@/lib/board-auth";
import { cleanText } from "@/lib/detect-link";
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const body = await req.json().catch(() => ({})); const slug = cleanText(body.boardSlug || "main", 36);
  const { client, board, role } = await boardRole(slug, typeof body.memberCode === "string" ? body.memberCode : "", typeof body.adminCode === "string" ? body.adminCode : "");
  if (!client || !board || !role) return NextResponse.json({ error: "Join this clan board first." }, { status: 403 });
  const user = cleanText(body.user, 24); const { id } = await params;
  if (!user) return NextResponse.json({ error: "Set a display name first." }, { status: 400 });
  if (!await postIsInBoard(client, id, slug)) return NextResponse.json({ error: "Post not found on this board." }, { status: 404 });
  const { error } = await client.from("saved_posts").upsert({ post_id: id, user_name: user }, { onConflict: "post_id,user_name" });
  if (error) return NextResponse.json({ error: "Could not save link." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const body = await req.json().catch(() => ({})); const slug = cleanText(body.boardSlug || "main", 36);
  const { client, board, role } = await boardRole(slug, typeof body.memberCode === "string" ? body.memberCode : "", typeof body.adminCode === "string" ? body.adminCode : "");
  if (!client || !board || !role) return NextResponse.json({ error: "Join this clan board first." }, { status: 403 });
  const user = cleanText(body.user, 24); const { id } = await params;
  if (!await postIsInBoard(client, id, slug)) return NextResponse.json({ error: "Post not found on this board." }, { status: 404 });
  const { error } = await client.from("saved_posts").delete().eq("post_id", id).eq("user_name", user);
  if (error) return NextResponse.json({ error: "Could not remove saved link." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
