import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const testImageUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
    const encodedUrl = encodeURIComponent(testImageUrl);
    const baseUrl = request.nextUrl?.origin || new URL(request.url).origin;
    const proxyUrl = `${baseUrl}/api/image-proxy?url=${encodedUrl}`;

    const response = await fetch(proxyUrl);

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      contentType: response.headers.get('content-type'),
      message: response.ok ? 'Image proxy is working correctly' : 'Image proxy failed',
      testUrl: testImageUrl,
      proxyUrl,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: 'Image proxy test failed',
      },
      { status: 500 }
    );
  }
}