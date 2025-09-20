'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  fetchUniswapV3Data,
  getMockUniswapV3Data,
  type UniswapV3Data
} from '@/lib/data/protocols/uniswap-v3';

interface UniswapV3CardProps {
  initialData?: {
    name: string;
    category: string;
    chain: string;
    risk: string;
    safetyScore: number;
  };
  liveApy?: number | null;
}

export default function UniswapV3Card({ initialData, liveApy }: UniswapV3CardProps) {
  // Always use mock data immediately to avoid loading issues
  const [data, setData] = useState<UniswapV3Data | null>(getMockUniswapV3Data());
  const [loading, setLoading] = useState(false);  // Start with loading false
  const [error, setError] = useState(false);

  // Helper functions
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

  // 平均APYの計算
  const averageAPY = data?.topPools.length
    ? data.topPools.reduce((sum, pool) => sum + pool.apy, 0) / data.topPools.length
    : 0;

  // Static data defaults
  const staticData = {
    name: 'Uniswap V3',
    chain: 'Multi-chain',
    category: 'DEX',
    tvl: '$4.5B',
    apy: '5.2',
    safetyScore: 94,
    risk: 'LOW',
    verified: true
  };

  const displayRisk = initialData?.risk || staticData.risk;
  const displayScore = initialData?.safetyScore || staticData.safetyScore;
  const displayChain = initialData?.chain || staticData.chain;
  const displayCategory = initialData?.category || staticData.category;
  const tvl = data ? formatTVL(data.tvl) : staticData.tvl;
  const apy = liveApy !== undefined && liveApy !== null
    ? liveApy.toFixed(1)
    : averageAPY > 0
      ? averageAPY.toFixed(1)
      : staticData.apy;

  // Loading state
  if (loading) {
    return (
      <Link href="/protocols/uniswap-v3" className="block">
        <div className="bg-[#0F1419] border border-gray-800 rounded-2xl p-6 hover:border-green-400/30 transition-all duration-300 hover:shadow-lg hover:shadow-green-400/5 opacity-70 animate-pulse cursor-pointer">
          <div className="flex justify-between items-start">
            {/* Left side */}
            <div className="flex gap-4">
              {/* Icon */}
              <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-2xl">
                🦄
              </div>

              {/* Info */}
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
                    {displayChain}
                  </span>
                  <span className="px-2 py-1 bg-gray-800 rounded-lg text-xs text-gray-300">
                    {displayCategory}
                  </span>
                </div>

                <div className="text-sm text-gray-400 mb-2">
                  TVL: <span className="text-white font-semibold">{staticData.tvl}</span>
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="flex flex-col items-end gap-4 ml-8">
              {/* APY */}
              <div className="text-right">
                <div className="text-4xl font-bold text-green-400">
                  {staticData.apy}%
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">
                  Avg APY
                </div>
              </div>

              {/* Safety Score */}
              <div className="text-right">
                <div className={`text-2xl font-bold ${getScoreColor(displayScore)}`}>
                  {displayScore}
                </div>
                <div className="w-24 bg-gray-800 rounded-full h-2 mt-1">
                  <div
                    className="h-2 rounded-full bg-green-400"
                    style={{width: `${displayScore}%`}}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">Safety Score</div>
              </div>

              {/* Risk Badge */}
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRiskColor(displayRisk)}`}>
                {displayRisk} RISK
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Main render
  return (
    <Link href="/protocols/uniswap-v3" className="block">
      <div className="bg-[#0F1419] border border-gray-800 rounded-2xl p-6 hover:border-green-400/30 transition-all duration-300 hover:shadow-lg hover:shadow-green-400/5 cursor-pointer">
        <div className="flex justify-between items-start">
          {/* Left side */}
          <div className="flex gap-4">
            {/* Icon */}
            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-2xl">
              🦄
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-white">Uniswap V3</h3>
                {staticData.verified && (
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                  </svg>
                )}
                {data && !data.fromCache && (
                  <span className="text-xs text-green-500" title="Live data">🟢 Live</span>
                )}
                {data && data.fromCache && (
                  <span className="text-xs text-gray-500" title="Cached data">💾 Cached</span>
                )}
                {error && (
                  <span className="text-xs text-yellow-500" title="Using fallback data">⚠️ Offline</span>
                )}
              </div>

              <div className="flex gap-2 mb-3">
                <span className="px-2 py-1 bg-gray-800 rounded-lg text-xs text-gray-300">
                  {displayChain}
                </span>
                <span className="px-2 py-1 bg-gray-800 rounded-lg text-xs text-gray-300">
                  {displayCategory}
                </span>
                <span className="px-2 py-1 bg-purple-400/10 rounded-lg text-xs text-purple-400 border border-purple-400/20">
                  AMM V3
                </span>
              </div>

              <div className="text-sm text-gray-400 mb-2">
                TVL: <span className="text-white font-semibold">{tvl}</span>
              </div>

              {/* Audits */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2 py-1 bg-green-400/10 text-green-400 rounded-lg text-xs border border-green-400/20">
                  ✓ Trail of Bits
                </span>
                <span className="px-2 py-1 bg-green-400/10 text-green-400 rounded-lg text-xs border border-green-400/20">
                  ✓ ABDK
                </span>
              </div>

              <p className="text-sm text-gray-400 max-w-lg">
                Concentrated liquidity DEX with capital efficiency
              </p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex flex-col items-end gap-4 ml-8">
            {/* APY */}
            <div className="text-right">
              <div className="text-4xl font-bold text-green-400">
                {apy}%
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">
                Avg APY {liveApy !== undefined && liveApy !== null && <span className="text-green-400">(Live)</span>}
              </div>
            </div>

            {/* Safety Score */}
            <div className="text-right">
              <div className={`text-2xl font-bold ${getScoreColor(displayScore)}`}>
                {displayScore}
              </div>
              <div className="w-24 bg-gray-800 rounded-full h-2 mt-1">
                <div
                  className="h-2 rounded-full bg-green-400"
                  style={{width: `${displayScore}%`}}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">Safety Score</div>
            </div>

            {/* Risk Badge */}
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRiskColor(displayRisk)}`}>
              {displayRisk} RISK
            </span>
          </div>
        </div>

        {/* Footer metrics */}
        <div className="flex gap-3 mt-4 pt-4 border-t border-gray-800">
          <span className="flex items-center gap-1 text-xs text-blue-400">
            <span className="text-base">🐛</span> Bug Bounty
          </span>
          <span className="flex items-center gap-1 text-xs text-green-400">
            <span className="text-base">✓</span> No Hacks
          </span>
          {data && (
            <>
              <span className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
                Pools: {data.poolCount.toLocaleString()}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-400">
                24h Vol: ${(data.volume24h / 1000000000).toFixed(1)}B
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}