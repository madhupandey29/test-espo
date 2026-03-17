import { debugLog } from '@/utils/debugLog';
import { getApiBaseUrl } from '@/utils/runtimeConfig';

function buildCartUrl(path = '') {
  const apiBase = getApiBaseUrl();
  const normalizedPath = String(path || '').replace(/^\/+/, '');

  if (!apiBase) {
    throw new Error('API base URL is not configured.');
  }

  return `${apiBase}/${normalizedPath}`;
}

function transformCartResponse(response) {
  const allItems = Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response)
      ? response
      : [];
  const cartItems = allItems.filter((item) => item.itemType === 'cart');

  debugLog('🛒 Cart client - Raw response:', response);
  debugLog(
    '🛒 Cart client - Filtered cart items:',
    cartItems.length,
    'out of',
    allItems.length
  );

  const transformedItems = cartItems.map((item) => {
    const transformedItem = {
      _id: item.id,
      productId: {
        _id: item.productId,
        name: item.productName || item.product?.name,
        ...(item.product || {}),
      },
      quantity: item.qty || 1,
      price: parseFloat(item.price) || 0,
      priceCurrency: item.priceCurrency || 'USD',
      priceConverted: item.priceConverted || parseFloat(item.price) || 0,
    };

    debugLog('🛒 Cart client - Transforming item:', {
      id: item.id,
      productId: item.productId,
      qty: item.qty,
    });

    return transformedItem;
  });

  return {
    success: true,
    data: {
      items: transformedItems,
      cartTotal: transformedItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
    },
  };
}

async function resolveCartPricing({ productId, price, priceCurrency }) {
  if (price && price !== 0 && price !== '0.00') {
    return {
      price,
      priceCurrency: priceCurrency || 'USD',
    };
  }

  try {
    debugLog('🛒 Fetching product price for:', productId);
    const productRes = await fetch(buildCartUrl(`products/${productId}`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include',
    });

    if (!productRes.ok) {
      return {
        price: price || '0.00',
        priceCurrency: priceCurrency || 'USD',
      };
    }

    const productJson = await productRes.json();
    const productData = productJson?.data || productJson;

    return {
      price: productData?.price || price || '0.00',
      priceCurrency: productData?.priceCurrency || priceCurrency || 'INR',
    };
  } catch (error) {
    console.warn('🛒 Failed to fetch product price:', error);
    return {
      price: price || '0.00',
      priceCurrency: priceCurrency || 'USD',
    };
  }
}

export async function fetchCartData(userId) {
  if (!userId) {
    return {
      success: true,
      data: {
        items: [],
        cartTotal: 0,
      },
    };
  }

  const response = await fetch(
    buildCartUrl(`wishlist/fieldname/customerAccountId/${encodeURIComponent(userId)}`),
    {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(errorText || 'Failed to load cart');
  }

  const json = await response.json();
  return transformCartResponse(json);
}

export async function addCartItem({
  userId,
  productId,
  quantity = 1,
  price = null,
  priceCurrency = 'USD',
}) {
  if (!userId || !productId) {
    throw new Error('Missing userId or productId');
  }

  debugLog('🛒 ADD TO CART:', { userId, productId, quantity, price, priceCurrency });

  const pricing = await resolveCartPricing({ productId, price, priceCurrency });
  const response = await fetch(buildCartUrl('wishlist'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      customerAccountId: userId,
      productId,
      itemType: 'cart',
      qty: quantity,
      price: pricing.price || '0.00',
      priceCurrency: pricing.priceCurrency,
    }),
  });

  debugLog('🛒 ADD TO CART Response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    console.error('🛒 ADD TO CART Error:', errorText);

    if (errorText.includes('already') || errorText.includes('duplicate') || errorText.includes('exists')) {
      throw new Error('Item already in cart');
    }

    throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to add to cart'}`);
  }

  const json = await response.json();
  debugLog('🛒 ADD TO CART Response:', json);

  if (!json?.success) {
    const message = json?.message || '';

    if (message.includes('already') || message.includes('duplicate') || message.includes('exists')) {
      throw new Error('Item already in cart');
    }

    throw new Error(message || 'Add to cart failed');
  }

  return json;
}
