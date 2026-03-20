import { NextResponse } from 'next/server';
import { SitemapManager } from '@/utils/sitemap-manager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    
    const sitemapManager = new SitemapManager(baseUrl, apiBaseUrl);
    const data = await sitemapManager.generateSitemap();
    
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Sitemap data API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        data: []
      },
      { status: 500 }
    );
  }
}
