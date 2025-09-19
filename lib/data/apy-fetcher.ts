// APY data fetching from DeFiLlama Yields API
export interface YieldPool {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apyBase: number | null;
  apyReward: number | null;
  apy: number | null;
  pool: string;
  stablecoin: boolean;
}

interface YieldsApiResponse {
  status: string;
  data: YieldPool[];
}

// Mapping of our protocol IDs to DeFiLlama Yields project names
const protocolToYieldsMapping: Record<string, string> = {
  'lido': 'lido',
  'rocket-pool': 'rocket-pool',
  'aave-v3': 'aave-v3',
  'compound-v3': 'compound-v3',
  'curve': 'curve-dex'
};

// Cache for APY data with 5-minute TTL
let apyCache: {
  data: YieldPool[] | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Fetch with timeout helper
async function fetchWithTimeout(url: string, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// Fetch all yield pools from DeFiLlama
export async function fetchAllYieldPools(): Promise<YieldPool[]> {
  // Check cache first
  if (apyCache.data && Date.now() - apyCache.timestamp < CACHE_TTL) {
    console.log('[APY] Using cached yield data');
    return apyCache.data;
  }

  try {
    console.log('[APY] Fetching fresh yield data from DeFiLlama');
    const response = await fetchWithTimeout('https://yields.llama.fi/pools', 15000);

    if (!response.ok) {
      throw new Error(`Failed to fetch yields: ${response.status}`);
    }

    const data: YieldsApiResponse = await response.json();

    if (data.status === 'success' && data.data) {
      // Update cache
      apyCache = {
        data: data.data,
        timestamp: Date.now()
      };

      console.log(`[APY] Successfully fetched ${data.data.length} yield pools`);
      return data.data;
    }

    throw new Error('Invalid response format from Yields API');
  } catch (error) {
    console.error('[APY] Failed to fetch yield pools:', error);

    // Return cached data if available, even if expired
    if (apyCache.data) {
      console.log('[APY] Returning expired cache due to fetch error');
      return apyCache.data;
    }

    return [];
  }
}

// Fallback APY values when live data is unavailable
// Set to null for protocols where we don't want to show estimated values
const fallbackAPYValues: Record<string, number | null> = {
  'lido': 2.6,
  'rocket-pool': 2.4,
  'aave-v3': 3.5,
  'compound-v3': null,  // Don't show estimated value for Compound V3
  'curve': 5.2
};

// Get APY data for a specific protocol
export async function getProtocolAPY(protocolId: string): Promise<{
  apy: number | null;
  pools: YieldPool[];
}> {
  const yieldsProjectName = protocolToYieldsMapping[protocolId];

  if (!yieldsProjectName) {
    console.warn(`[APY] No yields mapping for protocol: ${protocolId}`);
    // Return fallback APY if available
    const fallback = fallbackAPYValues[protocolId];
    return {
      apy: fallback !== undefined ? fallback : null,
      pools: []
    };
  }

  try {
    const allPools = await fetchAllYieldPools();

    // Filter pools for this protocol
    const protocolPools = allPools.filter(
      pool => pool.project === yieldsProjectName
    );

    if (protocolPools.length === 0) {
      console.log(`[APY] No pools found for ${yieldsProjectName}, using fallback`);
      // Use fallback APY when no pools are found
      const fallback = fallbackAPYValues[protocolId];
      return {
        apy: fallback !== undefined ? fallback : null,
        pools: []
      };
    }

    // Sort pools by TVL to get the most significant ones
    protocolPools.sort((a, b) => b.tvlUsd - a.tvlUsd);

    // Special handling for Compound V3 - return null if no valid data
    if (protocolId === 'compound-v3') {
      // Check if any pools have meaningful data
      const hasValidData = protocolPools.some(pool => pool.tvlUsd > 1000 && pool.apy > 0);
      if (!hasValidData) {
        console.log(`[APY] ${protocolId}: No valid pools found, returning null`);
        return {
          apy: null,
          pools: protocolPools
        };
      }
    }

    // Calculate weighted average APY based on TVL
    let totalTvl = 0;
    let weightedApy = 0;

    // Use top 5 pools or all if less than 5
    const topPools = protocolPools.slice(0, 5);

    for (const pool of topPools) {
      if (pool.apy > 0 && pool.tvlUsd > 0) {
        totalTvl += pool.tvlUsd;
        weightedApy += pool.apy * pool.tvlUsd;
      }
    }

    const averageApy = totalTvl > 0 ? weightedApy / totalTvl : 0;

    console.log(`[APY] ${protocolId}: ${averageApy.toFixed(2)}% (${topPools.length} pools, $${(totalTvl/1e9).toFixed(2)}B TVL)`);

    return {
      apy: averageApy > 0 ? Number(averageApy.toFixed(2)) : null,
      pools: topPools
    };
  } catch (error) {
    console.error(`[APY] Failed to get APY for ${protocolId}:`, error);
    return { apy: 0, pools: [] };
  }
}

// Get best APY pool for a protocol
export async function getBestAPYPool(protocolId: string): Promise<YieldPool | null> {
  const { pools } = await getProtocolAPY(protocolId);

  if (pools.length === 0) {
    return null;
  }

  // Find pool with highest APY and reasonable TVL (> $1M)
  const bestPool = pools
    .filter(pool => pool.tvlUsd > 1_000_000)
    .sort((a, b) => b.apy - a.apy)[0];

  return bestPool || pools[0]; // Fallback to highest TVL pool
}

// Get APY range for a protocol (min-max)
export async function getProtocolAPYRange(protocolId: string): Promise<{
  min: number;
  max: number;
  average: number;
}> {
  const { pools } = await getProtocolAPY(protocolId);

  if (pools.length === 0) {
    return { min: 0, max: 0, average: 0 };
  }

  const apys = pools
    .filter(pool => pool.apy > 0)
    .map(pool => pool.apy);

  if (apys.length === 0) {
    return { min: 0, max: 0, average: 0 };
  }

  return {
    min: Math.min(...apys),
    max: Math.max(...apys),
    average: apys.reduce((sum, apy) => sum + apy, 0) / apys.length
  };
}