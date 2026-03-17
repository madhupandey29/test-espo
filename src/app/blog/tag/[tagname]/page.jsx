import Wrapper from "@/layout/wrapper";
import HeaderTwo from "@/layout/headers/header-2";
import BlogContentWrapper from "@/components/blog/blog-grid/blog-content-wrapper";
import Footer from "@/layout/footers/footer";
import CompactUniversalBreadcrumb from "@/components/breadcrumb/compact-universal-breadcrumb";
import { generateMetadata as generateSEOMetadata } from "@/utils/seo";
import { BreadcrumbJsonLd } from "@/utils/breadcrumbStructuredData";
import {
  getPageSeoMetadata,
  fetchTopicPageByName,
  PAGE_NAMES,
} from "@/utils/topicPageSeoIntegration";
import { BlogPageJsonLd } from "@/utils/blogPageStructuredData";
import { getSiteUrl } from "@/utils/siteUrl";
import { getBlogApiUrl } from "@/utils/blogApi";

export const revalidate = 86400;
const BLOG_PAGE_REVALIDATE = revalidate;

const BLOG_API_URL = getBlogApiUrl();

// Server-side function to fetch blogs
async function fetchBlogs() {
  try {
    if (!BLOG_API_URL) {
      return [];
    }

    const response = await fetch(BLOG_API_URL, {
      next: { revalidate: BLOG_PAGE_REVALIDATE },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch blogs");
    }

    const data = await response.json();
    return Array.isArray(data?.data) ? data.data : [];
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return [];
  }
}

// Extract first blog image from blogs array
function getFirstBlogImage(blogs) {
  if (!Array.isArray(blogs) || blogs.length === 0) return null;

  const firstBlog = blogs[0];
  const blogImage1 = firstBlog?.blogimage1;
  const blogImage2 = firstBlog?.blogimage2;

  // Handle different image formats
  let imageUrl = null;

  if (blogImage1) {
    if (typeof blogImage1 === "string") {
      imageUrl = blogImage1;
    } else if (typeof blogImage1 === "object") {
      imageUrl =
        blogImage1.url ||
        blogImage1.secure_url ||
        blogImage1.src ||
        blogImage1.path;
    }
  }

  if (!imageUrl && blogImage2) {
    if (typeof blogImage2 === "string") {
      imageUrl = blogImage2;
    } else if (typeof blogImage2 === "object") {
      imageUrl =
        blogImage2.url ||
        blogImage2.secure_url ||
        blogImage2.src ||
        blogImage2.path;
    }
  }

  return imageUrl;
}

// Generate metadata - Same as main blog page
export async function generateMetadata() {
  // Fetch blogs for OG image
  const blogs = await fetchBlogs();
  const firstBlogImage = getFirstBlogImage(blogs);

  // Fetch SEO data from topic page API (same as main blog page)
  const topicMetadata = await getPageSeoMetadata(PAGE_NAMES.BLOG, {
    title: null,
    description: null,
    keywords: null,
  }, { revalidateSeconds: BLOG_PAGE_REVALIDATE });

  // Extract canonical URL from the metadata object
  const canonicalFromApi = topicMetadata.alternates?.canonical || null;

  return generateSEOMetadata({
    title: topicMetadata.title,
    description: topicMetadata.description,
    keywords: topicMetadata.keywords,
    path: "/blog",
    canonicalOverride: canonicalFromApi,
    ogImage: firstBlogImage,
    robots: "index, follow",
  });
}

export default async function BlogTagPage({ params }) {
  const { tagname } = await params;
  const decodedTag = decodeURIComponent(tagname);

  // Fetch blogs and topic page data server-side
  const blogs = await fetchBlogs();

  // Fetch RAW topic page data for structured data (not the Next.js metadata)
  const topicPageData = await fetchTopicPageByName(PAGE_NAMES.BLOG, { revalidateSeconds: BLOG_PAGE_REVALIDATE });

  // Base URL for structured data
  const baseUrl = getSiteUrl();

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Blog", href: "/blog" },
    { label: decodedTag },
  ];

  // Breadcrumb structured data
  const breadcrumbStructuredData = [
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
    { name: decodedTag, url: `/blog/tag/${tagname}` },
  ];

  return (
    <>
      {/* Blog Page Structured Data - Same pattern as main blog page */}
      <BlogPageJsonLd topicPageData={topicPageData} blogs={blogs} baseUrl={baseUrl} />

      {/* Breadcrumb Structured Data */}
      <BreadcrumbJsonLd breadcrumbItems={breadcrumbStructuredData} />

      <Wrapper>
        <HeaderTwo style_2={true} />
        <CompactUniversalBreadcrumb items={breadcrumbItems} />
        <BlogContentWrapper tagname={decodedTag} />
        <Footer primary_style={true} />
      </Wrapper>
    </>
  );
}
