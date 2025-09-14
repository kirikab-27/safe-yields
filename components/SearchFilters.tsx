'use client';

import { FilterOptions } from '@/types/protocol';
import { Input } from '@/components/ui/input';

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
      <div className="container mx-auto px-4">
        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto mb-8">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            🔍
          </div>
          <Input
            type="text"
            placeholder="Search protocols..."
            value={filters.searchQuery}
            onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
            className="pl-12 py-4 text-lg bg-gray-900 border-gray-700 focus:border-green-400 focus:ring-green-400/20"
          />
        </div>

        {/* Filters */}
        <div className="space-y-4">
          {/* Category */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">Category</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => onChange({ ...filters, category })}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    filters.category === category
                      ? 'bg-green-400 text-black'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Chain */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">Chain</h3>
            <div className="flex flex-wrap gap-2">
              {chains.map((chain) => (
                <button
                  key={chain}
                  onClick={() => onChange({ ...filters, chain })}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    filters.chain === chain
                      ? 'bg-green-400 text-black'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {chain}
                </button>
              ))}
            </div>
          </div>

          {/* Risk */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">Risk Level</h3>
            <div className="flex flex-wrap gap-2">
              {risks.map((risk) => (
                <button
                  key={risk}
                  onClick={() => onChange({ ...filters, risk })}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    filters.risk === risk
                      ? 'bg-green-400 text-black'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
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