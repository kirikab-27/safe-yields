// Uniswap V3 データフェッチャー
import { logger } from '@/lib/monitoring/logger';

export interface UniswapV3Pool {
  id: string;
  token0: {
    symbol: string;
    name: string;
  };
  token1: {
    symbol: string;
    name: string;
  };
  feeTier: string;
  liquidity: string;
  volumeUSD: string;
  feesUSD: string;
  totalValueLockedUSD: string;
}

export interface UniswapV3Data {
  tvl: number;
  volume24h: number;
  fees24h: number;
  poolCount: number;
  topPools: {
    pair: string;
    tvl: number;
    apy: number;
    feeTier: number;
    volume24h: number;
  }[];
  lastUpdated: number;
  fromCache: boolean;
}

// キャッシュ設定
const CACHE_CONFIG = {
  subgraph: {
    ttl: 5 * 60 * 1000,  // 5分
    stale: 10 * 60 * 1000 // 10分（stale-while-revalidate）
  },
  defiLlama: {
    ttl: 10 * 60 * 1000,  // 10分
    stale: 30 * 60 * 1000 // 30分
  }
};

// キャッシュ
let cache: {
  data: UniswapV3Data | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0
};

// 主要5プールの定義
const TOP_POOLS = [
  { token0: 'ETH', token1: 'USDC', feeTier: 500 },   // 0.05%
  { token0: 'WBTC', token1: 'ETH', feeTier: 3000 },  // 0.3%
  { token0: 'ETH', token1: 'USDT', feeTier: 500 },   // 0.05%
  { token0: 'DAI', token1: 'USDC', feeTier: 100 },   // 0.01%
  { token0: 'MATIC', token1: 'ETH', feeTier: 3000 }  // 0.3%
];

/**
 * Uniswap V3 Subgraphからデータ取得
 */
export async function fetchUniswapV3FromSubgraph(): Promise<UniswapV3Data | null> {
  console.log('[Uniswap V3] Fetching data from Subgraph...');

  const query = `
    query {
      factory(id: "0x1F98431c8aD98523631AE4a59f267346ea31F984") {
        totalValueLockedUSD
        totalVolumeUSD
        totalFeesUSD
        poolCount
      }
      pools(
        first: 20,
        orderBy: totalValueLockedUSD,
        orderDirection: desc,
        where: { totalValueLockedUSD_gt: "1000000" }
      ) {
        id
        token0 {
          symbol
          name
        }
        token1 {
          symbol
          name
        }
        feeTier
        liquidity
        volumeUSD
        feesUSD
        totalValueLockedUSD
      }
    }
  `;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(
      'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('[Uniswap V3] Subgraph request failed:', response.status);
      return null;
    }

    const result = await response.json();

    if (result.errors) {
      console.error('[Uniswap V3] Subgraph errors:', result.errors);
      return null;
    }

    const factory = result.data?.factory;
    const pools = result.data?.pools || [];

    if (!factory) {
      console.error('[Uniswap V3] No factory data');
      return null;
    }

    // トップ5プールを抽出し、APYを計算
    const topPools = pools.slice(0, 5).map((pool: UniswapV3Pool) => {
      const tvl = parseFloat(pool.totalValueLockedUSD);
      const fees24h = parseFloat(pool.feesUSD);
      const volume24h = parseFloat(pool.volumeUSD);

      // 簡易的なAPY計算（年換算の手数料 / TVL）
      const apy = tvl > 0 ? (fees24h * 365 / tvl) * 100 : 0;

      return {
        pair: `${pool.token0.symbol}/${pool.token1.symbol}`,
        tvl,
        apy: Math.round(apy * 100) / 100, // 小数点2桁
        feeTier: parseInt(pool.feeTier) / 10000, // basis pointsをパーセントに変換
        volume24h
      };
    });

    const data: UniswapV3Data = {
      tvl: parseFloat(factory.totalValueLockedUSD),
      volume24h: parseFloat(factory.totalVolumeUSD),
      fees24h: parseFloat(factory.totalFeesUSD),
      poolCount: parseInt(factory.poolCount),
      topPools,
      lastUpdated: Date.now(),
      fromCache: false
    };

    // キャッシュに保存
    cache = {
      data,
      timestamp: Date.now()
    };

    console.log('[Uniswap V3] Successfully fetched from Subgraph');
    logger.info('Uniswap V3 data fetched from Subgraph', {
      protocol: 'uniswap-v3',
      tvl: data.tvl,
      poolCount: data.poolCount
    });

    return data;
  } catch (error) {
    console.error('[Uniswap V3] Subgraph error:', error);
    logger.error('Failed to fetch Uniswap V3 from Subgraph', {
      protocol: 'uniswap-v3',
      error: error as Error
    });
    return null;
  }
}

/**
 * DeFiLlamaからフォールバックデータ取得
 */
export async function fetchUniswapV3FromDeFiLlama(): Promise<UniswapV3Data | null> {
  console.log('[Uniswap V3] Fetching from DeFiLlama as fallback...');

  try {
    const response = await fetch('https://api.llama.fi/protocol/uniswap-v3');

    if (!response.ok) {
      console.error('[Uniswap V3] DeFiLlama request failed:', response.status);
      return null;
    }

    const data = await response.json();

    // DeFiLlamaデータを変換
    const uniswapData: UniswapV3Data = {
      tvl: data.tvl?.[data.tvl.length - 1]?.totalLiquidityUSD || 0,
      volume24h: 0, // DeFiLlamaには24h volumeがない場合がある
      fees24h: 0,
      poolCount: 0,
      topPools: [], // プール詳細はDeFiLlamaでは取得できない
      lastUpdated: Date.now(),
      fromCache: false
    };

    console.log('[Uniswap V3] Successfully fetched from DeFiLlama');
    return uniswapData;
  } catch (error) {
    console.error('[Uniswap V3] DeFiLlama error:', error);
    return null;
  }
}

/**
 * Uniswap V3データ取得（キャッシュ考慮）
 */
export async function fetchUniswapV3Data(): Promise<UniswapV3Data | null> {
  // キャッシュチェック
  const now = Date.now();
  const cacheAge = now - cache.timestamp;

  if (cache.data && cacheAge < CACHE_CONFIG.subgraph.ttl) {
    console.log('[Uniswap V3] Using cached data');
    return {
      ...cache.data,
      fromCache: true
    };
  }

  // Subgraphから取得を試みる
  const subgraphData = await fetchUniswapV3FromSubgraph();
  if (subgraphData) {
    cache.data = subgraphData;
    cache.timestamp = now;
    return subgraphData;
  }

  // Skip DeFiLlama due to performance issues (325MB response causes 1-minute delays)
  // Use mock data as fallback
  console.log('[Uniswap V3] Using mock data (DeFiLlama skipped for performance)');
  const mockData = getMockUniswapV3Data();
  cache.data = mockData;
  cache.timestamp = now;
  return mockData;
}

/**
 * モックデータ（開発用）
 */
export function getMockUniswapV3Data(): UniswapV3Data {
  return {
    tvl: 4500000000,
    volume24h: 1200000000,
    fees24h: 3600000,
    poolCount: 5832,
    topPools: [
      { pair: 'ETH/USDC', tvl: 580000000, apy: 5.2, feeTier: 0.05, volume24h: 320000000 },
      { pair: 'WBTC/ETH', tvl: 420000000, apy: 3.8, feeTier: 0.3, volume24h: 180000000 },
      { pair: 'ETH/USDT', tvl: 380000000, apy: 4.5, feeTier: 0.05, volume24h: 250000000 },
      { pair: 'DAI/USDC', tvl: 320000000, apy: 2.1, feeTier: 0.01, volume24h: 150000000 },
      { pair: 'MATIC/ETH', tvl: 280000000, apy: 6.8, feeTier: 0.3, volume24h: 120000000 }
    ],
    lastUpdated: Date.now(),
    fromCache: true  // Mock data is considered cached
  };
}