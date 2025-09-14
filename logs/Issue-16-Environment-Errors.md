# エラーログ: 環境設定関連エラー

## 発生日時
2025-09-14

## エラー概要
Next.js 14への移行後、以下のエラーが発生：
1. フォント関連エラー（Geist, Geist Mono）
2. コンポーネントファイル未検出エラー（HeroSection, SearchFilters）

## エラー詳細

### 1. フォントエラー
```
NextFontError: Unknown font `Geist`
NextFontError: Unknown font `Geist Mono`
```

**原因**:
- Next.js 15で利用可能なGeistフォントがNext.js 14では未対応
- layout.tsxで `Geist, Geist_Mono` をGoogle Fontsからインポートしようとしている

**解決策**:
```typescript
// 修正前（エラー）
import { Geist, Geist_Mono } from "next/font/google";

// 修正後（正常）
import { Inter } from "next/font/google";
```

### 2. コンポーネントファイル未検出エラー
```
Error: Failed to read source code from C:\Users\masas\Documents\Projects\safe-yields\components\HeroSection.tsx
Error: Failed to read source code from C:\Users\masas\Documents\Projects\safe-yields\components\SearchFilters.tsx
```

**原因**:
- ブランチ切り替え時にファイルが存在しない
- git stashやブランチマージの問題

**解決策**:
1. 現在のブランチ確認
2. 必要なファイルの存在確認
3. 不足ファイルの復元または再作成

## 対処手順

### ステップ1: フォント修正
```bash
# layout.tsxを編集してInterフォントに変更
```

### ステップ2: コンポーネントファイル確認
```bash
# ファイル存在確認
ls components/

# 不足している場合、mainブランチから取得
git checkout main -- components/HeroSection.tsx
git checkout main -- components/SearchFilters.tsx
```

### ステップ3: 依存関係の再インストール
```bash
# クリーンインストール
rm -rf node_modules package-lock.json
npm install
```

### ステップ4: 開発サーバー再起動
```bash
npm run dev
```

## 現在の状態
- layout.tsx: ✅ Interフォントに修正済み
- コンポーネントファイル: ✅ 全ファイル存在確認済み
- ビルド状態: ✅ 正常動作確認
- 開発サーバー: ✅ http://localhost:3000 で正常稼働

## 推奨アクション
1. コンポーネントファイルの存在確認
2. 不足ファイルの復元
3. 開発サーバーでの動作確認

## 関連Issue
- Issue #16: Lido API実装（現在作業中）
- Issue #14: 環境安定化（Next.js 14へのダウングレード）- 完了済み

## 備考
- Next.js 14と15の互換性問題に注意
- フォント選択はNext.jsバージョンに依存
- ブランチ切り替え時は必ずファイル存在を確認