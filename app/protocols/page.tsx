import Link from 'next/link';

export default function ProtocolsPage() {
  const protocols = [
    { id: 'lido', name: 'Lido' },
    { id: 'rocket-pool', name: 'Rocket Pool' },
    { id: 'aave-v3', name: 'Aave V3' },
    { id: 'compound-v3', name: 'Compound V3' },
    { id: 'curve', name: 'Curve Finance' }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ヘッダー */}
      <header className="border-b border-gray-800 bg-black/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <span className="text-3xl">🛡️</span>
                <h1 className="text-2xl font-bold">
                  <span className="text-white">Safe</span>
                  <span className="text-green-400"> Yields</span>
                </h1>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-sm text-green-400 hover:text-green-300 transition-colors font-medium"
              >
                🏠 Home
              </Link>
              <Link
                href="/tools/gas-calculator"
                className="text-sm text-green-400 hover:text-green-300 transition-colors font-medium"
              >
                ⛽ Gas Calculator
              </Link>
              <p className="text-xs text-gray-500 hidden sm:block">
                Not Financial Advice. Always DYOR.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">All Protocols</h1>
      <div className="space-y-2">
        {protocols.map(p => (
          <Link
            key={p.id}
            href={`/protocols/${p.id}`}
            className="block p-4 bg-gray-900 rounded hover:bg-gray-800 transition"
          >
            {p.name} →
          </Link>
        ))}
      </div>
    </div>
  );
}