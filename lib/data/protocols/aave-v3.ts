// Aave V3 Protocol APY Fetcher (Subgraph Integration)
const AAVE_SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/aave/protocol-v3-ethereum';

interface AaveReserve {
  id: string;
  symbol: string;
  liquidityRate: string;
  variableBorrowRate: string;
  stableBorrowRate: string;
  totalLiquidity: string;
  availableLiquidity: string;
}

interface AaveSubgraphResponse {
  data: {
    reserves: AaveReserve[];
  };
}

const query = `
  query GetReserves {
    reserves(first: 10, orderBy: totalLiquidity, orderDirection: desc) {
      id
      symbol
      liquidityRate
      variableBorrowRate
      stableBorrowRate
      totalLiquidity
      availableLiquidity
    }
  }
`;

// Calculate weighted average APY from reserves
function calculateWeightedAPY(reserves: AaveReserve[]): number | null {
  if (!reserves || reserves.length === 0) {
    console.log('[Aave V3] No reserves data available');
    return null;
  }

  // Filter valid reserves (with positive liquidity and rates)
  const validReserves = reserves.filter(r => {
    const liquidity = parseFloat(r.totalLiquidity);
    const rate = parseFloat(r.liquidityRate);
    return liquidity > 0 && rate > 0;
  });

  if (validReserves.length === 0) {
    console.log('[Aave V3] No valid reserves found');
    return null;
  }

  // Calculate weighted average based on liquidity
  let totalLiquidity = 0;
  let weightedRate = 0;

  validReserves.forEach(reserve => {
    const liquidity = parseFloat(reserve.totalLiquidity);
    // Convert from Ray (1e27) to percentage
    const rate = parseFloat(reserve.liquidityRate) / 1e25;

    totalLiquidity += liquidity;
    weightedRate += rate * liquidity;
  });

  if (totalLiquidity === 0) {
    return null;
  }

  const avgRate = weightedRate / totalLiquidity;
  console.log(`[Aave V3] Calculated weighted APY: ${avgRate.toFixed(2)}% from ${validReserves.length} reserves`);

  return avgRate;
}

export async function fetchAaveAPY(): Promise<number | null> {
  try {
    console.log('[Aave V3] Fetching data from Subgraph...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒タイムアウト

    const res = await fetch(AAVE_SUBGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
      signal: controller.signal,
      next: { revalidate: 300 } // 5分キャッシュ
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data: AaveSubgraphResponse = await res.json();

    if (!data?.data?.reserves) {
      console.error('[Aave V3] Invalid response format:', data);
      return null;
    }

    const apy = calculateWeightedAPY(data.data.reserves);

    if (apy !== null) {
      console.log(`[Aave V3] Successfully fetched APY: ${apy.toFixed(2)}%`);
    } else {
      console.log('[Aave V3] Failed to calculate APY');
    }

    return apy;

  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('[Aave V3] Request timeout after 10 seconds');
      } else {
        console.error('[Aave V3] Subgraph query failed:', error.message);
      }
    }
    return null;
  }
}