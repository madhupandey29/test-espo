'use client';
import React, { useEffect, useState } from 'react';
import ModernBlogCard from './modern-blog-card';
import styles from './ModernBlog.module.scss';
import { getBlogApiUrl } from '@/utils/blogApi';

const BLOG_API_URL = getBlogApiUrl();

const fetchBlogs = async () => {
  if (!BLOG_API_URL) {
    return [];
  }

  const res = await fetch(BLOG_API_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load blogs');
  const json = await res.json();
  return Array.isArray(json?.data) ? json.data : [];
};

const BlogGridArea = ({ tagname = null }) => {
  const selectedTag = tagname; // Use prop instead of URL param
  

  const [allBlogs, setAllBlogs] = useState([]);
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // Fetch all blogs
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr('');
        const data = await fetchBlogs();
        if (!alive) return;
        setAllBlogs(data);
      } catch (e) {
        if (alive) setErr(e?.message || 'Error loading blogs');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Filter blogs when tag changes or blogs are loaded
  useEffect(() => {

    if (!selectedTag) {
      // No tag selected, show all blogs
      setFilteredBlogs(allBlogs);
    } else {
      // Filter blogs by selected tag (case-insensitive)
      const filtered = allBlogs.filter(blog => {
        if (!blog?.tags || !Array.isArray(blog.tags)) return false;
        return blog.tags.some(tag => 
          tag.toLowerCase() === selectedTag.toLowerCase()
        );
      });
      setFilteredBlogs(filtered);
    }
  }, [selectedTag, allBlogs]);

  if (loading) {
    return (
      <section className={`${styles.modernBlogArea} py-5`}>
        <div className="container">
          <div className="text-center py-5">
            <div className={styles.loadingSpinner} aria-hidden="true">
              <span className="sr-only">Loading...</span>
            </div>
            <p className={`mt-3 ${styles.loadingText}`}>Loading latest articles...</p>
          </div>
        </div>
      </section>
    );
  }

  if (err) {
    return (
      <section className={`${styles.modernBlogArea} py-5`}>
        <div className="container">
          <div className="text-center py-5">
            <div className="blog-error-box" role="alert">
              <h4 className="blog-error-title">Oops! Something went wrong</h4>
              <p>{err}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`${styles.modernBlogArea} py-5`}>
      <div className="container">
        {/* Show selected tag filter */}
        {selectedTag && (
          <div className="mb-4">
            <div className="d-flex align-items-center justify-content-between">
              <h5 className="blog-tag-heading">
                Showing blogs tagged with: <span className="blog-tag-pill">{selectedTag}</span>
              </h5>
              <a href="/blog" className="blog-clear-filter-btn">
                Clear Filter
              </a>
            </div>
          </div>
        )}

        {/* Modern Blog Grid - Show filtered blogs */}
        <div className={styles.modernBlogGrid}>
          {filteredBlogs.map((blog, idx) => (
            <ModernBlogCard 
              key={blog._id || blog.id || idx} 
              blog={blog} 
              index={idx}
            />
          ))}
        </div>

        {/* Show message if no blogs found */}
        {filteredBlogs.length === 0 && !loading && !err && (
          <div className="text-center py-5">
            {selectedTag ? (
              <>
                <p className="blog-empty-text">No blog posts found with tag &quot;{selectedTag}&quot;.</p>
                <a href="/blog" className="blog-view-all-btn">
                  View All Blogs
                </a>
              </>
            ) : (
              <p className="blog-empty-text">No blog posts found.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default BlogGridArea;








