/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'networthy-production.up.railway.app'],
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  },
  async rewrites() {
    let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    
    // Ensure the URL has a protocol
    if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
      apiUrl = `https://${apiUrl}`;
    }
    
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
