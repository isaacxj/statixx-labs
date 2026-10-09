import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  { ignores: ["dist/**", ".wrangler/**", ".next/**", ".vinext/**", "worker-configuration.d.ts", "next-env.d.ts"] },
];

export default config;
