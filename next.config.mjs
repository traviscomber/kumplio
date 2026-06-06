/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 5,
  },
  experimental: {
    // Removed invalid isrMemoryCacheSize option
  },
  staticPageGenerationTimeout: 120,
  // Allow HMR from Vercel Sandbox environment
  allowedDevOrigins: [
    'vm-78e3ge8hc20jbvfj4sutbj03.vusercontent.net',
    'localhost:3000',
    '127.0.0.1:3000',
  ],
}

export default nextConfig
