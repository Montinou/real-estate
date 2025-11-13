/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_APP_NAME: 'PropTech AI',
    NEXT_PUBLIC_APP_DESCRIPTION: 'Real Estate Intelligence Platform for Argentina'
  },
  images: {
    domains: [
      'http2.mlstatic.com',
      'img10.naventcdn.com',
      'static.zonaprop.com.ar',
      'www.properati.com.ar',
      'img.properati.com',
      'property-images.1154ac48d60dfeb452e573ed0be70bd6.r2.dev'
    ]
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' }
        ]
      }
    ];
  }
};

module.exports = nextConfig;