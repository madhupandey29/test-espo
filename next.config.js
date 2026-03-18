/** @type {import('next').NextConfig} */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { withSentryConfig } = require('@sentry/nextjs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const isCi = process.env.CI === 'true';

/* ---------- helpers ---------- */
const safeOrigin = (value) => {
  try {
    if (!value) return '';
    return new URL(value).origin;
  } catch {
    return '';
  }
};

const toRemotePattern = (value) => {
  try {
    if (!value) return null;

    const url = new URL(value);
    const pathname =
      url.pathname && url.pathname !== '/'
        ? `${url.pathname.replace(/\/$/, '')}/**`
        : '/**';

    return {
      protocol: url.protocol.replace(':', ''),
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
      pathname,
    };
  } catch {
    return null;
  }
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const cdnBaseUrl = process.env.NEXT_PUBLIC_CDN_BASE;
const legacyAssetOrigin =
  process.env.NEXT_PUBLIC_LEGACY_ASSET_ORIGIN || process.env.LEGACY_ASSET_ORIGIN || '';

const isProduction = process.env.NODE_ENV === 'production';
const localDevOrigins = isProduction ? [] : ['http://localhost:3000', 'http://localhost:7000'];

const apiDomain = safeOrigin(apiBaseUrl);
const siteDomain = safeOrigin(siteUrl);
const cdnDomain = safeOrigin(cdnBaseUrl);
const legacyAssetDomain = safeOrigin(legacyAssetOrigin);

const dynamicImagePatterns = [
  toRemotePattern(apiBaseUrl),
  toRemotePattern(siteUrl),
  toRemotePattern(cdnBaseUrl),
  toRemotePattern(legacyAssetOrigin),
].filter(Boolean);

const localDevImagePatterns = isProduction
  ? []
  : [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '7000',
        pathname: '/**',
      },
    ];

// Security headers for fabric e-commerce site
const getSecurityHeaders = () => {
  const sentryDsn =
    process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;
  const sentryDomain = safeOrigin(sentryDsn);

  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    "'wasm-unsafe-eval'",
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    'https://www.clarity.ms',
    'https://scripts.clarity.ms',
    'https://accounts.google.com',
    'https://vercel.live',
    'https://*.vercel.app',
    'https://vercel.com',
    'https://va.vercel-scripts.com',
    'https://maps.googleapis.com',
    'https://maps.gstatic.com',
    apiDomain,
    siteDomain,
  ].filter(Boolean).join(' ');

  const imgSrc = [
    "'self'",
    'data:',
    'blob:',
    'https://res.cloudinary.com',
    'https://i.ibb.co',
    'https://lh3.googleusercontent.com',
    'https://img.youtube.com',
    legacyAssetDomain,
    ...localDevOrigins,
    'https://maps.googleapis.com',
    'https://maps.gstatic.com',
    'https://*.googleapis.com',
    'https://*.gstatic.com',
    'https://c.clarity.ms',
    'https://c.bing.com',
    'https://www.google.co.in',
    apiDomain,
    siteDomain,
    cdnDomain,
  ].filter(Boolean).join(' ');

  const connectSrc = [
    "'self'",
    apiDomain,
    'https://www.google-analytics.com',
    'https://analytics.google.com',
    'https://stats.g.doubleclick.net',
    'https://vitals.vercel-insights.com',
    'https://vercel.live',
    'https://www.clarity.ms',
    'https://scripts.clarity.ms',
    'https://*.clarity.ms',
    'https://accounts.google.com',
    'https://www.youtube-nocookie.com',
    'https://maps.googleapis.com',
    'https://espo.egport.com',
    'https://www.google.co.in',
    sentryDomain,
    siteDomain,
  ].filter(Boolean).join(' ');

  return [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    {
      key: 'Permissions-Policy',
      value:
        'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
    },
    { key: 'X-DNS-Prefetch-Control', value: 'on' },
    {
      key: 'Strict-Transport-Security',
      value: 'max-age=31536000; includeSubDomains; preload',
    },
    {
      key: 'Content-Security-Policy',
      value: [
        "default-src 'self'",
        `script-src ${scriptSrc}`,
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://maps.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com https://maps.gstatic.com data:",
        `img-src ${imgSrc}`,
        `connect-src ${connectSrc}`,
        "frame-src 'self' https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com https://accounts.google.com https://www.google.com https://maps.google.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self' https://espo.egport.com",
        "frame-ancestors 'self'",
        'upgrade-insecure-requests',
      ].join('; '),
    },
  ];
};

const nextConfig = {
  // helps if Next ever infers wrong root because of workspace files
  turbopack: { root: __dirname },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.ibb.co', pathname: '/**' },
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      { protocol: 'https', hostname: 'img.youtube.com', pathname: '/**' },
      ...dynamicImagePatterns,
      ...localDevImagePatterns,
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [75, 90],
    minimumCacheTTL: 60,
    loader: 'default',
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: false,
  },

  async headers() {
    return [
      { source: '/((?!_next/static).*)', headers: getSecurityHeaders() },

      {
        source: '/assets/css/:path*',
        headers: [
          { key: 'Content-Type', value: 'text/css; charset=utf-8' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        source: '/_next/static/css/:path*',
        headers: [
          { key: 'Content-Type', value: 'text/css; charset=utf-8' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/js/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/chunks/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/assets/fonts/:path*.woff2',
        headers: [{ key: 'Content-Type', value: 'font/woff2' }],
      },
      {
        source: '/assets/fonts/:path*.ttf',
        headers: [{ key: 'Content-Type', value: 'font/ttf' }],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  typescript: { ignoreBuildErrors: true },

  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn'] }
        : false,
  },

  poweredByHeader: false,
  productionBrowserSourceMaps: true,
  compress: true,

  experimental: {
    optimizePackageImports: [
      'react-icons/fa',
      'react-icons/fi',
      'react-icons/fa6',
      'react-icons/ai',
      'react-icons/bs',
      'react-icons/cg',
      'react-icons/tb',
      'react-toastify',
    ],
    optimizeCss: true,
  },

  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  modularizeImports: {
    'react-icons': { transform: 'react-icons/{{member}}' },
    'react-icons/fa': { transform: 'react-icons/fa/{{member}}' },
    'react-icons/fi': { transform: 'react-icons/fi/{{member}}' },
    'react-icons/fa6': { transform: 'react-icons/fa6/{{member}}' },
    'react-icons/ai': { transform: 'react-icons/ai/{{member}}' },
    'react-icons/bs': { transform: 'react-icons/bs/{{member}}' },
    'react-icons/cg': { transform: 'react-icons/cg/{{member}}' },
    'react-icons/tb': { transform: 'react-icons/tb/{{member}}' },
  },

  webpack: (config, { dev, isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        canvg: require.resolve('./src/vendor/jspdf/canvg-stub.js'),
        html2canvas: require.resolve('./src/vendor/jspdf/html2canvas-stub.js'),
        dompurify: require.resolve('./src/vendor/jspdf/dompurify-stub.js'),
      };
    }
    if (!dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'react/jsx-runtime': 'react/jsx-runtime',
        'react/jsx-dev-runtime': 'react/jsx-dev-runtime',
        'next/dist/compiled/next-devtools$':
          require.resolve('next/dist/next-devtools/dev-overlay.shim.js'),
      };

      config.ignoreWarnings = [
        /Event handlers cannot be passed to Client Component props/,
        /Functions cannot be passed directly to Client Components/,
        /Attempted import error/,
        { module: /node_modules/ },
      ];
    }

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
    };

    return config;
  },

  async redirects() {
    return [];
  },
};

const sentryWebpackPluginOptions = {
  silent: !isCi,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
};

if (process.env.SENTRY_AUTH_TOKEN) {
  sentryWebpackPluginOptions.authToken = process.env.SENTRY_AUTH_TOKEN;
}

if (process.env.SENTRY_ORG) {
  sentryWebpackPluginOptions.org = process.env.SENTRY_ORG;
}

if (process.env.SENTRY_PROJECT) {
  sentryWebpackPluginOptions.project = process.env.SENTRY_PROJECT;
}

module.exports = withSentryConfig(
  withBundleAnalyzer(nextConfig),
  sentryWebpackPluginOptions
);




