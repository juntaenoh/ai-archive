import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  transpilePackages: ['next-mdx-remote'],
}

export default nextConfig
