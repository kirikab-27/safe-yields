export const protocolStaticData: Record<string, {
  name: string;
  description: string;
  website: string;
  docs: string;
  audit: string;
  safetyScore: number;
  apy?: number;
  tvl?: number;
  features?: string[];
  risks?: string[];
}> = {
  'lido': {
    name: 'Lido',
    description: 'Lido is a liquid staking solution for Ethereum, allowing users to stake ETH while retaining liquidity through stETH tokens. It enables users to earn staking rewards without locking assets or maintaining infrastructure.',
    website: 'https://lido.fi/',
    docs: 'https://docs.lido.fi/',
    audit: 'https://github.com/lidofinance/audits',
    safetyScore: 95,
    apy: undefined,  // Will be fetched from API
    tvl: undefined,   // Will be fetched from API
    features: [
      'Liquid staking with stETH tokens',
      'No minimum ETH requirement',
      'Daily staking rewards',
      'DeFi composability across protocols',
      'Professional node operators'
    ],
    risks: [
      'Smart contract risk',
      'stETH/ETH peg deviation risk',
      'Centralization concerns',
      'Slashing risk from validators'
    ]
  },
  'rocket-pool': {
    name: 'Rocket Pool',
    description: 'Rocket Pool is a decentralized Ethereum staking protocol. It allows users to run a validator with only 16 ETH, and provides liquid staking through rETH tokens for those with less ETH.',
    website: 'https://rocketpool.net',
    docs: 'https://docs.rocketpool.net',
    audit: 'https://rocketpool.net/files/audit-reports',
    safetyScore: 90,
    apy: undefined,  // Will be fetched from API
    tvl: undefined,   // Will be fetched from API
    features: [
      'Minimum 16 ETH for node operators',
      'rETH liquid staking token',
      'Decentralized validator network',
      'Built-in slashing insurance',
      'Permissionless node operation'
    ],
    risks: [
      'Smart contract risk',
      'Validator performance risk',
      'rETH/ETH price deviation risk',
      'Node operator collateral risk'
    ]
  },
  'aave-v3': {
    name: 'Aave V3',
    description: 'Aave V3 is a decentralized lending protocol that allows users to lend, borrow, and earn interest on crypto assets. Features include isolated markets, efficiency mode, and cross-chain portals.',
    website: 'https://app.aave.com',
    docs: 'https://docs.aave.com',
    audit: 'https://github.com/aave/aave-v3-core/tree/main/audits',
    safetyScore: 98,
    apy: undefined,  // Will be fetched from API
    tvl: undefined,   // Will be fetched from API
    features: [
      'Multi-chain deployment',
      'Isolation mode for new assets',
      'Efficiency mode for correlated assets',
      'Portal for cross-chain lending',
      'Advanced risk parameters'
    ],
    risks: [
      'Smart contract risk',
      'Liquidation risk',
      'Interest rate volatility',
      'Oracle manipulation risk'
    ]
  },
  'compound-v3': {
    name: 'Compound V3',
    description: 'Compound V3 is a streamlined version of the Compound protocol, focusing on security and capital efficiency. It features a single borrowable asset per market and improved risk management.',
    website: 'https://app.compound.finance',
    docs: 'https://docs.compound.finance',
    audit: 'https://github.com/compound-finance/comet/tree/main/audits',
    safetyScore: 94,
    apy: undefined,  // Will be fetched from API
    tvl: undefined,   // Will be fetched from API
    features: [
      'Single borrowable asset design',
      'Improved capital efficiency',
      'Better liquidation mechanism',
      'Supply caps for risk management',
      'Account management features'
    ],
    risks: [
      'Smart contract risk',
      'Liquidation risk',
      'Market manipulation risk',
      'Governance risk'
    ]
  },
  'curve': {
    name: 'Curve Finance',
    description: 'Curve Finance is a DEX optimized for stablecoin trading and low slippage swaps. It provides deep liquidity for stable assets and features innovative AMM mechanisms.',
    website: 'https://curve.fi',
    docs: 'https://docs.curve.fi',
    audit: 'https://github.com/curvefi/curve-contract/tree/master/audits',
    safetyScore: 88,
    apy: undefined,  // Will be fetched from API
    tvl: undefined,   // Will be fetched from API
    features: [
      'Optimized for stablecoin swaps',
      'Low slippage trading',
      'Liquidity provider rewards',
      'Vote-locked CRV (veCRV) governance',
      'Metapools for composability'
    ],
    risks: [
      'Smart contract risk',
      'Impermanent loss risk',
      'Peg deviation risk',
      'Governance attack risk'
    ]
  }
};