'use client';

import ProtocolCardWithAPI from '@/components/ProtocolCardWithAPI';

export default function TestAPIPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* ヘッダー */}
      <header className="border-b border-gray-800 bg-black/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <span className="text-3xl">🛡️</span>
                <h1 className="text-2xl font-bold">
                  <span className="text-white">Safe</span>
                  <span className="text-green-400"> Yields</span>
                </h1>
              </a>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/"
                className="text-sm text-green-400 hover:text-green-300 transition-colors font-medium"
              >
                🏠 Home
              </a>
              <a
                href="/tools/gas-calculator"
                className="text-sm text-green-400 hover:text-green-300 transition-colors font-medium"
              >
                ⛽ Gas Calculator
              </a>
              <p className="text-xs text-gray-500 hidden sm:block">
                Not Financial Advice. Always DYOR.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8 text-green-400">
          API Integration Test - Lido
        </h1>

        <div className="space-y-6">
          {/* Lido with real API data */}
          <div>
            <h2 className="text-xl mb-3 text-gray-400">Live Data from API:</h2>
            <ProtocolCardWithAPI
              protocolId="lido"
              staticData={{
                name: 'Lido',
                category: 'Staking',
                chain: 'Ethereum',
                risk: 'LOW',
                safetyScore: 95
              }}
            />
          </div>

          {/* API Status */}
          <div className="bg-gray-900 rounded-lg p-4 mt-8">
            <h3 className="text-lg font-semibold mb-2">API Endpoint:</h3>
            <code className="text-green-400">/api/protocols/lido</code>
            <p className="text-sm text-gray-500 mt-2">
              Data refreshes every 60 seconds. Cache TTL: 5 minutes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}