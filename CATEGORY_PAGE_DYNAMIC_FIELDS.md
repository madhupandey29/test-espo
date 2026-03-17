# Category Page - Dynamic Fields Requirements

## Overview
This document outlines all the dynamic fields needed from the backend API for the Category pages, including the home page category section and individual category detail pages.

---

## 1. CATEGORY LIST API (For Home Page)

**Endpoint:** `GET /api/categories` or `GET /api/product/fieldname/category`

**Purpose:** Display category cards on the home page with images and product counts

### Fields Required:

```json
{
  "categories": [
    {
      "id": "string or number (unique identifier)",
      "name": "string (e.g., 'Woven Fabrics', 'Denim Fabrics')",
      "slug": "string (URL-friendly, e.g., 'woven-fabrics')",
      "image": "string (category thumbnail/hero image URL)",
      "description": "string (short description for category card)",
    }
  ]
}
```

### Example Response:
```json
{
  "success": true,
  "categories": [
    {
      "id": "cat_001",
      "name": "Woven Fabrics",
      "slug": "woven-fabrics",
      "image": "https://cdn.example.com/categories/woven-fabrics.jpg",
      "productCount": 48,
      "description": "Durable and versatile woven textiles",
      "isActive": true,
      "displayOrder": 1,
      "seoTitle": "Woven Fabrics - Premium Quality",
      "seoDescription": "Explore our collection of high-quality woven fabrics"
    },
    {
      "id": "cat_002",
      "name": "Denim Fabrics",
      "slug": "denim-fabrics",
      "image": "https://cdn.example.com/categories/denim-fabrics.jpg",
      "productCount": 32,
      "description": "Sturdy and stylish denim materials",
      "isActive": true,
      "displayOrder": 2
    }
  ]
}
```

---

## 2. CATEGORY DETAIL API (For Individual Category Pages)

**Endpoint:** `GET /api/categories/{slug}` or `GET /api/categories/{id}`

**Purpose:** Display detailed information about a specific category

### Fields Required:

```json
{
  "id": "string or number",
  "name": "string (e.g., 'Woven Fabrics')",
  "slug": "string (e.g., 'woven-fabrics')",
  "heroImage": "string (large banner image URL)",
  "introduction": "string (detailed description/introduction text)",
  "features": [
    "string (feature 1)",
    "string (feature 2)",
    "string (feature 3)",
    "string (feature 4)"
  ],
  "usages": [
    "string (usage 1)",
    "string (usage 2)",
    "string (usage 3)",
    "string (usage 4)"
  ],
}
```

### Example Response:
```json
{
  "success": true,
  "category": {
    "id": "cat_001",
    "name": "Woven Fabrics",
    "slug": "woven-fabrics",
    "heroImage": "https://cdn.example.com/categories/woven-fabrics-hero.jpg",
    "thumbnailImage": "https://cdn.example.com/categories/woven-fabrics-thumb.jpg",
    "introduction": "Woven fabrics are created by interlacing two sets of yarns at right angles to each other. This traditional textile manufacturing technique produces durable, versatile fabrics suitable for a wide range of applications.",
    "features": [
      "High durability and strength",
      "Excellent dimensional stability",
      "Wide variety of textures and patterns",
      "Suitable for formal and casual wear"
    ],
    "usages": [
      "Apparel: Shirts, trousers, suits, dresses",
      "Home textiles: Curtains, upholstery, bedding",
      "Industrial applications: Bags, filters, technical textiles",
      "Fashion accessories: Scarves, ties, handkerchiefs"
    ],
    "productCount": 48,
    "isActive": true,
    "seoTitle": "Woven Fabrics - Premium Quality Textiles",
    "seoDescription": "Explore our collection of high-quality woven fabrics. Durable, versatile, and perfect for various applications.",
    "seoKeywords": ["woven fabrics", "textile", "fabric manufacturing", "quality fabrics"],
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-03-01T14:30:00Z"
  }
}
```

---

## 3. CATEGORY PRODUCTS API

**Endpoint:** `GET /api/categories/{slug}/products` or `GET /api/products?category={categoryName}`

**Purpose:** Get all products belonging to a specific category

### Query Parameters:
- `page`: number (pagination)
- `limit`: number (items per page)
- `sortBy`: string (e.g., 'name', 'createdAt', 'popular')
- `sortOrder`: string ('asc' or 'desc')

### Fields Required:

```json
{
  "success": "boolean",
  "data": [
    {
      "id": "string",
      "name": "string (product name)",
      "slug": "string (product URL slug)",
      "category": "string (category name)",
      "categoryId": "string (category ID)",
      "image": "string (primary product image URL)",
      "images": [
        "string (image URL 1)",
        "string (image URL 2)",
        "string (image URL 3)"
      ],
      "description": "string (short description)",
      "specifications": "object (product specs)",
      "merchTags": ["array of strings (e.g., ['ecatalogue'])"],
      "isActive": "boolean",
      "isFeatured": "boolean",
      "createdAt": "date"
    }
  ],
  "pagination": {
    "currentPage": "number",
    "totalPages": "number",
    "totalItems": "number",
    "itemsPerPage": "number"
  }
}
```

---

## 4. CATEGORY IMAGE REQUIREMENTS

### Image Specifications:

1. **Category Thumbnail (for home page cards):**
   - Recommended size: 600x450px (4:3 ratio)
   - Format: JPG, WebP
   - Max file size: 200KB
   - Quality: 80-85%

2. **Category Hero Image (for detail page banner):**
   - Recommended size: 1920x600px (16:5 ratio)
   - Format: JPG, WebP
   - Max file size: 500KB
   - Quality: 85-90%

3. **Fallback/Placeholder:**
   - Provide a default placeholder image if category image is not available
   - Path: `/assets/img/product/category-placeholder.jpg`

---

## 5. ADMIN PANEL REQUIREMENTS

The backend should provide a CMS/Admin panel to manage:

### Category Management:
- ✅ Create new categories
- ✅ Edit category details (name, description, images)
- ✅ Upload category images (thumbnail & hero)
- ✅ Manage features list (add/remove/reorder)
- ✅ Manage usages list (add/remove/reorder)
- ✅ Set display order for home page
- ✅ Toggle active/inactive status
- ✅ SEO settings (title, description, keywords)
- ✅ View product count per category
- ✅ Delete categories (with warning if products exist)

### Image Upload Features:
- Image cropping/resizing tool
- Multiple image format support (JPG, PNG, WebP)
- Image optimization on upload
- Preview before saving
- Bulk image upload option

---

## 6. API ENDPOINTS SUMMARY

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/categories` | GET | Get all categories (for home page) |
| `/api/categories/{slug}` | GET | Get single category details |
| `/api/categories/{slug}/products` | GET | Get products by category |
| `/api/categories` | POST | Create new category (admin) |
| `/api/categories/{id}` | PUT | Update category (admin) |
| `/api/categories/{id}` | DELETE | Delete category (admin) |
| `/api/categories/{id}/image` | POST | Upload category image (admin) |

---

## 7. VALIDATION RULES

### Category Name:
- Required
- Min length: 3 characters
- Max length: 100 characters
- Unique across all categories

### Slug:
- Auto-generated from name (lowercase, hyphenated)
- Must be unique
- URL-safe characters only

### Images:
- Required: At least thumbnail image
- Supported formats: JPG, PNG, WebP
- Max file size: 5MB
- Valid URL format

### Features & Usages:
- Min items: 3
- Max items: 10
- Each item max length: 200 characters

---

## 8. CURRENT VS REQUIRED CHANGES

### Current Implementation:
- Categories are fetched from `/api/product/fieldname/category` (returns only names)
- Category images are taken from first product in category
- Category information (features, usages) is hardcoded in frontend

### Required Changes:
- Create dedicated category management system
- Store category images separately (not dependent on products)
- Store category details (introduction, features, usages) in database
- Provide admin interface for category management
- Add proper image upload and management

---

## 9. SAMPLE CATEGORIES TO IMPLEMENT

Based on your UI, here are suggested categories:

1. **Woven Fabrics**
2. **Denim Fabrics**
3. **Knitted Fabrics**
4. **Cotton Fabrics**
5. **Polyester Fabrics**
6. **Blended Fabrics**
7. **Technical Fabrics**
8. **Sustainable Fabrics**

Each should have:
- Unique hero image
- Thumbnail image
- 4-6 key features
- 4-6 common usages
- Detailed introduction text

---

## 10. NOTES FOR BACKEND DEVELOPER

1. **Image Storage:** Use CDN or cloud storage (Cloudinary, AWS S3) for category images
2. **Caching:** Implement caching for category list (rarely changes)
3. **Slug Generation:** Auto-generate URL-friendly slugs from category names
4. **Product Count:** Calculate dynamically or cache with product updates
5. **SEO:** Ensure all text fields support rich text/markdown if needed
6. **Sorting:** Allow custom display order for categories on home page
7. **Filtering:** Support filtering products by merchTags within categories
8. **Pagination:** Implement pagination for category products (20-50 per page)
9. **Error Handling:** Provide clear error messages for missing categories
10. **Migration:** Plan data migration from current hardcoded structure

---

## Contact
For questions or clarifications about these requirements, please contact the frontend development team.
