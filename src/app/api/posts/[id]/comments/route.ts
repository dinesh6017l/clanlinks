import { NextRequest, NextResponse } from "next/server";
import { boardRole, postIsInBoard } from "@/lib/board-auth";
import { cleanText } from "@/lib/detect-link";
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const q = new URL(req.url).searchParams; const slug = cleanText(q.get("board") || "main", 36);
  const { client, board, role } = await boardRole(slug, req.headers.get("x-clan-passcode") || "", req.headers.get("x-clan-admin-passcode") || "");
  if (!client || !board || !role) return NextResponse.json({ comments: [] }, { status: 403 });
  const { id } = await params;
  if (!await postIsInBoard(client, id, slug)) return NextResponse.json({ comments: [] }, { status: 404 });
  const { data } = await client.from("comments").select("id,user_name,body,created_at").eq("post_id", id).order("created_at");
  return NextResponse.json({ comments: data ?? [] });
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const body = await req.json().catch(() => ({})); const slug = cleanText(body.boardSlug || "main", 36);
  const { client, board, role } = await boardRole(slug, typeof body.memberCode === "string" ? body.memberCode : "", typeof body.adminCode === "string" ? body.adminCode : "");
  if (!client || !board || !role) return NextResponse.json({ error: "Join this clan board first." }, { status: 403 });
  const user = cleanText(body.user, 24); const text = cleanText(body.body, 280);
  if (!user || !text) return NextResponse.json({ error: "Add your name and a short comment." }, { status: 400 });
  const { id } = await params;
  if (!await postIsInBoard(client, id, slug)) return NextResponse.json({ error: "Post not found on this board." }, { status: 404 });
  const { data, error } = await client.from("comments").insert({ post_id: id, user_name: user, body: text }).select("id,user_name,body,created_at").single();
  if (error) return NextResponse.json({ error: "Could not add comment." }, { status: 500 });
  return NextResponse.json({ comment: data }, { status: 201 });
}
