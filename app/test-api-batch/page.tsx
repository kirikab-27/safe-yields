'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ProtocolData {
  id: string;
  name: string;
  tvl: number;
  apy: number;
  chains?: string[];
  audits?: string | number;
  lastUpdated: number;
  source?: 'api' | 'fallback' | 'cache';
  _cached: boolean;
}

interface BatchResponse {
  data: {
    [protocol: string]: ProtocolData | null;
  };
  errors: {
    [protocol: string]: string;
  };
  _cached: {
    [protocol: string]: boolean;
  };
  timestamp: number;
}

export default function TestBatchAPIPage() {
  const [batchData, setBatchData] = useState<BatchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);

  const fetchBatchData = async () => {
    setLoading(true);
    setError(null);
    const start = performance.now();
    setStartTime(start);

    try {
      const response = await fetch('/api/protocols/batch');
      const end = performance.now();
      setEndTime(end);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setBatchData(data);

      // Log performance metrics
      console.log('Batch API Performance:', {
        duration: `${(end - start).toFixed(2)}ms`,
        cacheStatus: response.headers.get('X-Cache-Status'),
        data
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Batch API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount
  useEffect(() => {
    fetchBatchData();
  }, []);

  // Calculate metrics
  const calculateMetrics = () => {
    if (!batchData) return null;

    const protocols = Object.keys(batchData.data);
    const successful = protocols.filter(p => batchData.data[p] !== null).length;
    const cached = protocols.filter(p => batchData._cached[p]).length;
    const errors = Object.keys(batchData.errors).length;
    const loadTime = endTime - startTime;

    return {
      totalProtocols: protocols.length,
      successful,
      cached,
      errors,
      cacheHitRate: protocols.length > 0 ? ((cached / protocols.length) * 100).toFixed(1) : '0',
      loadTime: loadTime.toFixed(2),
    };
  };

  const metrics = calculateMetrics();

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-green-400 hover:text-green-300 text-sm mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold mb-2">⚡ Batch API Test</h1>
          <p className="text-gray-400">Testing optimized batch protocol fetching</p>
        </div>

        {/* Performance Metrics */}
        {metrics && (
          <div className="bg-gray-900 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 text-green-400">📊 Performance Metrics</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <div className="text-2xl font-bold text-white">{metrics.totalProtocols}</div>
                <div className="text-xs text-gray-400">Total Protocols</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">{metrics.successful}</div>
                <div className="text-xs text-gray-400">Successful</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">{metrics.cached}</div>
                <div className="text-xs text-gray-400">Cached</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-400">{metrics.errors}</div>
                <div className="text-xs text-gray-400">Errors</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-400">{metrics.cacheHitRate}%</div>
                <div className="text-xs text-gray-400">Cache Hit Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">{metrics.loadTime}ms</div>
                <div className="text-xs text-gray-400">Load Time</div>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="mb-8">
          <button
            onClick={fetchBatchData}
            disabled={loading}
            className="bg-green-400 text-black px-6 py-3 rounded-lg font-bold hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Fetching...' : 'Refresh Batch Data'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-8">
            <h3 className="text-red-400 font-bold mb-2">Error</h3>
            <p className="text-gray-300">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4 animate-spin">⚡</div>
            <p className="text-gray-400">Fetching batch data...</p>
          </div>
        )}

        {/* Data Display */}
        {batchData && !loading && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Protocol Data</h2>

            {Object.entries(batchData.data).map(([protocolId, data]) => (
              <div
                key={protocolId}
                className="bg-gray-900 rounded-lg p-4 border border-gray-800"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {data?.name || protocolId}
                      {batchData._cached[protocolId] && (
                        <span className="ml-2 text-xs text-blue-400">💾 Cached</span>
                      )}
                      {!batchData._cached[protocolId] && data && (
                        <span className="ml-2 text-xs text-green-400">🟢 Live</span>
                      )}
                      {batchData.errors[protocolId] && (
                        <span className="ml-2 text-xs text-red-400">❌ Error</span>
                      )}
                    </h3>

                    {data ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">TVL:</span>{' '}
                          <span className="text-white font-semibold">
                            ${(data.tvl / 1000000000).toFixed(2)}B
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">APY:</span>{' '}
                          <span className="text-green-400 font-semibold">
                            {data.apy.toFixed(2)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Chains:</span>{' '}
                          <span className="text-white">
                            {data.chains?.length || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Source:</span>{' '}
                          <span className={`font-semibold ${
                            data.source === 'api' ? 'text-green-400' :
                            data.source === 'cache' ? 'text-blue-400' :
                            'text-yellow-400'
                          }`}>
                            {data.source || 'unknown'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-red-400 text-sm">
                        Error: {batchData.errors[protocolId] || 'Data not available'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Comparison with Individual APIs */}
        <div className="mt-12 bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-yellow-400">⚡ Performance Comparison</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-gray-400 mb-2">Before (Individual APIs)</h3>
              <ul className="space-y-1 text-sm">
                <li className="text-gray-300">• 5 parallel API requests</li>
                <li className="text-gray-300">• ~2-3 seconds load time</li>
                <li className="text-gray-300">• 5 separate cache entries</li>
                <li className="text-gray-300">• Higher rate limit risk</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-green-400 mb-2">After (Batch API)</h3>
              <ul className="space-y-1 text-sm">
                <li className="text-green-300">• 1 batch request</li>
                <li className="text-green-300">• {metrics ? `~${metrics.loadTime}ms` : '<1 second'} load time</li>
                <li className="text-green-300">• Unified cache management</li>
                <li className="text-green-300">• Minimal rate limit risk</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Raw JSON Display */}
        <details className="mt-8">
          <summary className="cursor-pointer text-gray-400 hover:text-white">
            View Raw JSON Response
          </summary>
          <pre className="mt-4 bg-gray-900 rounded-lg p-4 overflow-x-auto text-xs">
            {JSON.stringify(batchData, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}