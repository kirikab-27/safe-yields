# TypeScript Build Error - Issue #36

## エラー概要
**発生日**: 2025-09-19
**Issue番号**: #36 (Gas Calculator実装)
**エラータイプ**: TypeScript型エラー
**影響**: Vercelデプロイ失敗

## エラー内容
```
Type error: Type 'null' is not assignable to type 'number'.
  96 |         },
  97 |         'compound-v3': {
> 98 |           fallbackApy: null  // No estimated values for Compound V3
     |           ^
  99 |         },
  100 |         'curve': {
```

## 原因
`app/api/protocols/batch/route.ts`でCompound V3のfallbackApyをnullに設定したが、型定義が`number`のみを期待していたため。

## 解決策
1. `endpoints`オブジェクトの型定義を`fallbackApy: number`から`fallbackApy: number | null`に変更
2. `ProtocolData`インターフェースの`apy`フィールドを`number`から`number | null`に変更

## 実装内容
```typescript
// 変更前
const endpoints: { [key: string]: { protocol: string; pools: string; fallbackApy: number } }

// 変更後
const endpoints: { [key: string]: { protocol: string; pools: string; fallbackApy: number | null } }

// 変更前
interface ProtocolData {
  apy: number;
}

// 変更後
interface ProtocolData {
  apy: number | null;
}
```

## 関連ファイル
- `app/api/protocols/batch/route.ts` (修正済み)

## 追加エラー (21:01)
```
Type error: 'apy' is possibly 'null'.
  163 | apy = Math.round(apy * 100) / 100;
```

### 追加修正
`apy`変数がnullの可能性があるため、計算前にnullチェックを追加:
```typescript
if (apy !== null) {
  apy = Math.round(apy * 100) / 100;
}
```

## 追加エラー2 (21:07)
```
Type error: 'data.apy' is possibly 'null'.
  48 | const apy = data ? data.apy.toFixed(1) : staticData.apy;
```

### 追加修正2
`page-optimized.tsx`でもnullチェックを追加:
```typescript
const apy = data?.apy !== null && data?.apy !== undefined
  ? data.apy.toFixed(1)
  : staticData.apy;
```

## 追加エラー3 (21:10)
```
Type error: Property 'apyRange' does not exist on type
  298 | {protocol.apyRange && protocol.apyRange.min > 0 && (
```

### 追加修正3
`protocols/[id]/page.tsx`で`apyRange`プロパティの存在チェックを追加:
```typescript
{'apyRange' in protocol && protocol.apyRange &&
 typeof protocol.apyRange === 'object' &&
 'min' in protocol.apyRange &&
 protocol.apyRange.min > 0 && (
```

## 追加エラー4 (21:13)
```
Type error: 'data.apy' is possibly 'null'.
  208 | {data.apy.toFixed(2)}%
```

### 追加修正4
`test-api-batch/page.tsx`でもnullチェックを追加:
```typescript
{data.apy !== null ? `${data.apy.toFixed(2)}%` : '--'}
```

## テスト結果
- ローカルビルドテスト: ✅ 成功
- TypeScriptコンパイル: ✅ エラー解消 (5回目)
- Vercelデプロイ: 🔄 再実行中

## 修正概要
null許容型への変更により発生したすべてのTypeScriptエラーを修正完了。
主要な変更点：
1. 型定義を`number | null`に更新
2. すべてのAPY表示箇所でnullチェック追加
3. 推定値の削除（Compound V3）

## 今後の対応
1. Vercelへの再デプロイ実行
2. デプロイ成功確認
3. ライブ環境での動作確認

## 備考
この修正により、Compound V3のAPYがデータ取得できない場合に推定値(2.8%)を表示せず、"--"を表示する仕様が正しく実装される。