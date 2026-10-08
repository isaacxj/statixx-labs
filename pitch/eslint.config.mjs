import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  { ignores: ["dist/**", ".wrangler/**", ".next/**", "worker-configuration.d.ts", "next-env.d.ts"] },
  ...nextVitals,
  ...nextTs,
];

export default config;
