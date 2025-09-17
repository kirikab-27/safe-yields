/**
 * Affiliate Links Configuration
 * Centralized management of all affiliate links used across the application
 */

export const affiliateLinks = {
  // Protocol-specific affiliate links
  lido: process.env.NEXT_PUBLIC_LIDO_AFFILIATE || 'https://stake.lido.fi',
  rocketPool: process.env.NEXT_PUBLIC_ROCKETPOOL_AFFILIATE || 'https://rocketpool.net',
  aaveV3: process.env.NEXT_PUBLIC_AAVEV3_AFFILIATE || 'https://app.aave.com',
  compoundV3: process.env.NEXT_PUBLIC_COMPOUNDV3_AFFILIATE || 'https://app.compound.finance',
  curve: process.env.NEXT_PUBLIC_CURVE_AFFILIATE || 'https://curve.fi',

  // Exchange affiliate links
  binance: process.env.NEXT_PUBLIC_BINANCE_AFFILIATE || 'https://www.binance.com',
  coinbase: process.env.NEXT_PUBLIC_COINBASE_AFFILIATE || 'https://www.coinbase.com',
  bybit: process.env.NEXT_PUBLIC_BYBIT_AFFILIATE || 'https://www.bybit.com',
  kraken: process.env.NEXT_PUBLIC_KRAKEN_AFFILIATE || 'https://www.kraken.com',
  okx: process.env.NEXT_PUBLIC_OKX_AFFILIATE || 'https://www.okx.com',

  // Hardware wallet affiliate links
  ledger: process.env.NEXT_PUBLIC_LEDGER_AFFILIATE || 'https://www.ledger.com',
  trezor: process.env.NEXT_PUBLIC_TREZOR_AFFILIATE || 'https://trezor.io',
} as const;

// Type for affiliate link keys
export type AffiliateKey = keyof typeof affiliateLinks;

// Helper function to get affiliate link with fallback
export function getAffiliateLink(
  key: AffiliateKey,
  fallback?: string
): string {
  return affiliateLinks[key] || fallback || affiliateLinks.binance;
}

// Helper to check if link has affiliate code
export function hasAffiliateCode(url: string): boolean {
  const affiliatePatterns = ['ref=', 'referral=', 'affiliate=', '?r=', '&r='];
  return affiliatePatterns.some(pattern => url.includes(pattern));
}

// Get best exchange for a specific protocol
export function getBestExchangeForProtocol(protocolId: string): string {
  const exchangeMapping: Record<string, AffiliateKey> = {
    lido: 'coinbase',      // Coinbase has good ETH staking
    rocketPool: 'binance', // Binance for advanced users
    aaveV3: 'binance',     // Binance has AAVE token
    compoundV3: 'coinbase', // Coinbase lists COMP
    curve: 'binance',      // Binance has CRV
  };

  const exchangeKey = exchangeMapping[protocolId] || 'binance';
  return affiliateLinks[exchangeKey];
}

// Get all exchange links for display
export function getExchangeLinks() {
  return {
    binance: {
      url: affiliateLinks.binance,
      name: 'Binance',
      benefit: '20% trading fee discount',
    },
    coinbase: {
      url: affiliateLinks.coinbase,
      name: 'Coinbase',
      benefit: 'User-friendly for beginners',
    },
    bybit: {
      url: affiliateLinks.bybit,
      name: 'Bybit',
      benefit: 'Bonus rewards available',
    },
    kraken: {
      url: affiliateLinks.kraken,
      name: 'Kraken',
      benefit: 'Low fees & high security',
    },
  };
}