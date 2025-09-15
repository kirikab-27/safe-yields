# Navigation 404 Error - 2025-01-15

## エラー概要
Lido詳細ページ（`/protocols/lido`）からハンバーガーメニューでHomeをクリックすると、`http://localhost:3000/`へのリクエストで404エラーが発生。

## エラー詳細
```
GET http://localhost:3000/ 404 (Not Found)
Failed to load resource: the server responded with a status of 404 (Not Found)
```

## 原因分析
1. 開発サーバーがポート3010で動作しているが、リンクがポート3000を指している
2. ハンバーガーメニューの実装が存在しない可能性がある
3. 詳細ページのナビゲーションリンクが相対パスではなく絶対パスを使用している可能性

## 調査結果
- 現在の開発サーバー: `http://localhost:3010`
- エラーのリクエスト先: `http://localhost:3000`
- `/protocols/[id]/page.tsx`内のナビゲーションは`href="/"`で相対パスを使用

## 問題の特定
詳細ページ（`/protocols/[id]/page.tsx`）にはハンバーガーメニューの実装が存在しない。
パンくずリストのHomeリンクは正常に動作するはず。

## 解決策
1. ハンバーガーメニューは実装されていないため、エラーの原因は別の場所にある可能性
2. ブラウザの開発者ツールで確認が必要
3. 現在のナビゲーションリンクは適切に設定されている

## 実装状況
- パンくずリスト: ✅ 実装済み（`<a href="/">Home</a>`）
- ハンバーガーメニュー: ❌ 未実装

## 修正実施
### 1. `lib/protocols/index.ts`の修正
ハードコードされた`localhost:3000`を動的に取得するよう修正：
```typescript
// 修正前
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// 修正後
const baseUrl = typeof window === 'undefined'
  ? `http://localhost:${process.env.PORT || 3000}`
  : '';
const apiUrl = process.env.NEXT_PUBLIC_API_URL || baseUrl;
```

## 追加調査事項
- エラーメッセージ`(index):5`は、ブラウザの拡張機能または外部スクリプトから発生している可能性がある
- 詳細ページのパンくずリストは正常に動作するはず
- ハンバーガーメニューは実装されていないため、ユーザーが言及した「ハンバーガーメニュー」は別の要素の可能性がある