# Vercelデプロイエラーログ

## 発生日時
2025-09-15 23:13:06 JST

## エラー概要
TypeScriptコンパイルエラーによりVercelデプロイが失敗

## エラー詳細

### エラーメッセージ
```
./components/LidoCard.tsx:152:18
Type error: 'data.chains.length' is possibly 'undefined'.

  150 |             <div className="flex gap-2 mb-3">
  151 |               <span className="px-2 py-1 bg-gray-800 rounded-lg text-xs text-gray-300">
> 152 |                 {data?.chains?.length > 1 ? 'Multi-chain' : staticData.chain}
      |                  ^
  153 |               </span>
```

### 原因
- `data.chains`がundefinedの可能性があるのに、`.length`プロパティにアクセスしている
- TypeScript strict modeでのnullチェック不足

## 解決策

### 修正前
```typescript
{data?.chains?.length > 1 ? 'Multi-chain' : staticData.chain}
```

### 修正後
```typescript
{data?.chains && data.chains.length > 1 ? 'Multi-chain' : staticData.chain}
```

または

```typescript
{(data?.chains?.length ?? 0) > 1 ? 'Multi-chain' : staticData.chain}
```

## ビルド環境
- Vercel CLI: 47.1.1
- Next.js: 14.2.5
- Build location: Washington, D.C., USA (East) – iad1
- Build machine: 2 cores, 8 GB

## 関連ファイル
- components/LidoCard.tsx (line 152)

## 対処手順
1. LidoCard.tsxの152行目を修正
2. ローカルでビルド確認 (`npm run build`)
3. コミット＆プッシュ
4. Vercel再デプロイ

## ステータス
- [ ] エラー修正
- [ ] ローカルビルド確認
- [ ] 再デプロイ