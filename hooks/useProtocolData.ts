import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export interface ProtocolApiData {
  id: string;
  name: string;
  tvl: number;
  apy: number | null;
  chains: string[];
  audits: string | number;
  lastUpdated: number;
  _cached: boolean;
}

export function useProtocolData(id: string) {
  const { data, error, isLoading, mutate } = useSWR<ProtocolApiData>(
    id ? `/api/protocols/${id}` : null,
    fetcher,
    {
      refreshInterval: 60000, // 1分ごとに更新
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  return {
    data,
    error,
    isLoading,
    mutate,
    isFromCache: data?._cached || false,
  };
}