import { NextResponse } from 'next/server';

const DEFILLAMA = process.env.DEFI_LLAMA_BASE ?? 'https://api.llama.fi';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5分

type CacheEntry = { data: any; ts: number };
let cache: CacheEntry | null = null;

async function fetchWithTimeout(url: string, opts: RequestInit = {}, timeout = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res;
  } finally {
    clearTimeout(id);
  }
}

function calculateStablePoolAPY(pools: any[]): number {
  if (!Array.isArray(pools) || pools.length === 0) return 0;

  // Stablecoinプールを優先的にフィルタリング
  const mainPools = ['3pool', 'frax-usdc', 'lusd-3crv', 'usdt', 'usdc', 'dai'];

  // Stablecoinプールを探す
  const stablePools = pools.filter(p => {
    const isStablecoin = p.stablecoin === true;
    const hasStableName = mainPools.some(name =>
      p.symbol?.toLowerCase().includes(name) ||
      p.pool?.toLowerCase().includes(name)
    );
    const hasReasonableAPY = p.apyBase > 0 && p.apyBase < 50; // 0-50%の範囲

    return (isStablecoin || hasStableName) && hasReasonableAPY;
  });

  const targetPools = stablePools.length > 0 ? stablePools : pools.filter(p => p.apyBase > 0);

  // TVLで重み付け平均を計算
  const totalTvl = targetPools.reduce((s, p) => s + (p.tvlUsd || 0), 0);
  if (!totalTvl) {
    // TVLがない場合は単純平均
    const avgApy = targetPools.reduce((s, p) => s + (p.apyBase || 0), 0) / targetPools.length;
    return Math.round(avgApy * 100) / 100;
  }

  // TVL重み付け平均（上位プールを重視）
  const sortedPools = targetPools.sort((a, b) => b.tvlUsd - a.tvlUsd).slice(0, 10);
  const topPoolsTvl = sortedPools.reduce((s, p) => s + (p.tvlUsd || 0), 0);
  const weightedApy = sortedPools.reduce((s, p) => {
    return s + ((p.apyBase || 0) * (p.tvlUsd || 0)) / topPoolsTvl;
  }, 0);

  return Math.round(weightedApy * 100) / 100;
}

export async function GET() {
  try {
    // 1) キャッシュヒット
    if (cache && (Date.now() - cache.ts) < CACHE_TTL_MS) {
      return NextResponse.json({ ...cache.data, _cached: true }, { status: 200 });
    }

    // 2) API取得
    const protoUrl = `${DEFILLAMA}/protocol/curve`;
    const poolsUrl = `${DEFILLAMA}/pools2?project=curve`;

    const protoRes = await fetchWithTimeout(protoUrl, { cache: 'no-store' });
    const protoJson = await protoRes.json().catch(() => ({}));

    // 3) APY取得の試み
    let apy = 4.5; // デフォルトフォールバック値（Stablepool標準）

    try {
      // pools2 APIからAPY取得を試みる
      const poolsRes = await fetchWithTimeout(poolsUrl, { cache: 'no-store' });
      const poolsJson = await poolsRes.json().catch(() => null);

      if (poolsJson?.data && Array.isArray(poolsJson.data)) {
        const calculatedApy = calculateStablePoolAPY(poolsJson.data);
        if (calculatedApy > 0) {
          apy = calculatedApy;
          console.log('[Curve] APY from pools2:', apy);
        }
      }
    } catch (poolsErr) {
      console.log('[Curve] pools2 fetch failed, using fallback APY:', apy);
    }

    // 4) TVL取得
    let tvl = 0;
    if (protoJson.currentChainTvls) {
      tvl = Object.values(protoJson.currentChainTvls).reduce((sum: number, val: any) => sum + (val || 0), 0);
    } else if (typeof protoJson.tvl === 'number') {
      tvl = protoJson.tvl;
    } else if (Array.isArray(protoJson.tvl) && protoJson.tvl.length > 0) {
      // 最新のTVLデータを取得
      tvl = protoJson.tvl[protoJson.tvl.length - 1].totalLiquidityUSD || 0;
    }

    const payload = {
      id: 'curve',
      name: protoJson.name ?? 'Curve Finance',
      tvl,
      apy,
      chains: protoJson.chains ?? ['ethereum', 'polygon', 'arbitrum', 'optimism', 'avalanche'],
      audits: protoJson.audits ?? '3',
      lastUpdated: Date.now(),
      _cached: false,
    };

    // 5) キャッシュ保存
    cache = { data: payload, ts: Date.now() };

    // 6) レスポンス
    return NextResponse.json(payload, {
      status: 200,
      headers: { 'Cache-Control': `public, max-age=${Math.floor(CACHE_TTL_MS/1000)}` },
    });
  } catch (err) {
    console.error('[API /api/protocols/curve] fetch error:', err);
    // 失敗時フォールバック
    if (cache) {
      return NextResponse.json({ ...cache.data, _cached: true, _warning: 'using stale cache' }, { status: 200 });
    }

    // キャッシュもない場合はフォールバックデータを返す
    const fallback = {
      id: 'curve',
      name: 'Curve Finance',
      tvl: 5200000000, // 約5.2B（推定値）
      apy: 4.5,
      chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'avalanche'],
      audits: '3',
      lastUpdated: Date.now(),
      source: 'fallback',
      _cached: false,
    };

    return NextResponse.json(fallback, { status: 200 });
  }
}