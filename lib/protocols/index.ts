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
    // Vercelでは絶対URLが必要な場合があるため、本番環境では完全なURLを構築
    let apiUrl = '';

    if (typeof window === 'undefined') {
      // サーバーサイド
      if (process.env.VERCEL_URL) {
        // Vercel環境
        apiUrl = `https://${process.env.VERCEL_URL}`;
      } else if (process.env.NEXT_PUBLIC_API_URL) {
        // 環境変数が設定されている場合
        apiUrl = process.env.NEXT_PUBLIC_API_URL;
      } else {
        // ローカル開発環境
        apiUrl = `http://localhost:${process.env.PORT || 3000}`;
      }
    }
    // クライアントサイドでは相対パス

    const fullUrl = `${apiUrl}/api/protocols/${id}`;
    console.log(`[getProtocolData] Fetching from: ${fullUrl}`);
    console.log(`[getProtocolData] Environment: NODE_ENV=${process.env.NODE_ENV}, VERCEL_URL=${process.env.VERCEL_URL}`);

    const res = await fetch(fullUrl, {
      cache: 'no-store',
      next: { revalidate: 0 }
    });

    if (res.ok) {
      dynamicData = await res.json();
      console.log(`[getProtocolData] Success for ${id}:`, dynamicData);
    } else {
      console.error(`[getProtocolData] API failed with status ${res.status} for ${id}`);
      const text = await res.text();
      console.error(`[getProtocolData] Response body:`, text);
    }
  } catch (e) {
    console.error(`[getProtocolData] Failed to fetch dynamic data for ${id}:`, e);
  }

  const staticData = protocolStaticData[id] || {};

  // マージ: 静的データをベースに、動的データで上書き
  return {
    ...staticData,
    ...dynamicData,
    id // IDを確実に含める
  };
}