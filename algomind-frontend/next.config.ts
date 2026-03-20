import type { NextConfig } from "next";
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  output: "standalone",

  // Tree-shake large icon libraries — only bundle icons actually used
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "@tabler/icons-react",
      "recharts",
    ],
  },
};

export default withBundleAnalyzer(nextConfig);
