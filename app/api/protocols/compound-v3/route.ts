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

  // USDC市場を優先的に探す（Compound V3の主要市場）
  const usdcPools = supplyPools.filter(p =>
    p.symbol?.toUpperCase().includes('USDC') ||
    p.underlyingSymbol?.toUpperCase().includes('USDC')
  );

  const targetPools = usdcPools.length > 0 ? usdcPools : supplyPools;

  // TVLで重み付け平均を計算
  const totalTvl = targetPools.reduce((s, p) => s + (p.tvlUsd || 0), 0);
  if (!totalTvl) {
    // TVLがない場合は単純平均
    const avgApy = targetPools.reduce((s, p) => s + (p.apyBase || 0), 0) / targetPools.length;
    return Math.round(avgApy * 100) / 100;
  }

  // TVL重み付け平均
  const weightedApy = targetPools.reduce((s, p) => {
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
    const protoUrl = `${DEFILLAMA}/protocol/compound`;
    const poolsUrl = `${DEFILLAMA}/pools2?project=compound-v3`;
    const lendBorrowUrl = `${DEFILLAMA}/lendBorrow`;

    const protoRes = await fetchWithTimeout(protoUrl, { cache: 'no-store' });
    const protoJson = await protoRes.json().catch(() => ({}));

    // 3) APY取得の試み（3段階のフォールバック）
    let apy = 2.8; // デフォルトフォールバック値（Compound V3の一般的なAPY）

    try {
      // Step 1: pools2 APIからAPY取得を試みる
      const poolsRes = await fetchWithTimeout(poolsUrl, { cache: 'no-store' });
      const poolsJson = await poolsRes.json().catch(() => null);

      if (poolsJson?.data && Array.isArray(poolsJson.data)) {
        const calculatedApy = calculateSupplyAPY(poolsJson.data);
        if (calculatedApy > 0) {
          apy = calculatedApy;
          console.log('[Compound V3] APY from pools2:', apy);
        }
      }
    } catch (poolsErr) {
      console.log('[Compound V3] pools2 fetch failed, trying lendBorrow...');

      try {
        // Step 2: lendBorrow APIからAPY取得を試みる
        const lendBorrowRes = await fetchWithTimeout(lendBorrowUrl, { cache: 'no-store' });
        const lendBorrowJson = await lendBorrowRes.json().catch(() => null);

        if (lendBorrowJson && Array.isArray(lendBorrowJson)) {
          // Compound V3のデータをフィルタリング
          const compoundData = lendBorrowJson.filter(
            item => item.project?.toLowerCase().includes('compound') &&
                   (item.project.includes('v3') || item.project.includes('V3') ||
                    item.symbol?.includes('cUSDCv3') || // Compound V3 USDC
                    item.chain === 'Base') // Base chainのCompoundはV3
          );

          if (compoundData.length > 0) {
            // USDC市場を優先
            const usdcData = compoundData.filter(item =>
              item.symbol?.toUpperCase().includes('USDC')
            );
            const targetData = usdcData.length > 0 ? usdcData : compoundData;

            const avgApy = targetData.reduce((sum, item) => sum + (item.apyBase || 0), 0) / targetData.length;
            if (avgApy > 0) {
              apy = Math.round(avgApy * 100) / 100;
              console.log('[Compound V3] APY from lendBorrow:', apy);
            }
          }
        }
      } catch (lendErr) {
        console.log('[Compound V3] lendBorrow fetch failed, using fallback APY:', apy);
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
      id: 'compound-v3',
      name: protoJson.name ?? 'Compound V3',
      tvl,
      apy,
      chains: protoJson.chains ?? ['ethereum', 'base', 'polygon', 'arbitrum'],
      audits: protoJson.audits ?? '4',
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
    console.error('[API /api/protocols/compound-v3] fetch error:', err);
    // 失敗時フォールバック
    if (cache) {
      return NextResponse.json({ ...cache.data, _cached: true, _warning: 'using stale cache' }, { status: 200 });
    }

    // キャッシュもない場合はフォールバックデータを返す
    const fallback = {
      id: 'compound-v3',
      name: 'Compound V3',
      tvl: 2800000000, // 約2.8B（推定値、主にBase USDC市場）
      apy: 2.8,
      chains: ['ethereum', 'base', 'polygon', 'arbitrum'],
      audits: '4',
      lastUpdated: Date.now(),
      source: 'fallback',
      _cached: false,
    };

    return NextResponse.json(fallback, { status: 200 });
  }
}