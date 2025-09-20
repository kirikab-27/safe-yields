## 概要
現在DeFiLlama APIを主に使用していますが、プロトコル固有の最適化により正確なデータ取得が必要です。

### このIssueの目的
1. **データの正確性向上** - プロトコル公式APIの活用
2. **ユーザー信頼性の確保** - 透明性のあるデータソース表示
3. **システム安定性** - 適切なキャッシュとフォールバック戦略

## 問題点
- Compound V3が0%または推定値2.8%を表示し信頼性が低下
- 公式APIからより正確なデータが取得可能なプロトコルが存在
- データがない場合は「--」表示の方が誤った推定値より良い

## 基本方針 🎯
**「誤情報を出さない」ことを最優先**
- 不正確なデータより「--」表示を選択（ツールチップで詳細説明）
- データソースを明示してユーザーの信頼を獲得
- 段階的な実装でリスクを最小化

## 実装要件（必須） ⚡

### 1. サーバーサイド実装
**すべての外部API呼び出しはNext.js API Routes経由で実行**

#### APIエンドポイント命名規則
```
/api/protocols/{protocol-id}/{metric}

例:
- /api/protocols/lido/apr
- /api/protocols/compound-v3/rates
- /api/protocols/aave-v3/rates
- /api/protocols/rocket-pool/apr
- /api/protocols/curve/pools
```

```typescript
// ❌ クライアント直接呼び出し（避ける）
fetch('https://stake.lido.fi/api/steth-apr')

// ✅ API Route経由（命名規則に従う）
fetch('/api/protocols/lido/apr')
```
理由：CORS対策、APIキー秘匿、レート制限管理、統一的な命名

### 2. タイムアウトとリトライ
```typescript
const fetchWithTimeout = async (url: string, timeout = 5000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// リトライロジック
const fetchWithRetry = async (fn: () => Promise<any>, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i))); // Exponential backoff
    }
  }
}
```

### 3. データ検証（Zod使用）
```typescript
import { z } from 'zod';

const LidoResponseSchema = z.object({
  apr: z.number().min(0).max(100) // 0-100%の範囲
});

// Compound V3 - 改善版
const CompoundV3MarketSchema = z.object({
  asset: z.string(),
  supplyApy: z.number().min(0).max(100),
  borrowApy: z.number().min(0).max(100),
  supplyLiquidityUSD: z.number().min(0),
  borrowLiquidityUSD: z.number().min(0)
});

const CompoundV3ResponseSchema = z.object({
  markets: z.array(CompoundV3MarketSchema)
});
```

### 4. フォールバック戦略（API障害時）
```typescript
// フォールバック優先順位
const FALLBACK_STRATEGY = {
  'lido': {
    primary: 'official',      // Lido公式API
    fallback: 'defillama',    // DeFiLlamaにフォールバック
    showStale: true,          // 古いキャッシュも表示
    maxStaleAge: 3600         // 最大1時間の古いデータまで許容
  },
  'compound-v3': {
    primary: 'official',
    fallback: null,           // フォールバックなし → "--"表示
    showStale: false,
    maxStaleAge: 0
  },
  'aave-v3': {
    primary: 'subgraph',
    fallback: 'defillama',
    showStale: true,
    maxStaleAge: 1800         // 最大30分
  },
  'rocket-pool': {
    primary: 'official',
    fallback: 'defillama',
    showStale: true,
    maxStaleAge: 7200         // 最大2時間（変動が緩やか）
  },
  'curve': {
    primary: 'official',
    fallback: 'defillama',
    showStale: true,
    maxStaleAge: 900          // 最大15分
  }
};

// フォールバック実装例
async function fetchWithFallback(protocol: string) {
  const strategy = FALLBACK_STRATEGY[protocol];

  try {
    // 1. プライマリソースから取得
    const data = await fetchPrimarySource(protocol);
    return { data, source: 'primary' };
  } catch (primaryError) {
    console.error(`[${protocol}] Primary source failed:`, primaryError);

    // 2. フォールバックソースが定義されている場合
    if (strategy.fallback) {
      try {
        const fallbackData = await fetchFallbackSource(protocol, strategy.fallback);
        return { data: fallbackData, source: 'fallback' };
      } catch (fallbackError) {
        console.error(`[${protocol}] Fallback source failed:`, fallbackError);
      }
    }

    // 3. 古いキャッシュの使用を検討
    if (strategy.showStale) {
      const staleCache = await cache.getStale(protocol, strategy.maxStaleAge);
      if (staleCache) {
        return { data: staleCache, source: 'stale-cache' };
      }
    }

    // 4. すべて失敗 → null（UIで "--" 表示）
    return { data: null, source: 'unavailable' };
  }
}
```

### 5. Compound V3 加重平均ロジック
**単純平均ではなく流動性ベースの加重平均を採用**
```typescript
interface CompoundMarket {
  asset: string;
  supplyApy: number;
  borrowApy: number;
  supplyLiquidityUSD: number;
  borrowLiquidityUSD: number;
}

// Supply側の加重平均APY計算
const calculateWeightedSupplyAPY = (markets: CompoundMarket[]): number | null => {
  const validMarkets = markets.filter(m => m.supplyLiquidityUSD > 1000); // $1000以上のみ対象

  if (validMarkets.length === 0) return null;

  const totalLiquidity = validMarkets.reduce((sum, m) => sum + m.supplyLiquidityUSD, 0);
  if (totalLiquidity === 0) return null;

  const weightedAPY = validMarkets.reduce((sum, m) =>
    sum + (m.supplyApy * m.supplyLiquidityUSD), 0
  ) / totalLiquidity;

  return Math.round(weightedAPY * 100) / 100; // 小数点2桁
};

// Borrow側の加重平均APY計算
const calculateWeightedBorrowAPY = (markets: CompoundMarket[]): number | null => {
  const validMarkets = markets.filter(m => m.borrowLiquidityUSD > 1000); // $1000以上のみ対象

  if (validMarkets.length === 0) return null;

  const totalLiquidity = validMarkets.reduce((sum, m) => sum + m.borrowLiquidityUSD, 0);
  if (totalLiquidity === 0) return null;

  const weightedAPY = validMarkets.reduce((sum, m) =>
    sum + (m.borrowApy * m.borrowLiquidityUSD), 0
  ) / totalLiquidity;

  return Math.round(weightedAPY * 100) / 100; // 小数点2桁
};

// API Route実装例
export async function GET() {
  const markets = await fetchCompoundV3Markets();

  const supplyAPY = calculateWeightedSupplyAPY(markets);
  const borrowAPY = calculateWeightedBorrowAPY(markets);

  // 主要アセット（USDC, ETH等）の個別APYも保持
  const topMarkets = markets
    .sort((a, b) => b.supplyLiquidityUSD - a.supplyLiquidityUSD)
    .slice(0, 3);

  return {
    avgSupplyAPY: supplyAPY,
    avgBorrowAPY: borrowAPY,
    topMarkets, // UI詳細表示用
    totalMarkets: markets.length,
    lastUpdated: new Date().toISOString()
  };
}
```

## 実装フェーズ（改訂版）

### Phase 1: Lido（2-3時間）
- [x] 推定値削除完了
- [x] "--"表示実装完了
- [ ] Lido公式API実装
- [ ] 基本キャッシュ（メモリ）

### Phase 2A: Compound V3（3-4時間）
- [ ] 公式API実装
- [ ] **加重平均ロジック実装**（流動性ベース）
- [ ] 個別マーケットデータ保持
- [ ] メモリキャッシュ

### Phase 2B: モニタリング導入（2時間）← **前倒し**
- [ ] **Sentry導入**（エラートラッキング）
- [ ] カスタムメトリクス設定
- [ ] アラート閾値設定

### Phase 2C: キャッシュ永続化（3-4時間）← **前倒し**
- [ ] **Upstash Redis導入**（Vercel対応）
- [ ] キャッシュレイヤー実装
- [ ] **プロトコル別TTL設定**
- [ ] フォールバック機構

#### プロトコル別キャッシュTTL設定
```typescript
// プロトコルごとの最適なTTL（秒）
const PROTOCOL_CACHE_TTL = {
  'lido': 30,           // 30秒 - ステーキングAPRは比較的安定
  'compound-v3': 120,   // 2分 - ブロックチェーン更新頻度に合わせる
  'aave-v3': 120,       // 2分 - 複数マーケットの集計のため
  'rocket-pool': 300,   // 5分 - APR変動が緩やか
  'curve': 60,          // 1分 - 流動性変動が激しいプール多数
  'default': 60         // デフォルト1分
};

// 使用例
const getTTL = (protocol: string): number => {
  return PROTOCOL_CACHE_TTL[protocol] || PROTOCOL_CACHE_TTL.default;
};
```

```typescript
// Upstash Redis実装例（プロトコル別TTL対応）
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

class PersistentCache {
  private memoryCache = new Map();

  async get(key: string, protocol: string) {
    const ttl = getTTL(protocol);

    // 1. メモリキャッシュ確認（プロトコル別TTL）
    const memCached = this.memoryCache.get(key);
    if (memCached && Date.now() - memCached.timestamp < ttl * 1000) {
      return memCached.data;
    }

    // 2. Redisキャッシュ確認
    try {
      const cached = await redis.get(key);
      if (cached) {
        this.memoryCache.set(key, { data: cached, timestamp: Date.now() });
        return cached;
      }
    } catch (error) {
      console.error('[Cache] Redis error:', error);
    }

    return null;
  }

  async set(key: string, data: any, protocol: string) {
    const ttl = getTTL(protocol);
    // メモリとRedis両方に保存（プロトコル別TTL）
    this.memoryCache.set(key, { data, timestamp: Date.now() });

    try {
      await redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.error('[Cache] Redis write error:', error);
    }
  }
}
```

### Phase 3: Aave V3（4-6時間）
- [ ] GraphQL実装
- [ ] マルチチェーン対応
- [ ] 加重平均（TVLベース）

## UI表示仕様（改訂版） 🎨

### 単一プロトコル表示（Lido等）
```tsx
<div className="flex items-center gap-2">
  <span className="text-2xl font-bold">3.45%</span>
  <InfoIcon tooltip="Source: Lido API" />
</div>
```

### 複数アセット系表示（Compound/Aave）← **NEW**
```tsx
function MultiAssetAPYDisplay({ protocol, data }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div>
      {/* メイン表示: 加重平均 */}
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold">
          {data.avgSupplyAPY ? `${data.avgSupplyAPY}%` : '--'}
        </span>
        <span className="text-sm text-gray-400">avg</span>

        <button onClick={() => setShowDetails(!showDetails)}>
          <ChevronIcon className={showDetails ? 'rotate-180' : ''} />
        </button>

        <InfoTooltip>
          <p>Weighted average across {data.totalMarkets} markets</p>
          <p>Source: {protocol} API</p>
        </InfoTooltip>
      </div>

      {/* 詳細表示: 個別アセット */}
      {showDetails && (
        <div className="mt-2 pl-4 border-l-2 border-gray-700">
          {data.topMarkets.map(market => (
            <div key={market.asset} className="flex justify-between text-sm">
              <span>{market.asset}:</span>
              <span>Supply {market.supplyApy}% / Borrow {market.borrowApy}%</span>
            </div>
          ))}
          <p className="text-xs text-gray-500 mt-1">
            Top 3 markets by liquidity
          </p>
        </div>
      )}
    </div>
  );
}
```

### エラー/キャッシュ状態表示（統一ルール）
| 状況 | UI表示 | ツールチップ内容 |
|------|--------|----------------|
| 通常 | `3.45%` | `Source: {protocol} API` |
| 平均値（複数アセット） | `3.45% avg` | `Weighted average across N markets` |
| キャッシュ（新鮮） | `3.45%` + 青バッジ`[Cached]` | `Using cached data (updated 2m ago)` |
| キャッシュ（古い） | `3.45%` + 黄バッジ`[Stale]` | `⚠️ Using stale data (updated 15m ago)` |
| **データなし** | **`--`のみ** | **`Data temporarily unavailable`** |
| **APIエラー** | **`--`のみ** | **`Failed to fetch from {source}`** |
| **タイムアウト** | **`--`のみ** | **`Request timeout (5s exceeded)`** |
| ローディング | スケルトン or `...` | - |

#### UI表示の統一原則
- **エラー時は必ず`--`のみ表示**（画面をシンプルに保つ）
- **`--`の横に`ⓘ`アイコン表示**（ホバーで詳細理由を表示）
- **詳細な理由はツールチップで提供**（例：「現在データ取得不可（Lido API障害・フォールバック失敗）」）
- **バッジは控えめに**（Cached/Stale のみ、色で区別）
- **データソースを透明に表示**（ツールチップ内で「Source: Lido API」「Source: DeFiLlama (fallback)」等）

#### UI実装例（エラー時）
```tsx
// データ取得失敗時のUI
<div className="flex items-center gap-1">
  <span className="text-gray-400 text-xl">--</span>
  <InfoIcon
    className="w-4 h-4 text-gray-500 cursor-help"
    tooltip={
      <div className="text-xs">
        <p className="font-semibold">データ取得不可</p>
        <p>原因: {errorReason}</p>
        <p className="text-gray-400 mt-1">再試行まで: {retryIn}秒</p>
      </div>
    }
  />
</div>
```

#### クライアントサイドのPolling間隔
```typescript
// フロントエンドの自動更新間隔（useSWR等で使用）
const POLLING_INTERVALS = {
  'page': 60000,        // ページ全体: 60秒
  'lido': 30000,        // Lido: 30秒（キャッシュTTLと同じ）
  'compound-v3': 120000,// Compound: 2分
  'aave-v3': 120000,    // Aave: 2分
  'rocket-pool': 300000,// Rocket Pool: 5分
  'curve': 60000,       // Curve: 1分
  'default': 60000      // デフォルト: 1分
};

// SWR設定例
const { data } = useSWR(
  `/api/protocols/${protocol}/rates`,
  fetcher,
  {
    refreshInterval: POLLING_INTERVALS[protocol] || POLLING_INTERVALS.default,
    revalidateOnFocus: false,
    dedupingInterval: 10000
  }
);
```

## モニタリング（Phase 2B）📊

### Sentry設定
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,

  beforeSend(event) {
    // APIエラーをグループ化
    if (event.exception?.values?.[0]?.value?.includes('API')) {
      event.fingerprint = ['api-error', event.extra?.protocol];
    }
    return event;
  }
});

// API呼び出しラッパー
const trackAPICall = async (protocol: string, fn: () => Promise<any>) => {
  const transaction = Sentry.startTransaction({
    name: `api.${protocol}`,
    op: 'http.client'
  });

  try {
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;

    transaction.setStatus('ok');

    // カスタムメトリクス
    Sentry.metrics.distribution('api.latency', duration, {
      tags: { protocol, status: 'success' }
    });

    return result;
  } catch (error) {
    transaction.setStatus('internal_error');
    Sentry.captureException(error, {
      tags: { protocol },
      extra: { timestamp: new Date().toISOString() }
    });
    throw error;
  } finally {
    transaction.finish();
  }
};
```

## 環境変数（追加分）
```bash
# Phase 2B - モニタリング
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# Phase 2C - キャッシュ永続化
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Optional
LOGTAIL_SOURCE_TOKEN=  # ログ集約
```

## 成功指標（改訂版）✅
- **API応答時間**: < 2秒（P95）
- **エラー率**: < 5%
- **キャッシュヒット率**: > 60%
- **データ鮮度**: 95%が5分以内
- **加重平均の精度**: 実際の使用状況を反映
- **Sentry エラー検知率**: 100%

## テスト計画 🧪

### 基本テストケース
```typescript
describe('API Data Fetching', () => {
  // 1. スキーマバリデーションテスト
  it('should validate Lido API response schema', async () => {
    const response = await fetch('/api/protocols/lido/apr');
    const data = await response.json();

    const result = LidoResponseSchema.safeParse(data);
    expect(result.success).toBe(true);
    expect(data.apr).toBeGreaterThan(0);
    expect(data.apr).toBeLessThan(100);
  });

  // 2. フォールバック動作テスト
  it('should fallback to DeFiLlama when primary fails', async () => {
    // Mock primary API failure
    jest.spyOn(global, 'fetch')
      .mockImplementationOnce(() => Promise.reject(new Error('Network error')))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ apr: 3.5 })
      }));

    const data = await fetchWithFallback('lido');
    expect(data.source).toBe('fallback');
    expect(data.data.apr).toBe(3.5);
  });

  // 3. キャッシュTTLテスト
  it('should respect protocol-specific cache TTL', async () => {
    const cache = new PersistentCache();

    // Lidoは30秒TTL
    await cache.set('lido-apr', { apr: 3.0 }, 'lido');

    // 29秒後: キャッシュ有効
    jest.advanceTimersByTime(29000);
    const cached1 = await cache.get('lido-apr', 'lido');
    expect(cached1).not.toBeNull();

    // 31秒後: キャッシュ無効
    jest.advanceTimersByTime(2000);
    const cached2 = await cache.get('lido-apr', 'lido');
    expect(cached2).toBeNull();
  });

  // 4. 加重平均計算テスト
  it('should calculate weighted average correctly', () => {
    const markets = [
      { asset: 'USDC', supplyApy: 5.0, supplyLiquidityUSD: 1000000 },
      { asset: 'ETH', supplyApy: 3.0, supplyLiquidityUSD: 500000 },
      { asset: 'DAI', supplyApy: 1.0, supplyLiquidityUSD: 100 } // 無視される（$1000未満）
    ];

    const weightedAPY = calculateWeightedSupplyAPY(markets);
    // (5.0 * 1000000 + 3.0 * 500000) / 1500000 = 4.33
    expect(weightedAPY).toBeCloseTo(4.33, 2);
  });

  // 5. エラー時のUI表示テスト
  it('should display "--" on data unavailable', async () => {
    const { getByText } = render(<APYDisplay value={null} />);
    expect(getByText('--')).toBeInTheDocument();
  });
});
```

### テストカバレッジ目標
- **ユニットテスト**: 80%以上
- **E2Eテスト**: 主要フロー（データ取得→表示）
- **負荷テスト**: 同時100リクエスト処理

## リスクと対策（改訂版）⚠️
| リスク | 対策 | 優先度 |
|--------|------|--------|
| Vercelサーバーレス制約 | Upstash Redis導入（Phase 2C） | 高 |
| 流動性ゼロのマーケット | $1000以上のみ加重平均対象 | 高 |
| API障害の未検知 | Sentry導入（Phase 2B） | 高 |
| 複雑なUI | 平均値＋詳細の2段階表示 | 中 |
| レート制限 | 適切なTTL設定とキャッシング | 中 |

## 実装チェックリスト（改訂版）✅

### Phase 1: Lido
- [x] 推定値削除
- [x] "--"表示
- [ ] API Route (`/api/protocols/lido/apr`)
- [ ] メモリキャッシュ
- [ ] UI更新

### Phase 2A: Compound V3
- [ ] API Route (`/api/protocols/compound-v3/rates`)
- [ ] **流動性データ取得**
- [ ] **加重平均計算実装**
- [ ] **個別マーケットデータ保持**
- [ ] **複数アセットUI実装**

### Phase 2B: モニタリング
- [ ] Sentry導入
- [ ] カスタムメトリクス
- [ ] エラーグループ化
- [ ] アラート設定

### Phase 2C: キャッシュ永続化
- [ ] Upstash Redis設定
- [ ] 2層キャッシュ実装
- [ ] TTL管理
- [ ] フォールバック

### Phase 3: Aave V3
- [ ] Subgraph統合
- [ ] 加重平均（TVLベース）
- [ ] マルチチェーン

## 次のステップ
1. **今日**: Lido API実装
2. **明日**: Compound V3 + 加重平均
3. **3日目**: Sentry導入
4. **4日目**: Upstash Redis
5. **来週**: Aave V3

## 完了条件（Definition of Done）
- [ ] すべてのAPIエンドポイントが命名規則に従っている
- [ ] Zodによるスキーマ検証が実装されている
- [ ] プロトコル別TTLが正しく動作している
- [ ] フォールバック戦略が機能している
- [ ] データソースがUIに表示されている
- [ ] テストカバレッジ80%以上
- [ ] Sentryでエラー監視が開始されている
- [ ] ドキュメント更新完了

## 備考
- 加重平均により「実際の使用状況」を反映した正確なAPY表示
- 早期のモニタリング導入でバグの早期発見
- Vercel環境を考慮した永続キャッシュで安定性向上
- 複数アセット系は「平均＋詳細」の2段階表示でUX向上

## 関連Issue
- #38: Live APY Data（一部実装済み）
- #36: Gas Calculator（実装済み）
- #40: Educational Content
- #41: Real-time Gas Price Optimization

## 参考リンク
- [Lido API Documentation](https://docs.lido.fi/integrations/api)
- [Compound V3 API](https://docs.compound.finance/v3/)
- [The Graph Protocol](https://thegraph.com/)
- [Upstash Redis for Vercel](https://upstash.com/)




