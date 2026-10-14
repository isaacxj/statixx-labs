declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    FILES: R2Bucket;
    DEV_USER_EMAIL?: string;
  }
}
