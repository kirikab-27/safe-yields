// Protocol Data Fetcher - 統合データフェッチャー
import { fetchLidoAPR } from './protocols/lido';
import { fetchCompoundAPY } from './protocols/compound-v3';
import { fetchAaveAPY } from './protocols/aave-v3';
import { getProtocolAPY } from './apy-fetcher';
import { logger } from '@/lib/monitoring/logger';

export interface ProtocolData {
  id: string;
  apy: number | null;
  tvl: number;
  source: 'protocol' | 'defillama' | 'cached' | 'fallback';
  lastUpdated: string;
  fromCache?: boolean;
}

interface CachedData {
  data: ProtocolData;
  timestamp: number;
}

export class ProtocolDataFetcher {
  private fetchers: Map<string, () => Promise<number | null>>;
  private cache: Map<string, CachedData>;

  constructor() {
    this.fetchers = new Map();
    this.cache = new Map();

    // プロトコル別フェッチャーを登録
    this.fetchers.set('lido', fetchLidoAPR);
    this.fetchers.set('compound-v3', fetchCompoundAPY);
    this.fetchers.set('aave-v3', fetchAaveAPY);
  }

  // プロトコル別のキャッシュTTL（ミリ秒）
  private getProtocolTTL(protocolId: string): number {
    const ttlMap: Record<string, number> = {
      'lido': 300000,        // 5分
      'aave-v3': 300000,     // 5分
      'compound-v3': 600000, // 10分（APIレート制限）
      'rocket-pool': 900000, // 15分
      'curve': 300000        // 5分
    };

    return ttlMap[protocolId] || 300000; // デフォルト5分
  }

  // キャッシュが期限切れかチェック
  private isExpired(cached: CachedData, protocolId: string): boolean {
    const ttl = this.getProtocolTTL(protocolId);
    return Date.now() - cached.timestamp > ttl;
  }

  // キャッシュから取得
  private getFromCache(protocolId: string): CachedData | null {
    return this.cache.get(protocolId) || null;
  }

  // キャッシュに保存
  private setCache(protocolId: string, data: ProtocolData): void {
    this.cache.set(protocolId, {
      data,
      timestamp: Date.now()
    });
  }

  // メインのフェッチメソッド
  async fetch(protocolId: string): Promise<ProtocolData | null> {
    const startTime = Date.now();
    logger.info(`Fetching data for ${protocolId}`, { protocol: protocolId });

    // 1. キャッシュチェック
    const cached = this.getFromCache(protocolId);
    if (cached && !this.isExpired(cached, protocolId)) {
      logger.logCacheHit(protocolId);
      return {
        ...cached.data,
        fromCache: true
      };
    }

    // 2. プロトコル固有APIを試行
    const fetcher = this.fetchers.get(protocolId);
    if (fetcher) {
      logger.debug(`Trying protocol-specific API for ${protocolId}`, { protocol: protocolId });

      try {
        const apy = await fetcher();

        if (apy !== null) {
          const responseTime = Date.now() - startTime;
          const data: ProtocolData = {
            id: protocolId,
            apy,
            tvl: 0, // TVLは別途取得
            source: 'protocol',
            lastUpdated: new Date().toISOString(),
            fromCache: false
          };

          this.setCache(protocolId, data);
          logger.logAPISuccess(protocolId, responseTime, apy);
          return data;
        }
      } catch (error) {
        logger.error(`Protocol API failed for ${protocolId}`, {
          protocol: protocolId,
          error: error instanceof Error ? error : new Error('Unknown error')
        });
      }
    }

    // 3. DeFiLlamaフォールバック
    console.log(`[Fetcher] Falling back to DeFiLlama for ${protocolId}`);
    try {
      const defiLlamaData = await getProtocolAPY(protocolId);

      if (defiLlamaData.apy !== null && defiLlamaData.apy !== undefined) {
        const data: ProtocolData = {
          id: protocolId,
          apy: defiLlamaData.apy,
          tvl: 0,
          source: 'defillama',
          lastUpdated: new Date().toISOString(),
          fromCache: false
        };

        this.setCache(protocolId, data);
        return data;
      }
    } catch (error) {
      console.error(`[Fetcher] DeFiLlama fallback failed for ${protocolId}:`, error);
    }

    // 4. 期限切れキャッシュをフォールバックとして使用
    if (cached) {
      console.warn(`[Fetcher] Using expired cache as fallback for ${protocolId}`);
      return {
        ...cached.data,
        source: 'fallback',
        fromCache: true
      };
    }

    // 5. すべて失敗した場合はnull
    console.error(`[Fetcher] All data sources failed for ${protocolId}`);
    return {
      id: protocolId,
      apy: null,
      tvl: 0,
      source: 'fallback',
      lastUpdated: new Date().toISOString(),
      fromCache: false
    };
  }

  // バッチフェッチ（複数プロトコルを並列取得）
  async fetchMultiple(protocolIds: string[]): Promise<Map<string, ProtocolData | null>> {
    const promises = protocolIds.map(id =>
      this.fetch(id).then(data => ({ id, data }))
    );

    const results = await Promise.all(promises);
    const resultMap = new Map<string, ProtocolData | null>();

    for (const { id, data } of results) {
      resultMap.set(id, data);
    }

    return resultMap;
  }

  // キャッシュクリア
  clearCache(protocolId?: string): void {
    if (protocolId) {
      this.cache.delete(protocolId);
      console.log(`[Fetcher] Cache cleared for ${protocolId}`);
    } else {
      this.cache.clear();
      console.log('[Fetcher] All cache cleared');
    }
  }
}

// シングルトンインスタンス
export const protocolDataFetcher = new ProtocolDataFetcher();