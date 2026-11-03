import { NextRequest, NextResponse } from "next/server";
import { boardRole } from "@/lib/board-auth";
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const adminCode = req.headers.get("x-clan-admin-passcode") || "";
  const { client, board, role } = await boardRole(slug, "", adminCode);
  if (!client || !board || role !== "admin") return NextResponse.json({ error: "Admin passcode required." }, { status: 403 });
  const { data: posts } = await client.from("posts").select("id,url,type,author,note,hidden,is_pinned,expires_at").eq("board_slug", slug).order("created_at", { ascending: false }).limit(200);
  const postIds = (posts ?? []).map(post => post.id);
  const { data: reports } = postIds.length ? await client.from("reports").select("id,post_id,user_name,reason,created_at").in("post_id", postIds).order("created_at", { ascending: false }).limit(100) : { data: [] };
  const byId = new Map((posts ?? []).map(post => [post.id, post]));
  return NextResponse.json({ reports: (reports ?? []).map(report => ({ ...report, post: byId.get(report.post_id) ?? null })), posts: posts ?? [] });
}
