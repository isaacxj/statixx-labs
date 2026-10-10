import { env } from "cloudflare:workers";

/** Logos live in R2 under a key per business and upload, so a new logo busts caches. */
export async function putLogo(businessId: number, file: File): Promise<string> {
  const key = `business-${businessId}/${crypto.randomUUID()}`;
  await env.LOGOS.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  return key;
}

export async function getLogo(key: string) {
  return env.LOGOS.get(key);
}

export async function deleteLogo(key: string) {
  await env.LOGOS.delete(key);
}
