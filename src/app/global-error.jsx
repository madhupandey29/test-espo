'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('Global application error', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="ge-outer">
          <div className="ge-inner">
            <p className="ge-label">Application fallback</p>
            <h1 className="ge-title">Something went wrong.</h1>
            <p className="ge-text">You can retry the page without leaving this session.</p>
            <button type="button" onClick={() => reset()} className="ge-btn">
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
