/**
 * Product Category Configuration
 * Centralized configuration for different product categories
 * Makes it easy to add new categories without duplicating code
 */

export const CATEGORY_CONFIG = {
  fabric: {
    id: 'fabric',
    label: 'Fabric',
    pluralLabel: 'Fabrics',
    path: '/fabric',
    
    // SEO Configuration
    seo: {
      title: 'Premium Fabric Collection | Cotton, Mercerized & Designer Textiles',
      description: 'Explore our premium fabric collection featuring cotton, mercerized, designer, woven and shirting textiles for apparel, uniforms and fashion manufacturing.',
      keywords: 'fabric collection, cotton fabric, mercerized fabric, designer textiles, woven fabric, shirting fabric',
      pageTitle: 'Premium Fabric Collection',
      seoTitle: 'Premium Fabric Collection - Cotton, Mercerized & Designer Textiles',
    },
    
    // API Configuration
    api: {
      endpoint: '/product',
      limit: 150,
      collectionIds: ['690a0e676132664ee', '695f9b0b956eb958b'],
    },
    
    // Layout Configuration
    layout: {
      showHeader: true,
      showFooter: true,
      headerStyle: 'style_2',
      footerStyle: 'primary_style',
      shopRight: false,
      hiddenSidebar: false,
    },
    
    // Revalidation time (ISR)
    revalidate: 120,
  },
  
  fashion: {
    id: 'fashion',
    label: 'Fashion',
    pluralLabel: 'Fashion Items',
    path: '/fashion',
    
    seo: {
      title: 'Fashion Collection | Designer Clothing & Apparel',
      description: 'Discover our curated fashion collection featuring designer clothing, apparel, and accessories for modern style.',
      keywords: 'fashion, designer clothing, apparel, fashion collection, designer wear',
      pageTitle: 'Fashion Collection',
      seoTitle: 'Fashion Collection - Designer Clothing & Apparel',
    },
    
    api: {
      endpoint: '/product',
      limit: 150,
      collectionIds: [],
    },
    
    layout: {
      showHeader: true,
      showFooter: true,
      headerStyle: 'style_2',
      footerStyle: 'primary_style',
      shopRight: false,
      hiddenSidebar: false,
    },
    
    revalidate: 120,
  },
  
  accessories: {
    id: 'accessories',
    label: 'Accessory',
    pluralLabel: 'Accessories',
    path: '/accessories',
    
    seo: {
      title: 'Accessories Collection | Fashion Accessories & More',
      description: 'Browse our accessories collection featuring bags, jewelry, scarves, and fashion accessories.',
      keywords: 'accessories, fashion accessories, bags, jewelry, scarves',
      pageTitle: 'Accessories Collection',
      seoTitle: 'Accessories Collection - Fashion Accessories & More',
    },
    
    api: {
      endpoint: '/product',
      limit: 150,
      collectionIds: [],
    },
    
    layout: {
      showHeader: true,
      showFooter: true,
      headerStyle: 'style_2',
      footerStyle: 'primary_style',
      shopRight: false,
      hiddenSidebar: false,
    },
    
    revalidate: 120,
  },
};

/**
 * Get category configuration by ID
 * @param {string} categoryId - Category identifier
 * @returns {Object} Category configuration
 */
export function getCategoryConfig(categoryId) {
  return CATEGORY_CONFIG[categoryId] || CATEGORY_CONFIG.fabric;
}

/**
 * Get all category IDs
 * @returns {Array<string>} Array of category IDs
 */
export function getAllCategoryIds() {
  return Object.keys(CATEGORY_CONFIG);
}

/**
 * Check if category exists
 * @param {string} categoryId - Category identifier
 * @returns {boolean} True if category exists
 */
export function categoryExists(categoryId) {
  return categoryId in CATEGORY_CONFIG;
}
