import React, { useId } from 'react';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function StaticStarRating({
  value = 0,
  size = 16,
  total = 5,
  fillColor = 'var(--tp-theme-secondary)',
  emptyColor = 'rgba(15, 34, 53, 0.18)',
  className = '',
  label,
}) {
  const baseId = useId();
  const safeValue = clamp(Number(value) || 0, 0, total);

  return (
    <span
      className={className}
      role="img"
      aria-label={label || `${safeValue} out of ${total} stars`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}
    >
      {Array.from({ length: total }).map((_, index) => {
        const fill = clamp(safeValue - index, 0, 1) * 100;
        const gradientId = `${baseId}-${index}`;

        return (
          <svg
            key={gradientId}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id={gradientId}>
                <stop offset={`${fill}%`} stopColor={fillColor} />
                <stop offset={`${fill}%`} stopColor={emptyColor} />
              </linearGradient>
            </defs>
            <path
              d="M12 2.75l2.91 5.89 6.5.95-4.7 4.58 1.11 6.47L12 17.66 6.18 20.64l1.11-6.47-4.7-4.58 6.5-.95L12 2.75z"
              fill={`url(#${gradientId})`}
            />
          </svg>
        );
      })}
    </span>
  );
}
