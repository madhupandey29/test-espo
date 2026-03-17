'use client';
import React from 'react';
import SectionTitle from './section-title';
import BlogGridArea from './blog-grid-area';
import { debugLog } from '@/utils/debugLog';

// Wrapper component
const BlogContentWrapper = ({ tagname = null }) => {
  debugLog('BlogContentWrapper - Received tagname:', tagname);
  
  return (
    <>
      <SectionTitle />
      <BlogGridArea tagname={tagname} />
    </>
  );
};

export default BlogContentWrapper;
