import { NextRequest, NextResponse } from "next/server";
import { boardRole } from "@/lib/board-auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await req.json().catch(() => ({}));
  const memberCode = typeof body.memberCode === "string" ? body.memberCode : "";
  const adminCode = typeof body.adminCode === "string" ? body.adminCode : "";
  const { client, board, role } = await boardRole(slug, memberCode, adminCode);
  if (!client) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  if (!board || !role) return NextResponse.json({ error: "Board not found or passcode is incorrect." }, { status: 403 });
  return NextResponse.json({ board: { slug: board.slug, name: board.name }, role });
}
