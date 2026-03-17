import Wrapper from "@/layout/wrapper";
import HeaderTwo from "@/layout/headers/header-2";
import ProductDetailsClient from "./ProductDetailsClient";
import Footer from "@/layout/footers/footer";
import { generateMetadata as generateSEOMetadata, getOptimizedLogoUrl } from "@/utils/seo";
import { getProductImageUrl } from '@/utils/imageContract';
import { generateProductStructuredData } from "@/utils/productStructuredData";

import StructuredDataScriptsClient from '@/components/seo/StructuredDataScripts.client';

const DEFAULT_PRODUCT_ID = '695799535233a620b';

// Server-side function to fetch product data for metadata
async function getProductData(productId) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/product/${productId}`,
      { next: { revalidate: 86400 } } // Cache for 10 minutes
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch product');
    }
    
    const data = await response.json();
    return data?.data || null;
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({ searchParams }) {
  // Get product ID from search params or use default
  const sp = await searchParams;
  const productId = sp?.id || DEFAULT_PRODUCT_ID;
  
  // Fetch product data for metadata
  const product = await getProductData(productId);
  
  const firstImage = getProductImageUrl(product, { variant: 'metadata' }) || null;
  
  // Logo URL - construct Next.js optimized image URL with base URL from env
  const logoUrl = getOptimizedLogoUrl();
  
  const productTitle = product?.name || product?.productTitle || product?.title || "Product Details";
  const productDescription = product?.shortProductDescription || 
                           product?.description || 
                           product?.productdescription || 
                           "View detailed information about our premium fabric products.";
  
  // Extract keywords from product data
  const productKeywords = product?.keywords || [];
  const keywordsString = Array.isArray(productKeywords) 
    ? productKeywords.join(', ') 
    : productKeywords || "product details, fabric, textile, premium quality, materials";
  
  // Dynamic robots tag - index if product exists, noindex if not found
  const robotsTag = product ? "index, follow" : "noindex, nofollow";
  
  return generateSEOMetadata({
    title: `${productTitle} - Shofy`,
    description: productDescription,
    keywords: keywordsString,
    path: `/product-details?id=${productId}`,
    ogImage: firstImage,
    ogLogo: logoUrl,
    robots: robotsTag
  });
}

export default async function ProductDetailsPage({ searchParams }) {
  const sp = await searchParams;
  const productId = sp?.id || DEFAULT_PRODUCT_ID;
  
  // Fetch product data for structured data
  const product = await getProductData(productId);
  
  // Generate structured data
  const productStructuredData = generateProductStructuredData(product);
  
  return (
    <>
      {/* Server-side JSON-LD - visible to all crawlers and validators */}
      {productStructuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productStructuredData) }}
        />
      )}
      
      <Wrapper>
        <HeaderTwo style_2={true} />
        <ProductDetailsClient productId={productId} initialProduct={product} />
        <Footer primary_style={true} />
      </Wrapper>
    </>
  );
}


