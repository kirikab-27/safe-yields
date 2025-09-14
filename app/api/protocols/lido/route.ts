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

function calculateWeightedAPY(pools: any[]): number {
  if (!Array.isArray(pools) || pools.length === 0) return 0;
  const totalTvl = pools.reduce((s, p) => s + (p.tvlUsd || 0), 0) || 0;
  if (!totalTvl) return Math.round((pools[0].apy || 0) * 100) / 100;
  const weighted = pools.reduce((s, p) => s + ((p.apy || 0) * (p.tvlUsd || 0)) / totalTvl, 0);
  return Math.round(weighted * 100) / 100;
}

export async function GET() {
  try {
    // 1) キャッシュヒット
    if (cache && (Date.now() - cache.ts) < CACHE_TTL_MS) {
      return NextResponse.json({ ...cache.data, _cached: true }, { status: 200 });
    }

    // 2) API取得
    const protoUrl = `${DEFILLAMA}/protocol/lido`;

    const protoRes = await fetchWithTimeout(protoUrl, { cache: 'no-store' });
    const protoJson = await protoRes.json().catch(() => ({}));

    // 3) データ抽出
    const apy = 3.8; // 固定値（実際のstETH APYの近似値）

    // TVLはcurrentChainTvlsまたはtvlから取得
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
      id: 'lido',
      name: protoJson.name ?? 'Lido',
      tvl,
      apy,
      chains: protoJson.chains ?? ['ethereum'],
      audits: protoJson.audits ?? null,
      lastUpdated: Date.now(),
      _cached: false,
    };

    // 4) キャッシュ保存
    cache = { data: payload, ts: Date.now() };

    // 5) レスポンス
    return NextResponse.json(payload, {
      status: 200,
      headers: { 'Cache-Control': `public, max-age=${Math.floor(CACHE_TTL_MS/1000)}` },
    });
  } catch (err) {
    console.error('[API /api/protocols/lido] fetch error:', err);
    // 失敗時フォールバック
    if (cache) {
      return NextResponse.json({ ...cache.data, _cached: true, _warning: 'using stale cache' }, { status: 200 });
    }
    return NextResponse.json({ error: 'fetch_failed', message: String(err) }, { status: 502 });
  }
}