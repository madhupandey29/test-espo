'use client';

import { useEffect, useMemo } from 'react';
import useCartProducts from '@/hooks/use-cart-products';

const useCartInfo = (enabled = true) => {
  const { cartItems } = useCartProducts(enabled);

  useEffect(() => {
    if (cartItems.length !== 0 || typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.removeItem('cart');
      localStorage.removeItem('cartItems');
      sessionStorage.removeItem('cart');
      sessionStorage.removeItem('cartItems');
    } catch (e) {
      // Ignore storage errors
    }
  }, [cartItems.length]);

  const { total, quantity } = useMemo(() => {
    return cartItems.reduce(
      (cartTotal, cartItem) => {
        if (!cartItem?.productId) {
          return cartTotal;
        }

        const product = cartItem?.productId || cartItem?.product || cartItem;
        const { salesPrice, price, orderQuantity, quantity: itemQuantity } = cartItem;

        if (!product || !product._id) {
          return cartTotal;
        }

        const itemPrice = salesPrice || price || 0;
        const qty = orderQuantity || itemQuantity || cartItem?.quantity || 0;

        if (qty > 0) {
          cartTotal.total += itemPrice * qty;
          cartTotal.quantity += 1;
        }

        return cartTotal;
      },
      {
        total: 0,
        quantity: 0,
      }
    );
  }, [cartItems]);

  return {
    quantity,
    total: Number(total.toFixed(2)),
  };
};

export default useCartInfo;
