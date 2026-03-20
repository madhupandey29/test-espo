import React, { useState, useEffect } from "react";
import { useGetFieldValuesQuery } from "@/lib/content-api";

/**
 * Mobile Filter Only Component for New API
 */
const FilterOnly = ({ filter, selected, onApply, onCancel }) => {
  const [draft, setDraft] = useState(() => {
    const obj = {};
    obj[filter.key] = (Array.isArray(selected[filter.key])
      ? selected[filter.key]
      : []
    ).map(String);
    return obj;
  });

  const { data: fieldData, isLoading, error } = useGetFieldValuesQuery(filter.key, {
    skip: !filter,
  });

  useEffect(() => {}, [filter, isLoading, error, fieldData]);

  const toggleDraft = (key, rawValue) => {
    const value = String(rawValue);
    setDraft((d) => {
      const cur = new Set(d[key] || []);
      if (cur.has(value)) cur.delete(value);
      else cur.add(value);
      return { ...d, [key]: [...cur] };
    });
  };

  const values = draft[filter.key] || [];
  const fieldValues = fieldData?.values || [];

  const handleApply = () => {
    const merged = { ...selected, ...draft };
    if (Array.isArray(merged[filter.key]) && merged[filter.key].length === 0) {
      delete merged[filter.key];
    }
    onApply?.(merged);
  };

  const handleClear = () => {
    const next = { ...selected };
    delete next[filter.key];
    onApply?.(next);
  };

  return (
    <div className="fo-root">
      {/* Header */}
      <div className="fo-header">
        <div>
          {values.length > 0 && (
            <div className="fo-selected-count">{values.length} selected</div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="fo-body">
        {isLoading && (
          <div className="fo-loading">
            <div className="fo-loading-text">Loading options...</div>
          </div>
        )}

        {error && (
          <div className="fo-error">
            <div>⚠️ Failed to load</div>
            <div className="fo-error-hint">Please try again</div>
          </div>
        )}

        {!isLoading && !error && !fieldValues?.length && (
          <div className="fo-empty">
            <div>No options available</div>
          </div>
        )}

        {!isLoading && !error && fieldValues?.length > 0 && (
          <div className="fo-list">
            {fieldValues.map((value) => {
              const checked = values.includes(String(value));
              return (
                <label
                  key={value}
                  className="fo-item mobile-filter-item"
                  onClick={() => toggleDraft(filter.key, value)}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    readOnly
                    className="fo-checkbox"
                    style={{
                      background: checked ? "var(--tp-theme-primary)" : "#fff",
                      borderColor: checked ? "var(--tp-theme-primary)" : "#e2e8f0",
                    }}
                  />
                  <span className="fo-item-label">{value}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="fo-footer">
        <button
          type="button"
          onClick={handleClear}
          disabled={values.length === 0}
          className="fo-btn-clear"
        >
          Clear
        </button>
        <button type="button" onClick={onCancel} className="fo-btn-cancel">
          Cancel
        </button>
        <button type="button" onClick={handleApply} className="fo-btn-apply">
          Apply
          {values.length > 0 && (
            <span className="fo-badge">{values.length}</span>
          )}
        </button>
      </div>
    </div>
  );
};

export { FilterOnly };
export default FilterOnly;
