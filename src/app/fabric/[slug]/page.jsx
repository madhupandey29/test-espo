import Wrapper       from '@/layout/wrapper';
import HeaderTwo     from '@/layout/headers/header-2';
import Footer        from '@/layout/footers/footer';
import ProductClient from './ProductDetailsClient';
import { generateMetadata as generateSEOMetadata } from '@/utils/seo';
import { getProductImageUrl } from '@/utils/imageContract';
import { generateProductStructuredData } from '@/utils/productStructuredData';
import { BreadcrumbJsonLd } from '@/utils/breadcrumbStructuredData';
import { FaqJsonLd } from '@/utils/faqStructuredData';
import { CollectionItemListJsonLd } from '@/utils/collectionItemListStructuredData';

import ProductStructuredDataHeadClient from '@/components/seo/ProductStructuredDataHead.client';

export const revalidate = 86400;

/* -----------------------------
  helpers
----------------------------- */
const pick = (...v) => v.find(x => x !== undefined && x !== null && String(x).trim() !== '');

const stripTrailingSlash = (s = '') => String(s || '').replace(/\/+$/, '');

const stripHtml = (html = '') =>
  String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// ✅ API base from env
const API_BASE = stripTrailingSlash(process.env.NEXT_PUBLIC_API_BASE_URL || '');

/* -----------------------------
  Product fetcher (YOUR API)
----------------------------- */
async function getProductBySlug(slug) {
  try {
    // Clean the slug by removing trailing hash character
    const cleanSlug = slug ? slug.replace(/#$/, '') : slug;
    // ✅ FIX: Since the slug endpoint is broken, get all products and search client-side
    const res = await fetch(`${API_BASE}/product?limit=150`, {
      next: { revalidate },
    });
    
    if (!res.ok) return null;

    const j = await res.json();
    
    // Handle the response structure and find product by slug
    let products = [];
    if (j?.success && j?.data && Array.isArray(j.data)) {
      products = j.data;
    } else if (j?.products && Array.isArray(j.products)) {
      products = j.products;
    } else if (Array.isArray(j)) {
      products = j;
    }
    
    if (products.length === 0) {
      return null;
    }
    
    // Search for product by slug in multiple fields
    const foundProduct = products.find(product => {
      const productSlug = product?.productslug;
      const aiTempSlug = product?.aiTempOutput;
      const fabricCode = product?.fabricCode;
      const productId = product?.id;
      
      return (
        productSlug === cleanSlug ||
        aiTempSlug === cleanSlug ||
        fabricCode === cleanSlug ||
        productId === cleanSlug
      );
    });
    
    return foundProduct || null;
  } catch (error) {
    return null;
  }
}

/* -----------------------------
  Website FAQs fetcher
----------------------------- */
async function getWebsiteFaqs() {
  try {
    const res = await fetch(`${API_BASE}/websitefaq`, {
      next: { revalidate },
    });
    
    if (!res.ok) return [];

    const j = await res.json();
    
    // Handle the response structure
    if (j?.success && j?.data) {
      return Array.isArray(j.data) ? j.data : [j.data];
    }
    if (Array.isArray(j)) {
      return j;
    }
    return j?.data || [];
  } catch (error) {
    return [];
  }
}

/* -----------------------------
  Collection Products fetcher
----------------------------- */
async function getCollectionProducts(collectionId) {
  if (!collectionId || String(collectionId).trim() === '') {
    return [];
  }

  try {
    const res = await fetch(`${API_BASE}/product?limit=150`, {
      next: { revalidate },
    });
    
    if (!res.ok) return [];

    const j = await res.json();
    
    // Handle the response structure
    let products = [];
    if (j?.success && j?.data && Array.isArray(j.data)) {
      products = j.data;
    } else if (j?.products && Array.isArray(j.products)) {
      products = j.products;
    } else if (Array.isArray(j)) {
      products = j;
    }
    
    // Filter products by collection ID
    const filteredProducts = products.filter(product => {
      return product.collectionId === collectionId || 
             product.collection === collectionId ||
             product.collection_id === collectionId;
    });
    
    return filteredProducts;
  } catch (error) {
    return [];
  }
}

/* -----------------------------
  Metadata
----------------------------- */
export async function generateMetadata({ params }) {
  const { slug } = await params;

  const product = await getProductBySlug(slug);

  const fallbackTitle = String(slug || '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  const title = pick(product?.productTitle, product?.name, fallbackTitle);

  const description = stripHtml(
    pick(product?.shortProductDescription, product?.description, '')
  ) || "View detailed information about our premium fabric products.";

  // Extract keywords from product data
  const productKeywords = product?.keywords || [];
  const keywordsString = Array.isArray(productKeywords) 
    ? productKeywords.join(', ') 
    : productKeywords || "fabric, textile, premium quality, materials";

  // ✅ OG image should be "image1CloudUrlWeb" field (your requirement)
  const ogImageUrl = getProductImageUrl(product, { variant: 'metadata' }) || '';

  // Dynamic robots tag - index if product exists, noindex if not found
  const robotsTag = product ? "index, follow" : "noindex, nofollow";

  return generateSEOMetadata({
    title: `${title}`,
    description,
    keywords: keywordsString,
    path: `/fabric/${slug}`,
    ogImage: ogImageUrl,
    robots: robotsTag
  });
}

/* -----------------------------
  Page component
----------------------------- */
export default async function Page({ params }) {
  const { slug } = await params;

  try {
    // Fetch product data for structured data
    const product = await getProductBySlug(slug);
    
    // Fetch website FAQs for structured data
    const websiteFaqs = await getWebsiteFaqs();
    
    // Get collection ID from product
    const collectionId = product?.collectionId || product?.collection?.id || product?.collection?._id || product?.collection || null;
    
    // Fetch collection products for ItemList structured data
    const collectionProducts = collectionId ? await getCollectionProducts(collectionId) : [];
    
    // Generate structured data
    const productStructuredData = generateProductStructuredData(product);
    
    // Product title for breadcrumb
    const productTitle = pick(product?.productTitle, product?.name, 'Product Details');
    
    // Breadcrumb structured data
    const breadcrumbStructuredData = [
      { name: 'Home', url: '/' },
      { name: 'Fabric', url: '/fabric' },
      { name: productTitle, url: `/fabric/${slug}` }
    ];

    return (
      <>
        {/* Render JSON-LD outside Wrapper for SSR */}
        <ProductStructuredDataHeadClient productStructuredData={productStructuredData} />
        <BreadcrumbJsonLd breadcrumbItems={breadcrumbStructuredData} />
        <FaqJsonLd product={product} websiteFaqs={websiteFaqs} />
        <CollectionItemListJsonLd 
          products={collectionProducts} 
          currentProduct={product}
          collectionData={product?.collection}
        />
        
        <Wrapper>
          <HeaderTwo style_2 />
         <ProductClient slug={slug} initialProduct={product} />
          <Footer primary_style />
        </Wrapper>
      </>
    );
  } catch (error) {
    console.error('Error in fabric page:', error);
    
    // Fallback without structured data
    return (
      <Wrapper>
        <HeaderTwo style_2 />
        <ProductClient slug={slug} initialProduct={product} />
        <Footer primary_style />
      </Wrapper>
    );
  }
}

