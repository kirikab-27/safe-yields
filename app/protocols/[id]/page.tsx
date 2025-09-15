import { protocolStaticData } from '@/lib/protocols/static-data';
import { Metadata } from 'next';
import Script from 'next/script';
import ProtocolCTA from '@/components/ProtocolCTA';

// ISR (Incremental Static Regeneration) を使用
// データは60秒ごとに再検証される
export const revalidate = 60;

export async function generateStaticParams() {
  return [
    { id: 'lido' },
    { id: 'rocket-pool' }
  ];
}

// SEOメタデータ生成
export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const staticData = protocolStaticData[params.id] || {};
  const dynamicData = await fetchProtocolData(params.id);
  const protocol = { ...staticData, ...dynamicData };

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
    title: `${protocol.name || params.id} - APY ${protocol.apy || 'N/A'}% | ${siteName}`,
    description: `${protocol.name}の安全性スコア、APY、TVL、監査情報を確認。DeFi投資のリスクを可視化。現在のAPY: ${protocol.apy || 'N/A'}%、TVL: ${tvlFormatted}、安全性スコア: ${protocol.safetyScore || 'N/A'}/100`,
    keywords: `${protocol.name}, DeFi, yield farming, APY, TVL, safety score, staking, ${params.id}`,

    openGraph: {
      title: `${protocol.name} Safety Analysis - ${protocol.apy || 'N/A'}% APY`,
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
      title: `${protocol.name} - ${protocol.apy || 'N/A'}% APY`,
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