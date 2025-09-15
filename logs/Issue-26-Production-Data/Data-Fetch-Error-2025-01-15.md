# Production Data Fetch Error - 2025-01-15

## 問題概要
本番環境（Vercel）でLido詳細ページのデータが取得できていない。静的データ（description, website等）は表示されるが、動的データ（APY, TVL, name）が表示されない。

## 症状
- APY: N/A（取得失敗）
- TVL: N/A（取得失敗）
- Safety Score: 95/100（静的データから表示）
- Name: 表示されない（"Protocol"がデフォルト表示）
- Description: 正常表示（静的データから）

## HTMLの分析
```html
<h1 class="text-4xl font-bold mb-8">Protocol</h1>  <!-- nameが取得できていない -->
<div class="text-2xl font-bold text-green-400">N/A</div>  <!-- APY取得失敗 -->
<div class="text-2xl font-bold">N/A</div>  <!-- TVL取得失敗 -->
<div class="text-2xl font-bold">95/100</div>  <!-- Safety Score（静的データ） -->
```

## 原因分析

### 1. 現在の実装の問題点
`lib/protocols/index.ts`で以下のロジックを使用：
```typescript
const isProduction = process.env.NODE_ENV === 'production';
```

しかし、Next.jsのSSG（Static Site Generation）では、ビルド時に`NODE_ENV`は`production`になるが、
ビルド時にAPIエンドポイントが利用できない可能性がある。

### 2. generateStaticParams の影響
```typescript
export async function generateStaticParams() {
  return [{ id: 'lido' }];
}
```
これによりビルド時に静的ページが生成されるが、その時点でAPIが呼び出せない。

## 解決策

### 案1: ISR（Incremental Static Regeneration）を使用
```typescript
export const revalidate = 60; // 60秒ごとに再生成
```

### 案2: 動的レンダリングに変更
```typescript
export const dynamic = 'force-dynamic';
```

### 案3: クライアントサイドでのデータフェッチ
Server Componentではなく、Client Componentでデータを取得する。

## 実装した修正

### 1. 動的レンダリングの強制
`app/protocols/[id]/page.tsx`に以下を追加：
```typescript
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

### 2. API URL構築の改善
`lib/protocols/index.ts`を修正：
- Vercel環境変数`VERCEL_URL`を使用
- 完全なURLを構築してAPIを呼び出す
- 詳細なデバッグログを追加

### 3. エラーハンドリングの改善
- レスポンスボディのログ出力
- 環境変数の状態をログ出力

## 期待される効果
- 本番環境でリアルタイムにAPIが呼び出される
- `VERCEL_URL`を使用して正しいAPIエンドポイントにアクセス
- デバッグログでトラブルシューティングが容易に