# Performance Optimization Guide

## Current Issues Fixed:

### 1. Image Optimization ✅

- Added `unoptimized: false` to next.config.js
- Added preconnect for Cloudinary CDN
- Images now use AVIF/WebP formats

### 2. DNS Prefetch & Preconnect ✅

- Added DNS prefetch for external resources
- Added preconnect for critical resources (Cloudinary, Google Fonts)

### 3. Bundle Optimization ✅

- Configured code splitting in next.config.js
- Optimized chunk sizes (60KB-120KB)
- Separated vendor bundles (React, Redux, Swiper, etc.)

## Additional Steps to Reach 95+ Performance:

### 1. Remove Unused Dependencies

Run this command to analyze your bundle:

```bash
ANALYZE=true npm run build
```

### 2. Optimize Third-Party Scripts

- Google Analytics and Clarity are already optimized with `beforeInteractive`
- Consider removing GTM if not actively used

### 3. Enable Compression

Your server should enable:

- Gzip/Brotli compression
- HTTP/2 or HTTP/3

### 4. Reduce JavaScript Execution Time

Current optimizations:

- Dynamic imports with `ssr: false` for heavy components
- Code splitting by route
- Tree shaking enabled

### 5. Minimize Main Thread Work

- Remove console.logs in production ✅ (already configured)
- Lazy load below-the-fold content ✅ (already done)

### 6. Reduce Unused CSS

Add this to your package.json scripts:

```json
"purge-css": "purgecss --css .next/**/*.css --content .next/**/*.html --output .next/static/css"
```

### 7. Use Production Build

Always test performance on production build:

```bash
npm run build
npm start
```

Development mode is slower due to:

- Source maps
- Hot reload
- Unminified code

### 8. Optimize Fonts

Already optimized:

- Using next/font for self-hosting ✅
- Reduced font weights to 400, 600, 700 ✅
- Font display: swap ✅

### 9. Defer Non-Critical CSS

Swiper CSS is loaded dynamically ✅

### 10. Enable Static Generation Where Possible

Your homepage already uses ISR with 60s revalidation ✅

## Testing Performance:

### Production Build Test:

```bash
npm run build
npm start
```

Then run Lighthouse on `http://localhost:3000`

### Expected Improvements:

- Performance: 31 → 85-95
- Best Practices: 73 → 90+
- SEO: 92 → 95+
- Accessibility: 87 → 90+

## Quick Wins:

1. **Remove unused dependencies** - Check package.json for unused packages
2. **Optimize images** - Use Cloudinary transformations (already configured)
3. **Enable caching** - Server-side caching headers (already configured)
4. **Minimize redirects** - Avoid redirect chains
5. **Use CDN** - Serve static assets from CDN (Vercel does this automatically)

## Monitoring:

Use these tools to monitor performance:

- Lighthouse CI
- Web Vitals
- Vercel Analytics (if deployed on Vercel)

## Next Steps:

1. Run production build
2. Test with Lighthouse
3. Check Network tab for large resources
4. Optimize any remaining large bundles
