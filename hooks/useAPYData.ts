'use client';

import { useEffect, useState } from 'react';

export function useAPYData() {
  const [apyData, setApyData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAPYData() {
      try {
        setLoading(true);
        const response = await fetch('/api/yields');

        if (!response.ok) {
          throw new Error('Failed to fetch APY data');
        }

        const result = await response.json();

        if (result.success && result.data) {
          setApyData(result.data);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Failed to fetch APY data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchAPYData();

    // Refresh APY data every 5 minutes
    const interval = setInterval(fetchAPYData, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return { apyData, loading, error };
}