'use client';

import React, { useEffect, useRef, useState } from 'react';
import ResetButton from '../shop/shop-filter/reset-button';
import EnhancedShopSidebarFilters, {
  FIELD_FILTERS_MAP as FILTERS_MAP,
} from '../shop/EnhancedShopSidebarFilters';
import { FilterOnly } from '../shop/FilterOnly';
import { closeShopFilter, useShopFilterState } from '@/lib/ui-state-store';

const KEYCODES = { ESC: 27 };

const ShopFilterOffCanvas = ({ all_products, otherProps, right_side = false }) => {
  const { priceFilterValues, selectedFilters, handleFilterChange } = otherProps;
  const { filterSidebar } = useShopFilterState();

  const drawerRef = useRef(null);
  const wrapperRef = useRef(null);
  const [singleKey, setSingleKey] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const maxPrice = all_products.reduce((max, product) => {
    const val = Number(product?.price ?? 0);
    return val > max ? val : max;
  }, 0);

  const applyAndClose = (nextSelected) => {
    handleFilterChange(nextSelected);
    closeShopFilter();
  };

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const syncViewport = () => setIsMobile(window.innerWidth <= 480);
    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  useEffect(() => {
    if (!filterSidebar) return;
    const handleKey = (e) => {
      if (e.keyCode === KEYCODES.ESC) {
        if (singleKey) setSingleKey(null);
        else closeShopFilter();
      }
    };
    drawerRef.current?.focus();
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [filterSidebar, singleKey]);

  if (!filterSidebar) return null;

  return (
    <>
      <div
        className={`sfo-offcanvas${filterSidebar ? ' sfo-offcanvas--open' : ''}`}
        aria-hidden={!filterSidebar}
        aria-modal="true"
        role="dialog"
      >
        <div
          className={`sfo-wrapper${filterSidebar ? ' sfo-wrapper--open' : ''}${isMobile ? ' sfo-wrapper--mobile' : ''}`}
          ref={wrapperRef}
          data-state={filterSidebar ? 'open' : 'closed'}
        >
          {/* Header */}
          <div className="sfo-header">
            <div className={`sfo-header-content${isMobile ? ' sfo-header-content--mobile' : ''}`}>
              <button
                type="button"
                onClick={() => {
                  if (singleKey) { setSingleKey(null); return; }
                  closeShopFilter();
                }}
                className={`sfo-close-btn${isHovered ? ' sfo-close-btn--hover' : ''}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                aria-label={singleKey ? 'Back to all filters' : 'Close filters'}
                title={singleKey ? 'Back' : 'Close'}
                ref={drawerRef}
              >
                <i
                  className={`fa-solid ${singleKey ? 'fa-arrow-left' : 'fa-xmark'} sfo-close-icon`}
                />
                <span>{singleKey ? 'Back' : 'Close'}</span>
              </button>

              {!singleKey && (
                <div className="sfo-title-section">
                  <h3 className={`sfo-title${isMobile ? ' sfo-title--mobile' : ''}`}>
                    Filters
                  </h3>
                  <span className="sfo-subtitle">Refine your results</span>
                </div>
              )}

              {/* Clear All button */}
              {!singleKey && (() => {
                const activeCount = Object.values(selectedFilters || {}).reduce(
                  (sum, v) => sum + (Array.isArray(v) ? v.length : 0), 0
                );
                if (activeCount === 0) return null;
                return (
                  <button
                    type="button"
                    onClick={() => { handleFilterChange({}); closeShopFilter(); }}
                    className="sfo-clear-btn"
                    aria-label="Remove all filters"
                    title="Remove all filters"
                  >
                    <i className="fa-solid fa-xmark sfo-clear-icon" />
                    Remove ({activeCount})
                  </button>
                );
              })()}
            </div>
          </div>

          {/* Body */}
          <div className="sfo-content">
            {singleKey ? (
              <FilterOnly
                filter={FILTERS_MAP[singleKey]}
                selected={selectedFilters}
                onApply={(nextSelected) => { applyAndClose(nextSelected); setSingleKey(null); }}
                onCancel={() => setSingleKey(null)}
              />
            ) : (
              <>
                <div className={`sfo-scroll${isMobile ? ' sfo-scroll--mobile' : ''}`}>
                  <div className="sfo-filter-section">
                    <EnhancedShopSidebarFilters
                      selected={selectedFilters}
                      onFilterChange={applyAndClose}
                      eCatalogueProducts={all_products}
                      mobile
                      mobileSingle
                      onOpenFilter={(key) => setSingleKey(key)}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className={`sfo-footer${isMobile ? ' sfo-footer--mobile' : ''}`}>
                  <ResetButton
                    shop_right={right_side}
                    setPriceValues={priceFilterValues?.setPriceValue}
                    maxPrice={maxPrice}
                    handleFilterChange={applyAndClose}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Overlay */}
      <div
        onClick={closeShopFilter}
        className={`sfo-overlay${filterSidebar ? ' sfo-overlay--open' : ''}`}
        aria-hidden
      />
    </>
  );
};

export default ShopFilterOffCanvas;
