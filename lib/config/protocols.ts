/**
 * Protocol Configuration
 * Centralized management of all protocol-related settings and data
 */

import { affiliateLinks } from './affiliates';

/**
 * Protocol configuration type
 */
export interface ProtocolConfig {
  id: string;
  name: string;
  slug: string;  // URL-friendly ID (with hyphens)
  description: string;
  website: string;
  docs: string;
  audit: string;
  affiliate: string;
  trackingPrefix: string;
  ogImage: string;
  safetyScore: number;
  features?: string[];
  risks?: string[];
  fallbackData: {
    apy: number;
    tvl: number;
  };
  defiLlamaId: string;  // ID for DeFiLlama API
  category: 'Lending' | 'Staking' | 'DEX' | 'Yield' | 'Perpetuals' | 'Bridge';
  chains: string[];
}

/**
 * Complete protocol configuration
 */
export const protocolConfig: Record<string, ProtocolConfig> = {
  lido: {
    id: 'lido',
    name: 'Lido',
    slug: 'lido',
    description: 'Lido is a liquid staking solution for Ethereum, allowing users to stake ETH while retaining liquidity through stETH tokens. It enables users to earn staking rewards without locking assets or maintaining infrastructure.',
    website: 'https://lido.fi/',
    docs: 'https://docs.lido.fi/',
    audit: 'https://github.com/lidofinance/audits',
    affiliate: affiliateLinks.lido,
    trackingPrefix: 'lido',
    ogImage: '/og/default.png',
    safetyScore: 95,
    features: [
      'Liquid staking with stETH tokens',
      'No minimum ETH requirement',
      'Daily staking rewards',
      'DeFi composability across protocols',
      'Professional node operators',
    ],
    risks: [
      'Smart contract risk',
      'stETH/ETH peg deviation risk',
      'Centralization concerns',
      'Slashing risk from validators',
    ],
    fallbackData: {
      apy: 3.8,
      tvl: 40_000_000_000,
    },
    defiLlamaId: 'lido',
    category: 'Staking',
    chains: ['Ethereum'],
  },

  rocketPool: {
    id: 'rocketPool',
    name: 'Rocket Pool',
    slug: 'rocket-pool',
    description: 'Rocket Pool is a decentralized Ethereum staking protocol. It allows users to run a validator with only 16 ETH, and provides liquid staking through rETH tokens for those with less ETH.',
    website: 'https://rocketpool.net',
    docs: 'https://docs.rocketpool.net',
    audit: 'https://rocketpool.net/files/audit-reports',
    affiliate: affiliateLinks.rocketPool,
    trackingPrefix: 'rocket_pool',
    ogImage: '/og/default.png',
    safetyScore: 90,
    features: [
      'Minimum 16 ETH for node operators',
      'rETH liquid staking token',
      'Decentralized validator network',
      'Built-in slashing insurance',
      'Permissionless node operation',
    ],
    risks: [
      'Smart contract risk',
      'Validator performance risk',
      'rETH/ETH price deviation risk',
      'Node operator collateral risk',
    ],
    fallbackData: {
      apy: 4.1,
      tvl: 3_500_000_000,
    },
    defiLlamaId: 'rocket-pool',
    category: 'Staking',
    chains: ['Ethereum'],
  },

  aaveV3: {
    id: 'aaveV3',
    name: 'Aave V3',
    slug: 'aave-v3',
    description: 'Aave V3 is a decentralized lending protocol that allows users to lend, borrow, and earn interest on crypto assets. Features include isolated markets, efficiency mode, and cross-chain portals.',
    website: 'https://app.aave.com',
    docs: 'https://docs.aave.com',
    audit: 'https://github.com/aave/aave-v3-core/tree/main/audits',
    affiliate: affiliateLinks.aaveV3,
    trackingPrefix: 'aave_v3',
    ogImage: '/og/default.png',
    safetyScore: 93,
    features: [
      'Multi-chain deployment',
      'Isolation mode for new assets',
      'Efficiency mode for correlated assets',
      'Portal for cross-chain lending',
      'Advanced risk parameters',
    ],
    risks: [
      'Smart contract risk',
      'Liquidation risk',
      'Interest rate volatility',
      'Oracle manipulation risk',
    ],
    fallbackData: {
      apy: 2.5,
      tvl: 8_000_000_000,
    },
    defiLlamaId: 'aave',
    category: 'Lending',
    chains: ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'Avalanche'],
  },

  compoundV3: {
    id: 'compoundV3',
    name: 'Compound V3',
    slug: 'compound-v3',
    description: 'Compound V3 is a streamlined version of the Compound protocol, focusing on security and capital efficiency. It features a single borrowable asset per market and improved risk management.',
    website: 'https://app.compound.finance',
    docs: 'https://docs.compound.finance',
    audit: 'https://github.com/compound-finance/comet/tree/main/audits',
    affiliate: affiliateLinks.compoundV3,
    trackingPrefix: 'compound_v3',
    ogImage: '/og/default.png',
    safetyScore: 91,
    features: [
      'Single borrowable asset design',
      'Improved capital efficiency',
      'Better liquidation mechanism',
      'Supply caps for risk management',
      'Account management features',
    ],
    risks: [
      'Smart contract risk',
      'Liquidation risk',
      'Market manipulation risk',
      'Governance risk',
    ],
    fallbackData: {
      apy: 2.8,
      tvl: 2_500_000_000,
    },
    defiLlamaId: 'compound-finance',
    category: 'Lending',
    chains: ['Ethereum', 'Polygon', 'Arbitrum'],
  },

  curve: {
    id: 'curve',
    name: 'Curve Finance',
    slug: 'curve',
    description: 'Curve Finance is a DEX optimized for stablecoin trading and low slippage swaps. It provides deep liquidity for stable assets and features innovative AMM mechanisms.',
    website: 'https://curve.fi',
    docs: 'https://docs.curve.fi',
    audit: 'https://github.com/curvefi/curve-contract/tree/master/audits',
    affiliate: affiliateLinks.curve,
    trackingPrefix: 'curve',
    ogImage: '/og/default.png',
    safetyScore: 88,
    features: [
      'Optimized for stablecoin swaps',
      'Low slippage trading',
      'Liquidity provider rewards',
      'Vote-locked CRV (veCRV) governance',
      'Metapools for composability',
    ],
    risks: [
      'Smart contract risk',
      'Impermanent loss risk',
      'Peg deviation risk',
      'Governance attack risk',
    ],
    fallbackData: {
      apy: 5.2,
      tvl: 4_000_000_000,
    },
    defiLlamaId: 'curve-dex',
    category: 'DEX',
    chains: ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'Fantom'],
  },
};

/**
 * Helper functions for protocol data
 */

// Get protocol by ID (camelCase)
export function getProtocolById(id: string): ProtocolConfig | undefined {
  return protocolConfig[id];
}

// Get protocol by slug (hyphenated)
export function getProtocolBySlug(slug: string): ProtocolConfig | undefined {
  return Object.values(protocolConfig).find(p => p.slug === slug);
}

// Get all protocols
export function getAllProtocols(): ProtocolConfig[] {
  return Object.values(protocolConfig);
}

// Get protocols by category
export function getProtocolsByCategory(category: string): ProtocolConfig[] {
  return Object.values(protocolConfig).filter(p => p.category === category);
}

// Get protocols by chain
export function getProtocolsByChain(chain: string): ProtocolConfig[] {
  return Object.values(protocolConfig).filter(p => p.chains.includes(chain));
}

// Map old ID format to new (for backwards compatibility)
export function mapProtocolId(id: string): string {
  const mapping: Record<string, string> = {
    'rocket-pool': 'rocketPool',
    'aave-v3': 'aaveV3',
    'compound-v3': 'compoundV3',
  };
  return mapping[id] || id;
}

// Get protocol for display (with slug compatibility)
export function getProtocol(idOrSlug: string): ProtocolConfig | undefined {
  // Try direct ID lookup first
  let protocol = getProtocolById(idOrSlug);

  // If not found, try slug lookup
  if (!protocol) {
    protocol = getProtocolBySlug(idOrSlug);
  }

  // If still not found, try mapping old format
  if (!protocol) {
    const mappedId = mapProtocolId(idOrSlug);
    protocol = getProtocolById(mappedId);
  }

  return protocol;
}

// Export protocol IDs for iteration
export const protocolIds = Object.keys(protocolConfig) as Array<keyof typeof protocolConfig>;

// Export protocol slugs for URL generation
export const protocolSlugs = Object.values(protocolConfig).map(p => p.slug);