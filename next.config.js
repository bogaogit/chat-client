/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  distDir: "out",
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
