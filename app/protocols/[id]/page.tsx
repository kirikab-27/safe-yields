import { protocolStaticData } from '@/lib/protocols/static-data';

// 動的レンダリングを強制（リアルタイムでAPIを呼び出す）
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateStaticParams() {
  return [{ id: 'lido' }];
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

async function fetchProtocolData(id: string) {
  try {
    const defiLlamaId = protocolMapping[id];
    if (!defiLlamaId) {
      console.error(`[Page] Protocol not found: ${id}`);
      return null;
    }

    // DeFiLlama APIを直接呼び出し
    const protoUrl = `https://api.llama.fi/protocol/${defiLlamaId}`;
    console.log(`[Page] Fetching from DeFiLlama: ${protoUrl}`);

    const res = await fetch(protoUrl, {
      cache: 'no-store',
      next: { revalidate: 0 }
    });

    if (res.ok) {
      const protoJson = await res.json();

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

      const data = {
        id,
        name: protoJson.name || id,
        apy,
        tvl,
        chains,
        audits: protoJson.audits || null,
        lastUpdated: Date.now()
      };

      console.log(`[Page] Data processed for ${id}:`, data);
      return data;
    } else {
      console.error(`[Page] DeFiLlama API failed with status ${res.status}`);
      return null;
    }
  } catch (error) {
    console.error(`[Page] Failed to fetch data for ${id}:`, error);
    // エラー時はフォールバック値を返す
    return {
      id,
      name: id,
      apy: fallbackAPY[id] || 0,
      tvl: 0,
      chains: ['Ethereum'],
      error: true
    };
  }
}

export default async function ProtocolDetailPage({
  params
}: {
  params: { id: string }
}) {
  // 静的データを取得
  const staticData = protocolStaticData[params.id] || {};

  // 動的データを取得
  const dynamicData = await fetchProtocolData(params.id);

  // データをマージ
  const protocol = {
    ...staticData,
    ...dynamicData,
    id: params.id
  };

  // TVL整形
  const formatTVL = (tvl: number | undefined) => {
    if (!tvl) return 'N/A';
    if (tvl >= 1_000_000_000) {
      return `$${(tvl / 1_000_000_000).toFixed(1)}B`;
    }
    if (tvl >= 1_000_000) {
      return `$${(tvl / 1_000_000).toFixed(1)}M`;
    }
    return `$${tvl.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* パンくずリスト */}
      <nav className="p-6 text-gray-400">
        <a href="/" className="hover:text-white">Home</a>
        {' / '}
        <a href="/protocols" className="hover:text-white">Protocols</a>
        {' / '}
        <span className="text-white">{protocol.name || params.id}</span>
      </nav>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-6 pb-12">
        <h1 className="text-4xl font-bold mb-8">{protocol.name || 'Protocol'}</h1>

        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900 p-6 rounded-lg">
            <div className="text-gray-400 text-sm mb-2">APY</div>
            <div className="text-2xl font-bold text-green-400">
              {protocol.apy ? `${protocol.apy}%` : 'N/A'}
            </div>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg">
            <div className="text-gray-400 text-sm mb-2">Total Value Locked</div>
            <div className="text-2xl font-bold">
              {formatTVL(protocol.tvl)}
            </div>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg">
            <div className="text-gray-400 text-sm mb-2">Safety Score</div>
            <div className="text-2xl font-bold">
              {protocol.safetyScore ? `${protocol.safetyScore}/100` : 'N/A'}
            </div>
          </div>
        </div>

        {/* 詳細説明 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">About {protocol.name}</h2>
          <p className="text-gray-300 leading-relaxed">
            {protocol.description || 'No description available.'}
          </p>
        </section>

        {/* リンク集 */}
        <section>
          <h3 className="text-xl font-bold mb-4">Resources</h3>
          <div className="space-y-2">
            {protocol.website && (
              <a
                href={protocol.website}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-gray-900 rounded hover:bg-gray-800 transition"
              >
                Official Website →
              </a>
            )}
            {protocol.docs && (
              <a
                href={protocol.docs}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-gray-900 rounded hover:bg-gray-800 transition"
              >
                Documentation →
              </a>
            )}
            {protocol.audit && (
              <a
                href={protocol.audit}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-gray-900 rounded hover:bg-gray-800 transition"
              >
                Audit Reports →
              </a>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}