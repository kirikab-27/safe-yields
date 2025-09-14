# 📋 **Safe Yields MVP - Claude Code向け要件定義書 v2.0**

## **🎯 プロジェクト概要**

```yaml
プロジェクト名: Safe Yields
ドメイン: safe-yields.com（取得済み）
技術スタック:
  - Next.js 15.5.3
  - TypeScript
  - Tailwind CSS v4
  - データ: JSONファイル（DB不使用）

MVP目標:
  - 開発期間: 2-3時間
  - 公開: 今日中
  - 初週目標: 1000ユーザー獲得

ターゲット: 英語圏のDeFi投資家
焦点: 安全性重視の利回り情報提供
```

---

## **📁 1. ファイル構造**

```
safe-yields/
├── app/
│   ├── page.tsx           # ホームページ
│   ├── layout.tsx         # レイアウト（メタデータ）
│   ├── globals.css        # グローバルCSS
│   └── favicon.ico        # ファビコン
├── components/
│   ├── ProtocolCard.tsx   # プロトコルカード
│   ├── FilterBar.tsx      # フィルターバー
│   ├── SearchBar.tsx      # 検索バー
│   └── EmailCapture.tsx   # メール収集
├── data/
│   └── protocols.json     # プロトコルデータ
├── lib/
│   └── data.ts           # データ取得関数
├── types/
│   └── protocol.ts       # 型定義
└── public/
    └── (画像ファイルなど)
```

---

## **📝 2. データ構造定義**

### **types/protocol.ts**

```typescript
export interface Protocol {
  // 基本情報
  id: number;
  name: string;
  website: string;
  description?: string;

  // カテゴリとチェーン
  category: string;
  chain: string;

  // 財務指標
  tvl: string;             // 表示用の文字列
  tvlNumber: number;       // ソート用の数値
  apy: string;             // 表示用の文字列 例: "4.5"
  apyNumber: number;       // ソート用の数値

  // 安全性
  safetyScore: number;     // 0-100
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  audits: string[];        // ["CertiK", "Trail of Bits"]
  hasInsurance: boolean;
  hasBugBounty: boolean;
  verified: boolean;
  incidentHistory: boolean; // 過去にハッキングがあったか

  // 更新情報
  lastUpdated: string;     // ISO日付
  dataSource: string;      // "Manual" or "DeFi Llama"
}

export interface FilterOptions {
  category: string;
  chain: string;
  risk: string;
  searchQuery: string;
}
```

---

## **🗂️ 3. データファイル**

### **data/protocols.json**

```json
[
  {
    "id": 1,
    "name": "Aave V3",
    "website": "https://aave.com",
    "description": "Leading lending protocol with multi-chain support",
    "category": "Lending",
    "chain": "Ethereum",
    "tvl": "5200000000",
    "tvlNumber": 5200000000,
    "apy": "4.5",
    "apyNumber": 4.5,
    "safetyScore": 95,
    "risk": "LOW",
    "audits": ["CertiK", "Trail of Bits", "OpenZeppelin"],
    "hasInsurance": true,
    "hasBugBounty": true,
    "verified": true,
    "incidentHistory": false,
    "lastUpdated": "2025-01-11",
    "dataSource": "Manual"
  },
  {
    "id": 2,
    "name": "Compound V3",
    "website": "https://compound.finance",
    "description": "Autonomous interest rate protocol",
    "category": "Lending",
    "chain": "Ethereum",
    "tvl": "2100000000",
    "tvlNumber": 2100000000,
    "apy": "3.8",
    "apyNumber": 3.8,
    "safetyScore": 92,
    "risk": "LOW",
    "audits": ["OpenZeppelin", "CertiK"],
    "hasInsurance": false,
    "hasBugBounty": true,
    "verified": true,
    "incidentHistory": false,
    "lastUpdated": "2025-01-11",
    "dataSource": "Manual"
  }
]
```

**注: 最低10個のプロトコルを含める（Aave, Compound, Curve, Uniswap, GMX, Lido, Yearn, Convex, Stargate, PancakeSwap）**

---

## **🎨 4. UIコンポーネント実装**

### **app/page.tsx - メインページ**

```typescript
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Protocol, FilterOptions } from '@/types/protocol';
import ProtocolCard from '@/components/ProtocolCard';
import FilterBar from '@/components/FilterBar';
import SearchBar from '@/components/SearchBar';
import EmailCapture from '@/components/EmailCapture';
import protocolsData from '@/data/protocols.json';

export default function Home() {
  const [protocols] = useState<Protocol[]>(protocolsData);
  const [filters, setFilters] = useState<FilterOptions>({
    category: 'All',
    chain: 'All',
    risk: 'All',
    searchQuery: ''
  });

  // フィルター適用
  const filteredProtocols = useMemo(() => {
    return protocols.filter(protocol => {
      if (filters.category !== 'All' && protocol.category !== filters.category) return false;
      if (filters.chain !== 'All' && protocol.chain !== filters.chain) return false;
      if (filters.risk !== 'All' && protocol.risk !== filters.risk) return false;
      if (filters.searchQuery && !protocol.name.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [protocols, filters]);

  // 統計計算
  const stats = useMemo(() => {
    const totalTVL = filteredProtocols.reduce((sum, p) => sum + p.tvlNumber, 0);
    const avgAPY = filteredProtocols.reduce((sum, p) => sum + p.apyNumber, 0) / filteredProtocols.length || 0;
    return {
      protocolCount: filteredProtocols.length,
      totalTVL: (totalTVL / 1000000000).toFixed(1),
      avgAPY: avgAPY.toFixed(1)
    };
  }, [filteredProtocols]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ヘッダー */}
      <header className="border-b border-green-900/20 bg-black/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🛡️</span>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                Safe Yields
              </h1>
            </div>
            <p className="text-xs text-gray-500 hidden sm:block">
              Not Financial Advice. Always DYOR.
            </p>
          </div>
        </div>
      </header>

      {/* ヒーローセクション */}
      <section className="bg-gradient-to-b from-green-900/10 to-transparent">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Find Safe DeFi Yields.{" "}
            <span className="text-green-400">Skip the Scams.</span>
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Verified protocols only. Real APYs. Safety scores. No BS.
          </p>

          {/* 統計 */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
              <div className="text-2xl font-bold text-green-400">{stats.protocolCount}</div>
              <div className="text-xs text-gray-500">Verified Protocols</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
              <div className="text-2xl font-bold">${stats.totalTVL}B</div>
              <div className="text-xs text-gray-500">Total TVL</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
              <div className="text-2xl font-bold text-yellow-400">{stats.avgAPY}%</div>
              <div className="text-xs text-gray-500">Avg Safe APY</div>
            </div>
          </div>
        </div>
      </section>

      {/* 検索・フィルター */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <SearchBar value={filters.searchQuery} onChange={(value) => setFilters({...filters, searchQuery: value})} />
        <FilterBar filters={filters} onChange={setFilters} />
      </section>

      {/* プロトコルリスト */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid gap-4">
          {filteredProtocols.map((protocol) => (
            <ProtocolCard key={protocol.id} protocol={protocol} />
          ))}
        </div>

        {filteredProtocols.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No protocols found matching your criteria.
          </div>
        )}
      </main>

      {/* メール収集 */}
      <EmailCapture />
    </div>
  );
}
```

---

## **🔧 5. コンポーネント詳細**

### **components/ProtocolCard.tsx**

```typescript
import { Protocol } from '@/types/protocol';

interface Props {
  protocol: Protocol;
}

export default function ProtocolCard({ protocol }: Props) {
  const formatTVL = (tvl: string) => {
    const num = parseFloat(tvl);
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(0)}M`;
    return `${num.toLocaleString()}`;
  };

  const getRiskColor = (risk: string) => {
    switch(risk) {
      case 'LOW': return 'text-green-400';
      case 'MEDIUM': return 'text-yellow-400';
      case 'HIGH': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getSafetyColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800 hover:border-green-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold">{protocol.name}</h3>
            {protocol.verified && (
              <span className="text-green-400" title="Verified Protocol">✓</span>
            )}
            <a
              href={protocol.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-300"
            >
              ↗
            </a>
          </div>

          <div className="flex flex-wrap gap-2 text-sm text-gray-400 mb-3">
            <span className="px-2 py-1 bg-gray-800 rounded">
              {protocol.chain}
            </span>
            <span className="px-2 py-1 bg-gray-800 rounded">
              {protocol.category}
            </span>
            <span className="px-2 py-1 bg-gray-800 rounded">
              TVL: {formatTVL(protocol.tvl)}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {protocol.audits.map((audit) => (
              <span
                key={audit}
                className="text-xs px-2 py-1 bg-green-900/30 text-green-400 rounded border border-green-800/50"
              >
                ✓ {audit}
              </span>
            ))}
          </div>

          {protocol.description && (
            <p className="text-sm text-gray-500 mt-2">{protocol.description}</p>
          )}
        </div>

        <div className="flex gap-6 items-center">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">
              {protocol.apy}%
            </div>
            <div className="text-xs text-gray-500">APY</div>
          </div>

          <div className="text-center">
            <div className={`text-2xl font-bold ${getSafetyColor(protocol.safetyScore)}`}>
              {protocol.safetyScore}
            </div>
            <div className="text-xs text-gray-500">Safety</div>
            <div className={`text-xs mt-1 ${getRiskColor(protocol.risk)}`}>
              {protocol.risk} RISK
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mt-4 pt-4 border-t border-gray-800">
        {protocol.hasInsurance && (
          <span className="text-xs text-blue-400">🛡️ Insured</span>
        )}
        {protocol.hasBugBounty && (
          <span className="text-xs text-purple-400">🐛 Bug Bounty</span>
        )}
        {!protocol.incidentHistory && (
          <span className="text-xs text-green-400">✓ No Hacks</span>
        )}
      </div>
    </div>
  );
}
```

### **components/FilterBar.tsx**

```typescript
import { FilterOptions } from '@/types/protocol';

interface Props {
  filters: FilterOptions;
  onChange: (filters: FilterOptions) => void;
}

export default function FilterBar({ filters, onChange }: Props) {
  const categories = ['All', 'Lending', 'DEX', 'Yield', 'Staking', 'Bridge', 'Perpetuals'];
  const chains = ['All', 'Ethereum', 'BSC', 'Arbitrum', 'Polygon', 'Optimism'];
  const risks = ['All', 'LOW', 'MEDIUM', 'HIGH'];

  return (
    <div className="space-y-4">
      {/* カテゴリーフィルター */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-gray-500 py-2">Category:</span>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => onChange({...filters, category: cat})}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filters.category === cat
                ? 'bg-green-500 text-black'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* チェーンフィルター */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-gray-500 py-2">Chain:</span>
        {chains.map(chain => (
          <button
            key={chain}
            onClick={() => onChange({...filters, chain})}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filters.chain === chain
                ? 'bg-green-500 text-black'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {chain}
          </button>
        ))}
      </div>

      {/* リスクフィルター */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-gray-500 py-2">Risk Level:</span>
        {risks.map(risk => (
          <button
            key={risk}
            onClick={() => onChange({...filters, risk})}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filters.risk === risk
                ? 'bg-green-500 text-black'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {risk}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### **components/SearchBar.tsx**

```typescript
interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: Props) {
  return (
    <div className="mb-6">
      <input
        type="text"
        placeholder="Search protocols..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:border-green-500 focus:outline-none text-white placeholder-gray-500"
      />
    </div>
  );
}
```

### **components/EmailCapture.tsx**

```typescript
'use client';

import { useState } from 'react';

export default function EmailCapture() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    // TODO: 実際のメール送信処理
    // 今はFormspree or ConvertKit連携を後で実装
    setTimeout(() => {
      setStatus('success');
      setEmail('');
      setTimeout(() => setStatus('idle'), 3000);
    }, 1000);
  };

  return (
    <section className="bg-gradient-to-t from-green-900/10 to-transparent mt-20">
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Get Weekly Safety Reports
        </h2>
        <p className="text-gray-400 mb-8">
          New safe yields, scam alerts, and protocol updates. No spam.
        </p>

        <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:border-green-500 focus:outline-none"
            required
            disabled={status === 'loading'}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50"
          >
            {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>

        {status === 'success' && (
          <p className="text-green-400 mt-4">✓ Successfully subscribed!</p>
        )}
        {status === 'error' && (
          <p className="text-red-400 mt-4">Something went wrong. Please try again.</p>
        )}
      </div>
    </section>
  );
}
```

---

## **🔧 6. メタデータ設定**

### **app/layout.tsx**

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Safe Yields - Find Verified DeFi Yields & Skip Scams',
  description: 'Safety-first DeFi directory with verified protocols, real APYs, audit reports, and scam warnings. Find safe yields in DeFi.',
  keywords: 'DeFi, yield farming, safe yields, crypto audit, DeFi safety, APY, TVL, liquidity mining, verified protocols',

  openGraph: {
    title: 'Safe Yields - Find Verified DeFi Yields',
    description: 'Safety-first DeFi directory. Verified protocols only. Real APYs. Skip the scams.',
    url: 'https://safe-yields.com',
    siteName: 'Safe Yields',
    type: 'website',
    images: [
      {
        url: 'https://safe-yields.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Safe Yields - DeFi Safety Directory',
      }
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Safe Yields - Find Verified DeFi Yields',
    description: 'Safety-first DeFi directory. Verified protocols only.',
    creator: '@SafeYields',
    images: ['https://safe-yields.com/og-image.png'],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

---

## **🎨 7. スタイル設定**

### **app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  /* スクロールバーのカスタマイズ */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    @apply bg-gray-900;
  }

  ::-webkit-scrollbar-thumb {
    @apply bg-gray-700 rounded;
  }

  ::-webkit-scrollbar-thumb:hover {
    @apply bg-gray-600;
  }

  /* テキスト選択色 */
  ::selection {
    @apply bg-green-500/30 text-green-400;
  }
}
```

---

## **📋 8. 実装手順**

### **Claude Codeへの指示**

```markdown
以下の順番で実装してください：

1. 既存ファイルのクリーンアップ
   - app/page.tsx の中身を削除
   - app/globals.css を上記内容で更新
   - public/内の不要な画像削除

2. 型定義とデータ作成
   - types/protocol.ts 作成
   - data/protocols.json 作成（10個以上のプロトコル）

3. コンポーネント作成（順番通り）
   - components/ProtocolCard.tsx
   - components/FilterBar.tsx
   - components/SearchBar.tsx
   - components/EmailCapture.tsx

4. メインページ実装
   - app/page.tsx を上記コードで作成
   - app/layout.tsx を更新

5. 動作確認
   - npm run dev で起動
   - フィルター機能テスト
   - レスポンシブ確認

6. デプロイ準備
   - git add .
   - git commit -m "🚀 Launch Safe Yields MVP"
   - Vercelへデプロイ

各ステップ完了時に報告してください。
```

---

## **✅ 9. 完了チェックリスト**

```markdown
MVP完了条件：
□ 10個以上のプロトコル表示
□ 安全性スコアの可視化
□ APY/TVL表示
□ 3つのフィルター機能（カテゴリー、チェーン、リスク）
□ 検索機能
□ メール収集フォーム
□ モバイルレスポンシブ対応
□ SEOメタデータ設定
□ 免責事項表示
□ Vercelデプロイ完了
```

---

## **🚀 10. デプロイ後のアクション**

```yaml
デプロイ完了後すぐに：
1. Twitter/Xで告知
2. safe-yields.comドメイン接続
3. Google Analytics設置
4. 最初のユーザーフィードバック収集
```