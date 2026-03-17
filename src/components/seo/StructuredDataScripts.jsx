'use client';
import { useEffect } from 'react';
import { debugLog } from '@/utils/debugLog';

const StructuredDataScripts = ({ 
  blogStructuredData, 
  breadcrumbStructuredData, 
  productStructuredData, 
  corporationStructuredData
  // Removed homePageStructuredData - home page JSON-LD is now server-side only
}) => {
  // Removed client-side home page data generation - no longer needed
  

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    debugLog('🔧 StructuredDataScripts useEffect triggered');
    debugLog('📊 Data received:', {
      blogStructuredData: blogStructuredData ? 'Available' : 'Not available',
      productStructuredData: productStructuredData ? 'Available' : 'Not available',
      corporationStructuredData: corporationStructuredData ? 'Available' : 'Not available'
    });

    // Remove any existing structured data scripts (except server-side ones)
    const existingScripts = document.querySelectorAll('script[data-structured-data="true"]');
    debugLog(`🗑️ Removing ${existingScripts.length} existing client-side structured data scripts`);
    existingScripts.forEach(script => script.remove());

    // Add corporation structured data script to head (for all pages)
    if (corporationStructuredData) {
      const corporationScript = document.createElement('script');
      corporationScript.type = 'application/ld+json';
      corporationScript.setAttribute('data-structured-data', 'true');
      corporationScript.setAttribute('data-type', 'corporation');
      corporationScript.textContent = JSON.stringify(corporationStructuredData, null, 2);
      document.head.appendChild(corporationScript);
      debugLog('✅ Added corporation structured data to head');
    }

    // NOTE: Home page JSON-LD is now handled server-side only - no client-side generation

    // Add blog structured data script to head
    if (blogStructuredData) {
      const blogScript = document.createElement('script');
      blogScript.type = 'application/ld+json';
      blogScript.setAttribute('data-structured-data', 'true');
      blogScript.setAttribute('data-type', 'blog');
      blogScript.textContent = JSON.stringify(blogStructuredData, null, 2);
      document.head.appendChild(blogScript);
      debugLog('✅ Added blog structured data to head');
    }

    // Add breadcrumb structured data script to head
    if (breadcrumbStructuredData) {
      const breadcrumbScript = document.createElement('script');
      breadcrumbScript.type = 'application/ld+json';
      breadcrumbScript.setAttribute('data-structured-data', 'true');
      breadcrumbScript.setAttribute('data-type', 'breadcrumb');
      breadcrumbScript.textContent = JSON.stringify(breadcrumbStructuredData, null, 2);
      document.head.appendChild(breadcrumbScript);
      debugLog('✅ Added breadcrumb structured data to head');
    }

    // Add product structured data script to head
    if (productStructuredData) {
      const productScript = document.createElement('script');
      productScript.type = 'application/ld+json';
      productScript.setAttribute('data-structured-data', 'true');
      productScript.setAttribute('data-type', 'product');
      productScript.textContent = JSON.stringify(productStructuredData, null, 2);
      document.head.appendChild(productScript);
      debugLog('✅ Added product structured data to head');
    }

    // Cleanup function
    return () => {
      if (typeof document !== 'undefined') {
        const scriptsToRemove = document.querySelectorAll('script[data-structured-data="true"]');
        debugLog(`🧹 Cleanup: Removing ${scriptsToRemove.length} structured data scripts`);
        scriptsToRemove.forEach(script => script.remove());
      }
    };
  }, [blogStructuredData, breadcrumbStructuredData, productStructuredData, corporationStructuredData]);

  return null;
};

export default StructuredDataScripts;