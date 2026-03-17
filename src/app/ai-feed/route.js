import { NextResponse } from 'next/server';

const PAGE_SIZE = 100;

// Cache response for 1 hour — adjust if products change more frequently
export const revalidate = 3600;

function buildAbsoluteUrl(request, page) {
  const url = new URL(request.url);
  url.searchParams.set('page', String(page));
  return url.toString();
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);

    // NEXT_PUBLIC_API_BASE_URL already includes /api (e.g. https://espobackend.vercel.app/api)
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/product?limit=500`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch products from backend' },
        { status: 500 }
      );
    }

    const payload = await res.json();

    // Backend returns { success: true, data: [...] } or plain array
    let productsArray = [];
    if (payload?.success && Array.isArray(payload.data)) {
      productsArray = payload.data;
    } else if (Array.isArray(payload)) {
      productsArray = payload;
    } else if (Array.isArray(payload?.products)) {
      productsArray = payload.products;
    } else if (Array.isArray(payload?.items)) {
      productsArray = payload.items;
    }

    // Filter by merchTag to match what the shop shows (ecatalogue products only)
    const MERCH_TAG = process.env.NEXT_PUBLIC_MERCH_TAG_FILTER;
    const filtered = MERCH_TAG
      ? productsArray.filter((p) => Array.isArray(p.merchTags) && p.merchTags.includes(MERCH_TAG))
      : productsArray;

    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    const pageItems = filtered.slice(start, start + PAGE_SIZE);

    const products = pageItems.map((item) => ({
      id: item.id || item._id || '',
      sku: item.fabricCode || item.sku || '',
      title: item.productTitle || item.name || item.title || '',
      description: item.shortProductDescription || item.description || '',
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/fabric/${item.productslug || item.slug || item.aiTempOutput || item.fabricCode || ''}`,
      image_url: item.image1CloudUrlCard || item.image1CloudUrl || item.image || '',
      brand: item.brand || 'Amrita Global Enterprises',
      category: typeof item.category === 'string' ? item.category : item.category?.name || '',
      material: Array.isArray(item.content) ? item.content.join(', ') : item.material || '',
      availability: item.availability || 'in_stock',
      updated_at: item.updatedAt || item.modifiedAt || null,
    }));

    return NextResponse.json({
      feed: 'ai-feed',
      version: '1.0',
      generated_at: new Date().toISOString(),
      page: safePage,
      page_size: PAGE_SIZE,
      total_items: totalItems,
      total_pages: totalPages,
      next_page: safePage < totalPages ? buildAbsoluteUrl(request, safePage + 1) : null,
      prev_page: safePage > 1 ? buildAbsoluteUrl(request, safePage - 1) : null,
      products,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Unexpected error', message: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
