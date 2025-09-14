'use client';

import { useProtocolData } from '@/hooks/useProtocolData';

export default function RocketPoolCard() {
  const { data, error, isLoading, isFromCache } = useProtocolData('rocket-pool');

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
    name: 'Rocket Pool',
    chain: 'Ethereum',
    category: 'Staking',
    tvl: '$3.1B',
    apy: '4.1',
    safetyScore: 92,
    risk: 'LOW',
    audits: ['ConsenSys', 'Sigma Prime'],
    hasInsurance: false,
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
              🚀
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
              <div className="text-xs text-gray-500 uppercase tracking-wider">APY</div>
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
  const apy = data ? data.apy.toFixed(1) : staticData.apy;

  return (
    <div className="bg-[#0F1419] border border-gray-800 rounded-2xl p-6 hover:border-green-400/30 transition-all duration-300 hover:shadow-lg hover:shadow-green-400/5">
      <div className="flex justify-between items-start">
        {/* 左側 */}
        <div className="flex gap-4">
          {/* アイコン */}
          <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-2xl">
            🚀
          </div>

          {/* 情報 */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-bold text-white">Rocket Pool</h3>
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
                {data?.chains && data.chains.length > 1 ? 'Multi-chain' : staticData.chain}
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
                staticData.audits.map((audit: string) => (
                  <span key={audit} className="px-2 py-1 bg-green-400/10 text-green-400 rounded-lg text-xs border border-green-400/20">
                    ✓ {audit}
                  </span>
                ))
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
            <div className="text-xs text-gray-500 uppercase tracking-wider">APY</div>
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
  );
}