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

function calculateSupplyAPY(pools: any[]): number {
  if (!Array.isArray(pools) || pools.length === 0) return 0;

  // Supply APYのみをフィルタリング（Borrow APYを除外）
  const supplyPools = pools.filter(p => p.apyBase && !p.apyBorrow);
  if (supplyPools.length === 0) return 0;

  // TVLで重み付け平均を計算
  const totalTvl = supplyPools.reduce((s, p) => s + (p.tvlUsd || 0), 0);
  if (!totalTvl) {
    // TVLがない場合は単純平均
    const avgApy = supplyPools.reduce((s, p) => s + (p.apyBase || 0), 0) / supplyPools.length;
    return Math.round(avgApy * 100) / 100;
  }

  // TVL重み付け平均
  const weightedApy = supplyPools.reduce((s, p) => {
    return s + ((p.apyBase || 0) * (p.tvlUsd || 0)) / totalTvl;
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
    const protoUrl = `${DEFILLAMA}/protocol/aave`;
    const poolsUrl = `${DEFILLAMA}/pools2?project=aave-v3`;
    const lendBorrowUrl = `${DEFILLAMA}/lendBorrow`;

    const protoRes = await fetchWithTimeout(protoUrl, { cache: 'no-store' });
    const protoJson = await protoRes.json().catch(() => ({}));

    // 3) APY取得の試み（3段階のフォールバック）
    let apy = 3.5; // デフォルトフォールバック値

    try {
      // Step 1: pools2 APIからAPY取得を試みる
      const poolsRes = await fetchWithTimeout(poolsUrl, { cache: 'no-store' });
      const poolsJson = await poolsRes.json().catch(() => null);

      if (poolsJson?.data && Array.isArray(poolsJson.data)) {
        const calculatedApy = calculateSupplyAPY(poolsJson.data);
        if (calculatedApy > 0) {
          apy = calculatedApy;
          console.log('[Aave V3] APY from pools2:', apy);
        }
      }
    } catch (poolsErr) {
      console.log('[Aave V3] pools2 fetch failed, trying lendBorrow...');

      try {
        // Step 2: lendBorrow APIからAPY取得を試みる
        const lendBorrowRes = await fetchWithTimeout(lendBorrowUrl, { cache: 'no-store' });
        const lendBorrowJson = await lendBorrowRes.json().catch(() => null);

        if (lendBorrowJson && Array.isArray(lendBorrowJson)) {
          // Aave V3のデータをフィルタリング
          const aaveData = lendBorrowJson.filter(
            item => item.project?.toLowerCase().includes('aave') &&
                   (item.project.includes('v3') || item.project.includes('V3'))
          );

          if (aaveData.length > 0) {
            const avgApy = aaveData.reduce((sum, item) => sum + (item.apyBase || 0), 0) / aaveData.length;
            if (avgApy > 0) {
              apy = Math.round(avgApy * 100) / 100;
              console.log('[Aave V3] APY from lendBorrow:', apy);
            }
          }
        }
      } catch (lendErr) {
        console.log('[Aave V3] lendBorrow fetch failed, using fallback APY:', apy);
      }
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
      id: 'aave-v3',
      name: protoJson.name ?? 'Aave V3',
      tvl,
      apy,
      chains: protoJson.chains ?? ['ethereum', 'polygon', 'arbitrum', 'optimism', 'avalanche'],
      audits: protoJson.audits ?? '5',
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
    console.error('[API /api/protocols/aave-v3] fetch error:', err);
    // 失敗時フォールバック
    if (cache) {
      return NextResponse.json({ ...cache.data, _cached: true, _warning: 'using stale cache' }, { status: 200 });
    }

    // キャッシュもない場合はフォールバックデータを返す
    const fallback = {
      id: 'aave-v3',
      name: 'Aave V3',
      tvl: 18500000000, // 約18.5B（推定値）
      apy: 3.5,
      chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'avalanche'],
      audits: '5',
      lastUpdated: Date.now(),
      source: 'fallback',
      _cached: false,
    };

    return NextResponse.json(fallback, { status: 200 });
  }
}