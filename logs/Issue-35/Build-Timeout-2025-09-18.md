# Issue #35 - Build Timeout Error
**Date**: 2025-09-18
**Time**: 21:30 UTC
**Environment**: Vercel Production Build

## エラー概要
Curveページの静的生成がタイムアウトし、3回のリトライ後もビルドが失敗しました。

## エラーメッセージ
```
Error: Static page generation for /protocols/curve is still timing out after 3 attempts.
See more info here https://nextjs.org/docs/messages/static-page-generation-timeout
```

## 詳細ログ

### タイムアウトシーケンス
1. **初回タイムアウト** (21:32:16)
   - 60秒後にSIGTERMシグナル送信
   - ワーカープロセス終了

2. **1回目リトライ** (21:32:17)
   - 再度60秒後にタイムアウト

3. **2回目リトライ** (21:33:17)
   - 再度60秒後にタイムアウト

4. **3回目リトライ** (21:34:17)
   - 最終的にビルド失敗

### 問題のあるページ
- `/protocols/curve` - DeFiLlama APIへのフェッチ中にタイムアウト

### 他のページのビルド状況
- ✅ `/protocols/lido` - 正常にビルド完了
- ✅ `/protocols/rocket-pool` - 正常にビルド完了
- ✅ `/protocols/aave-v3` - 正常にビルド完了
- ✅ `/protocols/compound-v3` - 正常にビルド完了
- ❌ `/protocols/curve` - タイムアウト

## 原因分析

### 考えられる原因
1. **DeFiLlama API応答遅延**
   - Curve-DEXのデータ取得時に応答が極めて遅い
   - APIエンドポイント: `https://api.llama.fi/protocol/curve-dex`

2. **データ処理の重さ**
   - Curveは多数のチェーンに展開されており、データ量が多い可能性

3. **無限ループの可能性**
   - getProtocolBySlug関数でのデータ取得時に問題がある可能性

## 解決策

### 即座の修正
```typescript
// app/protocols/[id]/page.tsxの修正

// タイムアウトを設定
const fetchWithTimeout = async (url: string, timeout = 30000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 60 }
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

// フォールバックデータの使用を強化
async function fetchProtocolData(id: string) {
  try {
    const defiLlamaId = protocolMapping[id];
    if (!defiLlamaId) {
      return null;
    }

    const protoUrl = `https://api.llama.fi/protocol/${defiLlamaId}`;

    // タイムアウト付きフェッチ
    const res = await fetchWithTimeout(protoUrl, 15000); // 15秒タイムアウト

    if (res.ok) {
      // データ処理...
    }
  } catch (error) {
    console.error(`[Page] Failed to fetch data for ${id}:`, error);
    // フォールバックデータを返す
    return {
      id,
      name: protocolConfig[id]?.name || id,
      apy: fallbackAPY[id] || 0,
      tvl: protocolConfig[id]?.fallbackData?.tvl || 0,
      chains: protocolConfig[id]?.chains || [],
      error: true
    };
  }
}
```

### 長期的な解決策
1. **ISRの最適化**
   - revalidate時間を延長（60秒 → 300秒）
   - オンデマンドISRの実装

2. **データキャッシュの実装**
   - Redisなどでデータをキャッシュ
   - APIコールの削減

3. **ビルド時データフェッチの分離**
   - 静的データとして事前に取得
   - ビルド時にはAPIコールを行わない

## 実装した修正
上記の即座の修正を実装し、タイムアウト処理とフォールバックを強化しました。

## テスト結果
ローカルでのビルドテストで問題なく完了することを確認しました。

## 参考リンク
- [Next.js Static Generation Timeout](https://nextjs.org/docs/messages/static-page-generation-timeout)
- [Vercel Function Timeout Limits](https://vercel.com/docs/functions/runtimes#timeout)