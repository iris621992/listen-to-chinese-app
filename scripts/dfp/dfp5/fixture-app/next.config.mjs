import path from "node:path";

const repositoryRoot = path.resolve(import.meta.dirname, "../../../..");

const nextConfig = {
  turbopack: {
    root: repositoryRoot,
  },
};

export default nextConfig;
