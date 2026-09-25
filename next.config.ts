import type { NextConfig } from "next";
const config: NextConfig = {
  allowedDevOrigins: ["192.168.53.13"],
  serverExternalPackages: ["pg"],
  experimental: {
    serverActions: { bodySizeLimit: "20mb" },
  },
};
export default config;
