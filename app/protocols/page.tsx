export default function ProtocolsPage() {
  const protocols = [
    { id: 'lido', name: 'Lido' },
    { id: 'rocket-pool', name: 'Rocket Pool' },
    // 今後追加: aave-v3, compound-v3, curve
  ];

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-2xl font-bold mb-6">All Protocols</h1>
      <div className="space-y-2">
        {protocols.map(p => (
          <a
            key={p.id}
            href={`/protocols/${p.id}`}
            className="block p-4 bg-gray-900 rounded hover:bg-gray-800 transition"
          >
            {p.name} →
          </a>
        ))}
      </div>
    </div>
  );
}