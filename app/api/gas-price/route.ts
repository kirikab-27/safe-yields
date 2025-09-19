import { NextResponse } from 'next/server';

// キャッシュ設定
let cache: {
  gasPrice: number;
  ethPrice: number;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 30 * 1000; // 30秒

export async function GET() {
  try {
    // キャッシュチェック
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        gasPrice: cache.gasPrice,
        ethPrice: cache.ethPrice,
        cached: true,
        timestamp: cache.timestamp,
      });
    }

    // 並行してガス価格とETH価格を取得
    const [gasData, ethPriceData] = await Promise.all([
      fetchGasPrice(),
      fetchEthPrice(),
    ]);

    const result = {
      gasPrice: gasData || 30, // デフォルト30 Gwei
      ethPrice: ethPriceData || 2000, // デフォルト$2000
      cached: false,
      timestamp: Date.now(),
    };

    // キャッシュ更新
    cache = {
      gasPrice: result.gasPrice,
      ethPrice: result.ethPrice,
      timestamp: result.timestamp,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching gas price:', error);
    // エラー時はデフォルト値を返す
    return NextResponse.json({
      gasPrice: 30,
      ethPrice: 2000,
      error: true,
      message: 'Using default values due to API error',
    });
  }
}

// Etherscan APIからガス価格を取得
async function fetchGasPrice(): Promise<number | null> {
  try {
    // Etherscan API（無料版）
    const etherscanApiKey = process.env.ETHERSCAN_API_KEY || 'YourEtherscanAPIKeyHere';
    const url = `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${etherscanApiKey}`;

    const response = await fetch(url, {
      next: { revalidate: 30 }, // 30秒キャッシュ
    });

    if (!response.ok) {
      throw new Error(`Etherscan API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === '1' && data.result) {
      // ProposeGasPriceは標準的なガス価格（Gwei）
      const gasPrice = parseInt(data.result.ProposeGasPrice);
      if (!isNaN(gasPrice) && gasPrice > 0) {
        return gasPrice;
      }
    }

    // Etherscan APIが使えない場合、代替APIを試す
    return await fetchGasPriceFromAlternative();
  } catch (error) {
    console.error('Error fetching gas price from Etherscan:', error);
    return await fetchGasPriceFromAlternative();
  }
}

// 代替APIからガス価格を取得（Etherscan APIが失敗した場合）
async function fetchGasPriceFromAlternative(): Promise<number | null> {
  try {
    // ETH Gas Station API（無料、APIキー不要）
    const response = await fetch('https://api.ethgasstation.info/api/fee-estimate', {
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    // standard gas priceを使用（Gwei単位に変換）
    if (data.gasPrice?.standard) {
      return Math.round(data.gasPrice.standard);
    }

    return null;
  } catch (error) {
    console.error('Error fetching gas price from alternative:', error);
    return null;
  }
}

// CoinGecko APIからETH価格を取得
async function fetchEthPrice(): Promise<number | null> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
      {
        next: { revalidate: 60 }, // 60秒キャッシュ
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.ethereum?.usd) {
      return Math.round(data.ethereum.usd);
    }

    return null;
  } catch (error) {
    console.error('Error fetching ETH price:', error);
    return null;
  }
}