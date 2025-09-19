'use client';

import useSWR from 'swr';
import { useEffect, useMemo } from 'react';

interface ProtocolData {
  id: string;
  name: string;
  tvl: number;
  apy: number | null;
  chains?: string[];
  audits?: string | number;
  lastUpdated: number;
  source?: 'api' | 'fallback' | 'cache';
  _cached: boolean;
}

interface BatchResponse {
  data: {
    [protocol: string]: ProtocolData | null;
  };
  errors: {
    [protocol: string]: string;
  };
  _cached: {
    [protocol: string]: boolean;
  };
  timestamp: number;
}

const fetcher = async (url: string): Promise<BatchResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  return res.json();
};

interface UseBatchProtocolDataReturn {
  data: BatchResponse | undefined;
  protocols: { [key: string]: ProtocolData | null };
  errors: { [key: string]: string };
  isLoading: boolean;
  isError: boolean;
  mutate: () => void;
}

/**
 * Hook to fetch batch protocol data
 * Optimized version that fetches all protocols in a single request
 */
export function useBatchProtocolData(
  protocolIds?: string[]
): UseBatchProtocolDataReturn {
  const protocols = protocolIds || ['lido', 'rocket-pool', 'aave-v3', 'compound-v3', 'curve'];
  const url = `/api/protocols/batch?protocols=${protocols.join(',')}`;

  const { data, error, isLoading, mutate } = useSWR<BatchResponse>(
    url,
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

  // Parse protocol data
  const protocolData = useMemo(() => {
    if (!data) return {};
    return data.data || {};
  }, [data]);

  // Parse errors
  const protocolErrors = useMemo(() => {
    if (!data) return {};
    return data.errors || {};
  }, [data]);

  // Log performance metrics in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && data) {
      const cachedCount = Object.values(data._cached || {}).filter(c => c).length;
      const totalCount = Object.keys(data.data || {}).length;
      const cacheHitRate = totalCount > 0 ? (cachedCount / totalCount) * 100 : 0;

      console.log('[Batch API] Performance Metrics:', {
        totalProtocols: totalCount,
        cachedProtocols: cachedCount,
        cacheHitRate: `${cacheHitRate.toFixed(1)}%`,
        timestamp: new Date(data.timestamp).toISOString(),
      });
    }
  }, [data]);

  return {
    data,
    protocols: protocolData,
    errors: protocolErrors,
    isLoading,
    isError: !!error,
    mutate,
  };
}

/**
 * Hook to get individual protocol data from batch
 * This allows existing components to work with batch data
 */
export function useProtocolFromBatch(
  protocolId: string,
  batchData?: BatchResponse
) {
  const protocol = batchData?.data?.[protocolId] || null;
  const error = batchData?.errors?.[protocolId] || null;
  const isCached = batchData?._cached?.[protocolId] || false;

  return {
    data: protocol,
    error,
    isLoading: !batchData,
    isFromCache: isCached,
  };
}