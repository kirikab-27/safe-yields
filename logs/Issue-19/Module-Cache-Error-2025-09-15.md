# モジュールキャッシュエラーログ

## 発生日時
2025-09-15

## Issue番号
Issue #19 (Compound V3 API実装)

## エラー概要
Next.js開発サーバーでwebpack-runtimeモジュール読み込みエラーが再発

## エラー詳細

### エラーメッセージ
```
Error: Cannot find module './948.js'
Require stack:
- C:\Users\masas\Documents\Projects\safe-yields\.next\server\webpack-runtime.js
- C:\Users\masas\Documents\Projects\safe-yields\.next\server\pages\_document.js
```

### 発生タイミング
- Compound V3実装後
- 開発サーバー稼働中にページアクセス時

### 原因
- Next.jsのビルドキャッシュの破損
- webpack-runtimeの不整合
- ホットリロード中のモジュール参照エラー
- 複数のコンポーネント追加によるキャッシュ競合

## 解決策

### 手順1: 開発サーバー停止
```bash
# 既存の開発サーバーを停止
# ポート3002で稼働中のサーバーを終了
```

### 手順2: ビルドキャッシュ完全クリア
```bash
# .nextフォルダを削除
rm -rf .next

# Windows の場合
rmdir /s /q .next
```

### 手順3: 開発サーバー再起動
```bash
# 新しいポートで再起動
npm run dev
```

### 手順4: 動作確認
```bash
# APIエンドポイント確認
curl http://localhost:3000/api/protocols/compound-v3
```

## 環境情報
- Next.js: 14.2.5
- Node.js: v18以上
- OS: Windows (MINGW64)
- ポート: 3002（3000, 3001が使用中）

## 関連ファイル
- .next/server/webpack-runtime.js
- .next/server/pages/_document.js
- .next/server/app/page.js

## ステータス
- [x] 開発サーバー停止
- [x] .nextフォルダ削除
- [x] 開発サーバー再起動
- [x] エラー解消確認

## 解決完了
- 日時: 2025-09-15 08:47
- ポート: 3003（3000-3002が使用中のため）
- API動作確認: ✅ 正常動作
- Compound V3 API: 正常レスポンス確認

## 予防策
- 大きな変更後は.nextキャッシュをクリア
- 開発サーバーの定期的な再起動
- ポート競合の回避

## 備考
- これはNext.jsの既知の問題
- プロダクションビルドには影響なし
- コード変更は不要、キャッシュクリアで解決