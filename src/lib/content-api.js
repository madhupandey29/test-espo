import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { getApiBaseUrl } from '@/utils/runtimeConfig';

const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
const API_KEY_HEADER = process.env.NEXT_PUBLIC_API_KEY_HEADER || 'x-api-key';

const IDLE_QUERY_STATE = Object.freeze({
  data: undefined,
  error: null,
  isLoading: false,
  isFetching: false,
  isSuccess: false,
  isError: false,
});

const queryCache = new Map();

function buildUrl(path) {
  const rawPath = String(path || '');

  if (/^https?:\/\//i.test(rawPath)) {
    return rawPath;
  }

  const normalizedPath = rawPath.replace(/^\/+/, '');
  const apiBase = getApiBaseUrl();
  return apiBase ? `${apiBase}/${normalizedPath}` : `/${normalizedPath}`;
}

function buildHeaders(headers, body) {
  const nextHeaders = new Headers(headers || {});

  if (API_KEY && !nextHeaders.has(API_KEY_HEADER)) {
    nextHeaders.set(API_KEY_HEADER, API_KEY);
  }

  if (!(body instanceof FormData) && !nextHeaders.has('Content-Type')) {
    nextHeaders.set('Content-Type', 'application/json');
  }

  return nextHeaders;
}

async function parseResponse(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function toRequestError(status, data, fallbackMessage) {
  const message =
    data?.message ||
    data?.error ||
    (typeof data === 'string' ? data : '') ||
    fallbackMessage ||
    'Request failed';

  return {
    status: status || 'CUSTOM_ERROR',
    data: {
      ...(data && typeof data === 'object' ? data : {}),
      message,
      error: data?.error || message,
    },
    message,
  };
}

async function requestJson(path, options = {}) {
  const { body, headers, method = 'GET', cache = 'no-store', ...rest } = options;
  const nextHeaders = buildHeaders(headers, body);
  const nextBody =
    body === undefined || body instanceof FormData || typeof body === 'string'
      ? body
      : JSON.stringify(body);

  let response;
  let data;

  try {
    response = await fetch(buildUrl(path), {
      method,
      credentials: 'include',
      cache,
      headers: nextHeaders,
      body: nextBody,
      ...rest,
    });
    data = await parseResponse(response);
  } catch (error) {
    throw toRequestError('FETCH_ERROR', undefined, error?.message || 'Network request failed');
  }

  if (!response.ok) {
    throw toRequestError(response.status, data, response.statusText);
  }

  return data;
}

function normalizeListResponse(response, fallbackPage = 1, fallbackLimit = 0) {
  let products = [];
  let total = 0;

  if (response?.success && Array.isArray(response.data)) {
    products = response.data;
    total = response.total || response.data.length;
  } else if (Array.isArray(response?.products)) {
    products = response.products;
    total = response.total || response.products.length;
  } else if (Array.isArray(response?.data)) {
    products = response.data;
    total = response.total || response.data.length;
  } else if (Array.isArray(response)) {
    products = response;
    total = response.length;
  }

  const limit = fallbackLimit || products.length || 1;
  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

  return {
    data: products,
    total,
    success: response?.success ?? true,
    pagination: response?.pagination || {
      page: fallbackPage,
      limit,
      totalPages,
      hasMore: fallbackPage * limit < total,
    },
  };
}

function normalizeFieldValuesResponse(response) {
  if (Array.isArray(response?.values)) {
    return response;
  }

  if (response?.success && Array.isArray(response.data)) {
    return {
      ...response,
      values: response.data,
    };
  }

  if (Array.isArray(response?.data)) {
    return {
      values: response.data,
    };
  }

  if (Array.isArray(response)) {
    return {
      values: response,
    };
  }

  return {
    values: [],
  };
}

function normalizeAuthorsResponse(response) {
  if (Array.isArray(response)) {
    return response.filter((author) => !author?.deleted);
  }

  if (response?.success && Array.isArray(response.data)) {
    return response.data.filter((author) => !author?.deleted);
  }

  return [];
}

function normalizeBlogsResponse(response) {
  if (Array.isArray(response)) {
    return response.filter((blog) => !blog?.deleted && blog?.status === 'Approved');
  }

  if (Array.isArray(response?.data)) {
    return response.data.filter((blog) => !blog?.deleted && blog?.status === 'Approved');
  }

  return [];
}

function normalizeGroupcodeProductsResponse(response) {
  if (Array.isArray(response?.products)) {
    return response.products;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return Array.isArray(response) ? response : [];
}

function findCatalogProduct(products, rawId) {
  const cleanId = rawId ? String(rawId).replace(/#$/, '') : rawId;

  return products.find((product) => {
    const productId = product?.id || product?._id;
    const productSlug = product?.productslug || product?.slug;
    const aiTempSlug = product?.aiTempOutput;
    const fabricCode = product?.fabricCode;

    return (
      productId === cleanId ||
      productSlug === cleanId ||
      aiTempSlug === cleanId ||
      fabricCode === cleanId
    );
  }) || null;
}

function filterProductsByCollection(products, collectionId) {
  if (!collectionId || String(collectionId).trim() === '') {
    return products;
  }

  return products.filter((product) => {
    return (
      product?.collectionId === collectionId ||
      product?.collection === collectionId ||
      product?.collection_id === collectionId
    );
  });
}

function filterProductsByMerchTags(products, requiredTags) {
  return products.filter((product) => {
    if (!Array.isArray(product?.merchTags)) {
      return false;
    }

    return requiredTags.every((tag) => product.merchTags.includes(tag));
  });
}

function createQueryEntry() {
  return {
    data: undefined,
    error: null,
    isLoading: false,
    isFetching: false,
    isSuccess: false,
    isError: false,
    promise: null,
    listeners: new Set(),
    snapshot: IDLE_QUERY_STATE,
  };
}

function refreshQuerySnapshot(entry) {
  const currentSnapshot = entry.snapshot;
  const nextSnapshot = {
    data: entry.data,
    error: entry.error,
    isLoading: entry.isLoading,
    isFetching: entry.isFetching,
    isSuccess: entry.isSuccess,
    isError: entry.isError,
  };

  if (
    currentSnapshot.data === nextSnapshot.data &&
    currentSnapshot.error === nextSnapshot.error &&
    currentSnapshot.isLoading === nextSnapshot.isLoading &&
    currentSnapshot.isFetching === nextSnapshot.isFetching &&
    currentSnapshot.isSuccess === nextSnapshot.isSuccess &&
    currentSnapshot.isError === nextSnapshot.isError
  ) {
    return currentSnapshot;
  }

  entry.snapshot = nextSnapshot;
  return nextSnapshot;
}

function getQueryEntry(key) {
  if (!queryCache.has(key)) {
    queryCache.set(key, createQueryEntry());
  }

  return queryCache.get(key);
}

function snapshotQueryEntry(entry) {
  return refreshQuerySnapshot(entry);
}

function notifyQueryEntry(entry) {
  entry.listeners.forEach((listener) => listener());
}

function subscribeToQuery(key, listener) {
  const entry = getQueryEntry(key);
  entry.listeners.add(listener);

  return () => {
    entry.listeners.delete(listener);
  };
}

async function executeQuery(key, fetcher, { force = false } = {}) {
  const entry = getQueryEntry(key);

  if (entry.promise && !force) {
    return entry.promise;
  }

  if (!force && entry.data !== undefined && !entry.isError) {
    return { data: entry.data };
  }

  const hasData = entry.data !== undefined;
  entry.error = null;
  entry.isError = false;
  entry.isFetching = true;
  entry.isLoading = !hasData;
  refreshQuerySnapshot(entry);
  notifyQueryEntry(entry);

  entry.promise = (async () => {
    try {
      const data = await fetcher();
      entry.data = data;
      entry.error = null;
      entry.isLoading = false;
      entry.isFetching = false;
      entry.isSuccess = true;
      entry.isError = false;
      refreshQuerySnapshot(entry);
      return { data };
    } catch (error) {
      entry.error = error;
      entry.isLoading = false;
      entry.isFetching = false;
      entry.isSuccess = false;
      entry.isError = true;
      refreshQuerySnapshot(entry);
      return { error };
    } finally {
      entry.promise = null;
      notifyQueryEntry(entry);
    }
  })();

  return entry.promise;
}

function useApiQuery(key, fetcher, options = {}) {
  const { skip = false } = options;
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const subscribe = useCallback(
    (listener) => {
      if (skip) {
        return () => {};
      }

      return subscribeToQuery(key, listener);
    },
    [key, skip]
  );

  const getSnapshot = useCallback(() => {
    if (skip) {
      return IDLE_QUERY_STATE;
    }

    return snapshotQueryEntry(getQueryEntry(key));
  }, [key, skip]);

  const getServerSnapshot = useCallback(() => IDLE_QUERY_STATE, []);
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (skip) {
      return;
    }

    void executeQuery(key, () => fetcherRef.current());
  }, [key, skip]);

  const refetch = useCallback(() => {
    if (skip) {
      return Promise.resolve({ data: undefined });
    }

    return executeQuery(key, () => fetcherRef.current(), { force: true });
  }, [key, skip]);

  return skip ? { ...IDLE_QUERY_STATE, refetch } : { ...state, refetch };
}

async function fetchFieldValues(fieldName) {
  const response = await requestJson(`product/fieldname/${fieldName}`);
  return normalizeFieldValuesResponse(response);
}

async function fetchAuthors() {
  const response = await requestJson('author');
  return normalizeAuthorsResponse(response);
}

async function fetchBlogs() {
  const response = await requestJson('blog');
  return normalizeBlogsResponse(response);
}

async function fetchSingleLegacyProduct(productId) {
  const response = await requestJson(`product/${productId}`);
  return response?.product || response?.data || response;
}

async function fetchProductsByGroupcode(groupcodeId) {
  const response = await requestJson(`product/groupcode/${groupcodeId}`);
  return normalizeGroupcodeProductsResponse(response);
}

async function fetchAllNewProducts(params = {}) {
  const { limit = 12, page = 1, merchTag } = params;
  let path = `product?limit=${limit}&page=${page}`;

  if (merchTag) {
    path += `&merchTag=${encodeURIComponent(merchTag)}`;
  }

  const response = await requestJson(path);
  return normalizeListResponse(response, page, limit);
}

async function fetchSingleNewProduct(productId) {
  const response = await requestJson('product?limit=200');
  const products = normalizeListResponse(response).data;

  return {
    data: findCatalogProduct(products, productId),
  };
}

async function fetchSearchNewProducts(query) {
  const response = await requestJson(`product/search/${encodeURIComponent(query)}`);
  return normalizeListResponse(response);
}

async function fetchProductsByMetric(metric, value) {
  const response = await requestJson(`product/${metric}/${encodeURIComponent(value)}`);
  return normalizeListResponse(response);
}

async function fetchProductsByCollection(collectionId) {
  const response = await requestJson('product?limit=200');
  const normalized = normalizeListResponse(response, 1, 200);
  const filteredProducts = filterProductsByCollection(normalized.data, collectionId);

  return {
    data: filteredProducts,
    total: filteredProducts.length,
    success: normalized.success,
    collectionId,
  };
}

async function fetchTopRatedProducts() {
  const response = await requestJson('product?limit=200&source=toprated');
  const normalized = normalizeListResponse(response, 1, 200);
  const filteredProducts = filterProductsByMerchTags(normalized.data, ['TopRatedFabrics', 'ecatalogue']);

  return {
    data: filteredProducts,
    total: filteredProducts.length,
    success: normalized.success,
    filtered: true,
    filterTags: ['TopRatedFabrics', 'ecatalogue'],
  };
}

export function useGetFieldValuesQuery(fieldName, options = {}) {
  const fetcher = useCallback(() => fetchFieldValues(fieldName), [fieldName]);
  return useApiQuery(`field-values:${fieldName}`, fetcher, {
    skip: options.skip || !fieldName,
  });
}

export function useGetAuthorsQuery(_arg, options = {}) {
  const fetcher = useCallback(() => fetchAuthors(), []);
  return useApiQuery('authors', fetcher, {
    skip: options.skip || false,
  });
}

export function useGetBlogsQuery(_arg, options = {}) {
  const fetcher = useCallback(() => fetchBlogs(), []);
  return useApiQuery('blogs', fetcher, {
    skip: options.skip || false,
  });
}

export function useGetSingleProductQuery(productId, options = {}) {
  const fetcher = useCallback(() => fetchSingleLegacyProduct(productId), [productId]);
  return useApiQuery(`legacy-product:${productId}`, fetcher, {
    skip: options.skip || !productId,
  });
}

export function useGetProductsByGroupcodeQuery(groupcodeId, options = {}) {
  const fetcher = useCallback(() => fetchProductsByGroupcode(groupcodeId), [groupcodeId]);
  return useApiQuery(`groupcode-products:${groupcodeId}`, fetcher, {
    skip: options.skip || !groupcodeId,
  });
}

export function useGetAllNewProductsQuery(params, options = {}) {
  const normalizedParams = params || {};
  const fetcher = useCallback(() => fetchAllNewProducts(normalizedParams), [normalizedParams]);
  return useApiQuery(`all-new-products:${JSON.stringify(normalizedParams)}`, fetcher, {
    skip: options.skip || false,
  });
}

export function useGetSingleNewProductQuery(productId, options = {}) {
  const fetcher = useCallback(() => fetchSingleNewProduct(productId), [productId]);
  return useApiQuery(`single-new-product:${productId}`, fetcher, {
    skip: options.skip || !productId,
  });
}

export function useSearchNewProductQuery(query, options = {}) {
  const fetcher = useCallback(() => fetchSearchNewProducts(query), [query]);
  return useApiQuery(`search-new-products:${query}`, fetcher, {
    skip: options.skip || !query,
  });
}

export function useGetGsmUptoQuery(value, options = {}) {
  const fetcher = useCallback(() => fetchProductsByMetric('gsm', value), [value]);
  return useApiQuery(`products-gsm:${value}`, fetcher, {
    skip: options.skip || value === undefined || value === null || value === '',
  });
}

export function useGetOzUptoQuery(value, options = {}) {
  const fetcher = useCallback(() => fetchProductsByMetric('ozs', value), [value]);
  return useApiQuery(`products-oz:${value}`, fetcher, {
    skip: options.skip || value === undefined || value === null || value === '',
  });
}

export function useGetPriceUptoQuery(value, options = {}) {
  const fetcher = useCallback(() => fetchProductsByMetric('price', value), [value]);
  return useApiQuery(`products-price:${value}`, fetcher, {
    skip: options.skip || value === undefined || value === null || value === '',
  });
}

export function useGetQuantityUptoQuery(value, options = {}) {
  const fetcher = useCallback(() => fetchProductsByMetric('quantity', value), [value]);
  return useApiQuery(`products-quantity:${value}`, fetcher, {
    skip: options.skip || value === undefined || value === null || value === '',
  });
}

export function useGetPurchasePriceUptoQuery(value, options = {}) {
  const fetcher = useCallback(() => fetchProductsByMetric('purchaseprice', value), [value]);
  return useApiQuery(`products-purchase-price:${value}`, fetcher, {
    skip: options.skip || value === undefined || value === null || value === '',
  });
}

export function useGetProductsByCollectionQuery(collectionId, options = {}) {
  const fetcher = useCallback(() => fetchProductsByCollection(collectionId), [collectionId]);
  return useApiQuery(`products-by-collection:${collectionId}`, fetcher, {
    skip: options.skip || !collectionId,
  });
}

export function useGetTopRatedQuery(_arg, options = {}) {
  const fetcher = useCallback(() => fetchTopRatedProducts(), []);
  return useApiQuery('top-rated-products', fetcher, {
    skip: options.skip || false,
  });
}

