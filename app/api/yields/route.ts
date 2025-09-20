import { NextResponse } from 'next/server';
import { getProtocolAPY } from '@/lib/data/apy-fetcher';
import { protocolDataFetcher } from '@/lib/data/protocol-fetcher';

// GET /api/yields - Fetch live APY data for all protocols
export async function GET() {
  try {
    const protocols = ['lido', 'rocket-pool', 'aave-v3', 'compound-v3', 'curve', 'uniswap-v3'];

    // Fetch APY data for all protocols in parallel
    const apyPromises = protocols.map(async (protocolId) => {
      // Use new fetcher for supported protocols
      const supportedProtocols = ['lido', 'compound-v3', 'aave-v3'];

      // Special handling for Uniswap V3
      if (protocolId === 'uniswap-v3') {
        try {
          // Dynamic import to avoid build issues
          const { fetchUniswapV3Data } = await import('@/lib/data/protocols/uniswap-v3');
          const uniswapData = await fetchUniswapV3Data();

          if (uniswapData && uniswapData.topPools.length > 0) {
            const avgApy = uniswapData.topPools.reduce((sum, pool) => sum + pool.apy, 0) / uniswapData.topPools.length;
            console.log(`[Yields API] uniswap-v3: APY=${avgApy.toFixed(2)} (from ${uniswapData.topPools.length} pools)`);
            return {
              id: protocolId,
              apy: avgApy,
              poolCount: uniswapData.poolCount
            };
          }
        } catch (error) {
          console.error(`[Yields API] Error fetching Uniswap V3 data:`, error);
        }
        // Fallback to default APY
        return {
          id: protocolId,
          apy: 5.2,
          poolCount: 0
        };
      }

      if (supportedProtocols.includes(protocolId)) {
        const data = await protocolDataFetcher.fetch(protocolId);
        console.log(`[Yields API] ${protocolId}: APY=${data?.apy} (source: ${data?.source})`);
        return {
          id: protocolId,
          apy: data?.apy !== undefined ? data.apy : null,
          poolCount: 0
        };
      }

      // Fallback to original fetcher for other protocols
      const { apy, pools } = await getProtocolAPY(protocolId);
      console.log(`[Yields API] ${protocolId}: APY=${apy}, Pools=${pools.length}`);
      return {
        id: protocolId,
        apy: apy !== null ? apy : null, // Preserve null values
        poolCount: pools.length
      };
    });

    const apyData = await Promise.all(apyPromises);

    // Convert to object for easier lookup
    const apyMap = apyData.reduce((acc, item) => {
      acc[item.id] = item.apy;
      return acc;
    }, {} as Record<string, number | null>);

    return NextResponse.json({
      success: true,
      data: apyMap,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('[API] Failed to fetch yields:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch yield data'
      },
      { status: 500 }
    );
  }
}