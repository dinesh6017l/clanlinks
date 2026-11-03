import type { LinkType } from "./types";
export function detectLink(raw: string): { type: LinkType; th: number | null; url: string } | null {
  try {
    const parsed = new URL(raw.trim());
    if (parsed.protocol !== "https:" || parsed.hostname !== "link.clashofclans.com") return null;
    const action = parsed.searchParams.get("action");
    if (action === "OpenLayout") {
      const id = parsed.searchParams.get("id") ?? "";
      const match = id.match(/(?:TH|TownHall)(\d{1,2})/i);
      return id ? { type: "Base", th: match ? Number(match[1]) : null, url: parsed.toString() } : null;
    }
    if (action === "OpenPlayerProfile") return parsed.searchParams.get("tag") ? { type: "Player", th: null, url: parsed.toString() } : null;
    if (action === "OpenClanProfile") return parsed.searchParams.get("tag") ? { type: "Clan", th: null, url: parsed.toString() } : null;
    return null;
  } catch { return null; }
}
export function cleanText(value: unknown, max: number) { return typeof value === "string" ? value.replace(/[<>\u0000-\u001F]/g, "").trim().slice(0, max) : ""; }
