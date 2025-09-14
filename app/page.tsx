'use client';

import { useState, useMemo } from 'react';
import { Protocol, FilterOptions } from '@/types/protocol';
import ProtocolCard from '@/components/ProtocolCard';
import FilterBar from '@/components/FilterBar';
import SearchBar from '@/components/SearchBar';
import EmailCapture from '@/components/EmailCapture';
import protocolsData from '@/data/protocols.json';

export default function Home() {
  const [protocols] = useState<Protocol[]>(protocolsData as Protocol[]);
  const [filters, setFilters] = useState<FilterOptions>({
    category: 'All',
    chain: 'All',
    risk: 'All',
    searchQuery: ''
  });

  // フィルター適用
  const filteredProtocols = useMemo(() => {
    return protocols.filter(protocol => {
      if (filters.category !== 'All' && protocol.category !== filters.category) return false;
      if (filters.chain !== 'All' && protocol.chain !== filters.chain) return false;
      if (filters.risk !== 'All' && protocol.risk !== filters.risk) return false;
      if (filters.searchQuery && !protocol.name.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [protocols, filters]);

  // 統計計算
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
      {/* ヘッダー */}
      <header className="border-b border-green-900/20 bg-black/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🛡️</span>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                Safe Yields
              </h1>
            </div>
            <p className="text-xs text-gray-500 hidden sm:block">
              Not Financial Advice. Always DYOR.
            </p>
          </div>
        </div>
      </header>

      {/* ヒーローセクション */}
      <section className="bg-gradient-to-b from-green-900/10 to-transparent">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Find Safe DeFi Yields.{" "}
            <span className="text-green-400">Skip the Scams.</span>
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Verified protocols only. Real APYs. Safety scores. No BS.
          </p>

          {/* 統計 */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
              <div className="text-2xl font-bold text-green-400">{stats.protocolCount}</div>
              <div className="text-xs text-gray-500">Verified Protocols</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
              <div className="text-2xl font-bold">${stats.totalTVL}B</div>
              <div className="text-xs text-gray-500">Total TVL</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
              <div className="text-2xl font-bold text-yellow-400">{stats.avgAPY}%</div>
              <div className="text-xs text-gray-500">Avg Safe APY</div>
            </div>
          </div>
        </div>
      </section>

      {/* 検索・フィルター */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <SearchBar value={filters.searchQuery} onChange={(value) => setFilters({...filters, searchQuery: value})} />
        <FilterBar filters={filters} onChange={setFilters} />
      </section>

      {/* プロトコルリスト */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid gap-4">
          {filteredProtocols.map((protocol) => (
            <ProtocolCard key={protocol.id} protocol={protocol} />
          ))}
        </div>

        {filteredProtocols.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No protocols found matching your criteria.
          </div>
        )}
      </main>

      {/* メール収集 */}
      <EmailCapture />

      {/* フッター */}
      <footer className="border-t border-gray-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>© 2025 Safe Yields. Not financial advice.</p>
            <p className="mt-2">Always do your own research.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}