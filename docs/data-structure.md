# Safe Yields - データ構造ドキュメント

## 📊 データ型定義

### Protocol インターフェース
プロトコル情報を表現する主要なデータ型です。

```typescript
export interface Protocol {
  // 基本情報
  id: number;                 // 一意識別子
  name: string;               // プロトコル名
  website: string;            // 公式サイトURL
  description?: string;       // プロトコルの説明（オプション）

  // カテゴリとチェーン
  category: 'Lending' | 'DEX' | 'Yield' | 'Staking' | 'Bridge' | 'Perpetuals';
  chain: 'Ethereum' | 'BSC' | 'Arbitrum' | 'Polygon' | 'Optimism' | 'Base' | 'Avalanche';

  // 財務指標
  tvl: string;               // TVL表示用文字列（例: "$1.2B"）
  tvlNumber: number;         // TVLソート用数値（例: 1200000000）
  apy: string;               // APY表示用文字列（例: "4.5"）
  apyNumber: number;         // APYソート用数値（例: 4.5）

  // 安全性指標
  safetyScore: number;       // 安全性スコア（0-100）
  risk: 'LOW' | 'MEDIUM' | 'HIGH';  // リスクレベル
  audits: string[];          // 監査会社リスト
  hasInsurance: boolean;     // 保険有無
  hasBugBounty: boolean;     // バグバウンティ有無
  verified: boolean;         // 検証済みフラグ
  incidentHistory: boolean;  // 過去のインシデント有無

  // メタデータ
  lastUpdated: string;       // 最終更新日（ISO形式）
  dataSource: string;        // データソース（"Manual" or "DeFi Llama"）
}
```

### FilterOptions インターフェース
フィルター条件を管理するデータ型です。

```typescript
export interface FilterOptions {
  category: string;          // カテゴリーフィルター（"All" または特定カテゴリー）
  chain: string;            // チェーンフィルター（"All" または特定チェーン）
  risk: string;             // リスクフィルター（"All" または "LOW"/"MEDIUM"/"HIGH"）
  searchQuery: string;      // 検索クエリ文字列
}
```

### Stats インターフェース
統計情報を表示するためのデータ型です。

```typescript
export interface Stats {
  protocolCount: number;     // プロトコル数
  totalTVL: string;         // 合計TVL（フォーマット済み）
  avgAPY: string;           // 平均APY（フォーマット済み）
}
```

## 📁 データファイル構造

### protocols.json
現在10個のプロトコルデータを格納している静的JSONファイルです。

```json
[
  {
    "id": 1,
    "name": "Aave V3",
    "website": "https://aave.com",
    "category": "Lending",
    "chain": "Ethereum",
    "tvl": "$5.2B",
    "tvlNumber": 5200000000,
    "apy": "3.2",
    "apyNumber": 3.2,
    "safetyScore": 95,
    "risk": "LOW",
    "audits": ["CertiK", "Trail of Bits", "OpenZeppelin"],
    "hasInsurance": true,
    "hasBugBounty": true,
    "verified": true,
    "incidentHistory": false,
    "lastUpdated": "2025-01-14",
    "dataSource": "Manual"
  },
  // ... 他のプロトコル
]
```

## 🔄 データフロー

### 1. データ読み込み
```typescript
// data/protocols.json から静的インポート
import protocolsData from '@/data/protocols.json';

// コンポーネント内で型キャスト
const [protocols] = useState<Protocol[]>(protocolsData as Protocol[]);
```

### 2. フィルタリング処理
```typescript
const filteredProtocols = useMemo(() => {
  return protocols.filter(protocol => {
    // カテゴリーフィルター
    if (filters.category !== 'All' && protocol.category !== filters.category)
      return false;

    // チェーンフィルター
    if (filters.chain !== 'All' && protocol.chain !== filters.chain)
      return false;

    // リスクフィルター
    if (filters.risk !== 'All' && protocol.risk !== filters.risk)
      return false;

    // 検索フィルター
    if (filters.searchQuery &&
        !protocol.name.toLowerCase().includes(filters.searchQuery.toLowerCase()))
      return false;

    return true;
  });
}, [protocols, filters]);
```

### 3. 統計計算
```typescript
const stats = useMemo(() => {
  const totalTVL = filteredProtocols.reduce((sum, p) => sum + p.tvlNumber, 0);
  const avgAPY = filteredProtocols.reduce((sum, p) => sum + p.apyNumber, 0)
                  / filteredProtocols.length || 0;

  return {
    protocolCount: filteredProtocols.length,
    totalTVL: (totalTVL / 1000000000).toFixed(1),  // Billions表記
    avgAPY: avgAPY.toFixed(1)
  };
}, [filteredProtocols]);
```

## 🎯 データ検証ルール

### 必須フィールド
- `id`: 一意である必要がある
- `name`: 空文字列不可
- `website`: 有効なURL形式
- `category`: 定義された値のいずれか
- `chain`: 定義された値のいずれか
- `tvl`/`tvlNumber`: 一致する値
- `apy`/`apyNumber`: 一致する値
- `safetyScore`: 0-100の範囲
- `risk`: 定義された値のいずれか

### 推奨フィールド
- `audits`: 最低1つの監査会社
- `lastUpdated`: 30日以内の日付
- `dataSource`: 信頼できるソース

## 📝 データ追加ガイドライン

新しいプロトコルを追加する際の手順：

1. **安全性スコアの計算**
   - 監査数: +20点/監査（最大60点）
   - TVL: $1B以上で+10点
   - 保険: +10点
   - バグバウンティ: +10点
   - インシデントなし: +10点

2. **リスクレベルの判定**
   - LOW: safetyScore >= 80
   - MEDIUM: 50 <= safetyScore < 80
   - HIGH: safetyScore < 50

3. **データ更新頻度**
   - TVL/APY: 24時間ごと（Phase 2でAPI化）
   - 安全性情報: 週次
   - 監査情報: 新規監査時

## 🔮 Phase 2での変更予定
- JSONファイル → API統合
- リアルタイムデータ更新
- 追加フィールド（詳細統計、履歴データ）
- データキャッシング戦略