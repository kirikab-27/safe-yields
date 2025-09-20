// Lido Protocol APR Fetcher
interface LidoAPRResponse {
  data: {
    timeUnix: number;
    apr: number;
    apr7d: number;
    apr30d: number;
  }
}

export async function fetchLidoAPR(): Promise<number | null> {
  try {
    console.log('[Lido] Fetching APR from official API...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch('https://stake.lido.fi/api/steth-apr', {
      signal: controller.signal,
      next: { revalidate: 300 } // 5分キャッシュ
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data: LidoAPRResponse = await res.json();

    if (!data?.data?.apr || typeof data.data.apr !== 'number') {
      console.error('[Lido] Invalid response format:', data);
      return null;
    }

    const apr = data.data.apr;
    console.log(`[Lido] Successfully fetched APR: ${apr.toFixed(2)}%`);

    return apr;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('[Lido] Request timeout after 5 seconds');
      } else {
        console.error('[Lido] API fetch failed:', error.message);
      }
    }
    return null;
  }
}