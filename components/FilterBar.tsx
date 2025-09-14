import { FilterOptions } from '@/types/protocol';

interface Props {
  filters: FilterOptions;
  onChange: (filters: FilterOptions) => void;
}

export default function FilterBar({ filters, onChange }: Props) {
  const categories = ['All', 'Lending', 'DEX', 'Yield', 'Staking', 'Bridge', 'Perpetuals'];
  const chains = ['All', 'Ethereum', 'BSC', 'Arbitrum', 'Polygon', 'Optimism', 'Base', 'Avalanche'];
  const risks = ['All', 'LOW', 'MEDIUM', 'HIGH'];

  return (
    <div className="space-y-4">
      {/* カテゴリーフィルター */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-gray-500 py-2">Category:</span>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => onChange({...filters, category: cat})}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filters.category === cat
                ? 'bg-green-500 text-black'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* チェーンフィルター */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-gray-500 py-2">Chain:</span>
        {chains.map(chain => (
          <button
            key={chain}
            onClick={() => onChange({...filters, chain})}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filters.chain === chain
                ? 'bg-green-500 text-black'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {chain}
          </button>
        ))}
      </div>

      {/* リスクフィルター */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-gray-500 py-2">Risk Level:</span>
        {risks.map(risk => (
          <button
            key={risk}
            onClick={() => onChange({...filters, risk})}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filters.risk === risk
                ? 'bg-green-500 text-black'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {risk}
          </button>
        ))}
      </div>
    </div>
  );
}