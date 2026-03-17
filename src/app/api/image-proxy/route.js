import { NextResponse } from 'next/server';

const LEGACY_ASSET_ORIGIN =
  process.env.NEXT_PUBLIC_LEGACY_ASSET_ORIGIN || process.env.LEGACY_ASSET_ORIGIN || '';

const getAllowedHostname = (value = '') => {
  try {
    return value ? new URL(value).hostname : '';
  } catch {
    return '';
  }
};

const getRequestHostname = (request) => {
  try {
    return request.nextUrl?.hostname || new URL(request.url).hostname || '';
  } catch {
    return '';
  }
};

const getAllowedHostnames = (request) =>
  new Set(
    [
      'res.cloudinary.com',
      'i.ibb.co',
      'lh3.googleusercontent.com',
      'img.youtube.com',
      getRequestHostname(request),
      getAllowedHostname(process.env.NEXT_PUBLIC_API_BASE_URL),
      getAllowedHostname(process.env.NEXT_PUBLIC_SITE_URL),
      getAllowedHostname(process.env.NEXT_PUBLIC_CDN_BASE),
      getAllowedHostname(LEGACY_ASSET_ORIGIN),
      ...(process.env.NODE_ENV === 'production' ? [] : ['localhost', '127.0.0.1']),
    ]
      .filter(Boolean)
      .map((hostname) => hostname.toLowerCase())
  );

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    let url;
    try {
      url = new URL(decodeURIComponent(imageUrl));
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    const allowedHostnames = getAllowedHostnames(request);
    if (!allowedHostnames.has(url.hostname.toLowerCase())) {
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
    }

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PDF-Generator/1.0)',
        Accept: 'image/*',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'Response is not an image' }, { status: 400 });
    }

    const imageBuffer = await response.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);

    if (error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timeout' }, { status: 408 });
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}