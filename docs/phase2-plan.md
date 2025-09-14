# Safe Yields - Phase 2.1 実装計画（現実的版）

## 🎯 Phase 2.1の目標

* **期間**: 2週間
* **目的**: DeFiLlama APIを使用したリアルタイムデータ統合
* **方針**: 段階的実装（1プロトコルずつ確実に）

## 📊 対象プロトコル（実装順）

### 優先度と複雑度

| 順序 | プロトコル       | カテゴリ    | 複雑度 | 理由           |
| -- | ----------- | ------- | --- | ------------ |
| 1  | Lido        | Staking | 低   | 単一APY、最もシンプル |
| 2  | Rocket Pool | Staking | 低   | Lidoと同構造     |
| 3  | Aave v3     | Lending | 中   | 複数アセット       |
| 4  | Compound v3 | Lending | 中   | Aave類似       |
| 5  | Curve       | DEX     | 高   | 複数プール        |

## 🛠️ 技術スタック

### API選定

* **統一API**: DeFiLlama API (`https://api.llama.fi`)
* **理由**: 全プロトコル対応、統一的インターフェース、無料

### 主要エンドポイント

```
GET /protocol/{name}     # プロトコル基本情報
GET /tvl/{protocol}      # TVL履歴
GET /pools2              # Yield情報
```

### キャッシュ戦略

```
開発: メモリキャッシュ（5分）
本番: Vercel KV または Redis（5分TTL）
```

## 📅 実装スケジュール

### Week 1: 基礎実装

#### Day 1-2（月・火）: Lido実装

* [ ] `/api/protocols/lido/route.ts` 作成
* [ ] エラーハンドリング実装
* [ ] 5分キャッシュ実装
* [ ] UIコンポーネント更新
* [ ] テスト（レート制限確認）

#### Day 3（水）: Rocket Pool追加

* [ ] Lidoコードを流用
* [ ] `/api/protocols/rocket-pool/route.ts`
* [ ] 両プロトコルの比較表示

#### Day 4-5（木・金）: Aave v3実装

* [ ] 複数アセット対応
* [ ] 加重平均APY計算
* [ ] Supply/Borrow APY分離

### Week 2: 拡張と最適化

#### Day 1-2（月・火）: Compound v3追加

* [ ] Aaveと同様の実装
* [ ] データ構造の統一化

#### Day 3-4（水・木）: Curve追加

* [ ] 複数プール対応
* [ ] Stablecoinフィルター

#### Day 5（金）: 最適化

* [ ] バッチ取得実装
* [ ] エラー率測定
* [ ] パフォーマンス改善

## 💻 実装詳細

### 1. APIルート構造

```typescript
// app/api/protocols/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // キャッシュチェック
  if (cache.has(params.id)) {
    return NextResponse.json(cache.get(params.id));
  }

  // API取得
  const data = await fetchProtocolData(params.id);
  cache.set(params.id, data, TTL);

  return NextResponse.json(data);
}
```

### 2. データ取得関数

```typescript
async function fetchProtocolData(id: string) {
  const [protocol, yields] = await Promise.all([
    fetch(`https://api.llama.fi/protocol/${id}`),
    fetch(`https://api.llama.fi/pools2?project=${id}`)
  ]);

  return {
    id,
    tvl: protocol.tvl,
    apy: calculateWeightedAPY(yields.data),
    lastUpdated: Date.now()
  };
}
```

### 3. クライアント実装

```typescript
// hooks/useProtocolData.ts
import useSWR from 'swr';

export function useProtocolData(id: string) {
  return useSWR(
    `/api/protocols/${id}`,
    fetcher,
    { refreshInterval: 60000 }
  );
}
```

## 🧩 型定義

```typescript
interface ProtocolData {
  id: string;
  name: string;
  tvl: number;
  apy?: number;        // Staking系
  apyLend?: number;    // Lending系
  apyBorrow?: number;  // Lending系
  pools?: PoolData[];  // DEX系
  lastUpdated: number;
}
```

## ✅ 各段階の完了条件

### Lido完了条件

* [ ] APIからリアルタイムデータ取得
* [ ] TVLとAPY表示
* [ ] 5分キャッシュ動作
* [ ] エラー時フォールバック

### 全体完了条件

* [ ] 5プロトコル全て実装
* [ ] エラー率 < 1%
* [ ] レスポンス時間 < 500ms
* [ ] キャッシュヒット率 > 80%

## 🚨 リスク管理

### 技術的リスク

| リスク      | 対策                |
| -------- | ----------------- |
| APIレート制限 | 5分キャッシュ、リトライ機構    |
| データ不整合   | バリデーション、フォールバック   |
| API停止    | 静的データフォールバック      |
| 想定外の型崩れ  | 型ガード、Zodでのバリデーション |

## 📈 監視・ログ

* 重要なエラーはSentry等に送信
* APIレスポンス時間を計測
* フロント側でフェールセーフUI（例: 「データ取得失敗」表示）

## ⚙️ 環境変数管理

* `NEXT_PUBLIC_API_BASE_URL` を `.env` で管理
* 本番/開発で切替可能にする

## 📊 成功指標

### 必須達成

* API統合完了（5プロトコル）
* エラー率 < 1%
* データ更新頻度 5分以内

### 努力目標

* レスポンス時間 < 300ms
* キャッシュヒット率 > 90%
* 全プロトコル対応準備

## 🚀 Phase 2.2への準備

### 検討事項

* 全プロトコル対応（100+）
* バッチ処理最適化
* Supabase/Prisma導入
* 履歴データ保存

## 📝 Issue管理

```
Issue #16: Lido API実装
Issue #17: Rocket Pool追加
Issue #18: Aave v3/Compound v3追加
Issue #19: Curve追加
Issue #20: 最適化とバッチ処理
```

## 🎯 今すぐ実行

1. Issue #16作成
2. Lido APIテスト（curl）
3. 開発環境準備

---

*最終更新: 2025年1月14日*