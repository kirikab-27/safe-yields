'use client';

import { useState, useMemo } from 'react';
import { Protocol, FilterOptions } from '@/types/protocol';
import HeroSection from '@/components/HeroSection';
import SearchFilters from '@/components/SearchFilters';
import ProtocolCard from '@/components/ProtocolCard';
import LidoCard from '@/components/LidoCard';
import RocketPoolCard from '@/components/RocketPoolCard';
import AaveCard from '@/components/AaveCard';
import CompoundCard from '@/components/CompoundCard';
import CurveCard from '@/components/CurveCard';
import EmailCapture from '@/components/EmailCapture';
import protocolsData from '@/data/protocols.json';
import { useAPYData } from '@/hooks/useAPYData';

export default function Home() {
  const [protocols] = useState<Protocol[]>(protocolsData as Protocol[]);
  const { apyData, loading: apyLoading } = useAPYData();
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
                href="/tools/gas-calculator"
                className="text-sm text-green-400 hover:text-green-300 transition-colors font-medium"
              >
                ⛽ Gas Calculator
              </a>
              <a
                href="/test-api"
                className="text-xs text-green-400 hover:text-green-300 transition-colors"
              >
                🧪 API Test
              </a>
              <p className="text-xs text-gray-500 hidden sm:block">
                Not Financial Advice. Always DYOR.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ヒーローセクション */}
      <HeroSection stats={stats} />

      {/* 検索・フィルター */}
      <SearchFilters filters={filters} onChange={setFilters} />

      {/* プロトコルリスト */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid gap-6">
          {filteredProtocols.map((protocol) => {
            // Lido、Rocket Pool、Aave V3、Compound V3、Curve Financeはリアルタイムデータを使用
            const isLido = protocol.name === 'Lido';
            const isRocketPool = protocol.name === 'Rocket Pool';
            const isAave = protocol.name === 'Aave V3';
            const isCompound = protocol.name === 'Compound V3';
            const isCurve = protocol.name === 'Curve Finance';

            if (isLido) {
              return <LidoCard key={protocol.id} liveApy={apyData['lido']} />;
            } else if (isRocketPool) {
              return <RocketPoolCard key={protocol.id} liveApy={apyData['rocket-pool']} />;
            } else if (isAave) {
              return <AaveCard key={protocol.id} liveApy={apyData['aave-v3']} />;
            } else if (isCompound) {
              return <CompoundCard key={protocol.id} liveApy={apyData['compound-v3']} />;
            } else if (isCurve) {
              return <CurveCard key={protocol.id} liveApy={apyData['curve']} />;
            } else {
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

      {/* メール収集 */}
      <section className="border-t border-gray-800 bg-gradient-to-b from-transparent to-green-950/10">
        <EmailCapture />
      </section>

      {/* フッター */}
      <footer className="border-t border-gray-800 bg-black">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-2xl">🛡️</span>
              <span className="text-lg font-bold">Safe Yields</span>
            </div>
            <p className="text-sm text-gray-500">© 2025 Safe Yields. Not financial advice.</p>
            <p className="text-xs text-gray-600 mt-2">Always do your own research before investing.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}