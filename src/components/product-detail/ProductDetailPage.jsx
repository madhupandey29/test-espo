// Generic Product Detail Page Component
// Reusable for fabric, fashion, accessories, etc.

import Wrapper from '@/layout/wrapper';
import HeaderTwo from '@/layout/headers/header-2';
import Footer from '@/layout/footers/footer';
import ProductDetailsClient from '@/components/product-detail/ProductDetailsClient';
import { BreadcrumbJsonLd } from '@/utils/breadcrumbStructuredData';
import { FaqJsonLd } from '@/utils/faqStructuredData';
import { CollectionItemListJsonLd } from '@/utils/collectionItemListStructuredData';
import ProductStructuredDataHeadClient from '@/components/seo/ProductStructuredDataHead.client';
import { generateProductStructuredData } from '@/utils/productStructuredData';

/**
 * Generic Product Detail Page Component
 * 
 * @param {Object} props
 * @param {string} props.category - Category identifier (fabric, fashion, accessories)
 * @param {string} props.categoryLabel - Category display label for breadcrumb
 * @param {string} props.slug - Product slug
 * @param {Object} props.product - Product data
 * @param {Array} props.websiteFaqs - Website FAQs for structured data
 * @param {Array} props.collectionProducts - Related collection products
 * @param {Object} props.layoutOptions - Layout customization options
 */
export default function ProductDetailPage({
  category = 'product',
  categoryLabel = 'Products',
  slug,
  product,
  websiteFaqs = [],
  collectionProducts = [],
  layoutOptions = {}
}) {
  // Layout options with defaults
  const {
    showHeader = true,
    showFooter = true,
    headerStyle = 'style_2',
    footerStyle = 'primary_style'
  } = layoutOptions;

  // Generate structured data
  const productStructuredData = generateProductStructuredData(product);
  
  // Product title for breadcrumb
  const productTitle = product?.productTitle || product?.name || 'Product Details';
  
  // Breadcrumb structured data
  const breadcrumbStructuredData = [
    { name: 'Home', url: '/' },
    { name: categoryLabel, url: `/${category}` },
    { name: productTitle, url: `/${category}/${slug}` }
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
        {showHeader && <HeaderTwo style_2={headerStyle === 'style_2'} />}
        <ProductDetailsClient 
          slug={slug} 
          initialProduct={product}
          category={category}
        />
        {showFooter && <Footer primary_style={footerStyle === 'primary_style'} />}
      </Wrapper>
    </>
  );
}
