// app/dynamicsection/[sectionId]/page.jsx - Dynamic Section Listing Page
import { generateMetadata as generateSEOMetadata, getOptimizedLogoUrl } from "@/utils/seo";
import { fetchHomePageData, formatSectionTitle } from "@/utils/homeSectionFetcher";
import { getApiBaseUrl } from "@/utils/runtimeConfig";
import ProductListingPage from "@/components/product-listing/ProductListingPage";
import DynamicSectionHero from "@/components/dynamic-section/DynamicSectionHero";
import DynamicSectionGalleryKeywords from "@/components/dynamic-section/DynamicSectionGalleryKeywords";
import DynamicSectionKeywordsFAQ from "@/components/dynamic-section/DynamicSectionKeywordsFAQ";

export const revalidate = 60;

/* ---------------------------------------------
   Fetch Dynamic Section Data from API
---------------------------------------------- */
async function fetchDynamicSectionData(sectionId) {
  const apiBase = getApiBaseUrl();
  
  if (!apiBase) {
    console.error('[DynamicSection] API base URL is not set');
    return null;
  }

  const url = `${apiBase}/dynamicsection/${sectionId}`;
  
  try {
    const response = await fetch(url, { next: { revalidate: 60 } });
    
    if (!response.ok) {
      console.error(`[DynamicSection] API returned ${response.status} for ${url}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.success) {
      console.error(`[DynamicSection] API success=false for ${sectionId}:`, data);
      return null;
    }

    return data.data;
  } catch (error) {
    console.error(`[DynamicSection] Fetch failed for ${url}:`, error);
    return null;
  }
}

/* ---------------------------------------------
   Metadata
---------------------------------------------- */
export async function generateMetadata({ params }) {
  const { sectionId } = await params;
  const logoUrl = getOptimizedLogoUrl();
  
  // Fetch data from API
  const sectionData = await fetchDynamicSectionData(sectionId);
  const topicPage = sectionData?.topicPages?.[0];
  
  // Use topic page metadata if available, otherwise use defaults
  const title = topicPage?.metaTitle || `${formatSectionTitle(sectionId)} Collection | Premium Products`;
  const description = topicPage?.description || `Explore our ${formatSectionTitle(sectionId)} collection featuring premium quality products.`;
  const keywords = topicPage?.keywords?.join(', ') || `${formatSectionTitle(sectionId)}, collection, premium products`;
  const canonicalUrl = topicPage?.canonicalUrl || null;
  const ogType = topicPage?.ogType || 'website';
  const excerpt = topicPage?.excerpt || description;
  
  // Use topic page image if available
  const ogImage = topicPage?.image1CloudUrl || "/assets/img/logo/logo.svg";
  const altText = topicPage?.altTextImage1 || title;
  
  return generateSEOMetadata({
    title,
    description: excerpt,
    keywords,
    path: `/dynamicsection/${sectionId}`,
    ogImage,
    ogLogo: logoUrl,
    ogType,
    canonicalUrl,
    robots: "index, follow"
  });
}

/* ---------------------------------------------
   Page Component
---------------------------------------------- */
export default async function DynamicSectionPage({ params }) {
  const { sectionId } = await params;
  
  // Fetch data from API
  const sectionData = await fetchDynamicSectionData(sectionId);
  const topicPage = sectionData?.topicPages?.[0];
  
  // Use API products if available, otherwise fallback to home page data
  let products = sectionData?.products || [];
  let sectionTitle = topicPage?.name || formatSectionTitle(sectionId);
  
  // Fallback to home page data if API returns no products
  if (products.length === 0) {
    const homePageData = await fetchHomePageData({ revalidate });
    const section = homePageData.sections.find(s => s.id === sectionId);
    products = section?.products || [];
    sectionTitle = section?.title || sectionTitle;
  }
  
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Collections', href: '/' },
    { label: sectionTitle }
  ];

  return (
    <>
      <ProductListingPage
        category="dynamicsection"
        pageTitle={`${sectionTitle} Collection`}
        seoTitle={topicPage?.metaTitle || `${sectionTitle} Collection - Premium Products`}
        products={products}
        totalProducts={products.length}
        filtered={true}
        filterTag={sectionTitle}
        breadcrumbItems={breadcrumbItems}
        layoutOptions={{
          showHeader: true,
          showFooter: true,
          headerStyle: 'style_2',
          footerStyle: 'primary_style',
          shopRight: false,
          hiddenSidebar: false,
        }}
        customHeroContent={<DynamicSectionHero sectionSlug={sectionId} topicData={topicPage} products={products} />}
        customFooterContent={
          <>
            <DynamicSectionGalleryKeywords sectionSlug={sectionId} topicData={topicPage} products={products} />
            <DynamicSectionKeywordsFAQ sectionSlug={sectionId} topicData={topicPage} products={products} />
          </>
        }
      />
    </>
  );
}
