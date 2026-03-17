// app/page.jsx - Refactored to use reusable utilities
import HomePageTwoClient from "./HomePageTwoClient";
import { getPageSeoMetadata, PAGE_NAMES } from "@/utils/topicPageSeoIntegration";
import { generateMetadata as generateSEOMetadata, getOptimizedLogoUrl } from "@/utils/seo";
import { getProductImageUrl } from "@/utils/imageContract";
import { getSiteUrl } from "@/utils/siteUrl";
import { getBlogApiUrl } from "@/utils/blogApi";
import { fetchHomePageData, filterProductsByMerchTag } from "@/utils/homeSectionFetcher";

// Revalidate every 60 seconds
export const revalidate = 60;

const MERCH_TAG_FILTER = 'ecatalogue';

/* ---------------------------------------------
   Server fetch helpers for ISR Home
---------------------------------------------- */
const stripTrailingSlash = (s = '') => String(s || '').replace(/\/+$/, '');

const API_BASE = stripTrailingSlash(process.env.NEXT_PUBLIC_API_BASE_URL || '');

// Fetch company information and apply same filter as Redux transformResponse
async function fetchOfficeInfo() {
  try {
    if (!API_BASE) return null;

    const res = await fetch(`${API_BASE}/companyinformation`, {
      next: { revalidate },
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) return null;

    const json = await res.json();
    const list = Array.isArray(json?.data) ? json.data : [];

    const companyFilter = process.env.NEXT_PUBLIC_COMPANY_FILTER;
    if (!companyFilter) return null;

    return list.find((x) => x?.name === companyFilter) || null;
  } catch {
    return null;
  }
}

// Removed: Now using fetchHomePageData from homeSectionFetcher utility

async function fetchHomeCategoryNames() {
  try {
    if (!API_BASE) return [];

    const response = await fetch(`${API_BASE}/product/fieldname/category`, {
      next: { revalidate },
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) return [];

    const json = await response.json();
    return Array.isArray(json?.values) ? json.values : [];
  } catch {
    return [];
  }
}

// Removed: Now using filterProductsByMerchTag from homeSectionFetcher utility

function buildHomeCategorySummaries(categoryNames, products) {
  if (!Array.isArray(categoryNames) || categoryNames.length === 0) {
    return [];
  }

  // Use reusable utility for filtering
  const filteredProducts = filterProductsByMerchTag(products, MERCH_TAG_FILTER);
  const productsToCount = filteredProducts.length > 0 ? filteredProducts : products;

  return categoryNames.map((categoryName) => {
    const categoryProducts = productsToCount.filter(
      (product) => product?.category === categoryName
    );
    const firstProduct = categoryProducts[0];

    return {
      name: categoryName,
      count: categoryProducts.length,
      image:
        getProductImageUrl(firstProduct, { variant: 'card' }) ||
        '/assets/img/about/about1.jpg',
    };
  });
}

async function fetchHomeBlogs() {
  try {
    const blogApiUrl = getBlogApiUrl();
    if (!blogApiUrl) return [];

    const res = await fetch(blogApiUrl, { next: { revalidate } });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch {
    return [];
  }
}

// Removed: Now using fetchHomePageData from homeSectionFetcher utility

export async function generateMetadata() {
  const logoUrl = getOptimizedLogoUrl();

  // Fetch SEO data from topic page API
  const topicMetadata = await getPageSeoMetadata(PAGE_NAMES.HOME, {
    title: null,
    description: null,
    keywords: null,
  });

  // Extract canonical URL from the metadata object
  const canonicalFromApi = topicMetadata.alternates?.canonical || null;

  // Merge with existing SEO metadata structure
  return generateSEOMetadata({
    title: topicMetadata.title,
    description: topicMetadata.description,
    keywords: topicMetadata.keywords,
    path: "/",
    canonicalOverride: canonicalFromApi,
    ogImage: "/assets/img/logo/logo.svg",
    ogLogo: logoUrl,
    robots: "index, follow",
  });
}

export default async function Page() {
  const siteUrl = getSiteUrl();

  // Fetch data using reusable utilities
  const [office, homePageData, homeCategoryNames, homeBlogs] = await Promise.all([
    fetchOfficeInfo(),
    fetchHomePageData({ revalidate }), // ✅ Uses reusable utility
    fetchHomeCategoryNames(),
    fetchHomeBlogs(),
  ]);

  const { sections: dynamicSectionsData, allProducts: allHomeProducts, dynamicSections } = homePageData;
  const homeProducts = allHomeProducts.slice(0, 50);
  const categorySummaries = buildHomeCategorySummaries(homeCategoryNames, allHomeProducts);

  const homeJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${siteUrl}/#home`,
    "url": `${siteUrl}/`,
    "name": "Home",
    "isPartOf": { "@id": `${siteUrl}/#website` },
    "about": { "@id": `${siteUrl}/#org` },
    "inLanguage": "en",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <HomePageTwoClient
        office={office}
        homeProducts={homeProducts}
        homeBlogs={homeBlogs}
        categorySummaries={categorySummaries}
        dynamicSections={dynamicSections}
        dynamicSectionsData={dynamicSectionsData}
      />
    </>
  );
}



