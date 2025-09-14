'use client';

import { useProtocolData } from '@/hooks/useProtocolData';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Props {
  protocolId: string;
  staticData?: {
    name: string;
    category: string;
    chain: string;
    risk: string;
    safetyScore: number;
  };
}

export default function ProtocolCardWithAPI({ protocolId, staticData }: Props) {
  const { data, error, isLoading, isFromCache } = useProtocolData(protocolId);

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

  const formatTVL = (tvl: number) => {
    if (tvl >= 1000000000) return `$${(tvl / 1000000000).toFixed(1)}B`;
    if (tvl >= 1000000) return `$${(tvl / 1000000).toFixed(0)}M`;
    return `$${tvl.toLocaleString()}`;
  };

  // ローディング中
  if (isLoading) {
    return (
      <div className="bg-[#0F1419] border border-gray-800 rounded-2xl p-6 animate-pulse">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="h-6 bg-gray-800 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-800 rounded w-24"></div>
          </div>
          <div className="text-right">
            <div className="h-8 bg-gray-800 rounded w-20 mb-2"></div>
            <div className="h-4 bg-gray-800 rounded w-16"></div>
          </div>
        </div>
      </div>
    );
  }

  // エラー時はスタティックデータを表示
  if (error && staticData) {
    return (
      <div className="bg-[#0F1419] border border-gray-800 rounded-2xl p-6 hover:border-yellow-400/30 transition-all duration-300">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{protocolIcons[staticData.name] || '🏦'}</span>
              <div>
                <h3 className="text-lg font-semibold text-white">{staticData.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">{staticData.category}</span>
                  <span className="text-xs text-gray-600">•</span>
                  <span className="text-xs text-gray-500">{staticData.chain}</span>
                  <span className="text-xs text-yellow-500 ml-2">⚠️ Offline Data</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // APIデータ表示
  if (data) {
    const displayName = data.name || staticData?.name || protocolId;
    const displayChain = data.chains?.[0] || staticData?.chain || 'Multi-chain';

    return (
      <div className="bg-[#0F1419] border border-gray-800 rounded-2xl p-6 hover:border-green-400/30 transition-all duration-300 hover:shadow-lg hover:shadow-green-400/5">
        <div className="flex justify-between items-start">
          {/* 左側 */}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{protocolIcons[displayName] || '🏦'}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-white">{displayName}</h3>
                  {isFromCache && (
                    <span className="text-xs text-gray-500" title="Cached data">💾</span>
                  )}
                  {!isFromCache && (
                    <span className="text-xs text-green-500" title="Live data">🟢</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">{staticData?.category || 'Staking'}</span>
                  <span className="text-xs text-gray-600">•</span>
                  <span className="text-xs text-gray-500">{displayChain}</span>
                </div>
              </div>
            </div>

            {/* 安全性スコア */}
            {staticData?.safetyScore && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Safety Score</span>
                  <span className={`text-xs font-semibold ${getScoreColor(staticData.safetyScore)}`}>
                    {staticData.safetyScore}/100
                  </span>
                </div>
                <Progress value={staticData.safetyScore} className="h-1.5" />
              </div>
            )}

            {/* リスクとAudits */}
            <div className="flex items-center gap-2 mt-4">
              {staticData?.risk && (
                <Badge variant="outline" className={`text-xs ${getRiskColor(staticData.risk)}`}>
                  {staticData.risk} RISK
                </Badge>
              )}
              {data.audits && (
                <Badge variant="outline" className="text-xs text-blue-400 bg-blue-400/10 border-blue-400/20">
                  {data.audits} Audits
                </Badge>
              )}
            </div>
          </div>

          {/* 右側 - TVLとAPY */}
          <div className="text-right ml-4">
            <div>
              <div className="text-2xl font-bold text-white">
                {formatTVL(data.tvl)}
              </div>
              <div className="text-xs text-gray-500">TVL</div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-yellow-400">
                {data.apy.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">APY</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}