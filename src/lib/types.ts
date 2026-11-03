export type LinkType = "Base" | "Friend" | "Clan" | "Player";
export type Post = { id: string; board_slug: string; url: string; type: LinkType; th_level: number | null; author: string; mention: string | null; note: string; tags: string[]; created_at: string; likes_count: number; liked?: boolean; saved?: boolean; is_pinned?: boolean; expires_at?: string | null; hidden?: boolean; rating_avg?: number; rating_count?: number; comment_count?: number };
export type Member = { name: string; board_slug: string; post_count: number; last_active: string; town_hall?: number | null; bio?: string; player_tag?: string | null; coc_verified_at?: string | null };
export type Board = { slug: string; name: string; created_at?: string };
export type Comment = { id: string; user_name: string; body: string; created_at: string };
