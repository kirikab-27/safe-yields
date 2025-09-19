'use client';

import Link from 'next/link';
import { useProtocolData } from '@/hooks/useProtocolData';

interface AaveCardProps {
  liveApy?: number | null;
}

export default function AaveCard({ liveApy }: AaveCardProps) {
  const { data, error, isLoading, isFromCache } = useProtocolData('aave-v3');

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

  const formatTVL = (tvl: number) => {
    if (tvl >= 1000000000) return `$${(tvl / 1000000000).toFixed(1)}B`;
    if (tvl >= 1000000) return `$${(tvl / 1000000).toFixed(0)}M`;
    return `$${tvl.toLocaleString()}`;
  };

  // Static data for when API is loading or fails
  const staticData = {
    name: 'Aave V3',
    chain: 'Multi-chain',
    category: 'Lending',
    tvl: '$18.5B',
    apy: '3.5',
    safetyScore: 98,
    risk: 'LOW',
    audits: ['Certora', 'OpenZeppelin', 'PeckShield', 'SigmaPrime', 'Trail of Bits'],
    hasInsurance: true,
    hasBugBounty: true,
    verified: true
  };

  // ローディング中は静的データを表示（アニメーション付き）
  if (isLoading) {
    return (
      <div className="bg-[#0F1419] border border-gray-800 rounded-2xl p-6 hover:border-green-400/30 transition-all duration-300 hover:shadow-lg hover:shadow-green-400/5 opacity-70 animate-pulse">
        <div className="flex justify-between items-start">
          {/* 左側 */}
          <div className="flex gap-4">
            {/* アイコン */}
            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-2xl">
              🏦
            </div>

            {/* 情報 */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-white">{staticData.name}</h3>
                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                </svg>
                <span className="text-xs text-gray-500">Loading...</span>
              </div>

              <div className="flex gap-2 mb-3">
                <span className="px-2 py-1 bg-gray-800 rounded-lg text-xs text-gray-300">
                  {staticData.chain}
                </span>
                <span className="px-2 py-1 bg-gray-800 rounded-lg text-xs text-gray-300">
                  {staticData.category}
                </span>
              </div>

              <div className="text-sm text-gray-400 mb-2">
                TVL: <span className="text-white font-semibold">{staticData.tvl}</span>
              </div>
            </div>
          </div>

          {/* 右側 */}
          <div className="flex flex-col items-end gap-4 ml-8">
            {/* APY */}
            <div className="text-right">
              <div className="text-4xl font-bold text-green-400">
                {staticData.apy}%
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Supply APY</div>
            </div>

            {/* Safety Score */}
            <div className="text-right">
              <div className={`text-2xl font-bold ${getScoreColor(staticData.safetyScore)}`}>
                {staticData.safetyScore}
              </div>
              <div className="w-24 bg-gray-800 rounded-full h-2 mt-1">
                <div
                  className="h-2 rounded-full bg-green-400"
                  style={{width: `${staticData.safetyScore}%`}}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">Safety Score</div>
            </div>

            {/* Risk Badge */}
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRiskColor(staticData.risk)}`}>
              {staticData.risk} RISK
            </span>
          </div>
        </div>
      </div>
    );
  }

  // APIデータまたは静的データを使用
  const displayData = data || staticData;
  const tvl = data ? formatTVL(data.tvl) : staticData.tvl;
  const apy = liveApy !== undefined && liveApy !== null
    ? liveApy.toFixed(1)
    : data?.apy !== null && data?.apy !== undefined
      ? data.apy.toFixed(1)
      : staticData.apy;

  return (
    <Link href="/protocols/aave-v3" className="block">
      <div className="bg-[#0F1419] border border-gray-800 rounded-2xl p-6 hover:border-green-400/30 transition-all duration-300 hover:shadow-lg hover:shadow-green-400/5 cursor-pointer">
        <div className="flex justify-between items-start">
        {/* 左側 */}
        <div className="flex gap-4">
          {/* アイコン */}
          <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-2xl">
            🏦
          </div>

          {/* 情報 */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-bold text-white">Aave V3</h3>
              {staticData.verified && (
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                </svg>
              )}
              {data && !isFromCache && (
                <span className="text-xs text-green-500" title="Live data">🟢 Live</span>
              )}
              {data && isFromCache && (
                <span className="text-xs text-gray-500" title="Cached data">💾 Cached</span>
              )}
              {error && (
                <span className="text-xs text-yellow-500" title="Using fallback data">⚠️ Offline</span>
              )}
            </div>

            <div className="flex gap-2 mb-3">
              <span className="px-2 py-1 bg-gray-800 rounded-lg text-xs text-gray-300">
                {data?.chains && data.chains.length > 1 ? 'Multi-chain' : data?.chains?.[0] || staticData.chain}
              </span>
              <span className="px-2 py-1 bg-gray-800 rounded-lg text-xs text-gray-300">
                {staticData.category}
              </span>
            </div>

            <div className="text-sm text-gray-400 mb-2">
              TVL: <span className="text-white font-semibold">{tvl}</span>
              {data && <span className="text-xs text-green-400 ml-1">(Live)</span>}
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {data?.audits ? (
                <span className="px-2 py-1 bg-green-400/10 text-green-400 rounded-lg text-xs border border-green-400/20">
                  ✓ {data.audits} Audits
                </span>
              ) : (
                staticData.audits.slice(0, 3).map((audit: string) => (
                  <span key={audit} className="px-2 py-1 bg-green-400/10 text-green-400 rounded-lg text-xs border border-green-400/20">
                    ✓ {audit}
                  </span>
                ))
              )}
              {staticData.audits.length > 3 && (
                <span className="px-2 py-1 bg-gray-800 text-gray-400 rounded-lg text-xs">
                  +{staticData.audits.length - 3} more
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 右側 */}
        <div className="flex flex-col items-end gap-4 ml-8">
          {/* APY */}
          <div className="text-right">
            <div className="text-4xl font-bold text-green-400">
              {apy}%
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Supply APY</div>
          </div>

          {/* Safety Score */}
          <div className="text-right">
            <div className={`text-2xl font-bold ${getScoreColor(staticData.safetyScore)}`}>
              {staticData.safetyScore}
            </div>
            <div className="w-24 bg-gray-800 rounded-full h-2 mt-1">
              <div
                className="h-2 rounded-full bg-green-400"
                style={{width: `${staticData.safetyScore}%`}}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">Safety Score</div>
          </div>

          {/* Risk Badge */}
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRiskColor(staticData.risk)}`}>
            {staticData.risk} RISK
          </span>
        </div>
      </div>

      {/* Bottom Badges */}
      <div className="flex gap-3 mt-4 pt-4 border-t border-gray-800">
        {staticData.hasInsurance && (
          <span className="flex items-center gap-1 text-xs text-green-400">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
            </svg>
            Insurance
          </span>
        )}
        {staticData.hasBugBounty && (
          <span className="flex items-center gap-1 text-xs text-green-400">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" />
            </svg>
            Bug Bounty
          </span>
        )}
      </div>
      </div>
    </Link>
  );
}