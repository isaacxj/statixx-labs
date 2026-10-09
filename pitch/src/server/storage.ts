import { env } from "cloudflare:workers";

export async function putLogo(key: string, file: File) {
  await env.LOGOS.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
}

export async function getLogo(key: string) {
  return env.LOGOS.get(key);
}

export async function deleteLogo(key: string) {
  await env.LOGOS.delete(key);
}
