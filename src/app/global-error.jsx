'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('Global application error', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: '2rem',
            background: '#f5f1eb',
            color: '#171717',
          }}
        >
          <div style={{ maxWidth: '32rem', textAlign: 'center' }}>
            <p
              style={{
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: '0.75rem',
              }}
            >
              Application fallback
            </p>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
              Something went wrong.
            </h1>
            <p style={{ marginBottom: '1.5rem', lineHeight: 1.6 }}>
              You can retry the page without leaving this session.
            </p>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                border: 0,
                borderRadius: '999px',
                padding: '0.9rem 1.4rem',
                background: '#171717',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}