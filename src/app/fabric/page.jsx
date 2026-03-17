// app/fabric/page.jsx
import { Suspense } from 'react';
import Wrapper from "@/layout/wrapper";
import HeaderTwo from "@/layout/headers/header-2";
import Footer from "@/layout/footers/footer";
import ShopArea from "@/components/shop/shop-area";
import CompactUniversalBreadcrumb from "@/components/breadcrumb/compact-universal-breadcrumb";
import { generateMetadata as generateSEOMetadata, getOptimizedLogoUrl } from "@/utils/seo";
import { BreadcrumbJsonLd } from "@/utils/breadcrumbStructuredData";
import { FabricCollectionJsonLd } from "@/utils/fabricCollectionStructuredData";
import { getPageSeoMetadata, PAGE_NAMES } from "@/utils/topicPageSeoIntegration";
import { getApiBaseUrl } from "@/utils/runtimeConfig";

/* ---------------------------------------------
   Incremental Static Regeneration (ISR)
---------------------------------------------- */
export const revalidate = 86400;

const FABRIC_SEO_FALLBACKS = {
  title: "Premium Fabric Collection | Cotton, Mercerized & Designer Textiles",
  description:
    "Explore our premium fabric collection featuring cotton, mercerized, designer, woven and shirting textiles for apparel, uniforms and fashion manufacturing.",
  keywords:
    "fabric collection, cotton fabric, mercerized fabric, designer textiles, woven fabric, shirting fabric",
};

const isPlaceholderSeoValue = (value) => {
  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized.startsWith("meta ") || normalized === "meta description";
};

/* ---------------------------------------------
   Metadata (Dynamic SEO from Topic Page API)
---------------------------------------------- */
export async function generateMetadata() {
  const logoUrl = getOptimizedLogoUrl();
  
  // Fetch SEO data from topic page API
  const topicMetadata = await getPageSeoMetadata(PAGE_NAMES.FABRIC, {
    title: null,
    description: null,
    keywords: null,
  });

  // Extract canonical URL from the metadata object
  const canonicalFromApi = topicMetadata.alternates?.canonical || null;
  
  return generateSEOMetadata({
    title: isPlaceholderSeoValue(topicMetadata.title)
      ? FABRIC_SEO_FALLBACKS.title
      : topicMetadata.title || FABRIC_SEO_FALLBACKS.title,
    description: isPlaceholderSeoValue(topicMetadata.description)
      ? FABRIC_SEO_FALLBACKS.description
      : topicMetadata.description || FABRIC_SEO_FALLBACKS.description,
    keywords: isPlaceholderSeoValue(topicMetadata.keywords)
      ? FABRIC_SEO_FALLBACKS.keywords
      : topicMetadata.keywords || FABRIC_SEO_FALLBACKS.keywords,
    path: "/fabric",
    canonicalOverride: canonicalFromApi, // Use canonical from API
    ogImage: "/assets/img/logo/logo.svg",
    ogLogo: logoUrl,
    robots: "index, follow"
  });
}

/**
 * Fetch ALL products on the server (SSR) - Get all 123 products
 */
async function fetchAllProducts() {
  const API_BASE2 = getApiBaseUrl();

  if (!API_BASE2) {
    return {
      products: [],
      total: 0,
      filtered: false,
    };
  }

  // Get merchTag filter from environment variable
  const MERCH_TAG_FILTER = process.env.NEXT_PUBLIC_MERCH_TAG_FILTER;

  // Fetching ALL 123 products...

  try {
    // ✅ FIX: Use the general product endpoint with limit=150 to get all 123 products
    const url = `${API_BASE2}/product?limit=150`;
    const res = await fetch(url, {
      next: { revalidate },
    });
    
    if (!res.ok) {
      // Fallback to collection-based approach
      return await fetchFromCollections(API_BASE2, MERCH_TAG_FILTER);
    }

    const payload = await res.json();
    
    let products = [];
    let totalProducts = 0;
    
    // Handle the API response structure
    if (payload?.success && payload?.data && Array.isArray(payload.data)) {
      products = payload.data;
      totalProducts = payload.total || payload.data.length;
    } else if (payload?.products && Array.isArray(payload.products)) {
      products = payload.products;
      totalProducts = payload.total || payload.products.length;
    } else if (Array.isArray(payload)) {
      products = payload;
      totalProducts = payload.length;
    } else {
      // Fallback to collection-based approach
      return await fetchFromCollections(API_BASE2, MERCH_TAG_FILTER);
    }

    // Check collection distribution
    const collectionStats = {};
    products.forEach(product => {
      const collectionName = product.collectionName || 'No Collection';
      collectionStats[collectionName] = (collectionStats[collectionName] || 0) + 1;
    });
    
    Object.entries(collectionStats).forEach(([collection, count]) => {
      // Collection stats logged for debugging
    });

    // Apply merchTag filtering if MERCH_TAG_FILTER is set
    if (MERCH_TAG_FILTER && products.length > 0) {
      // Filtering by merchTag
      
      const filteredProducts = products.filter((product) => {
        if (!product.merchTags || !Array.isArray(product.merchTags)) {
          return false;
        }
        
        if (product.merchTags.length === 0) {
          return false;
        }
        
        return product.merchTags.includes(MERCH_TAG_FILTER);
      });

      return {
        products: filteredProducts,
        total: filteredProducts.length,
        filtered: true,
        filterTag: MERCH_TAG_FILTER
      };
    }

    // Return ALL products if no filter is set
    return {
      products: products,
      total: totalProducts,
      filtered: false
    };
  } catch (error) {
    // Fallback to collection-based approach
    return await fetchFromCollections(API_BASE2, MERCH_TAG_FILTER);
  }
}

/**
 * Fallback: Fetch from collections if main endpoint fails
 */
async function fetchFromCollections(API_BASE2, MERCH_TAG_FILTER) {
  const collectionIds = [
    '690a0e676132664ee', // Nokia collection
    '695f9b0b956eb958b'  // Majestica collection
  ];

  let allProducts = [];
  let totalProducts = 0;

  // Fetch products from each collection
  for (const collectionId of collectionIds) {
    try {
      const url = `${API_BASE2}/product/fieldname/collectionId/${collectionId}?limit=100`;
      const res = await fetch(url, {
        next: { revalidate },
      });
      
      if (res.ok) {
        const payload = await res.json();
        
        if (payload?.success && payload?.data && Array.isArray(payload.data)) {
          allProducts = [...allProducts, ...payload.data];
          totalProducts += payload.total || payload.data.length;
        }
      }
    } catch (error) {
      // Collection fetch failed - continue with other collections
    }
  }

  // Apply filtering if needed
  if (MERCH_TAG_FILTER && allProducts.length > 0) {
    const filteredProducts = allProducts.filter((product) => {
      return product.merchTags && product.merchTags.includes(MERCH_TAG_FILTER);
    });

    return {
      products: filteredProducts,
      total: filteredProducts.length,
      filtered: true,
      filterTag: MERCH_TAG_FILTER
    };
  }

  return {
    products: allProducts,
    total: totalProducts,
    filtered: false
  };
}

/* ---------------------------------------------
   Page (Server Component)
---------------------------------------------- */
export default async function FabricPage() {
  const productData = await fetchAllProducts();

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Fabrics' }
  ];

  // Breadcrumb structured data
  const breadcrumbStructuredData = [
    { name: 'Home', url: '/' },
    { name: 'Fabrics', url: '/fabric' }
  ];

  return (
    <>
      {/* Render JSON-LD outside Wrapper for SSR */}
      <BreadcrumbJsonLd breadcrumbItems={breadcrumbStructuredData} />
      <FabricCollectionJsonLd 
        products={productData.products} 
        options={{
          filtered: productData.filtered,
          filterTag: productData.filterTag
        }}
      />
      
      <Wrapper>
        <HeaderTwo style_2 />

      {/* ✅ SEO-Optimized H1 for Fabric Page */}
      <h1
        style={{
          position: "absolute",
          left: "-9999px",
          top: "auto",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      >
        Premium Fabric Collection - Cotton, Mercerized & Designer Textiles
        {productData.filtered && ` - ${productData.filterTag} Collection`}
      </h1>

      <CompactUniversalBreadcrumb items={breadcrumbItems} />

      <div className="shop-page-spacing">
        <Suspense fallback={null}>
          <ShopArea 
            initialProducts={productData.products} 
            totalProducts={productData.total}
          />
        </Suspense>
      </div>

      <Footer primary_style />
      </Wrapper>
    </>
  );
}
