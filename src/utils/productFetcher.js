/**
 * Generic Product Fetcher Utility
 * Reusable functions for fetching products across different categories
 */

import { getApiBaseUrl } from '@/utils/runtimeConfig';
import { getCategoryConfig } from './productCategoryConfig';

/**
 * Fetch all products for a category
 * @param {string} categoryId - Category identifier (fabric, fashion, accessories)
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Product data with products array and total count
 */
export async function fetchProductsByCategory(categoryId, options = {}) {
  const API_BASE = getApiBaseUrl();
  const categoryConfig = getCategoryConfig(categoryId);
  
  if (!API_BASE) {
    return {
      products: [],
      total: 0,
      filtered: false,
    };
  }

  // Get merchTag filter from environment variable
  const MERCH_TAG_FILTER = process.env.NEXT_PUBLIC_MERCH_TAG_FILTER;
  const revalidate = options.revalidate || categoryConfig.revalidate || 120;

  try {
    // Use category-specific endpoint and limit
    const url = `${API_BASE}${categoryConfig.api.endpoint}?limit=${categoryConfig.api.limit}`;
    const res = await fetch(url, {
      next: { revalidate },
    });
    
    if (!res.ok) {
      // Fallback to collection-based approach
      return await fetchFromCollections(API_BASE, categoryConfig, MERCH_TAG_FILTER, revalidate);
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
      return await fetchFromCollections(API_BASE, categoryConfig, MERCH_TAG_FILTER, revalidate);
    }

    // Apply merchTag filtering if MERCH_TAG_FILTER is set
    if (MERCH_TAG_FILTER && products.length > 0) {
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
    return await fetchFromCollections(API_BASE, categoryConfig, MERCH_TAG_FILTER, revalidate);
  }
}

/**
 * Fallback: Fetch from collections if main endpoint fails
 */
async function fetchFromCollections(API_BASE, categoryConfig, MERCH_TAG_FILTER, revalidate) {
  const collectionIds = categoryConfig.api.collectionIds || [];

  if (collectionIds.length === 0) {
    return {
      products: [],
      total: 0,
      filtered: false
    };
  }

  let allProducts = [];
  let totalProducts = 0;

  // Fetch products from each collection
  for (const collectionId of collectionIds) {
    try {
      const url = `${API_BASE}/product/fieldname/collectionId/${collectionId}?limit=100`;
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

/**
 * Fetch single product by slug
 * @param {string} slug - Product slug
 * @param {Object} options - Additional options
 * @returns {Promise<Object|null>} Product data or null
 */
export async function fetchProductBySlug(slug, options = {}) {
  const API_BASE = getApiBaseUrl();
  const revalidate = options.revalidate || 600;
  
  if (!API_BASE || !slug) {
    return null;
  }

  try {
    // Clean the slug by removing trailing hash character
    const cleanSlug = slug.replace(/#$/, '');
    
    // Get all products and search client-side
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

/**
 * Fetch website FAQs
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Array of FAQs
 */
export async function fetchWebsiteFaqs(options = {}) {
  const API_BASE = getApiBaseUrl();
  const revalidate = options.revalidate || 600;
  
  if (!API_BASE) {
    return [];
  }

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

/**
 * Fetch collection products
 * @param {string} collectionId - Collection ID
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Array of products in collection
 */
export async function fetchCollectionProducts(collectionId, options = {}) {
  const API_BASE = getApiBaseUrl();
  const revalidate = options.revalidate || 600;
  
  if (!API_BASE || !collectionId || String(collectionId).trim() === '') {
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
