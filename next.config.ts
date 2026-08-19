import type { NextConfig } from "next";

const legacyProficiencyRedirects = [
  { source: "/hsk1", destination: "/resources?levelSystem=HSK&level=HSK1", permanent: false },
  { source: "/hsk2", destination: "/resources?levelSystem=HSK&level=HSK2", permanent: false },
  { source: "/hsk3", destination: "/resources?levelSystem=HSK&level=HSK3", permanent: false },
  { source: "/hsk4", destination: "/resources?levelSystem=HSK&level=HSK4", permanent: false },
  { source: "/hsk5", destination: "/resources?levelSystem=HSK&level=HSK5", permanent: false },
  { source: "/hsk6", destination: "/resources?levelSystem=HSK&level=HSK6", permanent: false },
] as const;

const nextConfig: NextConfig = {
  async redirects() {
    return [...legacyProficiencyRedirects];
  },
};

export default nextConfig;
