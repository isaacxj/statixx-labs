import { COMMENT_PARENT_TYPES, type Comment, type CommentParentType } from "@/server/db/schema";

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export const COMMENT_MAX = 2000;

export function parseCommentInput(form: FormData): Result<string> {
  const body = String(form.get("body") ?? "").replace(/\r\n/g, "\n").trim();
  if (!body) return { ok: false, error: "Write a comment before sending." };
  if (body.length > COMMENT_MAX) return { ok: false, error: `Comments can be up to ${COMMENT_MAX.toLocaleString("en-US")} characters.` };
  return { ok: true, value: body };
}

export function parseCommentParentType(raw: unknown): Result<CommentParentType> {
  const type = COMMENT_PARENT_TYPES.find((t) => t === String(raw ?? ""));
  return type ? { ok: true, value: type } : { ok: false, error: "That can't be commented on." };
}

export const commentKey = (type: CommentParentType, id: number) => `${type}:${id}`;

/** Groups comments by their approval or request, oldest first so a back-and-forth reads in order. */
export function groupComments(items: Comment[]): Map<string, Comment[]> {
  const map = new Map<string, Comment[]>();
  const ordered = [...items].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id);
  for (const c of ordered) {
    const key = commentKey(c.parentType, c.parentId);
    map.set(key, [...(map.get(key) ?? []), c]);
  }
  return map;
}
