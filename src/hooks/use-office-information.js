'use client';

import { useEffect, useState } from 'react';
import { getApiBaseUrl } from '@/utils/runtimeConfig';

const EMPTY_RESPONSE = { success: false, data: [] };

let officeInfoCache = null;
let officeInfoPromise = null;

function normalizeOfficeInformationResponse(response) {
  if (!response?.success || !Array.isArray(response.data)) {
    return EMPTY_RESPONSE;
  }

  const companyFilter = process.env.NEXT_PUBLIC_COMPANY_FILTER;
  if (!companyFilter) {
    return EMPTY_RESPONSE;
  }

  const targetCompany = response.data.find((company) => company.name === companyFilter);
  if (!targetCompany) {
    return EMPTY_RESPONSE;
  }

  return {
    success: true,
    data: [targetCompany],
  };
}

async function fetchOfficeInformation(signal) {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    return EMPTY_RESPONSE;
  }

  const normalizedApiBaseUrl = String(apiBaseUrl).replace(/\/+$/, '');
  const headers = {
    'Content-Type': 'application/json',
  };

  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  const response = await fetch(normalizedApiBaseUrl + '/companyinformation', {
    method: 'GET',
    headers,
    signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch office information: ${response.status}`);
  }

  const json = await response.json();
  return normalizeOfficeInformationResponse(json);
}

function loadOfficeInformation(signal) {
  if (officeInfoCache) {
    return Promise.resolve(officeInfoCache);
  }

  if (!officeInfoPromise) {
    officeInfoPromise = fetchOfficeInformation(signal)
      .then((data) => {
        officeInfoCache = data;
        return data;
      })
      .finally(() => {
        officeInfoPromise = null;
      });
  }

  return officeInfoPromise;
}

export default function useOfficeInformation() {
  const [data, setData] = useState(() => officeInfoCache || EMPTY_RESPONSE);
  const [isLoading, setIsLoading] = useState(() => officeInfoCache === null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    if (officeInfoCache) {
      setData(officeInfoCache);
      setIsLoading(false);
      setError(null);
      return () => controller.abort();
    }

    setIsLoading(true);
    setError(null);

    loadOfficeInformation(controller.signal)
      .then((response) => {
        if (!mounted) {
          return;
        }

        setData(response);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!mounted || err?.name === 'AbortError') {
          return;
        }

        setError(err);
        setData(EMPTY_RESPONSE);
        setIsLoading(false);
      });

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  return {
    data,
    office: data?.data?.[0] ?? null,
    isLoading,
    error,
  };
}

export function resetOfficeInformationCache() {
  officeInfoCache = null;
  officeInfoPromise = null;
}
