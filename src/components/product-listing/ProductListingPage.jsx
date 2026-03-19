// Generic Product Listing Page Component
// Reusable for fabric, fashion, accessories, etc.

import { Suspense } from 'react';
import Wrapper from "@/layout/wrapper";
import HeaderTwo from "@/layout/headers/header-2";
import Footer from "@/layout/footers/footer";
import ShopArea from "@/components/shop/shop-area";
import CompactUniversalBreadcrumb from "@/components/breadcrumb/compact-universal-breadcrumb";
import { BreadcrumbJsonLd } from "@/utils/breadcrumbStructuredData";
import { FabricCollectionJsonLd } from "@/utils/fabricCollectionStructuredData";

/**
 * Generic Product Listing Page Component
 * 
 * @param {Object} props
 * @param {string} props.category - Category identifier (fabric, fashion, accessories, dynamicsection)
 * @param {string} props.pageTitle - Page title for H1 and breadcrumb
 * @param {string} props.seoTitle - SEO title for hidden H1
 * @param {Array} props.products - Array of products to display
 * @param {number} props.totalProducts - Total product count
 * @param {boolean} props.filtered - Whether products are filtered
 * @param {string} props.filterTag - Filter tag name if filtered
 * @param {Array} props.breadcrumbItems - Custom breadcrumb items
 * @param {Object} props.layoutOptions - Layout customization options
 * @param {string} props.categoryPath - Path for product links (e.g., '/fabric', '/dynamicsection/diwali-collection')
 */
export default function ProductListingPage({
  category = 'product',
  pageTitle = 'Products',
  seoTitle = null,
  products = [],
  totalProducts = 0,
  filtered = false,
  filterTag = null,
  breadcrumbItems = null,
  layoutOptions = {},
  categoryPath = null,
  customHeroContent = null, // ✅ New prop for custom hero content after header
  customFooterContent = null, // ✅ New prop for custom content before footer
}) {
  // Default breadcrumb if not provided
  const defaultBreadcrumb = [
    { label: 'Home', href: '/' },
    { label: pageTitle }
  ];

  const breadcrumb = breadcrumbItems || defaultBreadcrumb;

  // Breadcrumb structured data
  const breadcrumbStructuredData = breadcrumb.map(item => ({
    name: item.label,
    url: item.href || `/${category}`
  }));

  // SEO H1 text
  const seoH1Text = seoTitle || `${pageTitle}${filtered ? ` - ${filterTag} Collection` : ''}`;

  // Layout options with defaults
  const {
    showHeader = true,
    showFooter = true,
    headerStyle = 'style_2',
    footerStyle = 'primary_style',
    shopRight = false,
    hiddenSidebar = false
  } = layoutOptions;

  return (
    <>
      {/* Render JSON-LD outside Wrapper for SSR */}
      <BreadcrumbJsonLd breadcrumbItems={breadcrumbStructuredData} />
      <FabricCollectionJsonLd 
        products={products} 
        options={{
          filtered,
          filterTag
        }}
      />
      
      <Wrapper>
        {showHeader && <HeaderTwo style_2={headerStyle === 'style_2'} />}

        {/* SEO-Optimized H1 (Hidden) */}
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
          {seoH1Text}
        </h1>

        <CompactUniversalBreadcrumb items={breadcrumb} />

        {/* Custom Hero Content (e.g., Diwali Hero) */}
        {customHeroContent && customHeroContent}

        <div className="shop-page-spacing">
          <Suspense fallback={null}>
            <ShopArea 
              initialProducts={products} 
              totalProducts={totalProducts}
              shop_right={shopRight}
              hidden_sidebar={hiddenSidebar}
              categoryPath={categoryPath}
            />
          </Suspense>
        </div>

        {customFooterContent && customFooterContent}

        {showFooter && <Footer primary_style={footerStyle === 'primary_style'} />}
      </Wrapper>
    </>
  );
}
