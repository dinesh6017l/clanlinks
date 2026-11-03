export type LinkType = "Base" | "Friend" | "Clan" | "Player";
export type Post = { id: string; url: string; type: LinkType; th_level: number | null; author: string; mention: string | null; note: string; tags: string[]; created_at: string; likes_count: number; liked?: boolean };
export type Member = { name: string; post_count: number; last_active: string };
