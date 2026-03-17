'use client';
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import ErrorMsg from "../common/error-msg";
import ShopCategoryLoader from "../loader/shop/shop-category-loader";
import { getApiBaseUrl } from "@/utils/runtimeConfig";
import { debugLog } from "@/utils/debugLog";

const ShopCategoryArea = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Get merchtag filter from environment
  const merchTagFilter = "ecatalogue";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const apiBase = getApiBaseUrl();

        // Fetch categories
        const categoriesRes = await fetch(`${apiBase}/product/fieldname/category`);
        
        if (!categoriesRes.ok) {
          throw new Error("Failed to fetch categories");
        }

        const categoriesData = await categoriesRes.json();
        const categoryList = categoriesData?.values || [];
        setCategories(categoryList);

        // Fetch ALL products (handle pagination)
        let allProducts = [];
        let currentPage = 1;
        let totalPages = 1;

        // Fetch first page to get total pages
        const firstPageRes = await fetch(`${apiBase}/product?page=1&limit=20`);
        if (!firstPageRes.ok) {
          throw new Error("Failed to fetch products");
        }

        const firstPageData = await firstPageRes.json();

        // Extract products and pagination info
        const firstPageProducts = firstPageData?.data || [];
        allProducts = [...firstPageProducts];
        totalPages = firstPageData?.pagination?.totalPages || 1;

        // Fetch remaining pages if there are more
        if (totalPages > 1) {
          const pagePromises = [];
          for (let page = 2; page <= totalPages; page++) {
            pagePromises.push(
              fetch(`${apiBase}/product?page=${page}&limit=20`).then(res => res.json())
            );
          }

          const remainingPages = await Promise.all(pagePromises);
          remainingPages.forEach(pageData => {
            const pageProducts = pageData?.data || [];
            allProducts = [...allProducts, ...pageProducts];
          });
        }

        setProducts(allProducts);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter products by merchtag and count by category
  const categoriesWithCount = useMemo(() => {
    if (!categories.length) return [];

    // If no products loaded, show categories with 0 count
    if (!products.length) {
      return categories.map((categoryName) => ({
        name: categoryName,
        count: 0,
      }));
    }

    // Filter products by merchTags (note: plural and capital T)
    const filteredProducts = products.filter((product) => {
      const merchTags = product.merchTags || product.merchtags || product.merchtag || product.merchTag;
      if (!merchTags) return false;
      
      // Check if merchTags contains "ecatalogue" (case insensitive)
      if (Array.isArray(merchTags)) {
        return merchTags.some(tag => tag?.toLowerCase().includes('ecatalogue'));
      }
      return String(merchTags).toLowerCase().includes('ecatalogue');
    });

    debugLog("Total products:", products.length);
    debugLog("Filtered products by merchTags:", filteredProducts.length);

    // If no products match merchtag, show all products instead
    const productsToCount = filteredProducts.length > 0 ? filteredProducts : products;

    // Count products per category
    const categoryCounts = categories.map((categoryName) => {
      const count = productsToCount.filter(
        (product) => product.category === categoryName
      ).length;

      return {
        name: categoryName,
        count: count,
      };
    });

    // Show all categories, even with 0 count
    return categoryCounts;
  }, [categories, products, merchTagFilter]);

  // Handle category route
  const handleCategoryRoute = (categoryName) => {
    router.push(
      `/fabric?category=${categoryName
        .toLowerCase()
        .replace("&", "")
        .split(" ")
        .join("-")}`
    );
  };

  // Decide what to render
  let content = null;

  if (loading) {
    content = <ShopCategoryLoader loading={true} />;
  } else if (error) {
    content = <ErrorMsg msg={`Error: ${error}`} />;
  } else if (categoriesWithCount.length === 0) {
    content = <ErrorMsg msg="No Category found!" />;
  } else {
    content = categoriesWithCount.map((item, index) => (
      <div key={index} className="col-lg-3 col-sm-6">
        <div
          className="tp-category-main-box mb-25 p-relative fix"
          style={{ backgroundColor: "#F3F5F7" }}
        >
          <div className="tp-category-main-content">
            <h3
              className="tp-category-main-title pb-1"
              onClick={() => handleCategoryRoute(item.name)}
            >
              <a className="cursor-pointer">{item.name}</a>
            </h3>
            <span className="tp-category-main-item">
              {item.count} Products
            </span>
          </div>
        </div>
      </div>
    ));
  }

  return (
    <>
      <section className="tp-category-area pb-120">
        <div className="container">
          <div className="row">{content}</div>
        </div>
      </section>
    </>
  );
};

export default ShopCategoryArea;
