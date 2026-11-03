import { NextRequest, NextResponse } from "next/server";
import { boardRole, postIsInBoard } from "@/lib/board-auth";
import { cleanText } from "@/lib/detect-link";
async function toggle(req: NextRequest, id: string, remove = false) {
  const body = await req.json().catch(() => ({}));
  const slug = cleanText(body.boardSlug || "main", 36);
  const { client, board, role } = await boardRole(slug, typeof body.memberCode === "string" ? body.memberCode : "", typeof body.adminCode === "string" ? body.adminCode : "");
  if (!client || !board || !role) return NextResponse.json({ error: "Join this clan board first." }, { status: 403 });
  const user = cleanText(body.user, 24);
  if (!user) return NextResponse.json({ error: "Set a display name first." }, { status: 400 });
  const idPost = id;
  if (!await postIsInBoard(client, idPost, slug)) return NextResponse.json({ error: "Post not found on this board." }, { status: 404 });
  const result = remove ? await client.from("likes").delete().eq("post_id", idPost).eq("user_name", user) : await client.from("likes").upsert({ post_id: idPost, user_name: user }, { onConflict: "post_id,user_name" });
  if (result.error) return NextResponse.json({ error: "Could not update like." }, { status: 500 });
  await client.rpc("refresh_post_likes", { target_post: idPost });
  return NextResponse.json({ ok: true });
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) { return toggle(req, (await params).id); }
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) { return toggle(req, (await params).id, true); }
