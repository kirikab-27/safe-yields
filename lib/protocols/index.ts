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
    // サーバーサイドでは相対パスを使用、クライアントサイドでは環境変数を使用
    const baseUrl = typeof window === 'undefined'
      ? `http://localhost:${process.env.PORT || 3000}`
      : '';
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || baseUrl;
    const res = await fetch(`${apiUrl}/api/protocols/${id}`, {
      cache: 'no-store'
    });
    if (res.ok) {
      dynamicData = await res.json();
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