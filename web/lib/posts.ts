import postsData from "@/data/posts.json";
import type { Post } from "./types";

// Newest first for listing; source order is by `num` (build-posts.mjs).
export const posts = (postsData as Post[])
  .slice()
  .sort((a, b) => b.num - a.num);

export const TOTAL_POSTS = posts.length;

export function getPost(id: string): Post | undefined {
  return posts.find((p) => p.id === id);
}
