/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import Wrapper from "@/layout/wrapper";
import HeaderTwo from "@/layout/headers/header-2";
import FashionBanner from "@/components/banner/fashion-banner";
import DeferredSection from "@/components/common/deferred-section";

// ✅ Lazy load below-the-fold components with ssr: false to prevent bailout
const HomeCategorySection = dynamic(
  () => import("@/components/categories/home-category-section"),
  { ssr: false, loading: () => <div style={{ minHeight: "300px" }} /> }
);
const PopularProducts = dynamic(
  () => import("@/components/products/fashion/popular-products"),
  { ssr: false, loading: () => <div style={{ minHeight: "500px" }} /> }
);
const WeeksFeatured = dynamic(
  () => import("@/components/products/fashion/weeks-featured"),
  { ssr: false, loading: () => <div style={{ minHeight: "400px" }} /> }
);
const DynamicProductSection = dynamic(
  () => import("@/components/products/fashion/dynamic-section"),
  { ssr: false, loading: () => <div style={{ minHeight: "400px" }} /> }
);
const FashionTestimonial = dynamic(
  () => import("@/components/testimonial/fashion-testimonial"),
  { ssr: false, loading: () => <div style={{ minHeight: "400px" }} /> }
);
const BlogArea = dynamic(() => import("@/components/blog/fashion/blog-area"), {
  ssr: false,
  loading: () => <div style={{ minHeight: "400px" }} />,
});
const FeatureAreaTwo = dynamic(
  () => import("@/components/features/feature-area-2"),
  { ssr: false, loading: () => <div style={{ minHeight: "200px" }} /> }
);
const Footer = dynamic(() => import("@/layout/footers/footer"), {
  ssr: false,
  loading: () => <div style={{ minHeight: "400px" }} />,
});

import { FiShare2 } from "react-icons/fi";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { normalizeSocialUrl } from "@/utils/socialLinks";

export default function HomePageTwoClient({ office = null, homeProducts = [], homeBlogs = [], categorySummaries = [], dynamicSections = [], dynamicSectionsData = [] }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // close on outside click / ESC
  useEffect(() => {
    if (!open) return;

    const onDocClick = (e) => {
      const root = document.getElementById("age-social-share-root");
      if (root && e?.target && !root.contains(e.target)) setOpen(false);
    };

    const onEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const links = useMemo(() => {
    return [
      {
        id: "fb",
        icon: <FaFacebookF />,
        color: "#1877F2",
        href: normalizeSocialUrl(office?.facebookUrl, "facebook"),
      },
      {
        id: "ig",
        icon: <FaInstagram />,
        color: "#E1306C",
        href: normalizeSocialUrl(office?.instagramUrl, "instagram"),
      },
      {
        id: "ln",
        icon: <FaLinkedinIn />,
        color: "#0A66C2",
        href: normalizeSocialUrl(office?.linkedinUrl, "linkedin"),
      },
      {
        id: "yt",
        icon: <FaYoutube />,
        color: "#FF0000",
        href: normalizeSocialUrl(office?.youtubeUrl, "youtube"),
      },
      {
        id: "tw",
        icon: <FaXTwitter />,
        color: "#000000",
        href: normalizeSocialUrl(office?.xUrl, "twitter"),
      },
    ].filter((link) => Boolean(link.href));
  }, [office]);

  return (
    <Wrapper>
      <HeaderTwo />
      <FashionBanner />
      {dynamicSectionsData.length > 0 ? (
        dynamicSectionsData.map((section) => (
          <DeferredSection key={section.id} minHeight={500}>
            <DynamicProductSection
              sectionId={section.id}
              sectionTitle={section.title}
              products={section.products}
              sectionPath={`/dynamicsection/${section.id}`}
              showViewAll={true}
            />
          </DeferredSection>
        ))
      ) : (
        <>
          <HomeCategorySection categorySummaries={categorySummaries} />
          <DeferredSection minHeight={500}>
            <PopularProducts products={homeProducts} />
          </DeferredSection>
          <DeferredSection minHeight={420}>
            <WeeksFeatured products={homeProducts} />
          </DeferredSection>
        </>
      )}
      <DeferredSection minHeight={220}>
        <FeatureAreaTwo />
      </DeferredSection>
      <DeferredSection minHeight={420}>
        <FashionTestimonial />
      </DeferredSection>
      <DeferredSection minHeight={420}>
        <BlogArea initialBlogs={homeBlogs} />
      </DeferredSection>

      {/* ✅ Social Share (Portal + unique class names) */}
      {mounted &&
        links.length > 0 &&
        createPortal(
          <div id="age-social-share-root" className="age-social-root">
            <button
              type="button"
              className={`age-social-toggle ${open ? "is-open" : ""}`}
              aria-label="Share"
              title="Share"
              onClick={() => setOpen((v) => !v)}
            >
              <FiShare2 size={20} />
            </button>

            <ul className={`age-social-items ${open ? "show" : ""}`} aria-hidden={!open}>
              {links.map((s, i) => (
                <li
                  key={s.id}
                  className="age-social-item"
                  style={{
                    background: s.color,
                    "--d": `${i * 70}ms`, // ✅ stagger delay (reliable)
                  }}
                >
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.id}
                    title={s.id}
                  >
                    {s.icon}
                  </a>
                </li>
              ))}
            </ul>
          </div>,
          document.body
        )}

      <Footer />

      <style jsx global>{`
        .age-social-root{
          position: fixed;
          right: 22px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 99999;
        }

        .age-social-toggle{
          width: 52px;
          height: 52px;
          border-radius: 999px;
          border: 0;
          background: #111827;
          color: #fff;
          display: grid;
          place-items: center;
          cursor: pointer;
          box-shadow: 0 14px 35px rgba(0,0,0,.22);
        }

        .age-social-toggle svg{
          transition: transform .22s cubic-bezier(.2,1,.3,1);
        }

        .age-social-toggle.is-open svg{
          transform: rotate(18deg) scale(1.05);
        }

        .age-social-items{
          list-style: none;
          margin: 0;
          padding: 0;
          position: absolute;
          right: 0;
          top: 50%;
          transform: translate(calc(-100% - 14px), -50%);
          display: flex;
          flex-direction: column;
          gap: 12px;
          opacity: 0;
          pointer-events: none;
        }

        .age-social-items.show{
          opacity: 1;
          pointer-events: auto;
        }

        .age-social-items .age-social-item{
          width: 46px;
          height: 46px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          box-shadow: 0 12px 28px rgba(0,0,0,.18);
          opacity: 0;
          transform: translateX(18px) scale(.2);
          will-change: transform, opacity;
        }

        .age-social-items.show .age-social-item{
          animation: ageSocialPopIn .34s cubic-bezier(.16,1,.3,1) both !important;
          animation-delay: var(--d, 0ms);
        }

        .age-social-item a{
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          color: #fff;
          font-size: 18px;
          text-decoration: none;
          transition: transform .15s ease;
        }

        .age-social-items.show .age-social-item:hover{
          transform: translateX(0) scale(1.06);
        }

        .age-social-items.show .age-social-item:hover a{
          transform: scale(1.06);
        }

        @keyframes ageSocialPopIn{
          0%{
            opacity: 0;
            transform: translateX(18px) scale(.2);
          }
          65%{
            opacity: 1;
            transform: translateX(-4px) scale(1.12);
          }
          100%{
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @media (max-width: 768px){
          .age-social-root{ right: 14px; }
          .age-social-toggle{ width: 48px; height: 48px; }
          .age-social-items .age-social-item{ width: 44px; height: 44px; }
        }

        @media (prefers-reduced-motion: reduce){
          .age-social-items.show .age-social-item{
            animation: none !important;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </Wrapper>
  );
}


