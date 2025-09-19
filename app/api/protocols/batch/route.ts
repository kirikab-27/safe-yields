import { NextRequest, NextResponse } from 'next/server';
import { globalCache } from '@/lib/cache/globalCache';

const DEFILLAMA = process.env.DEFI_LLAMA_BASE ?? 'https://api.llama.fi';
const BATCH_DELAY = 100;              // ms between chunks
const MAX_CONCURRENT = 3;             // max concurrent requests
const RETRIES = 3;                    // retry count
const CACHE_TTL = 5 * 60 * 1000;      // 5 minutes

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

// Utility functions
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Exponential backoff with jitter
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  retries = RETRIES,
  baseDelay = 500
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;

    // Exponential backoff with jitter
    const wait = baseDelay * 2 ** (RETRIES - retries) + Math.random() * 200;
    await delay(wait);

    return fetchWithRetry(fn, retries - 1, baseDelay);
  }
}

// Fetch individual protocol data
async function fetchProtocolData(protocolId: string): Promise<ProtocolData | null> {
  // Check cache first
  const cacheKey = `protocol:${protocolId}`;
  const cached = globalCache.get<ProtocolData>(cacheKey);
  if (cached) {
    return { ...cached, _cached: true };
  }

  try {
    const data = await fetchWithRetry(async () => {
      // Protocol-specific endpoints
      const endpoints: { [key: string]: { protocol: string; pools: string; fallbackApy: number | null } } = {
        'lido': {
          protocol: `${DEFILLAMA}/protocol/lido`,
          pools: `${DEFILLAMA}/pools2?project=lido`,
          fallbackApy: 3.8
        },
        'rocket-pool': {
          protocol: `${DEFILLAMA}/protocol/rocket-pool`,
          pools: `${DEFILLAMA}/pools2?project=rocket-pool`,
          fallbackApy: 4.1
        },
        'aave-v3': {
          protocol: `${DEFILLAMA}/protocol/aave`,
          pools: `${DEFILLAMA}/pools2?project=aave-v3`,
          fallbackApy: 3.5
        },
        'compound-v3': {
          protocol: `${DEFILLAMA}/protocol/compound`,
          pools: `${DEFILLAMA}/pools2?project=compound-v3`,
          fallbackApy: null  // No estimated values for Compound V3
        },
        'curve': {
          protocol: `${DEFILLAMA}/protocol/curve`,
          pools: `${DEFILLAMA}/pools2?project=curve`,
          fallbackApy: 4.5
        }
      };

      const config = endpoints[protocolId];
      if (!config) {
        throw new Error(`Unknown protocol: ${protocolId}`);
      }

      // Fetch protocol data
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      try {
        const protoRes = await fetch(config.protocol, {
          signal: controller.signal,
          cache: 'no-store'
        });
        clearTimeout(timeout);

        if (!protoRes.ok) {
          throw new Error(`HTTP ${protoRes.status}`);
        }

        const protoJson = await protoRes.json();

        // Calculate TVL
        let tvl = 0;
        if (protoJson.currentChainTvls) {
          tvl = Object.values(protoJson.currentChainTvls).reduce(
            (sum: number, val: any) => sum + (val || 0), 0
          );
        } else if (typeof protoJson.tvl === 'number') {
          tvl = protoJson.tvl;
        } else if (Array.isArray(protoJson.tvl) && protoJson.tvl.length > 0) {
          tvl = protoJson.tvl[protoJson.tvl.length - 1].totalLiquidityUSD || 0;
        }

        // Try to fetch APY
        let apy = config.fallbackApy;
        try {
          const poolsRes = await fetch(config.pools, {
            signal: controller.signal,
            cache: 'no-store'
          });

          if (poolsRes.ok) {
            const poolsJson = await poolsRes.json();
            if (poolsJson?.data && Array.isArray(poolsJson.data)) {
              // Calculate weighted average APY
              const validPools = poolsJson.data.filter((p: any) => p.apyBase > 0);
              if (validPools.length > 0) {
                const totalTvl = validPools.reduce((s: number, p: any) => s + (p.tvlUsd || 0), 0);
                if (totalTvl > 0) {
                  apy = validPools.reduce((s: number, p: any) => {
                    return s + ((p.apyBase || 0) * (p.tvlUsd || 0)) / totalTvl;
                  }, 0);
                } else {
                  apy = validPools.reduce((s: number, p: any) => s + (p.apyBase || 0), 0) / validPools.length;
                }
                if (apy !== null) {
                  apy = Math.round(apy * 100) / 100;
                }
              }
            }
          }
        } catch (poolsErr) {
          console.log(`[Batch] APY fetch failed for ${protocolId}, using fallback`);
        }

        const result: ProtocolData = {
          id: protocolId,
          name: protoJson.name || protocolId,
          tvl,
          apy,
          chains: protoJson.chains || [],
          audits: protoJson.audits || '0',
          lastUpdated: Date.now(),
          source: 'api',
          _cached: false
        };

        // Cache the result
        globalCache.set(cacheKey, result, CACHE_TTL);

        return result;
      } finally {
        clearTimeout(timeout);
      }
    });

    return data;
  } catch (err) {
    console.error(`[Batch] Failed to fetch ${protocolId}:`, err);

    // Return fallback data
    const fallbacks: { [key: string]: ProtocolData } = {
      'lido': {
        id: 'lido',
        name: 'Lido',
        tvl: 40000000000,
        apy: 3.8,
        chains: ['ethereum', 'polygon'],
        audits: '2',
        lastUpdated: Date.now(),
        source: 'fallback',
        _cached: false
      },
      'rocket-pool': {
        id: 'rocket-pool',
        name: 'Rocket Pool',
        tvl: 3500000000,
        apy: 4.1,
        chains: ['ethereum'],
        audits: '3',
        lastUpdated: Date.now(),
        source: 'fallback',
        _cached: false
      },
      'aave-v3': {
        id: 'aave-v3',
        name: 'Aave V3',
        tvl: 10000000000,
        apy: 3.5,
        chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'avalanche'],
        audits: '5',
        lastUpdated: Date.now(),
        source: 'fallback',
        _cached: false
      },
      'compound-v3': {
        id: 'compound-v3',
        name: 'Compound V3',
        tvl: 2800000000,
        apy: null,  // No estimated values for Compound V3
        chains: ['ethereum', 'polygon', 'arbitrum', 'base'],
        audits: '4',
        lastUpdated: Date.now(),
        source: 'fallback',
        _cached: false
      },
      'curve': {
        id: 'curve',
        name: 'Curve Finance',
        tvl: 5200000000,
        apy: 4.5,
        chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'avalanche'],
        audits: '3',
        lastUpdated: Date.now(),
        source: 'fallback',
        _cached: false
      }
    };

    return fallbacks[protocolId] || null;
  }
}

// Batch fetch with chunking and rate limiting
async function fetchBatch(protocols: string[]): Promise<BatchResponse> {
  const chunks = chunkArray(protocols, MAX_CONCURRENT);
  const response: BatchResponse = {
    data: {},
    errors: {},
    _cached: {},
    timestamp: Date.now()
  };

  for (const chunk of chunks) {
    const results = await Promise.allSettled(
      chunk.map(protocol => fetchProtocolData(protocol))
    );

    // Process results
    chunk.forEach((protocol, index) => {
      const result = results[index];
      if (result.status === 'fulfilled') {
        response.data[protocol] = result.value;
        response._cached[protocol] = result.value?._cached || false;
      } else {
        response.data[protocol] = null;
        response.errors[protocol] = result.reason?.message || 'Unknown error';
        response._cached[protocol] = false;
      }
    });

    // Add delay between chunks to avoid rate limiting
    if (chunks.indexOf(chunk) < chunks.length - 1) {
      await delay(BATCH_DELAY);
    }
  }

  return response;
}

export async function GET(request: NextRequest) {
  try {
    // Get protocols from query params or use default
    const searchParams = request.nextUrl.searchParams;
    const protocolsParam = searchParams.get('protocols');

    const protocols = protocolsParam
      ? protocolsParam.split(',')
      : ['lido', 'rocket-pool', 'aave-v3', 'compound-v3', 'curve'];

    // Validate protocols
    const validProtocols = ['lido', 'rocket-pool', 'aave-v3', 'compound-v3', 'curve'];
    const invalidProtocols = protocols.filter(p => !validProtocols.includes(p));

    if (invalidProtocols.length > 0) {
      return NextResponse.json(
        { error: `Invalid protocols: ${invalidProtocols.join(', ')}` },
        { status: 400 }
      );
    }

    // Fetch batch data
    const batchData = await fetchBatch(protocols);

    // Add cache headers
    return NextResponse.json(batchData, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=60',
        'X-Cache-Status': Object.values(batchData._cached).some(c => c) ? 'partial' : 'miss'
      }
    });
  } catch (err) {
    console.error('[API /api/protocols/batch] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error', message: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const protocols = body.protocols || ['lido', 'rocket-pool', 'aave-v3', 'compound-v3', 'curve'];

    // Validate protocols
    const validProtocols = ['lido', 'rocket-pool', 'aave-v3', 'compound-v3', 'curve'];
    const invalidProtocols = protocols.filter((p: string) => !validProtocols.includes(p));

    if (invalidProtocols.length > 0) {
      return NextResponse.json(
        { error: `Invalid protocols: ${invalidProtocols.join(', ')}` },
        { status: 400 }
      );
    }

    // Fetch batch data
    const batchData = await fetchBatch(protocols);

    return NextResponse.json(batchData, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=60',
        'X-Cache-Status': Object.values(batchData._cached).some(c => c) ? 'partial' : 'miss'
      }
    });
  } catch (err) {
    console.error('[API /api/protocols/batch] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error', message: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}