# Safe Yields - プロジェクト仕様書

## 🎯 プロジェクト概要

**Safe Yields（セーフ・イールズ）** は、安全性を重視したDeFiプロトコルのディレクトリサービスです。
ユーザーが検証済みの利回りを見つけ、詐欺を回避できるよう支援します。

- **ドメイン**: safe-yields.com（取得済み、DNS伝播中）
- **ターゲット**: 英語圏のDeFi投資家
- **MVP目標**: 2-3時間以内にローンチ、1週間で1000ユーザー獲得
- **収益目標**: 3ヶ月以内に月額$3,000達成

## 🏗️ 現在の状況

- [x] ドメイン取得完了（safe-yields.com）
- [x] Next.jsプロジェクト初期化完了
- [ ] MVP開発
- [ ] Vercelデプロイ
- [ ] ドメイン接続

## 💻 技術スタック

```yaml
フレームワーク: Next.js 15.5.3
言語: TypeScript
スタイリング: Tailwind CSS v4
データベース: なし（MVPはJSONファイル使用）
デプロイ: Vercel
分析: Google Analytics 4（後で追加）
```

## 📁 プロジェクト構造

```
safe-yields/
├── app/                    # Next.js App Router
│   ├── page.tsx           # ホームページ（メイン）
│   ├── layout.tsx         # ルートレイアウト（メタデータ含む）
│   └── globals.css        # グローバルスタイル
├── components/            # Reactコンポーネント
│   ├── ProtocolCard.tsx  # プロトコル表示カード
│   ├── FilterBar.tsx     # カテゴリー/チェーン/リスクフィルター
│   ├── SearchBar.tsx     # プロトコル検索
│   └── EmailCapture.tsx  # メールリスト構築
├── data/                  # 静的データファイル
│   └── protocols.json    # プロトコルデータ（MVP用）
├── types/                 # TypeScript型定義
│   └── protocol.ts       # プロトコルインターフェース
├── lib/                   # ユーティリティ関数
│   └── data.ts          # データ取得関数
└── public/               # 静的アセット
```

## 🎨 デザインシステム

### カラーパレット

- **プライマリ**: Green 400/500（安全性を表現）
- **背景**: Black/Gray 900（ダークテーマ）
- **テキスト**: White/Gray 400
- **アクセント**: Yellow（APY）、Red（リスク）

### UI原則

- ダークテーマ（DeFi標準）
- 最小限のUIで最大限の情報密度
- モバイルレスポンシブ
- CTAにグラデーション
- カードにホバーエフェクト

## 📋 開発ガイドライン

### コードスタイル

- TypeScriptで関数コンポーネントを使用
- 必要な場合のみ 'use client' を使用
- コンポーネントは小さく、単一責任に
- カスタムCSSは避け、Tailwindクラスを使用

### ログファイル管理

- **ログディレクトリ構造**: `logs/Issue-{番号}/`
- **命名規則**: `{エラータイプ}-{日付}.md`
- **例**: `logs/Issue-18/Module-Error-2025-09-15.md`
- 各Issueごとに専用のログディレクトリを作成
- エラーログは必ず対応するIssue番号のディレクトリに保存
- ログファイルには解決策と手順を明記

### データ管理

- MVP: `/data`内のJSONファイル
- Week 2: Supabaseに移行
- すべてのデータ取得は `/lib/data.ts` 経由

### 状態管理

- Reactフック（useState、useMemo）を使用
- MVPでは外部状態管理ライブラリなし
- フィルター状態は親コンポーネントで管理

### パフォーマンス

- 画像の遅延読み込み
- フィルター結果のメモ化
- バンドルサイズ最小化

## 🚀 MVP要件

### 必須機能（今日中）

- [ ] 10個以上のプロトコル表示
- [ ] 安全性スコア表示（0-100）
- [ ] APYとTVL表示
- [ ] カテゴリーフィルター（Lending、DEX、Yield等）
- [ ] チェーンフィルター（Ethereum、BSC、Arbitrum等）
- [ ] リスクレベルフィルター（LOW、MEDIUM、HIGH）
- [ ] プロトコル名検索
- [ ] モバイルレスポンシブ
- [ ] メール収集フォーム
- [ ] 免責事項（「Not Financial Advice」）

### Nice to Have（後で追加）

- プロトコル詳細ページ
- ソート機能（APY、TVL、安全性）
- ライトテーマ
- 多言語対応
- リアルタイムデータ更新
- ユーザー認証
- お気に入り機能

## 🛠️ 開発コマンド

```bash
# 開発
npm run dev          # 開発サーバー起動（localhost:3000）

# ビルド
npm run build        # プロダクションビルド
npm run start        # プロダクションサーバー起動

# デプロイ
git add .
git commit -m "コミットメッセージ"
git push
# Vercelに自動デプロイされる
```

## 📊 データスキーマ

```typescript
interface Protocol {
  id: number;
  name: string;
  website: string;
  category: 'Lending' | 'DEX' | 'Yield' | 'Staking' | 'Bridge' | 'Perpetuals';
  chain: string;
  tvl: string;
  apy: string;
  safetyScore: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  audits: string[];
  verified: boolean;
  // 完全なスキーマは types/protocol.ts 参照
}
```

## 🔧 技術的な重要事項

### Next.js App Routerでの外部API呼び出し

**問題**: Server Componentsから内部APIルート（`/api/*`）を相対パスで呼び出すと、本番環境で失敗する。

**解決策**:
1. **推奨**: Server Componentsから外部API（DeFiLlama等）を直接呼び出す
2. **代替**: 内部APIを使う場合は絶対URLを構築する必要がある

**実装例**:
```typescript
// ✅ 推奨: 外部APIを直接呼び出し
async function fetchProtocolData(id: string) {
  const res = await fetch(`https://api.llama.fi/protocol/${id}`, {
    cache: 'no-store',
    next: { revalidate: 0 }
  });
  return res.json();
}

// ❌ 避ける: 相対パスでの内部API呼び出し
const res = await fetch('/api/protocols/lido');  // 本番で失敗

// ⚠️ 必要な場合: 絶対URLを構築
const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';
const res = await fetch(`${baseUrl}/api/protocols/lido`);
```

### TypeScript型定義の一貫性

静的データと動的データをマージする場合、両方の型定義を一致させる必要がある:

```typescript
// 静的データの型定義
type StaticProtocolData = {
  name: string;
  description: string;
  website: string;
  docs: string;
  audit: string;
  safetyScore: number;
  apy?: number;    // オプショナル（APIから取得）
  tvl?: number;     // オプショナル（APIから取得）
}
```

## 🚨 重要な注意事項

### 法的/コンプライアンス

- 常に「投資助言ではありません」を表示
- リターンや安全性を保証しない
- 「DYOR」（自己責任で調査）メッセージを含める
- 外部リンクは新規タブで開く

### SEO最適化

- タイトル: "Safe Yields - Find Verified DeFi Yields & Skip Scams"
- 重要キーワード: safe yields、DeFi safety、verified protocols
- 全ページにメタディスクリプション
- ソーシャル共有用のOpenGraphタグ

### 将来の拡張性

- DB移行パス準備済み（JSON → Supabase）
- 詳細ページ追加可能な構造
- 新カテゴリー追加可能なフィルター
- ニュースレターサービス統合準備済み

## 🎯 現在のタスク

**MVP開発フェーズ**

1. デフォルトのNext.jsファイルをクリーンアップ
2. データ構造とモックデータ作成
3. コンポーネント構築（ProtocolCard、Filters、Search）
4. 全機能を含むホームページ実装
5. レスポンシブデザインのテスト
6. Vercelにデプロイ
7. ドメイン接続

## 📈 成功指標

- **1日目**: サイト公開、100訪問者
- **1週間目**: 1,000ユニーク訪問者
- **1ヶ月目**: 10,000訪問者、初収益
- **3ヶ月目**: 月額$3,000収益

## 🔗 リソース

- **デザイン参考**: DeFi Llama、DeFi Pulse
- **データソース**: 手動入力 → DeFi Llama API
- **デプロイ**: Vercel（mainブランチから自動）
- **ドメイン**: Cloudflare DNS → Vercel

## 💬 連絡先

**プロジェクトオーナー**: [あなたのGitHubユーザー名]
**Twitter**: @SafeYields（作成予定）
**Email**: admin@safe-yields.com（設定予定）

---

## 新しいセッションでのクイックスタート

1. このドキュメントを完全に読む
2. 現在のブランチと最新のコミットを確認
3. `npm run dev` で現在の状態を確認
4. 「現在のタスク」セクションから続行
5. 説明的なメッセージで頻繁にコミット
6. 不明点があれば質問する

## 重要な方針

- **完璧より速度** - まずMVP、改善は後で
- **ユーザーの安全重視** - これが独自の価値提案
- **モバイルファースト** - DeFiユーザーの多くはモバイル
- **シンプルに保つ** - 複雑さは後で追加

## トラブルシューティング

**Q: npm run devでエラー**
A: `npm install` 実行、Node.js v18以上確認

**Q: Tailwind CSSが機能しない**
A: `tailwind.config.js` でコンテンツパス確認

**Q: データが表示されない**
A: `/data/protocols.json` の存在とフォーマット確認

**Q: Vercelデプロイ失敗**
A: ビルドエラー確認、環境変数チェック

## よくある質問

**Q: なぜDBを使わない？**
A: MVP速度優先。10-20プロトコルならJSONで十分。

**Q: 10プロトコルで十分？**
A: MVP段階では十分。動作確認後、すぐ追加する。

**Q: デザインが地味では？**
A: 信頼性重視のデザイン。派手さより見やすさ。

---

最終更新: 2025年9月14日