import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app lives in a subdirectory of the repo; without this, Turbopack
  // guesses the workspace root from the parent lockfile.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
