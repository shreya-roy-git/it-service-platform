import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // TypeScript 5.x provides the compiler API used by this project. The Next CLI
    // runner cannot capture its config output correctly in this environment.
    useTypeScriptCli: false,
  },
};

export default nextConfig;
