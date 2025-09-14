'use client';

import { FilterOptions } from '@/types/protocol';

interface Props {
  filters: FilterOptions;
  onChange: (filters: FilterOptions) => void;
}

export default function SearchFilters({ filters, onChange }: Props) {
  const categories = ['All', 'Lending', 'DEX', 'Yield', 'Staking', 'Bridge', 'Perpetuals'];
  const chains = ['All', 'Ethereum', 'BSC', 'Arbitrum', 'Polygon', 'Optimism', 'Base', 'Avalanche'];
  const risks = ['All', 'LOW', 'MEDIUM', 'HIGH'];

  return (
    <section className="py-8 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto mb-8">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search protocols..."
            value={filters.searchQuery}
            onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
            className="w-full pl-12 pr-4 py-4 text-lg bg-[#0F1419] border border-gray-800 rounded-xl focus:border-green-400/50 focus:outline-none focus:ring-2 focus:ring-green-400/20 text-white placeholder-gray-500 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="space-y-6">
          {/* Category */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Category</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => onChange({ ...filters, category })}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    filters.category === category
                      ? 'bg-green-400 text-black shadow-lg shadow-green-400/25'
                      : 'bg-[#1A1F2E] text-gray-400 hover:bg-[#252B3B] border border-gray-800'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Chain */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Chain</h3>
            <div className="flex flex-wrap gap-2">
              {chains.map((chain) => (
                <button
                  key={chain}
                  onClick={() => onChange({ ...filters, chain })}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    filters.chain === chain
                      ? 'bg-green-400 text-black shadow-lg shadow-green-400/25'
                      : 'bg-[#1A1F2E] text-gray-400 hover:bg-[#252B3B] border border-gray-800'
                  }`}
                >
                  {chain}
                </button>
              ))}
            </div>
          </div>

          {/* Risk Level */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Risk Level</h3>
            <div className="flex flex-wrap gap-2">
              {risks.map((risk) => (
                <button
                  key={risk}
                  onClick={() => onChange({ ...filters, risk })}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    filters.risk === risk
                      ? 'bg-green-400 text-black shadow-lg shadow-green-400/25'
                      : 'bg-[#1A1F2E] text-gray-400 hover:bg-[#252B3B] border border-gray-800'
                  }`}
                >
                  {risk}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}