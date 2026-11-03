import { NextRequest, NextResponse } from "next/server";
import { boardRole, postIsInBoard } from "@/lib/board-auth";
import { cleanText } from "@/lib/detect-link";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const body = await req.json().catch(() => ({}));
  const slug = cleanText(body.boardSlug || "main", 36);
  const { client, board, role } = await boardRole(slug, typeof body.memberCode === "string" ? body.memberCode : "", typeof body.adminCode === "string" ? body.adminCode : "");
  if (!client || !board || !role) return NextResponse.json({ error: "Join this clan board first." }, { status: 403 });
  const { id } = await params;
  if (!await postIsInBoard(client, id, slug)) return NextResponse.json({ error: "Post not found on this board." }, { status: 404 });
  const user = cleanText(body.user, 24) || "anonymous";
  const reason = cleanText(body.reason, 48) || "Other";
  const { error } = await client.from("reports").upsert({ post_id: id, user_name: user, reason }, { onConflict: "post_id,user_name" });
  if (error) return NextResponse.json({ error: "Could not report link." }, { status: 500 });
  const { count } = await client.from("reports").select("id", { count: "exact", head: true }).eq("post_id", id);
  if ((count ?? 0) >= 3) await client.from("posts").update({ hidden: true }).eq("id", id).eq("board_slug", slug);
  return NextResponse.json({ ok: true, hidden: (count ?? 0) >= 3 });
}
