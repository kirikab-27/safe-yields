import { protocolStaticData } from '@/lib/protocols/static-data';
import { protocolConfig } from '@/lib/config/protocols';
import { getProtocolBySlug } from '@/lib/config/protocols';
import { getProtocolAPY, getProtocolAPYRange } from '@/lib/data/apy-fetcher';
import { Metadata } from 'next';
import Script from 'next/script';
import ProtocolCTA from '@/components/ProtocolCTA';

// ISR (Incremental Static Regeneration) を使用
// データは5分ごとに再検証される（タイムアウト対策）
export const revalidate = 300;

export async function generateStaticParams() {
  return [
    { id: 'lido' },
    { id: 'rocket-pool' },
    { id: 'aave-v3' },
    { id: 'compound-v3' },
    { id: 'curve' }
  ];
}

// SEOメタデータ生成
export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  // 共通設定から取得（slugベースで検索）
  const configData = getProtocolBySlug(params.id);
  const staticData = protocolStaticData[params.id] || {};
  const dynamicData = await fetchProtocolData(params.id);
  const protocol = { ...configData, ...staticData, ...dynamicData };

  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Safe Yields';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://safe-yields.com';
  const defaultOgImage = process.env.NEXT_PUBLIC_DEFAULT_OG_IMAGE || '/og/default.png';

  // TVLをフォーマット
  const tvlFormatted = protocol.tvl
    ? protocol.tvl >= 1_000_000_000
      ? `$${(protocol.tvl / 1_000_000_000).toFixed(1)}B`
      : `$${(protocol.tvl / 1_000_000).toFixed(1)}M`
    : 'N/A';

  return {
    title: `${protocol.name || params.id} - APY ${protocol.apy !== null && protocol.apy !== undefined ? `${protocol.apy}%` : 'N/A'} | ${siteName}`,
    description: `${protocol.name}の安全性スコア、APY、TVL、監査情報を確認。DeFi投資のリスクを可視化。現在のAPY: ${protocol.apy !== null && protocol.apy !== undefined ? `${protocol.apy}%` : 'N/A'}、TVL: ${tvlFormatted}、安全性スコア: ${protocol.safetyScore || 'N/A'}/100`,
    keywords: `${protocol.name}, DeFi, yield farming, APY, TVL, safety score, staking, ${params.id}`,

    openGraph: {
      title: `${protocol.name} Safety Analysis - ${protocol.apy !== null && protocol.apy !== undefined ? `${protocol.apy}% APY` : 'APY N/A'}`,
      description: `安全性スコア: ${protocol.safetyScore || 'N/A'}/100。${protocol.description?.substring(0, 100) || 'DeFi投資の透明性を提供'}`,
      type: 'website',
      url: `${siteUrl}/protocols/${params.id}`,
      siteName: siteName,
      images: [{
        url: `${siteUrl}${defaultOgImage}`,
        width: 1200,
        height: 630,
        alt: `${protocol.name} on ${siteName}`
      }],
      locale: 'en_US',
    },

    twitter: {
      card: 'summary_large_image',
      title: `${protocol.name} - ${protocol.apy !== null && protocol.apy !== undefined ? `${protocol.apy}% APY` : 'APY N/A'}`,
      description: `Safety Score: ${protocol.safetyScore || 'N/A'}/100 | TVL: ${tvlFormatted}`,
      images: [`${siteUrl}${defaultOgImage}`],
    },

    alternates: {
      canonical: `${siteUrl}/protocols/${params.id}`,
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
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
// DeFiLlamaのライブデータよりも代表的な値を使用
const fallbackAPY: Record<string, number | null> = {
  'lido': 2.6,        // ETHステーキング標準的なAPY
  'rocket-pool': 2.4,  // ETHステーキング（若干低め）
  'aave-v3': 3.5,     // 主要レンディングプールの平均的APY
  'compound-v3': null,  // データなしの場合は推定値を使わない
  'curve': 5.2        // ステーブルコインプールの平均
};

// タイムアウト付きfetch関数
async function fetchWithTimeout(url: string, timeout = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 300 } // revalidateを5分に延長
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

async function fetchProtocolData(id: string) {
  try {
    const defiLlamaId = protocolMapping[id];
    if (!defiLlamaId) {
      console.error(`[Page] Protocol not found: ${id}`);
      return null;
    }

    // Fetch TVL data from DeFiLlama Protocol API and APY data from Yields API in parallel
    const [protoData, apyData] = await Promise.all([
      fetchProtocolTVL(defiLlamaId),
      getProtocolAPY(id)
    ]);

    // Get APY range for display
    const apyRange = await getProtocolAPYRange(id);

    const data = {
      id,
      name: protoData.name || id,
      apy: apyData.apy !== null ? apyData.apy : fallbackAPY[id], // Use live APY or fallback (can be null)
      apyRange, // Include APY range for display
      tvl: protoData.tvl || 0,
      chains: protoData.chains || ['Ethereum'],
      audits: protoData.audits || null,
      pools: apyData.pools, // Include pool data for transparency
      lastUpdated: Date.now()
    };

    console.log(`[Page] Data processed for ${id}:`, {
      ...data,
      pools: `${data.pools?.length || 0} pools`
    });
    return data;
  } catch (error: any) {
    console.error(`[Page] Failed to fetch data for ${id}:`, error.message || error);
    // エラー時は共通設定からフォールバック値を返す
    const configData = getProtocolBySlug(id);
    return {
      id,
      name: configData?.name || id,
      apy: fallbackAPY[id] !== undefined ? fallbackAPY[id] : configData?.fallbackData?.apy,
      apyRange: { min: 0, max: 0, average: 0 },
      tvl: configData?.fallbackData?.tvl || 0,
      chains: configData?.chains || ['Ethereum'],
      error: true,
      errorMessage: error.name === 'AbortError' ? 'Request timeout' : error.message
    };
  }
}

// Helper function to fetch TVL data from DeFiLlama
async function fetchProtocolTVL(defiLlamaId: string) {
  try {
    const protoUrl = `https://api.llama.fi/protocol/${defiLlamaId}`;
    console.log(`[Page] Fetching TVL from DeFiLlama: ${protoUrl}`);

    const res = await fetchWithTimeout(protoUrl, 10000); // 10秒タイムアウト

    if (res.ok) {
      const protoJson = await res.json();

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

      return {
        name: protoJson.name,
        tvl,
        chains: protoJson.chains || ['Ethereum'],
        audits: protoJson.audits || null
      };
    } else {
      console.error(`[Page] DeFiLlama API failed with status ${res.status}`);
      return { name: '', tvl: 0, chains: ['Ethereum'], audits: null };
    }
  } catch (error) {
    console.error(`[Page] Failed to fetch TVL:`, error);
    return { name: '', tvl: 0, chains: ['Ethereum'], audits: null };
  }
}

export default async function ProtocolDetailPage({
  params
}: {
  params: { id: string }
}) {
  // 共通設定から取得（slugベースで検索）
  const configData = getProtocolBySlug(params.id);

  // 静的データを取得（後方互換性のため残す）
  const staticData = protocolStaticData[params.id] || {};

  // 動的データを取得
  const dynamicData = await fetchProtocolData(params.id);

  // データをマージ（configDataを優先）
  const protocol = {
    ...configData,
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

  // 構造化データ（JSON-LD）
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FinancialProduct',
    name: `${protocol.name} Staking`,
    description: protocol.description || `${protocol.name} DeFi protocol`,
    provider: {
      '@type': 'Organization',
      name: protocol.name,
      url: protocol.website
    },
    annualPercentageRate: protocol.apy,
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://safe-yields.com'}/protocols/${params.id}`,
    aggregateRating: protocol.safetyScore ? {
      '@type': 'AggregateRating',
      ratingValue: protocol.safetyScore,
      bestRating: 100,
      worstRating: 0
    } : undefined
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* 構造化データ */}
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
            <div className="text-gray-400 text-sm mb-2">APY (Live)</div>
            <div className="text-2xl font-bold text-green-400">
              {protocol.apy !== null && protocol.apy !== undefined ? `${protocol.apy}%` : '--'}
            </div>
            {protocol.apyRange && protocol.apyRange.min > 0 && (
              <div className="text-xs text-gray-400 mt-2">
                Range: {protocol.apyRange.min.toFixed(2)}% - {protocol.apyRange.max.toFixed(2)}%
              </div>
            )}
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

        {/* Key Features */}
        {protocol.features && protocol.features.length > 0 && (
          <section className="mb-8">
            <h3 className="text-xl font-bold mb-4">Key Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {protocol.features.map((feature: string, index: number) => (
                <div key={index} className="flex items-start">
                  <span className="text-green-400 mr-2 mt-1">✓</span>
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Risks to Consider */}
        {protocol.risks && protocol.risks.length > 0 && (
          <section className="mb-8">
            <h3 className="text-xl font-bold mb-4">Risks to Consider</h3>
            <div className="bg-yellow-900/10 border border-yellow-600/20 rounded-lg p-4">
              <div className="space-y-2">
                {protocol.risks.map((risk: string, index: number) => (
                  <div key={index} className="flex items-start">
                    <span className="text-yellow-400 mr-2 mt-1">⚠</span>
                    <span className="text-gray-300">{risk}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTAセクション */}
        <ProtocolCTA
          protocolId={params.id}
          protocolName={protocol.name || params.id}
        />

        {/* リンク集 */}
        <section className="mt-8">
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