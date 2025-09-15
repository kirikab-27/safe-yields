'use client';

import { track } from '@vercel/analytics';

interface ProtocolCTAProps {
  protocolId: string;
  protocolName: string;
}

export default function ProtocolCTA({ protocolId, protocolName }: ProtocolCTAProps) {
  // アフィリエイトリンクの取得
  const getAffiliateLink = () => {
    // プロトコル固有のアフィリエイトリンク
    const protocolAffiliates: Record<string, string | undefined> = {
      'lido': process.env.NEXT_PUBLIC_LIDO_AFFILIATE,
      'rocket-pool': process.env.NEXT_PUBLIC_ROCKETPOOL_AFFILIATE,
      'aave-v3': process.env.NEXT_PUBLIC_AAVE_AFFILIATE,
      'compound-v3': process.env.NEXT_PUBLIC_COMPOUND_AFFILIATE,
      'curve': process.env.NEXT_PUBLIC_CURVE_AFFILIATE,
    };

    // プロトコル固有のリンクがあればそれを使用、なければBinanceへ誘導
    return protocolAffiliates[protocolId] ||
           process.env.NEXT_PUBLIC_BINANCE_AFFILIATE ||
           'https://www.binance.com';
  };

  // クリックトラッキング
  const handleCtaClick = () => {
    // Vercel Analyticsにイベント送信
    track(`${protocolId}_cta_click`, {
      protocol: protocolName,
      type: 'primary_cta'
    });
  };

  const handleSecondaryCtaClick = (exchange: string) => {
    track(`${exchange}_from_${protocolId}`, {
      protocol: protocolName,
      exchange: exchange,
      type: 'secondary_cta'
    });
  };

  const affiliateLink = getAffiliateLink();
  const isProtocolDirect = affiliateLink.includes(protocolId) ||
                          affiliateLink.includes(protocolName.toLowerCase());

  return (
    <section className="mt-8 space-y-4">
      {/* メインCTA */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg">
        <h3 className="text-2xl font-bold text-black mb-3">
          Start Earning with {protocolName}
        </h3>
        <p className="text-black/80 mb-4">
          {isProtocolDirect
            ? `Access ${protocolName} directly and start earning yield on your crypto assets.`
            : `Get started with DeFi through our trusted exchange partner.`}
        </p>
        <a
          href={affiliateLink}
          onClick={handleCtaClick}
          rel="sponsored noopener"
          target="_blank"
          className="inline-block bg-black text-green-400 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-900 transition-colors"
        >
          {isProtocolDirect
            ? `Start Earning on ${protocolName} →`
            : 'Get Started with DeFi →'}
        </a>
      </div>

      {/* セカンダリCTA（CEX誘導） */}
      {!isProtocolDirect && (
        <div className="bg-gray-900 p-4 rounded-lg">
          <p className="text-sm text-gray-400 mb-3">
            New to DeFi? Start with a trusted exchange:
          </p>
          <div className="flex flex-wrap gap-3">
            {process.env.NEXT_PUBLIC_BINANCE_AFFILIATE && (
              <a
                href={process.env.NEXT_PUBLIC_BINANCE_AFFILIATE}
                onClick={() => handleSecondaryCtaClick('binance')}
                rel="sponsored noopener"
                target="_blank"
                className="text-green-400 hover:text-green-300 underline text-sm"
              >
                Binance (20% fee discount) →
              </a>
            )}
            {process.env.NEXT_PUBLIC_BYBIT_AFFILIATE && (
              <a
                href={process.env.NEXT_PUBLIC_BYBIT_AFFILIATE}
                onClick={() => handleSecondaryCtaClick('bybit')}
                rel="sponsored noopener"
                target="_blank"
                className="text-green-400 hover:text-green-300 underline text-sm"
              >
                Bybit (Bonus rewards) →
              </a>
            )}
            {process.env.NEXT_PUBLIC_COINBASE_AFFILIATE && (
              <a
                href={process.env.NEXT_PUBLIC_COINBASE_AFFILIATE}
                onClick={() => handleSecondaryCtaClick('coinbase')}
                rel="sponsored noopener"
                target="_blank"
                className="text-green-400 hover:text-green-300 underline text-sm"
              >
                Coinbase (User-friendly) →
              </a>
            )}
          </div>
        </div>
      )}

      {/* アフィリエイト開示文 */}
      <div className="text-xs text-gray-500 italic">
        * This page contains affiliate links. We may earn a commission at no extra cost to you.
        All recommendations are based on our independent research and analysis.
      </div>

      {/* 安全性の注意事項 */}
      <div className="bg-yellow-900/20 border border-yellow-600/30 p-3 rounded-lg">
        <p className="text-xs text-yellow-400">
          <strong>⚠️ Important:</strong> Always do your own research (DYOR) before investing.
          DeFi protocols carry risks including smart contract vulnerabilities and impermanent loss.
          Never invest more than you can afford to lose.
        </p>
      </div>
    </section>
  );
}