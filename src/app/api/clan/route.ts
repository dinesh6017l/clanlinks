import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) { const body = await req.json().catch(() => ({})); return NextResponse.json({ ok: !process.env.CLAN_PASSCODE || body.passcode === process.env.CLAN_PASSCODE }); }
