import { useState } from "react";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { SearchFilters } from "./components/SearchFilters";
import { ProtocolCard } from "./components/ProtocolCard";
import { EmailCapture } from "./components/EmailCapture";
import { Footer } from "./components/Footer";

// Sample protocol data
const protocols = [
  {
    id: "1",
    name: "Aave",
    logo: "🏦",
    verified: true,
    chain: "Ethereum",
    category: "Lending",
    tvl: "$12.4B",
    apy: "4.5%",
    safetyScore: 95,
    risk: "LOW" as const,
    audits: ["OpenZeppelin", "Trail of Bits"],
    description: "Decentralized lending protocol with proven track record and extensive security measures.",
    hasInsurance: true,
    bugBounty: true,
    noHacks: true,
  },
  {
    id: "2",
    name: "GMX",
    logo: "⚡",
    verified: true,
    chain: "Arbitrum",
    category: "Perpetuals",
    tvl: "$847M",
    apy: "12.3%",
    safetyScore: 82,
    risk: "MEDIUM" as const,
    audits: ["ABDK", "Peckshield"],
    description: "Decentralized perpetual exchange with innovative GLP token model and real yield.",
    hasInsurance: false,
    bugBounty: true,
    noHacks: true,
  },
  {
    id: "3",
    name: "Uniswap V3",
    logo: "🦄",
    verified: true,
    chain: "Ethereum",
    category: "DEX",
    tvl: "$3.2B",
    apy: "6.8%",
    safetyScore: 88,
    risk: "LOW" as const,
    audits: ["Consensys", "Trail of Bits", "ABDK"],
    description: "Leading decentralized exchange with concentrated liquidity and battle-tested smart contracts.",
    hasInsurance: true,
    bugBounty: true,
    noHacks: true,
  },
  {
    id: "4",
    name: "YieldMax Protocol",
    logo: "💎",
    verified: false,
    chain: "BSC",
    category: "Yield",
    tvl: "$42M",
    apy: "25.7%",
    safetyScore: 65,
    risk: "HIGH" as const,
    audits: ["CertiK"],
    description: "High-yield farming protocol with experimental tokenomics and untested mechanisms.",
    hasInsurance: false,
    bugBounty: false,
    noHacks: false,
  },
];

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedChain, setSelectedChain] = useState("All");
  const [selectedRisk, setSelectedRisk] = useState("All");

  // Filter protocols based on search and filters
  const filteredProtocols = protocols.filter((protocol) => {
    const matchesSearch = protocol.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         protocol.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || protocol.category === selectedCategory;
    const matchesChain = selectedChain === "All" || protocol.chain === selectedChain;
    const matchesRisk = selectedRisk === "All" || protocol.risk === selectedRisk;

    return matchesSearch && matchesCategory && matchesChain && matchesRisk;
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main>
        <Hero />
        <SearchFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedChain={selectedChain}
          setSelectedChain={setSelectedChain}
          selectedRisk={selectedRisk}
          setSelectedRisk={setSelectedRisk}
        />
        
        {/* Protocol Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">
                DeFi Protocols ({filteredProtocols.length})
              </h2>
            </div>
            
            <div className="grid gap-6">
              {filteredProtocols.map((protocol) => (
                <ProtocolCard key={protocol.id} protocol={protocol} />
              ))}
              
              {filteredProtocols.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-lg mb-2">No protocols found</p>
                  <p className="text-gray-500">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <EmailCapture />
      </main>
      <Footer />
    </div>
  );
}