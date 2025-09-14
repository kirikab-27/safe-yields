# モジュールエラーログ

## 発生日時
2025-09-15

## エラー概要
Next.js開発サーバーでモジュール読み込みエラーが発生

## エラー詳細

### エラーメッセージ
```
Error: Cannot find module './948.js'
Require stack:
- C:\Users\masas\Documents\Projects\safe-yields\.next\server\webpack-runtime.js
- C:\Users\masas\Documents\Projects\safe-yields\.next\server\app\favicon.ico\route.js
```

### 原因
- Next.jsのビルドキャッシュの破損
- webpack-runtimeの不整合
- 開発サーバーのホットリロード問題

## 解決策

### 手順1: 開発サーバー停止
```bash
# Ctrl+C で開発サーバーを停止
```

### 手順2: ビルドキャッシュクリア
```bash
# .nextフォルダを削除
rm -rf .next

# または Windows の場合
rmdir /s /q .next
```

### 手順3: node_modules再インストール（オプション）
```bash
# 必要に応じて
rm -rf node_modules package-lock.json
npm install
```

### 手順4: 開発サーバー再起動
```bash
npm run dev
```

## 環境情報
- Next.js: 14.2.5
- Node.js: v18以上
- OS: Windows

## 関連ファイル
- .next/server/webpack-runtime.js
- .next/server/app/favicon.ico/route.js

## ステータス
- [x] .nextフォルダ削除
- [x] 開発サーバー再起動
- [x] エラー解消確認

## 解決完了
- 日時: 2025-09-15 08:24
- ポート: 3002（3000, 3001が使用中のため）
- API動作確認: ✅ 正常動作

## 備考
- これはNext.jsの一般的なキャッシュ問題
- プロダクションビルドには影響なし
- コード変更は不要