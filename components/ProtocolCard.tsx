'use client';

import { Protocol } from '@/types/protocol';

interface Props {
  protocol: Protocol;
}

export default function ProtocolCard({ protocol }: Props) {
  const protocolIcons: Record<string, string> = {
    'Aave V3': '🏦',
    'Compound V3': '🏛️',
    'Curve Finance': '🌊',
    'Uniswap V3': '🦄',
    'GMX': '⚡',
    'Lido': '🌊',
    'Yearn Finance': '🔮',
    'Convex Finance': '🔺',
    'Stargate': '🌉',
    'PancakeSwap': '🥞',
    'Rocket Pool': '🚀',
    'Frax Finance': '💎'
  };

  const getRiskColor = (risk: string) => {
    switch(risk) {
      case 'LOW': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'HIGH': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-gray-400';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatTVL = (tvl: string) => {
    const num = parseFloat(tvl);
    if (num >= 1000000000) return `$${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(0)}M`;
    return `$${num.toLocaleString()}`;
  };

  return (
    <div className="bg-[#0F1419] border border-gray-800 rounded-2xl p-6 hover:border-green-400/30 transition-all duration-300 hover:shadow-lg hover:shadow-green-400/5">
      <div className="flex justify-between items-start">
        {/* 左側 */}
        <div className="flex gap-4">
          {/* アイコン */}
          <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-2xl">
            {protocolIcons[protocol.name] || '🔷'}
          </div>

          {/* 情報 */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-bold text-white">{protocol.name}</h3>
              {protocol.verified && (
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                </svg>
              )}
            </div>

            <div className="flex gap-2 mb-3">
              <span className="px-2 py-1 bg-gray-800 rounded-lg text-xs text-gray-300">
                {protocol.chain}
              </span>
              <span className="px-2 py-1 bg-gray-800 rounded-lg text-xs text-gray-300">
                {protocol.category}
              </span>
            </div>

            <div className="text-sm text-gray-400 mb-2">
              TVL: <span className="text-white font-semibold">{formatTVL(protocol.tvl)}</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {protocol.audits.map((audit: string) => (
                <span key={audit} className="px-2 py-1 bg-green-400/10 text-green-400 rounded-lg text-xs border border-green-400/20">
                  ✓ {audit}
                </span>
              ))}
            </div>

            {protocol.description && (
              <p className="text-sm text-gray-400 max-w-lg">
                {protocol.description}
              </p>
            )}
          </div>
        </div>

        {/* 右側 */}
        <div className="flex flex-col items-end gap-4 ml-8">
          {/* APY */}
          <div className="text-right">
            <div className="text-4xl font-bold text-green-400">
              {protocol.apy}%
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">APY</div>
          </div>

          {/* Safety Score */}
          <div className="text-right">
            <div className={`text-2xl font-bold ${getScoreColor(protocol.safetyScore)}`}>
              {protocol.safetyScore}
            </div>
            <div className="w-24 bg-gray-800 rounded-full h-2 mt-1">
              <div
                className={`h-2 rounded-full ${
                  protocol.safetyScore >= 90 ? 'bg-green-400' :
                  protocol.safetyScore >= 70 ? 'bg-yellow-400' : 'bg-red-400'
                }`}
                style={{width: `${protocol.safetyScore}%`}}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">Safety Score</div>
          </div>

          {/* Risk Badge */}
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRiskColor(protocol.risk)}`}>
            {protocol.risk} RISK
          </span>
        </div>
      </div>

      {/* Bottom Badges */}
      <div className="flex gap-3 mt-4 pt-4 border-t border-gray-800">
        {protocol.hasInsurance && (
          <span className="flex items-center gap-1 text-xs text-green-400">
            <span className="text-base">🛡️</span> Insurance
          </span>
        )}
        {protocol.hasBugBounty && (
          <span className="flex items-center gap-1 text-xs text-blue-400">
            <span className="text-base">🐛</span> Bug Bounty
          </span>
        )}
        {!protocol.incidentHistory && (
          <span className="flex items-center gap-1 text-xs text-green-400">
            <span className="text-base">✓</span> No Hacks
          </span>
        )}
      </div>
    </div>
  );
}