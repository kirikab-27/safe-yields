'use client';

import { useState, useMemo } from 'react';
import { Protocol, FilterOptions } from '@/types/protocol';
import HeroSection from '@/components/HeroSection';
import SearchFilters from '@/components/SearchFilters';
import ProtocolCard from '@/components/ProtocolCard';
import EmailCapture from '@/components/EmailCapture';
import protocolsData from '@/data/protocols.json';
import { useBatchProtocolData, useProtocolFromBatch } from '@/hooks/useBatchProtocolData';

// Optimized Protocol Card that uses batch data
function OptimizedProtocolCard({
  protocolId,
  batchData,
  staticData
}: {
  protocolId: string;
  batchData?: any;
  staticData: Protocol;
}) {
  const { data, error, isLoading, isFromCache } = useProtocolFromBatch(protocolId, batchData);

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

  // Use live data if available, otherwise use static data
  const displayData = data || staticData;
  const tvl = data ? formatTVL(data.tvl) : staticData.tvl;
  const apy = data?.apy !== null && data?.apy !== undefined
    ? data.apy.toFixed(1)
    : staticData.apy;

  // Get protocol-specific emoji
  const getProtocolEmoji = (id: string) => {
    const emojis: { [key: string]: string } = {
      'lido': '🌊',
      'rocket-pool': '🚀',
      'aave-v3': '👻',
      'compound-v3': '🏛️',
      'curve': '🌊'
    };
    return emojis[id] || '💎';
  };

  return (
    <div className={`bg-[#0F1419] border border-gray-800 rounded-2xl p-6 hover:border-green-400/30 transition-all duration-300 hover:shadow-lg hover:shadow-green-400/5 ${isLoading ? 'opacity-70 animate-pulse' : ''}`}>
      <div className="flex justify-between items-start">
        {/* Left side */}
        <div className="flex gap-4">
          {/* Icon */}
          <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-2xl">
            {getProtocolEmoji(protocolId)}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-bold text-white">{displayData.name}</h3>
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
            </div>
          </div>
        </div>

        {/* Right side */}
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
    </div>
  );
}

export default function OptimizedHome() {
  const [protocols] = useState<Protocol[]>(protocolsData as Protocol[]);
  const [filters, setFilters] = useState<FilterOptions>({
    category: 'All',
    chain: 'All',
    risk: 'All',
    searchQuery: ''
  });

  // Get API-enabled protocols
  const apiProtocols = ['lido', 'rocket-pool', 'aave-v3', 'compound-v3', 'curve'];

  // Fetch batch data for all API-enabled protocols at once
  const { data: batchData, isLoading: batchLoading } = useBatchProtocolData(apiProtocols);

  // Filter protocols
  const filteredProtocols = useMemo(() => {
    return protocols.filter(protocol => {
      if (filters.category !== 'All' && protocol.category !== filters.category) return false;
      if (filters.chain !== 'All' && protocol.chain !== filters.chain) return false;
      if (filters.risk !== 'All' && protocol.risk !== filters.risk) return false;
      if (filters.searchQuery && !protocol.name.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [protocols, filters]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalTVL = filteredProtocols.reduce((sum, p) => sum + p.tvlNumber, 0);
    const avgAPY = filteredProtocols.reduce((sum, p) => sum + p.apyNumber, 0) / filteredProtocols.length || 0;
    return {
      protocolCount: filteredProtocols.length,
      totalTVL: (totalTVL / 1000000000).toFixed(1),
      avgAPY: avgAPY.toFixed(1)
    };
  }, [filteredProtocols]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🛡️</span>
              <h1 className="text-2xl font-bold">
                <span className="text-white">Safe</span>
                <span className="text-green-400"> Yields</span>
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/test-api-batch"
                className="text-xs text-green-400 hover:text-green-300 transition-colors"
              >
                ⚡ Batch API Test
              </a>
              <p className="text-xs text-gray-500 hidden sm:block">
                Not Financial Advice. Always DYOR.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection stats={stats} />

      {/* Search & Filters */}
      <SearchFilters filters={filters} onChange={setFilters} />

      {/* Protocol List */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Performance Indicator */}
        {batchLoading && (
          <div className="mb-4 text-center">
            <span className="text-sm text-green-400">⚡ Loading all protocols in batch mode...</span>
          </div>
        )}

        <div className="grid gap-6">
          {filteredProtocols.map((protocol) => {
            // Check if this protocol has API support
            const protocolIdString = protocol.id.toString();
            const hasApiSupport = apiProtocols.includes(protocolIdString);

            if (hasApiSupport) {
              // Use optimized card with batch data
              return (
                <OptimizedProtocolCard
                  key={protocol.id}
                  protocolId={protocolIdString}
                  batchData={batchData}
                  staticData={protocol}
                />
              );
            } else {
              // Use regular static protocol card
              return <ProtocolCard key={protocol.id} protocol={protocol} />;
            }
          })}
        </div>

        {filteredProtocols.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <div className="text-xl text-gray-400">No protocols found matching your criteria.</div>
            <div className="text-sm text-gray-500 mt-2">Try adjusting your filters</div>
          </div>
        )}
      </main>

      {/* Email Capture */}
      <section className="border-t border-gray-800 bg-gradient-to-b from-transparent to-green-950/10">
        <EmailCapture />
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-black">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-2xl">🛡️</span>
              <span className="text-lg font-bold">Safe Yields</span>
            </div>
            <p className="text-sm text-gray-500">© 2025 Safe Yields. Not financial advice.</p>
            <p className="text-xs text-gray-600 mt-2">Always do your own research before investing.</p>
            <p className="text-xs text-green-400 mt-4">⚡ Optimized with Batch API</p>
          </div>
        </div>
      </footer>
    </div>
  );
}