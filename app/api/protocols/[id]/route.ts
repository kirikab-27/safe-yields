import { NextResponse } from 'next/server';

const DEFILLAMA = process.env.DEFI_LLAMA_BASE ?? 'https://api.llama.fi';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5分

type CacheEntry = { data: any; ts: number };
const cacheMap = new Map<string, CacheEntry>();

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

// DeFiLlamaのプロトコルIDマッピング
const protocolMapping: Record<string, string> = {
  'lido': 'lido',
  'rocket-pool': 'rocket-pool',
  'aave-v3': 'aave',
  'compound-v3': 'compound-finance',
  'curve': 'curve-dex'
};

// 固定APY値（フォールバック用）
const fallbackAPY: Record<string, number> = {
  'lido': 3.8,
  'rocket-pool': 4.1,
  'aave-v3': 2.5,
  'compound-v3': 2.8,
  'curve': 5.2
};

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  console.log(`[Dynamic API Route] Requested protocol: ${id}`);

  // プロトコルのマッピングを確認
  const defiLlamaId = protocolMapping[id];
  if (!defiLlamaId) {
    console.error(`[Dynamic API Route] Protocol not found: ${id}`);
    return NextResponse.json(
      { error: 'Protocol not found' },
      { status: 404 }
    );
  }

  try {
    // キャッシュチェック
    const cache = cacheMap.get(id);
    if (cache && (Date.now() - cache.ts) < CACHE_TTL_MS) {
      console.log(`[Dynamic API Route] Returning cached data for ${id}`);
      return NextResponse.json({ ...cache.data, _cached: true });
    }

    // DeFiLlama APIから取得
    const protoUrl = `${DEFILLAMA}/protocol/${defiLlamaId}`;
    console.log(`[Dynamic API Route] Fetching from DeFiLlama: ${protoUrl}`);

    const protoRes = await fetchWithTimeout(protoUrl, { cache: 'no-store' });
    const protoJson = await protoRes.json().catch(() => ({}));

    // データ抽出
    const apy = fallbackAPY[id] || 0;

    // TVL計算
    let tvl = 0;
    if (protoJson.currentChainTvls) {
      tvl = Object.values(protoJson.currentChainTvls).reduce((sum: number, val: any) => sum + (val || 0), 0);
    } else if (typeof protoJson.tvl === 'number') {
      tvl = protoJson.tvl;
    } else if (Array.isArray(protoJson.tvl) && protoJson.tvl.length > 0) {
      const lastEntry = protoJson.tvl[protoJson.tvl.length - 1];
      tvl = lastEntry.totalLiquidityUSD || 0;
    }

    // チェーン情報
    const chains = protoJson.chains || ['Ethereum'];

    const responseData = {
      id,
      name: protoJson.name || id,
      apy,
      tvl,
      chains,
      audits: protoJson.audits || null,
      lastUpdated: Date.now()
    };

    // キャッシュ更新
    cacheMap.set(id, { data: responseData, ts: Date.now() });
    console.log(`[Dynamic API Route] Data retrieved for ${id}:`, responseData);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error(`[Dynamic API Route] Error fetching data for ${id}:`, error);

    // エラー時はフォールバック値を返す
    return NextResponse.json({
      id,
      name: id,
      apy: fallbackAPY[id] || 0,
      tvl: 0,
      chains: ['Ethereum'],
      error: true,
      lastUpdated: Date.now()
    });
  }
}