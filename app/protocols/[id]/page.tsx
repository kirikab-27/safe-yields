import { getProtocolData } from '@/lib/protocols';

export async function generateStaticParams() {
  return [{ id: 'lido' }];
}

export default async function ProtocolDetailPage({
  params
}: {
  params: { id: string }
}) {
  const protocol = await getProtocolData(params.id);

  // TVL整形
  const formatTVL = (tvl: number | undefined) => {
    if (!tvl) return 'N/A';
    if (tvl >= 1_000_000_000) {
      return `$${(tvl / 1_000_000_000).toFixed(1)}B`;
    }
    if (tvl >= 1_000_000) {
      return `$${(tvl / 1_000_000).toFixed(1)}M`;
    }
    return `$${tvl.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* パンくずリスト */}
      <nav className="p-6 text-gray-400">
        <a href="/" className="hover:text-white">Home</a>
        {' / '}
        <a href="/protocols" className="hover:text-white">Protocols</a>
        {' / '}
        <span className="text-white">{protocol.name || params.id}</span>
      </nav>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-6 pb-12">
        <h1 className="text-4xl font-bold mb-8">{protocol.name || 'Protocol'}</h1>

        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900 p-6 rounded-lg">
            <div className="text-gray-400 text-sm mb-2">APY</div>
            <div className="text-2xl font-bold text-green-400">
              {protocol.apy ? `${protocol.apy}%` : 'N/A'}
            </div>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg">
            <div className="text-gray-400 text-sm mb-2">Total Value Locked</div>
            <div className="text-2xl font-bold">
              {formatTVL(protocol.tvl)}
            </div>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg">
            <div className="text-gray-400 text-sm mb-2">Safety Score</div>
            <div className="text-2xl font-bold">
              {protocol.safetyScore ? `${protocol.safetyScore}/100` : 'N/A'}
            </div>
          </div>
        </div>

        {/* 詳細説明 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">About {protocol.name}</h2>
          <p className="text-gray-300 leading-relaxed">
            {protocol.description || 'No description available.'}
          </p>
        </section>

        {/* リンク集 */}
        <section>
          <h3 className="text-xl font-bold mb-4">Resources</h3>
          <div className="space-y-2">
            {protocol.website && (
              <a
                href={protocol.website}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-gray-900 rounded hover:bg-gray-800 transition"
              >
                Official Website →
              </a>
            )}
            {protocol.docs && (
              <a
                href={protocol.docs}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-gray-900 rounded hover:bg-gray-800 transition"
              >
                Documentation →
              </a>
            )}
            {protocol.audit && (
              <a
                href={protocol.audit}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-gray-900 rounded hover:bg-gray-800 transition"
              >
                Audit Reports →
              </a>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}