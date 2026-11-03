import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const db = () => {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key) : null;
};

export function hashCode(code: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(code, salt, 64).toString("hex")}`;
}

export function verifyCode(code: string, stored: string | null | undefined) {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const a = Buffer.from(hash, "hex");
  const b = scryptSync(code, salt, 64);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function slugify(value: string) {
  const slug = value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 36);
  return slug || `clan-${createHash("sha256").update(value).digest("hex").slice(0, 8)}`;
}

export async function boardRole(slug: string, memberCode: string, adminCode = "") {
  const client = db();
  if (!client) return { client: null, board: null, role: null };
  const { data: board } = await client.from("boards").select("slug,name,member_code_hash,admin_code_hash").eq("slug", slug).maybeSingle();
  if (!board) return { client, board: null, role: null };
  const role = verifyCode(adminCode, board.admin_code_hash) ? "admin" :
    !board.member_code_hash || verifyCode(memberCode, board.member_code_hash) ? "member" : null;
  return { client, board, role };
}

export async function postIsInBoard(client: NonNullable<ReturnType<typeof db>>, postId: string, slug: string) {
  const { data } = await client.from("posts").select("id").eq("id", postId).eq("board_slug", slug).maybeSingle();
  return !!data;
}
