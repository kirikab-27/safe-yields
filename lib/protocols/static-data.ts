export const protocolStaticData: Record<string, {
  name: string;
  description: string;
  website: string;
  docs: string;
  audit: string;
  safetyScore: number;
  apy?: number;
  tvl?: number;
}> = {
  'lido': {
    name: 'Lido',
    description: 'Lido is a liquid staking solution for Ethereum, allowing users to stake ETH while retaining liquidity through stETH tokens. It enables users to earn staking rewards without locking assets or maintaining infrastructure.',
    website: 'https://lido.fi/',
    docs: 'https://docs.lido.fi/',
    audit: 'https://github.com/lidofinance/audits',
    safetyScore: 95,
    apy: undefined,  // Will be fetched from API
    tvl: undefined   // Will be fetched from API
  }
  // 今後追加: rocket-pool, aave-v3, compound-v3, curve
};