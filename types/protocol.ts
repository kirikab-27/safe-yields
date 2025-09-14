export interface Protocol {
  // 基本情報
  id: number;
  name: string;
  website: string;
  description?: string;

  // カテゴリとチェーン
  category: 'Lending' | 'DEX' | 'Yield' | 'Staking' | 'Bridge' | 'Perpetuals';
  chain: 'Ethereum' | 'BSC' | 'Arbitrum' | 'Polygon' | 'Optimism' | 'Base' | 'Avalanche';

  // 財務指標
  tvl: string;             // 表示用の文字列
  tvlNumber: number;       // ソート用の数値
  apy: string;             // 表示用の文字列 例: "4.5"
  apyNumber: number;       // ソート用の数値

  // 安全性
  safetyScore: number;     // 0-100
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  audits: string[];        // ["CertiK", "Trail of Bits"]
  hasInsurance: boolean;
  hasBugBounty: boolean;
  verified: boolean;
  incidentHistory: boolean; // 過去にハッキングがあったか

  // 更新情報
  lastUpdated: string;     // ISO日付
  dataSource: string;      // "Manual" or "DeFi Llama"
}

export interface FilterOptions {
  category: string;
  chain: string;
  risk: string;
  searchQuery: string;
}

export interface Stats {
  protocolCount: number;
  totalTVL: string;
  avgAPY: string;
}