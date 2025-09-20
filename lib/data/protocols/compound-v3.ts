// Compound V3 Protocol APY Fetcher
interface CompoundMarket {
  totalSupplyUsd: string;
  totalBorrowUsd: string;
  supplyApr: string;
  borrowApr: string;
  asset: string;
}

interface CompoundV3Response {
  market: CompoundMarket;
}

// 複数マーケットの加重平均計算
export function calculateWeightedAPY(markets: CompoundMarket[]): number | null {
  const validMarkets = markets.filter(m => {
    const tvl = parseFloat(m.totalSupplyUsd);
    const apr = parseFloat(m.supplyApr);
    return tvl > 1000000 && apr > 0; // $1M以上のTVLかつ正のAPR
  });

  if (validMarkets.length === 0) {
    console.log('[Compound] No valid markets found for APY calculation');
    return null;
  }

  const totalTvl = validMarkets.reduce((sum, m) =>
    sum + parseFloat(m.totalSupplyUsd), 0
  );

  const weightedApy = validMarkets.reduce((sum, m) =>
    sum + (parseFloat(m.supplyApr) * parseFloat(m.totalSupplyUsd)), 0
  );

  return weightedApy / totalTvl;
}

export async function fetchCompoundAPY(): Promise<number | null> {
  try {
    console.log('[Compound V3] Fetching APY from official API...');

    // Option 1: Try official Compound V3 API
    // Note: Compound V3のAPIエンドポイントは変更される可能性があります
    const endpoints = [
      'https://api.compound.finance/api/v3/markets/mainnet-usdc',
      'https://api.compound.finance/api/v3/markets' // 代替エンドポイント
    ];

    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(endpoint, {
          signal: controller.signal,
          next: { revalidate: 600 } // 10分キャッシュ（レート制限対策）
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();

          // 単一マーケットの場合
          if (data.market) {
            const market = data.market as CompoundMarket;
            const tvl = parseFloat(market.totalSupplyUsd);
            const apr = parseFloat(market.supplyApr);

            if (tvl < 1000) {
              console.log('[Compound V3] TVL too low, returning null');
              return null;
            }

            console.log(`[Compound V3] USDC APY: ${apr.toFixed(2)}%`);
            return apr;
          }

          // 複数マーケットの場合
          if (Array.isArray(data)) {
            const apy = calculateWeightedAPY(data);
            if (apy !== null) {
              console.log(`[Compound V3] Weighted APY: ${apy.toFixed(2)}%`);
            }
            return apy;
          }
        }
      } catch (error) {
        console.log(`[Compound V3] Failed to fetch from ${endpoint}`);
        continue;
      }
    }

    // すべてのエンドポイントが失敗した場合
    console.log('[Compound V3] All API endpoints failed, returning null');
    return null;

  } catch (error) {
    console.error('[Compound V3] Unexpected error:', error);
    return null;
  }
}