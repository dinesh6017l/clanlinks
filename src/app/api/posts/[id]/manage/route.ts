import { NextRequest, NextResponse } from "next/server";
import { boardRole } from "@/lib/board-auth";
import { cleanText } from "@/lib/detect-link";
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const body = await req.json().catch(() => ({})); const slug = cleanText(body.boardSlug || "main", 36);
  const { client, board, role } = await boardRole(slug, typeof body.memberCode === "string" ? body.memberCode : "", typeof body.adminCode === "string" ? body.adminCode : "");
  if (!client || !board || !role) return NextResponse.json({ error: "Join this clan board first." }, { status: 403 });
  const { id } = await params; const action = String(body.action || "");
  if (action === "edit" || action === "author-delete") {
    const author = cleanText(body.author, 24);
    const { data: post } = await client.from("posts").select("id,author").eq("id", id).eq("board_slug", slug).maybeSingle();
    if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });
    if (!author || post.author.toLocaleLowerCase() !== author.toLocaleLowerCase()) return NextResponse.json({ error: "You can only change posts shared under your display name." }, { status: 403 });
    if (action === "author-delete") {
      const { error } = await client.from("posts").delete().eq("id", id).eq("board_slug", slug);
      return NextResponse.json(error ? { error: "Could not delete this post." } : { ok: true }, { status: error ? 500 : 200 });
    }
    const note = cleanText(body.note, 140);
    const mention = cleanText(body.mention, 24).replace(/^@/, "") || null;
    const tags = Array.isArray(body.tags) ? body.tags.filter((tag: unknown) => ["War", "CWL", "Farming", "Trophy"].includes(String(tag))).slice(0, 4) : [];
    const { error } = await client.from("posts").update({ note, mention, tags }).eq("id", id).eq("board_slug", slug);
    return NextResponse.json(error ? { error: "Could not update this post." } : { ok: true }, { status: error ? 500 : 200 });
  }
  if (role !== "admin") return NextResponse.json({ error: "Admin passcode required." }, { status: 403 });
  if (action === "delete") {
    const { error } = await client.from("posts").delete().eq("id", id).eq("board_slug", slug);
    return NextResponse.json(error ? { error: "Could not delete this post." } : { ok: true }, { status: error ? 500 : 200 });
  }
  const changes: Record<string, unknown> = {};
  if (action === "pin" || action === "unpin") changes.is_pinned = action === "pin";
  else if (action === "hide" || action === "restore") changes.hidden = action === "hide";
  else if (action === "expire") changes.expires_at = body.days ? new Date(Date.now() + Number(body.days) * 86400000).toISOString() : null;
  else if (action === "unexpire") changes.expires_at = null;
  else return NextResponse.json({ error: "Unknown moderation action." }, { status: 400 });
  const { error } = await client.from("posts").update(changes).eq("id", id).eq("board_slug", slug);
  return NextResponse.json(error ? { error: "Could not update this post." } : { ok: true }, { status: error ? 500 : 200 });
}
