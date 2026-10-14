/// <reference types="@cloudflare/workers-types" />

declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    LOGOS: R2Bucket;
    DEV_USER_EMAIL?: string;
  }
}
