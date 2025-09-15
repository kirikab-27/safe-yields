import { protocolStaticData } from './static-data';

export interface ProtocolData {
  id?: string;
  name?: string;
  apy?: number;
  tvl?: number;
  safetyScore?: number;
  description?: string;
  website?: string;
  docs?: string;
  audit?: string;
  chains?: string[];
  audits?: any;
  lastUpdated?: number;
  _cached?: boolean;
}

export async function getProtocolData(id: string): Promise<ProtocolData> {
  let dynamicData: ProtocolData = {};

  try {
    // 本番環境では相対パスを使用（同じドメイン）
    // 開発環境では環境変数または動的ポート
    const isProduction = process.env.NODE_ENV === 'production';
    let apiUrl = '';

    if (typeof window === 'undefined') {
      // サーバーサイド
      if (isProduction) {
        // 本番環境では相対パス（Vercel上では同じドメイン）
        apiUrl = '';
      } else {
        // 開発環境
        apiUrl = process.env.NEXT_PUBLIC_API_URL || `http://localhost:${process.env.PORT || 3000}`;
      }
    } else {
      // クライアントサイド - 常に相対パス
      apiUrl = '';
    }

    const fullUrl = `${apiUrl}/api/protocols/${id}`;
    console.log(`Fetching protocol data from: ${fullUrl}`);

    const res = await fetch(fullUrl, {
      cache: 'no-store'
    });

    if (res.ok) {
      dynamicData = await res.json();
      console.log(`Successfully fetched data for ${id}:`, dynamicData);
    } else {
      console.error(`API request failed with status ${res.status} for ${id}`);
    }
  } catch (e) {
    console.error(`Failed to fetch dynamic data for ${id}:`, e);
  }

  const staticData = protocolStaticData[id] || {};

  // マージ: 静的データをベースに、動的データで上書き
  return {
    ...staticData,
    ...dynamicData,
    id // IDを確実に含める
  };
}