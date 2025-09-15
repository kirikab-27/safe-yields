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
    // シンプルに相対パスを使用
    const fullUrl = `/api/protocols/${id}`;
    console.log(`[getProtocolData] Fetching from: ${fullUrl}`);

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