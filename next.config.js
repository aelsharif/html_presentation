/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for presentation content
  poweredByHeader: false,
  
  // Handle trailing slashes
  trailingSlash: true,
  
  // Images configuration
  images: {
    unoptimized: true,
  },
  
  // Custom webpack config for slide content
  webpack: (config, { isServer }) => {
    // Allow importing of HTML files as text
    config.module.rules.push({
      test: /\.html$/,
      use: 'raw-loader'
    });
    
    return config;
  },
  
  // Custom headers for better caching of slides
  async headers() {
    return [
      {
        source: '/slides/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ];
  },
  
  // Redirect rules to handle different URL patterns
  async redirects() {
    return [
      {
        source: '/presentation/:folder/',
        destination: '/presentation/:folder/slide/1/',
        permanent: false,
      },
      {
        source: '/presentation/:folder',
        destination: '/presentation/:folder/slide/1/',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;