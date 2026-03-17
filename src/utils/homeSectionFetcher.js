/**
 * Home Page Dynamic Section Fetcher
 * Fetches products for dynamic sections on the home page
 * Integrates with the reusable product system
 */

import { getApiBaseUrl } from '@/utils/runtimeConfig';

/**
 * Fetch dynamic sections configuration from API
 * @param {Object} options - Fetch options
 * @returns {Promise<Array>} Array of section IDs
 */
export async function fetchDynamicSections(options = {}) {
  const revalidate = options.revalidate || 60;
  
  try {
    const res = await fetch('https://espobackend.vercel.app/api/dynamicsection', {
      next: { revalidate },
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) return [];

    const json = await res.json();
    return Array.isArray(json?.sections) ? json.sections : [];
  } catch (error) {
    console.error('Error fetching dynamic sections:', error);
    return [];
  }
}

/**
 * Fetch all products for home page
 * @param {Object} options - Fetch options
 * @returns {Promise<Array>} Array of products
 */
export async function fetchAllHomeProducts(options = {}) {
  const API_BASE = getApiBaseUrl();
  const revalidate = options.revalidate || 60;
  
  if (!API_BASE) return [];

  try {
    const pageSize = 100;
    const firstPageRes = await fetch(`${API_BASE}/product?page=1&limit=${pageSize}`, {
      next: { revalidate },
    });

    if (!firstPageRes.ok) return [];

    const firstPageData = await firstPageRes.json();
    const firstPageProducts = Array.isArray(firstPageData?.data)
      ? firstPageData.data
      : Array.isArray(firstPageData?.products)
        ? firstPageData.products
        : Array.isArray(firstPageData)
          ? firstPageData
          : [];

    const totalPages = Math.max(1, Number(firstPageData?.pagination?.totalPages) || 1);
    if (totalPages === 1) {
      return firstPageProducts;
    }

    const remainingPages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) => {
        const page = index + 2;
        return fetch(`${API_BASE}/product?page=${page}&limit=${pageSize}`, {
          next: { revalidate },
        })
          .then((response) => (response.ok ? response.json() : null))
          .catch(() => null);
      })
    );

    const remainingProducts = remainingPages.flatMap((pageData) => {
      if (Array.isArray(pageData?.data)) return pageData.data;
      if (Array.isArray(pageData?.products)) return pageData.products;
      return Array.isArray(pageData) ? pageData : [];
    });

    return [...firstPageProducts, ...remainingProducts];
  } catch (error) {
    console.error('Error fetching home products:', error);
    return [];
  }
}

/**
 * Filter products by merchTag
 * @param {Array} products - Array of products
 * @param {string} targetTag - Target merchTag to filter by
 * @returns {Array} Filtered products
 */
export function filterProductsByMerchTag(products, targetTag) {
  if (!Array.isArray(products) || !targetTag) {
    return [];
  }

  return products.filter(product => {
    const merchTags = product?.merchTags || 
                     product?.merchtags || 
                     product?.merchtag || 
                     product?.merchTag;
    
    if (!merchTags) return false;
    
    if (Array.isArray(merchTags)) {
      return merchTags.some(tag => 
        String(tag || '').toLowerCase() === targetTag.toLowerCase()
      );
    }
    
    return String(merchTags).toLowerCase() === targetTag.toLowerCase();
  });
}

/**
 * Get products for a specific section
 * @param {Array} allProducts - All available products
 * @param {string} sectionId - Section identifier (also used as merchTag)
 * @param {Object} options - Additional options
 * @returns {Array} Products for the section
 */
export function getSectionProducts(allProducts, sectionId, options = {}) {
  const { limit = null } = options;
  
  const filtered = filterProductsByMerchTag(allProducts, sectionId);
  
  if (limit && filtered.length > limit) {
    return filtered.slice(0, limit);
  }
  
  return filtered;
}

/**
 * Format section title from section ID
 * Converts kebab-case to Title Case
 * @param {string} sectionId - Section identifier
 * @returns {string} Formatted title
 */
export function formatSectionTitle(sectionId) {
  if (!sectionId) return 'Featured Collection';
  
  return sectionId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Build section data for home page
 * @param {Array} sectionIds - Array of section IDs
 * @param {Array} allProducts - All available products
 * @param {Object} options - Additional options
 * @returns {Array} Array of section data objects
 */
export function buildHomeSections(sectionIds, allProducts, options = {}) {
  if (!Array.isArray(sectionIds) || sectionIds.length === 0) {
    return [];
  }

  return sectionIds.map(sectionId => {
    const products = getSectionProducts(allProducts, sectionId, options);
    const title = formatSectionTitle(sectionId);
    
    return {
      id: sectionId,
      title,
      products,
      productCount: products.length,
    };
  }).filter(section => section.productCount > 0); // Only include sections with products
}

/**
 * Fetch complete home page data
 * Combines dynamic sections and products
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Home page data
 */
export async function fetchHomePageData(options = {}) {
  const revalidate = options.revalidate || 60;
  
  try {
    const [dynamicSections, allProducts] = await Promise.all([
      fetchDynamicSections({ revalidate }),
      fetchAllHomeProducts({ revalidate }),
    ]);

    const sections = buildHomeSections(dynamicSections, allProducts, options);

    return {
      sections,
      allProducts,
      dynamicSections,
      totalProducts: allProducts.length,
      totalSections: sections.length,
    };
  } catch (error) {
    console.error('Error fetching home page data:', error);
    return {
      sections: [],
      allProducts: [],
      dynamicSections: [],
      totalProducts: 0,
      totalSections: 0,
    };
  }
}
