import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const API_BASE = String(
  process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || ''
).replace(/\/+$/, '');
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
const API_KEY_HEADER = process.env.NEXT_PUBLIC_API_KEY_HEADER || 'x-api-key';

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'content-length',
  'content-encoding',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

function buildTargetUrl(pathSegments, search = '') {
  const normalizedPath = Array.isArray(pathSegments)
    ? pathSegments.filter(Boolean).map((segment) => encodeURIComponent(segment)).join('/')
    : '';

  return `${API_BASE}/${normalizedPath}${search}`;
}

function buildProxyHeaders(requestHeaders) {
  const headers = new Headers();

  requestHeaders.forEach((value, key) => {
    const normalizedKey = key.toLowerCase();

    if (HOP_BY_HOP_HEADERS.has(normalizedKey)) {
      return;
    }

    headers.set(key, value);
  });

  if (API_KEY && !headers.has(API_KEY_HEADER)) {
    headers.set(API_KEY_HEADER, API_KEY);
  }

  return headers;
}

function buildResponseHeaders(sourceHeaders) {
  const headers = new Headers();

  sourceHeaders.forEach((value, key) => {
    if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      return;
    }

    headers.set(key, value);
  });

  return headers;
}

async function proxyRequest(request, context) {
  // Read at request time so env vars are always fresh
  const apiBase = String(
    process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || ''
  ).replace(/\/+$/, '');

  if (!apiBase) {
    return NextResponse.json(
      { success: false, message: 'API base URL is not configured.' },
      { status: 500 }
    );
  }

  const { path = [] } = await context.params;
  const normalizedPath = Array.isArray(path)
    ? path.filter(Boolean).map((segment) => encodeURIComponent(segment)).join('/')
    : '';
  const targetUrl = `${apiBase}/${normalizedPath}${request.nextUrl.search}`;

  const method = request.method.toUpperCase();
  const body =
    method === 'GET' || method === 'HEAD' ? undefined : await request.arrayBuffer();

  try {
    const response = await fetch(targetUrl, {
      method,
      headers: buildProxyHeaders(request.headers),
      body,
      cache: 'no-store',
      redirect: 'manual',
    });

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: buildResponseHeaders(response.headers),
    });
  } catch (err) {
    console.error(`[proxy] Failed to reach ${targetUrl}:`, err?.message || err);
    return NextResponse.json(
      { success: false, message: 'Failed to reach upstream API.', detail: err?.message },
      { status: 502 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;
export const HEAD = proxyRequest;
