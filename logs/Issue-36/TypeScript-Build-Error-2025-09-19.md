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

## テスト結果
- ローカルビルドテスト: ✅ 成功
- TypeScriptコンパイル: ✅ エラー解消 (2回目)
- Vercelデプロイ: 🔄 再実行中

## 今後の対応
1. Vercelへの再デプロイ実行
2. デプロイ成功確認
3. ライブ環境での動作確認

## 備考
この修正により、Compound V3のAPYがデータ取得できない場合に推定値(2.8%)を表示せず、"--"を表示する仕様が正しく実装される。