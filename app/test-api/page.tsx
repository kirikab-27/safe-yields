'use client';

import ProtocolCardWithAPI from '@/components/ProtocolCardWithAPI';

export default function TestAPIPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
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