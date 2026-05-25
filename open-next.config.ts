import { defineCloudflareConfig, type OpenNextConfig } from "@opennextjs/cloudflare";

const config = {
  ...defineCloudflareConfig(),
  buildCommand: "npm run next:build"
} satisfies OpenNextConfig;

export default config;
