import { NextResponse } from 'next/server';
import { fetchUniswapV3Data, getMockUniswapV3Data } from '@/lib/data/protocols/uniswap-v3';

export async function GET() {
  try {
    // Test mock data
    const mockData = getMockUniswapV3Data();

    // Test live data
    const liveData = await fetchUniswapV3Data();

    return NextResponse.json({
      success: true,
      mock: {
        tvl: mockData.tvl,
        poolCount: mockData.poolCount,
        topPool: mockData.topPools[0]
      },
      live: liveData ? {
        tvl: liveData.tvl,
        poolCount: liveData.poolCount,
        topPool: liveData.topPools[0] || null,
        fromCache: liveData.fromCache
      } : null
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}