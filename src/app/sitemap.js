export const revalidate = 86400; // Revalidate every 5 minutes
import { SitemapManager } from '@/utils/sitemap-manager';
import { logSitemapStats, validateSitemapData } from '@/utils/sitemap-utils';
import { getApiBaseUrl, getSiteUrl } from '@/utils/runtimeConfig';

export default async function sitemap() {
  const baseUrl = getSiteUrl();
  const apiBaseUrl = getApiBaseUrl();
  
  try {
    // Initialize sitemap manager
    const sitemapManager = new SitemapManager(baseUrl, apiBaseUrl);
    
    // Generate complete sitemap
    const allPages = await sitemapManager.generateSitemap();
    
    // Validate and log statistics
    validateSitemapData(allPages);
    const stats = logSitemapStats(allPages);
    
    return allPages;
    
  } catch (error) {
    console.error('Sitemap generation error:', error);
    
    // Fallback to basic static pages (only active routes)
    const fallbackPages = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
      {
        url: `${baseUrl}/fabric`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/capabilities`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/blog`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/contact`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      },
      {
        url: `${baseUrl}/about`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      },
    ];
    
    return fallbackPages;
  }
} 