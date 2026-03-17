// app/dynamicsection/[sectionId]/[slug]/page.jsx - Dynamic Section Product Detail Page
import { generateMetadata as generateSEOMetadata } from '@/utils/seo';
import { getProductImageUrl } from '@/utils/imageContract';
import { fetchProductBySlug, fetchWebsiteFaqs, fetchCollectionProducts } from '@/utils/productFetcher';
import { formatSectionTitle } from '@/utils/homeSectionFetcher';
import ProductDetailPage from '@/components/product-detail/ProductDetailPage';

export const revalidate = 60;

/* -----------------------------
  helpers
----------------------------- */
const pick = (...v) => v.find(x => x !== undefined && x !== null && String(x).trim() !== '');

const stripHtml = (html = '') =>
  String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/* -----------------------------
  Metadata
----------------------------- */
export async function generateMetadata({ params }) {
  const { sectionId, slug } = await params;

  const product = await fetchProductBySlug(slug, { revalidate });

  const fallbackTitle = String(slug || '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  const title = pick(product?.productTitle, product?.name, fallbackTitle);
  const sectionTitle = formatSectionTitle(sectionId);

  const description = stripHtml(
    pick(product?.shortProductDescription, product?.description, '')
  ) || `View ${title} from our ${sectionTitle} collection.`;

  const productKeywords = product?.keywords || [];
  const keywordsString = Array.isArray(productKeywords) 
    ? productKeywords.join(', ') 
    : productKeywords || `${sectionTitle}, premium products`;

  const ogImageUrl = getProductImageUrl(product, { variant: 'metadata' }) || '';
  const robotsTag = product ? "index, follow" : "noindex, nofollow";

  return generateSEOMetadata({
    title: `${title} - ${sectionTitle}`,
    description,
    keywords: keywordsString,
    path: `/dynamicsection/${sectionId}/${slug}`,
    ogImage: ogImageUrl,
    robots: robotsTag
  });
}

/* -----------------------------
  Page component
----------------------------- */
export default async function Page({ params }) {
  const { sectionId, slug } = await params;

  try {
    const product = await fetchProductBySlug(slug, { revalidate });
    const websiteFaqs = await fetchWebsiteFaqs({ revalidate });
    
    const collectionId = product?.collectionId || product?.collection?.id || product?.collection?._id || product?.collection || null;
    const collectionProducts = collectionId 
      ? await fetchCollectionProducts(collectionId, { revalidate }) 
      : [];

    const sectionTitle = formatSectionTitle(sectionId);

    return (
      <ProductDetailPage
        category="dynamicsection"
        categoryLabel={sectionTitle}
        slug={slug}
        product={product}
        websiteFaqs={websiteFaqs}
        collectionProducts={collectionProducts}
        layoutOptions={{
          showHeader: true,
          showFooter: true,
          headerStyle: 'style_2',
          footerStyle: 'primary_style',
        }}
      />
    );
  } catch (error) {
    console.error('Error in dynamic section product detail page:', error);
    
    return (
      <ProductDetailPage
        category="dynamicsection"
        categoryLabel={formatSectionTitle(sectionId)}
        slug={slug}
        product={null}
        websiteFaqs={[]}
        collectionProducts={[]}
        layoutOptions={{
          showHeader: true,
          showFooter: true,
          headerStyle: 'style_2',
          footerStyle: 'primary_style',
        }}
      />
    );
  }
}
