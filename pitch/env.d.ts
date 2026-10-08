declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    LOGOS: R2Bucket;
  }
}

declare module "*?raw" {
  const content: string;
  export default content;
}
