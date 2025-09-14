import { Search } from "lucide-react";
import { useState } from "react";
import { Input } from "./ui/input";

interface SearchFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedChain: string;
  setSelectedChain: (chain: string) => void;
  selectedRisk: string;
  setSelectedRisk: (risk: string) => void;
}

export function SearchFilters({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedChain,
  setSelectedChain,
  selectedRisk,
  setSelectedRisk
}: SearchFiltersProps) {
  const categories = ["All", "Lending", "DEX", "Yield", "Staking", "Bridge", "Perpetuals"];
  const chains = ["All", "Ethereum", "BSC", "Arbitrum", "Polygon", "Optimism"];
  const risks = ["All", "LOW", "MEDIUM", "HIGH"];

  return (
    <section className="py-8 border-b border-gray-800">
      <div className="container mx-auto px-4">
        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto mb-8">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search protocols..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? "bg-green-400 text-black"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
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
                  onClick={() => setSelectedChain(chain)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedChain === chain
                      ? "bg-green-400 text-black"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {chain}
                </button>
              ))}
            </div>
          </div>

          {/* Risk */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">Risk</h3>
            <div className="flex flex-wrap gap-2">
              {risks.map((risk) => (
                <button
                  key={risk}
                  onClick={() => setSelectedRisk(risk)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedRisk === risk
                      ? "bg-green-400 text-black"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
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