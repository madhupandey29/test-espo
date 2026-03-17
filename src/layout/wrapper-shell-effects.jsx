'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'react-toastify/dist/ReactToastify.css';

import useAuthCheck from '@/hooks/use-auth-check';
import useWishlistManager from '@/hooks/useWishlistManager';

const ToastContainer = dynamic(
  () => import('react-toastify').then((mod) => mod.ToastContainer),
  {
    ssr: false,
    loading: () => null,
  }
);

const WrapperShellEffects = ({ onAuthChecked }) => {
  const authChecked = useAuthCheck();

  useWishlistManager();

  useEffect(() => {
    onAuthChecked?.(authChecked);
  }, [authChecked, onAuthChecked]);

  if (!authChecked) {
    return null;
  }

  return <ToastContainer position="bottom-center" autoClose={3000} />;
};

export default WrapperShellEffects;
