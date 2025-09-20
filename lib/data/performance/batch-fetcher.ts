// Batch Fetcher - パフォーマンス最適化された並列フェッチャー

import { protocolDataFetcher, ProtocolData } from '../protocol-fetcher';
import { logger } from '@/lib/monitoring/logger';

interface BatchOptions {
  maxConcurrent?: number;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
}

export class BatchFetcher {
  private defaultOptions: Required<BatchOptions> = {
    maxConcurrent: 3,      // 同時実行数
    timeout: 5000,         // タイムアウト（ms）
    retryCount: 2,         // リトライ回数
    retryDelay: 1000      // リトライ間隔（ms）
  };

  constructor(private options?: BatchOptions) {
    this.options = { ...this.defaultOptions, ...options };
  }

  /**
   * 複数のプロトコルを並列でフェッチ（チャンク処理）
   */
  async fetchBatch(
    protocolIds: string[],
    options?: BatchOptions
  ): Promise<Map<string, ProtocolData | null>> {
    const opts: Required<BatchOptions> = {
      ...this.defaultOptions,
      ...(this.options || {}),
      ...(options || {})
    } as Required<BatchOptions>;
    const startTime = Date.now();

    logger.info(`Starting batch fetch for ${protocolIds.length} protocols`, {
      protocols: protocolIds,
      maxConcurrent: opts.maxConcurrent
    });

    // チャンク分割
    const chunks = this.chunkArray(protocolIds, opts.maxConcurrent!);
    const results = new Map<string, ProtocolData | null>();

    for (const chunk of chunks) {
      // 並列実行
      const chunkPromises = chunk.map(protocolId =>
        this.fetchWithRetry(protocolId, opts)
          .then(data => ({ protocolId, data }))
          .catch(error => {
            logger.error(`Failed to fetch ${protocolId} after retries`, {
              protocol: protocolId,
              error: error as Error
            });
            return { protocolId, data: null };
          })
      );

      // チャンクの結果を待つ
      const chunkResults = await Promise.all(chunkPromises);

      // 結果を格納
      for (const { protocolId, data } of chunkResults) {
        results.set(protocolId, data);
      }

      // 次のチャンクまで少し待つ（レート制限対策）
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await this.delay(100);
      }
    }

    const elapsed = Date.now() - startTime;
    logger.info(`Batch fetch completed in ${elapsed}ms`, {
      totalTime: elapsed,
      successCount: Array.from(results.values()).filter(d => d?.apy !== null).length,
      failureCount: Array.from(results.values()).filter(d => d?.apy === null).length
    });

    // パフォーマンス警告
    if (elapsed > 3000) {
      logger.warning('Batch fetch took longer than 3 seconds', {
        elapsed,
        protocolCount: protocolIds.length
      });
    }

    return results;
  }

  /**
   * 並列フェッチ（Promise.allSettled使用）
   */
  async fetchParallel(
    protocolIds: string[]
  ): Promise<Map<string, ProtocolData | null>> {
    const startTime = Date.now();

    const promises = protocolIds.map(protocolId =>
      protocolDataFetcher.fetch(protocolId)
        .then(data => ({ status: 'fulfilled', protocolId, data }))
        .catch(error => ({ status: 'rejected', protocolId, error }))
    );

    const results = await Promise.allSettled(promises);
    const resultMap = new Map<string, ProtocolData | null>();

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { protocolId, data } = result.value as any;
        resultMap.set(protocolId, data);
      } else {
        // エラーの場合はnullを設定
        const { protocolId } = (result as any).reason;
        resultMap.set(protocolId, null);
      }
    }

    const elapsed = Date.now() - startTime;
    logger.debug(`Parallel fetch completed in ${elapsed}ms`, {
      count: protocolIds.length,
      time: elapsed
    });

    return resultMap;
  }

  /**
   * リトライ付きフェッチ
   */
  private async fetchWithRetry(
    protocolId: string,
    options: Required<BatchOptions>
  ): Promise<ProtocolData | null> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= options.retryCount; attempt++) {
      try {
        // タイムアウト付きフェッチ
        const data = await this.fetchWithTimeout(
          protocolId,
          options.timeout
        );

        if (data) {
          return data;
        }
      } catch (error) {
        lastError = error as Error;
        logger.warning(`Fetch attempt ${attempt + 1} failed for ${protocolId}`, {
          protocol: protocolId,
          attempt: attempt + 1,
          error: lastError
        });

        if (attempt < options.retryCount) {
          // 指数バックオフ
          const delay = options.retryDelay * Math.pow(2, attempt);
          await this.delay(delay);
        }
      }
    }

    throw lastError || new Error(`Failed to fetch ${protocolId}`);
  }

  /**
   * タイムアウト付きフェッチ
   */
  private async fetchWithTimeout(
    protocolId: string,
    timeout: number
  ): Promise<ProtocolData | null> {
    return Promise.race([
      protocolDataFetcher.fetch(protocolId),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeout)
      )
    ]);
  }

  /**
   * 配列をチャンクに分割
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * 遅延処理
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * パフォーマンス測定付きフェッチ
   */
  async fetchWithMetrics(
    protocolIds: string[]
  ): Promise<{
    data: Map<string, ProtocolData | null>;
    metrics: {
      totalTime: number;
      averageTime: number;
      successRate: number;
      cacheHitRate: number;
    };
  }> {
    const startTime = Date.now();
    const data = await this.fetchBatch(protocolIds);
    const totalTime = Date.now() - startTime;

    const values = Array.from(data.values());
    const successCount = values.filter(d => d?.apy !== null).length;
    const cacheHitCount = values.filter(d => d?.fromCache).length;

    const metrics = {
      totalTime,
      averageTime: totalTime / protocolIds.length,
      successRate: successCount / protocolIds.length,
      cacheHitRate: cacheHitCount / protocolIds.length
    };

    logger.info('Fetch performance metrics', metrics);

    return { data, metrics };
  }
}

// シングルトンインスタンス
export const batchFetcher = new BatchFetcher();