# [改善] プロトコル別API最適化による正確なAPYデータ取得

## 📋 概要
現在DeFiLlama APIを主に使用していますが、プロトコル固有の最適化により正確なデータ取得が必要です。

## 🎯 目的
- ハードコードされたAPY値を完全に排除
- より正確なリアルタイムデータの提供
- ユーザーの信頼性向上（誤情報の防止）

## 📊 現状の問題点
1. **信頼性の低下**
   - Compound V3が0%または推定値2.8%を表示
   - データがない場合に誤った情報を表示

2. **データソースの制限**
   - DeFiLlama APIのカバレッジ不足
   - プロトコル固有のデータ取得が非効率

3. **ユーザー体験の問題**
   - 誤った推定値によるミスリード
   - データの透明性欠如

## ✅ 実装要件

### 優先度: 高 🔴

#### 1. Lido API統合
```typescript
// lib/data/protocols/lido.ts
interface LidoAPRResponse {
  data: {
    timeUnix: number;
    apr: number;
    apr7d: number;
    apr30d: number;
  }
}

async function fetchLidoAPR(): Promise<number | null> {
  try {
    const res = await fetch('https://stake.lido.fi/api/steth-apr', {
      next: { revalidate: 300 }, // 5分キャッシュ
      signal: AbortSignal.timeout(5000)
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data: LidoAPRResponse = await res.json();
    return data.data.apr;
  } catch (error) {
    console.error('[Lido] API fetch failed:', error);
    return null;
  }
}
```

#### 2. Aave V3 Subgraph統合
```typescript
// lib/data/protocols/aave-v3.ts
const AAVE_SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/aave/protocol-v3-ethereum';

const query = `
  query GetReserves {
    reserves(first: 10, orderBy: totalLiquidity, orderDirection: desc) {
      id
      symbol
      liquidityRate
      variableBorrowRate
      stableBorrowRate
      totalLiquidity
      availableLiquidity
    }
  }
`;

async function fetchAaveAPY(): Promise<{ supply: number; borrow: number } | null> {
  try {
    const res = await fetch(AAVE_SUBGRAPH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      next: { revalidate: 300 }
    });

    const data = await res.json();
    // 加重平均計算ロジック
    return calculateWeightedAPY(data.data.reserves);
  } catch (error) {
    console.error('[Aave] Subgraph query failed:', error);
    return null;
  }
}
```

#### 3. Compound V3統合
```typescript
// lib/data/protocols/compound-v3.ts
interface CompoundMarket {
  totalSupplyUsd: string;
  totalBorrowUsd: string;
  supplyApr: string;
  borrowApr: string;
}

async function fetchCompoundAPY(): Promise<number | null> {
  try {
    // Option 1: Compound公式API（優先）
    const res = await fetch('https://api.compound.finance/api/v3/markets/mainnet-usdc', {
      next: { revalidate: 600 } // 10分キャッシュ
    });

    if (!res.ok) {
      // Option 2: On-chainフォールバック
      return await fetchOnChainCompoundData();
    }

    const data: CompoundMarket = await res.json();

    // 加重平均ロジック
    if (parseFloat(data.totalSupplyUsd) < 1000) {
      return null; // データ不十分
    }

    return parseFloat(data.supplyApr);
  } catch (error) {
    console.error('[Compound] API fetch failed:', error);
    return null;
  }
}

// 加重平均計算ロジック
function calculateWeightedAPY(markets: CompoundMarket[]): number | null {
  const validMarkets = markets.filter(m =>
    parseFloat(m.totalSupplyUsd) > 1000000 && // $1M以上のTVL
    parseFloat(m.supplyApr) > 0
  );

  if (validMarkets.length === 0) return null;

  const totalTvl = validMarkets.reduce((sum, m) =>
    sum + parseFloat(m.totalSupplyUsd), 0
  );

  const weightedApy = validMarkets.reduce((sum, m) =>
    sum + (parseFloat(m.supplyApr) * parseFloat(m.totalSupplyUsd)), 0
  );

  return weightedApy / totalTvl;
}
```

### 優先度: 中 🟡

#### 4. Rocket Pool統合
```typescript
// lib/data/protocols/rocket-pool.ts
async function fetchRocketPoolAPR(): Promise<number | null> {
  // Beaconchain APIまたはRocket Pool公式API
  const endpoints = [
    'https://api.rocketpool.net/api/apr',
    'https://beaconcha.in/api/v1/rocketpool/apr'
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        next: { revalidate: 600 }
      });
      if (res.ok) {
        const data = await res.json();
        return data.apr || data.rethApr;
      }
    } catch (error) {
      continue; // 次のエンドポイントを試す
    }
  }

  return null;
}
```

#### 5. Curve Finance統合
```typescript
// lib/data/protocols/curve.ts
async function fetchCurveAPY(): Promise<number | null> {
  try {
    const res = await fetch('https://api.curve.fi/api/getPools/ethereum/main', {
      next: { revalidate: 300 }
    });

    const pools = await res.json();
    // 上位プールの加重平均
    return calculateTopPoolsAPY(pools.data);
  } catch (error) {
    return null;
  }
}
```

## 🏗️ アーキテクチャ設計

### データフェッチャー統合
```typescript
// lib/data/protocol-fetcher.ts
import { z } from 'zod';

// スキーマ定義
const ProtocolDataSchema = z.object({
  apy: z.number().nullable(),
  tvl: z.number(),
  lastUpdated: z.string().datetime()
});

// 統合フェッチャー
export class ProtocolDataFetcher {
  private fetchers = new Map<string, () => Promise<number | null>>();
  private cache: Map<string, CachedData> = new Map();

  constructor() {
    this.fetchers.set('lido', fetchLidoAPR);
    this.fetchers.set('aave-v3', fetchAaveAPY);
    this.fetchers.set('compound-v3', fetchCompoundAPY);
    this.fetchers.set('rocket-pool', fetchRocketPoolAPR);
    this.fetchers.set('curve', fetchCurveAPY);
  }

  async fetch(protocolId: string): Promise<ProtocolData | null> {
    // 1. キャッシュチェック（プロトコル別TTL）
    const cached = this.getFromCache(protocolId);
    if (cached && !this.isExpired(cached, protocolId)) {
      return cached.data;
    }

    // 2. プロトコル固有APIフェッチ
    const fetcher = this.fetchers.get(protocolId);
    if (fetcher) {
      const apy = await fetcher();

      if (apy !== null) {
        const data = { apy, tvl: 0, lastUpdated: new Date().toISOString() };
        this.setCache(protocolId, data);
        return data;
      }
    }

    // 3. DeFiLlamaフォールバック
    const defillama = await fetchFromDeFiLlama(protocolId);
    if (defillama) {
      this.setCache(protocolId, defillama);
      return defillama;
    }

    // 4. キャッシュフォールバック（期限切れでも返す）
    if (cached) {
      console.warn(`[${protocolId}] Using expired cache`);
      return cached.data;
    }

    return null;
  }

  private getProtocolTTL(protocolId: string): number {
    const ttlMap: Record<string, number> = {
      'lido': 300,        // 5分（変動少ない）
      'aave-v3': 300,     // 5分
      'compound-v3': 600, // 10分（APIレート制限）
      'rocket-pool': 900, // 15分（変動少ない）
      'curve': 300        // 5分
    };

    return ttlMap[protocolId] || 300; // デフォルト5分
  }

  private isExpired(cached: CachedData, protocolId: string): boolean {
    const ttl = this.getProtocolTTL(protocolId);
    return Date.now() - cached.timestamp > ttl * 1000;
  }
}
```

### エラーハンドリング統合
```typescript
// lib/data/error-handler.ts
export class DataFetchError extends Error {
  constructor(
    public protocol: string,
    public source: 'api' | 'subgraph' | 'onchain',
    public originalError: Error
  ) {
    super(`Failed to fetch ${protocol} from ${source}: ${originalError.message}`);
    this.name = 'DataFetchError';
  }
}

// エラー監視
export function trackError(error: DataFetchError) {
  // Sentry統合
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureException(error, {
      tags: {
        protocol: error.protocol,
        source: error.source
      }
    });
  }

  // ローカルログ
  console.error(`[${error.protocol}] ${error.source} error:`, error.originalError);
}
```

### キャッシュ戦略
```typescript
// lib/data/cache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

export class CacheManager {
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      return data as T;
    } catch (error) {
      console.error(`Cache read error for ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number) {
    try {
      await redis.set(key, value, { ex: ttl });
    } catch (error) {
      console.error(`Cache write error for ${key}:`, error);
    }
  }

  async invalidate(pattern: string) {
    // プロトコル別キャッシュ無効化
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}

// 永続化戦略
export async function persistToDatabase(protocol: string, data: ProtocolData) {
  // Supabase/PostgreSQL永続化
  if (process.env.DATABASE_URL) {
    await db.insert({
      protocol_id: protocol,
      apy: data.apy,
      tvl: data.tvl,
      timestamp: new Date()
    });
  }
}
```

## 🎨 UI実装仕様

### APY表示ロジック（詳細仕様）

#### データ取得失敗時の表示
- **必須**: データ取得失敗時は `--` を表示
- **必須**: `--` の右に `ⓘ` アイコンを配置
- **必須**: ツールチップに「現在データ取得不可（API障害 / フォールバック失敗）」と表示
- **必須**: キャッシュ使用時は「Cached」バッジを表示
- **必須**: ページロード時間 2秒以内を維持

```typescript
// components/APYDisplay.tsx
interface APYDisplayProps {
  protocolId: string;
  apy: number | null;
  isLive?: boolean;
  source?: 'protocol' | 'defillama' | 'cached' | 'expired';
  errorReason?: 'api_down' | 'fallback_failed' | 'timeout' | 'invalid_data';
}

export function APYDisplay({ protocolId, apy, isLive, source, errorReason }: APYDisplayProps) {
  // データなし表示（詳細仕様）
  if (apy === null || apy === undefined) {
    const tooltipContent = getErrorTooltip(errorReason);

    return (
      <div className="flex items-center gap-1">
        <span className="text-2xl text-gray-500">--</span>
        <Tooltip
          content={tooltipContent}
          position="top"
          delay={200}
        >
          <span className="cursor-help text-gray-400 text-sm">
            ⓘ {/* Info icon: 必ず--の右に配置 */}
          </span>
        </Tooltip>
      </div>
    );
  }

  // 正常表示
  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl font-bold text-green-400">
        {apy.toFixed(2)}%
      </span>
      {isLive && (
        <Badge variant="success" size="sm">
          <span className="animate-pulse">● Live</span>
        </Badge>
      )}
      {source === 'cached' && (
        <Tooltip content="キャッシュデータ（最終更新: 5分前）">
          <Badge variant="secondary" size="sm">Cached</Badge>
        </Tooltip>
      )}
    </div>
  );
}

// ツールチップメッセージ定義
function getErrorTooltip(reason?: string): string {
  // 統一メッセージフォーマット
  const baseMessage = '現在データ取得不可';

  switch(reason) {
    case 'api_down':
      return `${baseMessage}（API障害）`;
    case 'fallback_failed':
      return `${baseMessage}（API障害 / フォールバック失敗）`;
    case 'timeout':
      return `${baseMessage}（タイムアウト）`;
    case 'invalid_data':
      return `${baseMessage}（不正なデータ）`;
    default:
      return `${baseMessage}（API障害 / フォールバック失敗）`;
  }
}

// パフォーマンス要件
const PERFORMANCE_REQUIREMENTS = {
  pageLoadTime: 2000, // 2秒以内
  apiTimeout: 5000,   // 5秒タイムアウト
  cacheRefresh: 300000 // 5分でキャッシュ更新
};
```

### エラー表示
```typescript
// components/DataStatus.tsx
export function DataStatus({ error, isLoading, retry }: DataStatusProps) {
  if (isLoading) {
    return <Skeleton className="h-8 w-20" />;
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-yellow-500">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">データ取得エラー</span>
        <button onClick={retry} className="text-xs underline">
          再試行
        </button>
      </div>
    );
  }

  return null;
}
```

### 透明性表示
```typescript
// components/DataSource.tsx
export function DataSource({ protocol, source, lastUpdated }: DataSourceProps) {
  return (
    <div className="text-xs text-gray-500 mt-1">
      データソース: {getSourceLabel(source)} |
      最終更新: {formatTimeAgo(lastUpdated)}
    </div>
  );
}
```

## 📊 モニタリング / ログ

### 必須モニタリング項目

#### Sentryへの送信
```typescript
// lib/monitoring/sentry-config.ts
import * as Sentry from '@sentry/nextjs';

export function trackAPIFailure(protocol: string, error: Error, fallbackUsed: boolean) {
  Sentry.captureException(error, {
    tags: {
      protocol,
      type: 'api_failure',
      fallback_used: fallbackUsed
    },
    level: 'error',
    fingerprint: [`api-failure-${protocol}`]
  });

  // フォールバック発生をイベントとして記録
  if (fallbackUsed) {
    Sentry.captureMessage(`Fallback triggered for ${protocol}`, 'warning');
  }
}
```

#### CloudWatch / Datadogメトリクス
```typescript
// lib/monitoring/metrics-config.ts
export const MONITORING_METRICS = {
  // 必須メトリクス
  FALLBACK_OCCURRENCE_RATE: 'api.fallback.rate',     // フォールバック発生率
  API_ERROR_RATE: 'api.error.rate',                  // APIエラー率
  AVERAGE_RESPONSE_TIME: 'api.response.avg',         // 平均応答時間

  // しきい値設定
  THRESHOLDS: {
    FALLBACK_RATE_CRITICAL: 0.3,    // 30%以上でアラート
    API_ERROR_RATE_WARNING: 0.1,    // 10%以上で警告
    RESPONSE_TIME_CRITICAL: 3000    // 3秒以上でアラート
  }
};

// CloudWatch送信
export async function sendToCloudWatch(metric: string, value: number, unit: string) {
  const cloudwatch = new AWS.CloudWatch();

  await cloudwatch.putMetricData({
    Namespace: 'SafeYields/API',
    MetricData: [{
      MetricName: metric,
      Value: value,
      Unit: unit,
      Timestamp: new Date()
    }]
  }).promise();
}

// Datadog送信
export function sendToDatadog(metric: string, value: number, tags: string[]) {
  const StatsD = require('node-dogstatsd').StatsD;
  const dogstatsd = new StatsD();

  dogstatsd.gauge(metric, value, tags);
}
```

#### アラート通知設定
```typescript
// lib/monitoring/alert-config.ts
export const ALERT_CONFIG = {
  // Slack通知
  slack: {
    webhook: process.env.SLACK_WEBHOOK_URL,
    channel: '#defi-alerts',
    thresholds: {
      fallbackRate: 0.3,
      apiErrorRate: 0.1,
      responseTime: 3000
    }
  },

  // PagerDuty設定
  pagerduty: {
    serviceKey: process.env.PAGERDUTY_SERVICE_KEY,
    severity: {
      critical: ['api_down', 'all_fallbacks_failed'],
      warning: ['high_fallback_rate', 'slow_response']
    }
  }
};

// アラート送信関数
export async function sendAlert(type: string, message: string, severity: 'critical' | 'warning') {
  // Slack通知
  if (severity === 'critical' || severity === 'warning') {
    await sendSlackNotification({
      channel: ALERT_CONFIG.slack.channel,
      text: `🚨 [${severity.toUpperCase()}] ${message}`,
      color: severity === 'critical' ? 'danger' : 'warning'
    });
  }

  // PagerDuty通知（criticalのみ）
  if (severity === 'critical') {
    await sendPagerDutyAlert({
      serviceKey: ALERT_CONFIG.pagerduty.serviceKey,
      description: message,
      details: {
        type,
        timestamp: new Date().toISOString()
      }
    });
  }
}

// しきい値監視
export async function checkThresholds(metrics: MetricsData) {
  // フォールバック発生率チェック
  if (metrics.fallbackRate > MONITORING_METRICS.THRESHOLDS.FALLBACK_RATE_CRITICAL) {
    await sendAlert(
      'high_fallback_rate',
      `Fallback rate exceeded ${metrics.fallbackRate * 100}%`,
      'critical'
    );
  }

  // APIエラー率チェック
  if (metrics.apiErrorRate > MONITORING_METRICS.THRESHOLDS.API_ERROR_RATE_WARNING) {
    await sendAlert(
      'high_error_rate',
      `API error rate exceeded ${metrics.apiErrorRate * 100}%`,
      'warning'
    );
  }

  // 応答時間チェック
  if (metrics.avgResponseTime > MONITORING_METRICS.THRESHOLDS.RESPONSE_TIME_CRITICAL) {
    await sendAlert(
      'slow_response',
      `Average response time: ${metrics.avgResponseTime}ms`,
      'warning'
    );
  }
}
```

### 詳細メトリクス仕様
```typescript
// lib/monitoring/metrics.ts
export const METRICS = {
  // 基本メトリクス
  FETCH_SUCCESS_RATE: 'data.fetch.success_rate',
  API_RESPONSE_TIME: 'api.response_time',
  CACHE_HIT_RATE: 'cache.hit_rate',
  NULL_APY_RATE: 'data.null_apy_rate',
  ERROR_RATE_BY_PROTOCOL: 'error.rate.by_protocol',

  // 追加詳細メトリクス
  FALLBACK_RATE: 'data.fallback_rate',           // フォールバック発生率
  FALLBACK_SUCCESS_RATE: 'data.fallback.success', // フォールバック成功率
  API_LATENCY_P95: 'api.latency.p95',            // 95パーセンタイル
  API_LATENCY_P99: 'api.latency.p99',            // 99パーセンタイル
  DATA_FRESHNESS: 'data.freshness.minutes',       // データ鮮度（分）
  VALIDATION_ERROR_RATE: 'data.validation.error', // Zodバリデーションエラー率
};

// プロトコル別詳細メトリクス
export function trackProtocolMetrics(protocol: string, metrics: ProtocolMetrics) {
  // Sentryへ送信
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.metrics.gauge(METRICS.API_RESPONSE_TIME, metrics.responseTime, {
      tags: { protocol, source: metrics.source }
    });

    if (metrics.fallbackUsed) {
      Sentry.metrics.increment(METRICS.FALLBACK_RATE, 1, {
        tags: { protocol, fallbackType: metrics.fallbackType }
      });
    }

    if (metrics.validationError) {
      Sentry.metrics.increment(METRICS.VALIDATION_ERROR_RATE, 1, {
        tags: { protocol, errorType: metrics.errorType }
      });
    }
  }

  // ローカルログ（開発環境）
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Metrics] ${protocol}:`, {
      responseTime: `${metrics.responseTime}ms`,
      source: metrics.source,
      fallback: metrics.fallbackUsed,
      cached: metrics.fromCache,
      apy: metrics.apy
    });
  }
}

// エラー追跡詳細
export function trackDetailedError(error: DataFetchError) {
  const errorMetrics = {
    protocol: error.protocol,
    source: error.source,
    errorType: error.constructor.name,
    message: error.message,
    timestamp: new Date().toISOString(),

    // スタックトレース（本番では短縮）
    stack: process.env.NODE_ENV === 'production'
      ? error.stack?.split('\n').slice(0, 3).join('\n')
      : error.stack
  };

  // Sentry送信
  Sentry.captureException(error, {
    tags: {
      protocol: error.protocol,
      source: error.source
    },
    extra: errorMetrics
  });

  // CloudWatchやDatadogへの送信もここで
  if (process.env.CLOUDWATCH_ENABLED) {
    // CloudWatch実装
  }
}

// ダッシュボード設定
export const DASHBOARD_CONFIG = {
  alerts: [
    {
      metric: METRICS.FETCH_SUCCESS_RATE,
      threshold: 0.8, // 80%以下でアラート
      severity: 'critical'
    },
    {
      metric: METRICS.NULL_APY_RATE,
      threshold: 0.3, // 30%以上でアラート
      severity: 'warning'
    }
  ],

  sla: {
    uptime: 99.9,
    responseTime: 2000, // 2秒以内
    errorRate: 0.01 // 1%以下
  }
};
```

### 早期監視
```typescript
// 初期デプロイ後の監視項目
const EARLY_MONITORING = {
  // 最初の24時間
  day1: [
    'すべてのプロトコルでデータ取得成功',
    'NULL APY率が20%未満',
    'エラー率が5%未満'
  ],

  // 最初の1週間
  week1: [
    'キャッシュヒット率70%以上',
    'すべての主要プロトコル稼働',
    'ユーザーフィードバック収集'
  ]
};
```

## 🧪 テスト計画

### テスト観点（必須実装）

#### 必須テスト項目
1. **API失敗時のフォールバック動作**
   - API失敗時にフォールバックが正しく動作するか
   - フォールバックも失敗した場合に`--`が表示されるか

2. **キャッシュ管理**
   - キャッシュ期限切れ時に正しく更新されるか
   - キャッシュ使用時に「Cached」バッジが表示されるか

3. **データバリデーション**
   - 不正データを返却された場合、Zodバリデーションで検知できるか
   - バリデーションエラー時に`--`が表示されるか

4. **UI表示検証**
   - UIで `--` + `ⓘ` が正しく表示されるか
   - ツールチップのメッセージが適切か
   - ページロード時間が2秒以内か

### プロトコル別テスト観点

#### Lido テスト仕様
```typescript
// __tests__/lib/data/protocols/lido.test.ts
describe('Lido APR Fetcher', () => {
  // ✅ 正常系
  it('公式APIから正しいAPRを取得', async () => {
    const apr = await fetchLidoAPR();
    expect(apr).toBeGreaterThan(0);
    expect(apr).toBeLessThan(20); // 現実的な範囲
  });

  // ✅ APIダウン時のフォールバック
  it('API失敗時にDeFiLlamaへフォールバック', async () => {
    // Lido API失敗をモック
    fetchMock.mockRejectOnce(new Error('Network error'));

    // DeFiLlamaから取得されることを確認
    const apr = await fetchLidoAPR();
    expect(apr).toBeNull(); // またはDeFiLlamaの値
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('defillama'));
  });

  // ✅ Zodスキーマ検証
  it('不正データをZodで弾く', async () => {
    fetchMock.mockResolvedOnce({
      data: { apr: 'invalid' } // 数値でない
    });

    const apr = await fetchLidoAPR();
    expect(apr).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Validation error')
    );
  });

  // ✅ タイムアウト処理
  it('5秒タイムアウト時にnullを返す', async () => {
    jest.useFakeTimers();
    const promise = fetchLidoAPR();
    jest.advanceTimersByTime(6000);
    const result = await promise;
    expect(result).toBeNull();
  });
});
```

#### Aave V3 テスト仕様
```typescript
describe('Aave V3 APY Fetcher', () => {
  // ✅ Subgraph正常応答
  it('Subgraphから加重平均APYを計算', async () => {
    const mockReserves = [
      { symbol: 'USDC', liquidityRate: '0.05', totalLiquidity: '1000000' },
      { symbol: 'DAI', liquidityRate: '0.04', totalLiquidity: '500000' }
    ];

    fetchMock.mockResolvedOnce({ data: { reserves: mockReserves }});
    const apy = await fetchAaveAPY();

    // 加重平均: (0.05*1M + 0.04*0.5M) / 1.5M = 0.0466...
    expect(apy).toBeCloseTo(4.67, 1);
  });

  // ✅ Subgraphダウン時
  it('Subgraph失敗時にDeFiLlamaフォールバック', async () => {
    fetchMock.mockRejectOnce(); // Subgraph失敗

    const apy = await fetchAaveAPY();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('yields.llama.fi')
    );
  });

  // ✅ 不正データ検証
  it('liquidityRateが文字列でも正しく処理', async () => {
    const mockReserves = [
      { liquidityRate: 'NaN', totalLiquidity: '1000000' }
    ];

    fetchMock.mockResolvedOnce({ data: { reserves: mockReserves }});
    const apy = await fetchAaveAPY();
    expect(apy).toBeNull(); // NaNは除外される
  });
});
```

#### Compound V3 テスト仕様
```typescript
describe('Compound V3 APY Fetcher', () => {
  // ✅ 公式API正常応答
  it('公式APIから正しいAPYを取得', async () => {
    fetchMock.mockResolvedOnce({
      totalSupplyUsd: '1000000',
      supplyApr: '3.5'
    });

    const apy = await fetchCompoundAPY();
    expect(apy).toBe(3.5);
  });

  // ✅ 公式API → On-chainフォールバック
  it('公式API失敗時にOn-chainデータ取得', async () => {
    fetchMock.mockRejectOnce(); // 公式API失敗

    // On-chainデータモック
    const onChainAPY = 3.2;
    jest.spyOn(global, 'fetchOnChainCompoundData')
      .mockResolvedValue(onChainAPY);

    const apy = await fetchCompoundAPY();
    expect(apy).toBe(3.2);
  });

  // ✅ TVL不足時の処理
  it('TVL $1000未満でnullを返す', async () => {
    fetchMock.mockResolvedOnce({
      totalSupplyUsd: '500', // $500
      supplyApr: '3.5'
    });

    const apy = await fetchCompoundAPY();
    expect(apy).toBeNull();
  });

  // ✅ 加重平均計算の正確性
  it('複数マーケットの加重平均が正しい', async () => {
    const markets = [
      { totalSupplyUsd: '2000000', supplyApr: '3.0' },
      { totalSupplyUsd: '1000000', supplyApr: '4.5' }
    ];

    const result = calculateWeightedAPY(markets);
    // (3.0*2M + 4.5*1M) / 3M = 3.5
    expect(result).toBeCloseTo(3.5, 2);
  });
});
```

### キャッシュテスト仕様
```typescript
describe('Cache TTL Management', () => {
  // ✅ TTL内はキャッシュ利用
  it('TTL内ではキャッシュから返す', async () => {
    const fetcher = new ProtocolDataFetcher();

    // 初回フェッチ
    await fetcher.fetch('lido');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // 2回目（TTL内）
    await fetcher.fetch('lido');
    expect(fetchMock).toHaveBeenCalledTimes(1); // 増えない
  });

  // ✅ TTL超過で再フェッチ
  it('TTL超過後は再フェッチ', async () => {
    const fetcher = new ProtocolDataFetcher();

    await fetcher.fetch('lido');

    // 5分経過をシミュレート
    jest.advanceTimersByTime(301000); // 301秒

    await fetcher.fetch('lido');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  // ✅ プロトコル別TTL
  it('プロトコル別にTTLが異なる', () => {
    const fetcher = new ProtocolDataFetcher();

    expect(fetcher.getProtocolTTL('lido')).toBe(300);         // 5分
    expect(fetcher.getProtocolTTL('compound-v3')).toBe(600);  // 10分
    expect(fetcher.getProtocolTTL('rocket-pool')).toBe(900);  // 15分
  });
});
```

### 統合テスト
```typescript
// __tests__/integration/data-fetcher.test.ts
describe('Protocol Data Fetcher Integration', () => {
  const fetcher = new ProtocolDataFetcher();

  it('Lidoデータをフェッチしてキャッシュ', async () => {
    const data1 = await fetcher.fetch('lido');
    expect(data1?.apy).toBeGreaterThan(0);

    const data2 = await fetcher.fetch('lido');
    expect(data2).toEqual(data1); // キャッシュから
  });

  it('フォールバック階層が正しく動作', async () => {
    // 1. プロトコルAPI失敗をモック
    fetchMock.mockRejectOnce();

    // 2. DeFiLlamaから取得
    const data = await fetcher.fetch('compound-v3');
    expect(data?.source).toBe('defillama');
  });

  it('すべてのプロトコルで加重平均計算が正しい', async () => {
    const protocols = ['aave-v3', 'compound-v3', 'curve'];

    for (const protocol of protocols) {
      const data = await fetcher.fetch(protocol);
      if (data?.apy !== null) {
        expect(data.apy).toBeGreaterThan(0);
        expect(data.apy).toBeLessThan(100);
      }
    }
  });
});
```

### E2Eテスト
```typescript
// __tests__/e2e/apy-display.spec.ts
import { test, expect } from '@playwright/test';

test.describe('APY Display', () => {
  test('データなしで「--」表示', async ({ page }) => {
    await page.goto('/protocols/compound-v3');

    // APIモックでnull返す
    await page.route('**/api/protocols/compound-v3', route => {
      route.fulfill({ json: { apy: null } });
    });

    const apyElement = await page.locator('[data-testid="apy-display"]');
    await expect(apyElement).toContainText('--');

    // インフォアイコン存在確認
    const infoIcon = await page.locator('[data-testid="apy-info-icon"]');
    await expect(infoIcon).toBeVisible();
  });

  test('ライブデータ表示', async ({ page }) => {
    await page.goto('/protocols/lido');

    await expect(page.locator('[data-testid="live-badge"]')).toBeVisible();
    await expect(page.locator('[data-testid="apy-display"]')).not.toContainText('--');
  });
});
```

### パフォーマンステスト
```typescript
// __tests__/performance/api-response.test.ts
describe('API Response Performance', () => {
  it('すべてのAPIが2秒以内に応答', async () => {
    const protocols = ['lido', 'aave-v3', 'compound-v3'];

    for (const protocol of protocols) {
      const start = Date.now();
      await fetch(`/api/protocols/${protocol}`);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(2000);
    }
  });

  it('バッチAPIが3秒以内に応答', async () => {
    const start = Date.now();
    await fetch('/api/protocols/batch');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(3000);
  });
});
```

## 📝 APIエンドポイント仕様

### エンドポイント命名規則
```typescript
// API Routes Structure
/api/protocols/[id]           // 個別プロトコル
/api/protocols/batch          // バッチ取得
/api/protocols/[id]/refresh   // 強制更新
/api/protocols/[id]/history   // 履歴データ

// RESTful conventions
GET    /api/protocols         // 一覧取得
GET    /api/protocols/[id]    // 個別取得
POST   /api/protocols/refresh // 全更新
DELETE /api/cache/protocols   // キャッシュクリア
```

### レスポンスフォーマット
```typescript
// 成功レスポンス
{
  "success": true,
  "data": {
    "id": "lido",
    "apy": 3.8,
    "tvl": 38500000000,
    "source": "protocol",
    "lastUpdated": "2024-01-20T10:30:00Z"
  }
}

// エラーレスポンス
{
  "success": false,
  "error": {
    "code": "DATA_FETCH_ERROR",
    "message": "Failed to fetch data",
    "details": "Connection timeout"
  }
}
```

## 🔄 ポーリング戦略

### クライアントサイド
```typescript
// hooks/useProtocolData.ts
export function useProtocolData(protocolId: string) {
  return useSWR(
    `/api/protocols/${protocolId}`,
    fetcher,
    {
      refreshInterval: getRefreshInterval(protocolId),
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      fallbackData: getCachedData(protocolId)
    }
  );
}

function getRefreshInterval(protocolId: string): number {
  // プロトコル別更新間隔
  const intervals: Record<string, number> = {
    'compound-v3': 600000,  // 10分（レート制限）
    'lido': 300000,         // 5分
    'aave-v3': 300000,      // 5分
    'default': 300000       // デフォルト5分
  };

  return intervals[protocolId] || intervals.default;
}
```

### サーバーサイド
```typescript
// lib/data/background-refresh.ts
export class BackgroundRefresher {
  private intervals = new Map<string, NodeJS.Timeout>();

  start() {
    // 優先プロトコルを定期更新
    const highPriority = ['lido', 'aave-v3', 'compound-v3'];

    highPriority.forEach(protocol => {
      this.scheduleRefresh(protocol, 5 * 60 * 1000); // 5分
    });
  }

  private async scheduleRefresh(protocol: string, interval: number) {
    const refresh = async () => {
      try {
        await this.fetcher.fetch(protocol);
        console.log(`[Refresh] ${protocol} updated`);
      } catch (error) {
        console.error(`[Refresh] ${protocol} failed:`, error);
      }
    };

    // 初回実行
    await refresh();

    // 定期実行
    this.intervals.set(
      protocol,
      setInterval(refresh, interval)
    );
  }
}
```

## ✅ Definition of Done

### 必須要件
- [ ] ハードコードされたAPY値が完全に削除されている
- [ ] データがない場合は必ず「--」を表示
- [ ] 各プロトコルAPIが実装されテストされている
- [ ] 加重平均ロジックが正しく動作している
- [ ] エラーハンドリングが適切に実装されている
- [ ] キャッシュ戦略が実装されている
- [ ] UIに透明性インジケーターが表示されている
- [ ] 単体テスト、統合テスト、E2Eテストがパスしている
- [ ] パフォーマンステストが基準を満たしている
- [ ] モニタリングダッシュボードが設定されている

### 成功基準
- NULL APY表示率 < 20%
- API応答時間 < 2秒
- キャッシュヒット率 > 70%
- エラー率 < 1%
- ユーザー満足度向上

## 📅 実装タイムライン

### Phase 1: 即座実装（1-2日）
- [x] 推定値削除とNULL表示
- [ ] Lido API統合
- [ ] Compound V3 API検証と統合
- [ ] 基本的なエラーハンドリング

### Phase 2: 主要改善（3-5日）
- [ ] Aave V3 Subgraph統合
- [ ] キャッシュレイヤー実装（Upstash Redis）
- [ ] フォールバック機構
- [ ] UI透明性表示

### Phase 3: 完全実装（1-2週間）
- [ ] 全プロトコルAPI統合
- [ ] バックグラウンド更新
- [ ] 包括的なテストスイート
- [ ] モニタリング設定
- [ ] パフォーマンス最適化

## 🚀 デプロイチェックリスト
- [ ] 環境変数設定（API keys、Redis接続情報）
- [ ] エラー監視設定（Sentry）
- [ ] キャッシュ初期化
- [ ] ヘルスチェックエンドポイント確認
- [ ] ロールバック計画準備

## 📚 参考資料
- [Lido API Documentation](https://docs.lido.fi/integrations/api)
- [Aave V3 Subgraph](https://thegraph.com/hosted-service/subgraph/aave/protocol-v3)
- [Compound V3 Documentation](https://docs.compound.finance)
- [DeFiLlama API](https://defillama.com/docs/api)
- [Upstash Redis for Vercel](https://docs.upstash.com/redis/quickstart)