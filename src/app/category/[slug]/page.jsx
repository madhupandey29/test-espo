import Wrapper from "@/layout/wrapper";
import HeaderTwo from "@/layout/headers/header-2";
import Footer from "@/layout/footers/footer";
import ShopBreadcrumb from "@/components/breadcrumb/shop-breadcrumb";
import CategoryDetailClient from "./CategoryDetailClient";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  
  if (!slug) {
    return {
      title: "Category - Fabric Category",
      description: "Explore our fabric collection.",
    };
  }

  const categoryName = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    title: `${categoryName} - Fabric Category`,
    description: `Explore our ${categoryName} collection. High-quality fabrics for all your needs.`,
  };
}

export default async function CategoryDetailPage({ params }) {
  const { slug } = await params;
  
  if (!slug) {
    return (
      <Wrapper>
        <HeaderTwo style_2={true} />
        <div className="container py-5">
          <h1>Category not found</h1>
        </div>
        <Footer primary_style={true} />
      </Wrapper>
    );
  }
  
  // Convert slug to category name (e.g., "woven-fabrics" -> "Woven Fabrics")
  const categoryName = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <Wrapper>
      <HeaderTwo style_2={true} />
      <ShopBreadcrumb title={categoryName} subtitle={categoryName} />
      <CategoryDetailClient categoryName={categoryName} slug={slug} />
      <Footer primary_style={true} />
    </Wrapper>
  );
}
