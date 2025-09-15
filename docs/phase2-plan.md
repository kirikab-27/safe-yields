# Phase 2 開発計画

## 📌 フェーズ概要

Phase 2では、複数のプロトコルから効率的にデータを取得し、安定したパフォーマンスを維持するための最適化を進める。特に、**APIバッチ処理・キャッシュ戦略・エラー時フォールバック**を導入し、ユーザーに途切れないデータ提供を実現する。また、安定稼働を意識したモニタリング導入も優先して実施する。

---

## ✅ Phase 2.1 - 個別API実装とUI統合

### 対応内容

* 各プロトコルのAPI実装（Lido, Rocket Pool, Aave V3, Compound V3, Curve Finance）
* フロントエンドの個別カードコンポーネント作成
* 自動更新（5分間隔, SWR refreshInterval: 60000）
* エラー時フォールバック処理の導入
* パフォーマンス計測（レスポンス時間・キャッシュヒット率可視化）

### 実装済みプロトコル

| Issue | プロトコル | カテゴリ | 状態 | デプロイ日 |
|-------|------------|----------|------|------------|
| #16 | Lido | Staking | ✅ 完了 | 2025/01/14 |
| #17 | Rocket Pool | Staking | ✅ 完了 | 2025/01/14 |
| #18 | Aave V3 | Lending | ✅ 完了 | 2025/01/15 |
| #19 | Compound V3 | Lending | ✅ 完了 | 2025/01/15 |
| #20 | Curve Finance | DEX | ✅ 完了 | 2025/01/15 |

### 状況

* **完了済み**

---

## ✅ Phase 2.2 - バッチAPI & キャッシュ統合

### 対応内容（Issue #21）

* `/api/protocols/batch` エンドポイント作成
* 複数プロトコルのデータを一括取得
* 並列制御（MAX_CONCURRENT = 3）
* エラー時のリトライ（エクスポネンシャルバックオフ＋ジッター）
* GlobalCacheによる一元管理
* `useBatchProtocolData` フック作成
* テストページ `/test-api-batch` にて動作確認

### 実測結果

* APIリクエスト: **5個 → 1個（80%削減）**
* 初回ロード: **約6.9秒（キャッシュなし）**
* キャッシュヒット時: **100ms未満**
* エラー分離: **Promise.allSettledで実現**

### 状況

* **完了済み（2025/01/15デプロイ）**

---

## ⚠️ Phase 2.2.1 - モニタリング導入（安定稼働強化）

### 優先対応

* **Sentry** の導入（エラートラッキング）
* **Vercel Analytics** の導入（パフォーマンス監視）
* キャッシュヒット率・エラー発生率のログ収集（本番環境対応）

### ゴール

* 異常時に即座に検知できる体制を構築
* キャッシュ・API処理の効率性を継続的に評価可能にする

### 状況

* **未実装 → 優先タスクとして着手**

---

## 🎯 Phase 2.3 - プロトコル追加とさらなる最適化

### 対応予定

* 残り10プロトコルの実装（例: MakerDAO, Balancer, Yearn, Convex, Frax）
* CDN最適化・Edge Functions活用
* キャッシュ戦略の高度化（Stale-While-Revalidate, Incremental Static Regeneration）

### ゴール

* 合計15プロトコルの安定サポート
* エッジ最適化による低レイテンシー実現

---

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
開発: GlobalCache（メモリキャッシュ、5分TTL）
本番: GlobalCache → Vercel KV or Redis移行可能
```

## 📅 実装スケジュール（完了済み）

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

## 🚀 次のアクション

1. **モニタリング導入（Phase 2.2.1）**
   * Vercel Analytics有効化
   * Sentryでエラー監視開始
   * キャッシュ効率ログを本番に展開

2. **本番環境で安定性確認**
   * [バッチAPIテストページ](https://safe-yields.vercel.app/test-api-batch) にて挙動確認
   * パフォーマンスメトリクス収集

3. **Phase 2.3 に進行**
   * 新規プロトコル追加と最適化

## 📝 Issue管理

### 完了済み
```
Issue #16: ✅ Lido API実装
Issue #17: ✅ Rocket Pool追加
Issue #18: ✅ Aave V3追加
Issue #19: ✅ Compound V3追加
Issue #20: ✅ Curve Finance追加
Issue #21: ✅ バッチAPI最適化
```

### 計画中
```
Issue #22: ⚠️ モニタリング導入
Issue #23: 📋 追加10プロトコル実装
```

---

## 📊 現状サマリー

* **Phase 2.1**: ✅ 完了（5プロトコル実装済み）
* **Phase 2.2**: ✅ 完了（バッチAPI最適化済み）
* **Phase 2.2.1**: ⚠️ 未実装（モニタリング導入待ち）
* **Phase 2.3**: 📋 計画中

### パフォーマンス指標
* レスポンス時間: < 500ms ✅
* キャッシュヒット率: > 80% ✅
* APIリクエスト削減: 80% ✅
* エラー率: < 1% ✅

---

*最終更新: 2025年1月15日*