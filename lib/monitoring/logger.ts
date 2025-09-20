// Monitoring Logger - ログベースモニタリング実装

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface LogContext {
  protocol?: string;
  source?: 'api' | 'cache' | 'fallback';
  responseTime?: number;
  error?: Error;
  [key: string]: any;
}

export interface MetricsData {
  fallbackRate: number;
  apiErrorRate: number;
  avgResponseTime: number;
  cacheHitRate: number;
  nullApyRate: number;
}

class Logger {
  private metrics: {
    totalRequests: number;
    fallbackCount: number;
    errorCount: number;
    cacheHitCount: number;
    nullApyCount: number;
    responseTimes: number[];
  };

  constructor() {
    this.metrics = {
      totalRequests: 0,
      fallbackCount: 0,
      errorCount: 0,
      cacheHitCount: 0,
      nullApyCount: 0,
      responseTimes: []
    };
  }

  // ログ出力（開発環境ではコンソール、本番環境では将来的にSentryなどに送信）
  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context
    };

    // 開発環境ではコンソールに出力
    if (process.env.NODE_ENV === 'development') {
      const color = this.getColorForLevel(level);
      console.log(`${color}[${level.toUpperCase()}]`, message, context || '');
    }

    // メトリクス収集
    this.updateMetrics(level, context);

    // 本番環境では構造化ログとして出力（将来のSentry/Datadog統合用）
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(logEntry));
    }
  }

  private getColorForLevel(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '\x1b[36m'; // Cyan
      case LogLevel.INFO: return '\x1b[32m';  // Green
      case LogLevel.WARNING: return '\x1b[33m'; // Yellow
      case LogLevel.ERROR: return '\x1b[31m';  // Red
      case LogLevel.CRITICAL: return '\x1b[35m'; // Magenta
      default: return '\x1b[0m';
    }
  }

  private updateMetrics(level: LogLevel, context?: LogContext) {
    this.metrics.totalRequests++;

    if (context?.source === 'fallback') {
      this.metrics.fallbackCount++;
    }

    if (context?.source === 'cache') {
      this.metrics.cacheHitCount++;
    }

    if (level === LogLevel.ERROR || level === LogLevel.CRITICAL) {
      this.metrics.errorCount++;
    }

    if (context?.responseTime) {
      this.metrics.responseTimes.push(context.responseTime);
      // Keep only last 100 response times
      if (this.metrics.responseTimes.length > 100) {
        this.metrics.responseTimes.shift();
      }
    }

    if (context?.apy === null) {
      this.metrics.nullApyCount++;
    }
  }

  // Public logging methods
  debug(message: string, context?: LogContext) {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context);
  }

  warning(message: string, context?: LogContext) {
    this.log(LogLevel.WARNING, message, context);
  }

  error(message: string, context?: LogContext) {
    this.log(LogLevel.ERROR, message, context);
  }

  critical(message: string, context?: LogContext) {
    this.log(LogLevel.CRITICAL, message, context);
  }

  // API成功をログ
  logAPISuccess(protocol: string, responseTime: number, apy: number | null) {
    this.info(`API fetch successful for ${protocol}`, {
      protocol,
      responseTime,
      apy,
      source: 'api'
    });
  }

  // API失敗をログ
  logAPIFailure(protocol: string, error: Error, fallbackUsed: boolean) {
    this.error(`API fetch failed for ${protocol}`, {
      protocol,
      error: error,
      fallbackUsed,
      source: fallbackUsed ? 'fallback' : undefined
    });
  }

  // キャッシュヒットをログ
  logCacheHit(protocol: string) {
    this.debug(`Cache hit for ${protocol}`, {
      protocol,
      source: 'cache'
    });
  }

  // メトリクス取得
  getMetrics(): MetricsData {
    const avgResponseTime = this.metrics.responseTimes.length > 0
      ? this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length
      : 0;

    return {
      fallbackRate: this.metrics.totalRequests > 0
        ? this.metrics.fallbackCount / this.metrics.totalRequests
        : 0,
      apiErrorRate: this.metrics.totalRequests > 0
        ? this.metrics.errorCount / this.metrics.totalRequests
        : 0,
      avgResponseTime,
      cacheHitRate: this.metrics.totalRequests > 0
        ? this.metrics.cacheHitCount / this.metrics.totalRequests
        : 0,
      nullApyRate: this.metrics.totalRequests > 0
        ? this.metrics.nullApyCount / this.metrics.totalRequests
        : 0
    };
  }

  // メトリクスレポート出力
  printMetricsReport() {
    const metrics = this.getMetrics();
    console.log('\n=== Metrics Report ===');
    console.log(`Fallback Rate: ${(metrics.fallbackRate * 100).toFixed(2)}%`);
    console.log(`API Error Rate: ${(metrics.apiErrorRate * 100).toFixed(2)}%`);
    console.log(`Average Response Time: ${metrics.avgResponseTime.toFixed(0)}ms`);
    console.log(`Cache Hit Rate: ${(metrics.cacheHitRate * 100).toFixed(2)}%`);
    console.log(`NULL APY Rate: ${(metrics.nullApyRate * 100).toFixed(2)}%`);
    console.log('======================\n');
  }

  // しきい値チェック
  checkThresholds() {
    const metrics = this.getMetrics();
    const warnings: string[] = [];

    // フォールバック率が30%を超えたら警告
    if (metrics.fallbackRate > 0.3) {
      warnings.push(`High fallback rate: ${(metrics.fallbackRate * 100).toFixed(2)}%`);
    }

    // APIエラー率が10%を超えたら警告
    if (metrics.apiErrorRate > 0.1) {
      warnings.push(`High error rate: ${(metrics.apiErrorRate * 100).toFixed(2)}%`);
    }

    // 平均応答時間が3秒を超えたら警告
    if (metrics.avgResponseTime > 3000) {
      warnings.push(`Slow response time: ${metrics.avgResponseTime.toFixed(0)}ms`);
    }

    if (warnings.length > 0) {
      this.warning('Threshold violations detected', { warnings });
      // 将来的にはここでSlack/PagerDuty通知を送信
    }

    return warnings;
  }
}

// シングルトンインスタンス
export const logger = new Logger();

// 定期的なメトリクスレポート（開発環境のみ）
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    logger.printMetricsReport();
    logger.checkThresholds();
  }, 60000); // 1分ごと
}