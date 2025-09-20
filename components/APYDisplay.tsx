'use client';

import React, { useState } from 'react';

interface APYDisplayProps {
  protocolId: string;
  apy: number | null | undefined;
  isLive?: boolean;
  source?: 'protocol' | 'defillama' | 'cached' | 'expired' | 'fallback';
  errorReason?: 'api_down' | 'fallback_failed' | 'timeout' | 'invalid_data';
}

export function APYDisplay({
  protocolId,
  apy,
  isLive,
  source,
  errorReason
}: APYDisplayProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Tooltip message definition
  function getErrorTooltip(reason?: string): string {
    const baseMessage = 'Data currently unavailable';

    switch(reason) {
      case 'api_down':
        return `${baseMessage} (API Error)`;
      case 'fallback_failed':
        return `${baseMessage} (API Error / Fallback Failed)`;
      case 'timeout':
        return `${baseMessage} (Timeout)`;
      case 'invalid_data':
        return `${baseMessage} (Invalid Data)`;
      default:
        return `${baseMessage} (API Error / Fallback Failed)`;
    }
  }

  // データなし表示
  if (apy === null || apy === undefined) {
    const tooltipContent = getErrorTooltip(errorReason);

    return (
      <div className="flex items-center gap-1">
        <span className="text-2xl text-gray-500 font-bold">--</span>
        <div className="relative">
          <span
            className="cursor-help text-gray-400 text-sm hover:text-gray-300"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            ⓘ
          </span>
          {showTooltip && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-50 border border-gray-700">
              {tooltipContent}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                <div className="w-2 h-2 bg-gray-900 border-b border-r border-gray-700 transform rotate-45"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 正常表示
  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl font-bold text-green-400">
        {apy.toFixed(1)}%
      </span>
      {isLive && (
        <span className="px-2 py-0.5 bg-green-400/10 text-green-400 rounded text-xs border border-green-400/20">
          <span className="animate-pulse">● Live</span>
        </span>
      )}
      {source === 'cached' && (
        <span
          className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded text-xs relative cursor-help"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          Cached
          {showTooltip && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-50 border border-gray-700">
              Cached data (Last updated: 5 minutes ago)
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                <div className="w-2 h-2 bg-gray-900 border-b border-r border-gray-700 transform rotate-45"></div>
              </div>
            </div>
          )}
        </span>
      )}
    </div>
  );
}

// パフォーマンス要件
export const PERFORMANCE_REQUIREMENTS = {
  pageLoadTime: 2000,    // 2秒以内
  apiTimeout: 5000,      // 5秒タイムアウト
  cacheRefresh: 300000   // 5分でキャッシュ更新
};