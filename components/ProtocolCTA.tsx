'use client';

import { getProtocol, mapProtocolId } from '@/lib/config/protocols';
import { affiliateLinks, getBestExchangeForProtocol, getExchangeLinks, hasAffiliateCode } from '@/lib/config/affiliates';
import { tracking } from '@/lib/config/tracking';

interface ProtocolCTAProps {
  protocolId: string;
  protocolName: string;
}

export default function ProtocolCTA({ protocolId, protocolName }: ProtocolCTAProps) {
  // Map old format IDs to new format
  const mappedId = mapProtocolId(protocolId);
  const protocol = getProtocol(protocolId);

  // Get affiliate link from config or fallback to best exchange
  const getAffiliateLink = () => {
    if (protocol?.affiliate) {
      return protocol.affiliate;
    }
    return getBestExchangeForProtocol(mappedId);
  };

  // Click tracking using centralized tracking
  const handleCtaClick = () => {
    tracking.trackCtaClick(protocolId, {
      protocol: protocolName,
    });
  };

  const handleSecondaryCtaClick = (exchange: string) => {
    tracking.trackAffiliateClick(exchange, protocolId, {
      protocol: protocolName,
    });
  };

  const affiliateLink = getAffiliateLink();
  const isProtocolDirect = hasAffiliateCode(affiliateLink) ||
                          affiliateLink.includes(protocolId) ||
                          affiliateLink.includes(protocolName.toLowerCase());

  // Get exchange links for secondary CTAs
  const exchanges = getExchangeLinks();

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

      {/* セカンダリCTA（CEX誘導） - Show top exchanges */}
      <div className="bg-gray-900 p-4 rounded-lg">
        <p className="text-sm text-gray-400 mb-3">
          {isProtocolDirect
            ? 'Alternative ways to get started:'
            : 'New to DeFi? Start with a trusted exchange:'}
        </p>
        <div className="flex flex-wrap gap-3">
          {Object.entries(exchanges).slice(0, 3).map(([key, exchange]) => (
            <a
              key={key}
              href={exchange.url}
              onClick={() => handleSecondaryCtaClick(key)}
              rel="sponsored noopener"
              target="_blank"
              className="text-green-400 hover:text-green-300 underline text-sm"
            >
              {exchange.name} ({exchange.benefit}) →
            </a>
          ))}
        </div>
      </div>

      {/* Hardware wallet recommendation for large amounts */}
      {protocol && protocol.safetyScore >= 90 && (
        <div className="bg-blue-900/20 border border-blue-600/30 p-3 rounded-lg">
          <p className="text-xs text-blue-400">
            💡 <strong>Security Tip:</strong> For large investments, consider using a hardware wallet like{' '}
            <a
              href={affiliateLinks.ledger}
              onClick={() => handleSecondaryCtaClick('ledger')}
              rel="sponsored noopener"
              target="_blank"
              className="underline hover:text-blue-300"
            >
              Ledger
            </a>{' '}
            or{' '}
            <a
              href={affiliateLinks.trezor}
              onClick={() => handleSecondaryCtaClick('trezor')}
              rel="sponsored noopener"
              target="_blank"
              className="underline hover:text-blue-300"
            >
              Trezor
            </a>{' '}
            for enhanced security.
          </p>
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