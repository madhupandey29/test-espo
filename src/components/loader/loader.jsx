import React from 'react';
import styles from './loader.module.css';

const normalizeColor = (value = '#800000') =>
  String(value).startsWith('#') ? String(value) : `#${value}`;

const Loader = ({ loading, spinner = 'scale', color = '#800000' }) => {
  if (!loading) return null;

  const resolvedColor = normalizeColor(color);
  const isFade = spinner === 'fade';
  const items = isFade ? 5 : 3;
  const className = `${styles.loader} ${isFade ? styles.fade : styles.scale}`;

  return (
    <div
      className={className}
      style={{ '--tp-loader-color': resolvedColor }}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      {Array.from({ length: items }).map((_, index) => (
        <span
          key={index}
          className={styles.segment}
          style={{ animationDelay: `${index * 0.12}s` }}
        />
      ))}
    </div>
  );
};

export default Loader;
