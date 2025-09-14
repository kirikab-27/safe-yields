import { Protocol } from '@/types/protocol';

interface Props {
  protocol: Protocol;
}

export default function ProtocolCard({ protocol }: Props) {
  const formatTVL = (tvl: string) => {
    const num = parseFloat(tvl);
    if (num >= 1000000000) return `$${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(0)}M`;
    return `$${num.toLocaleString()}`;
  };

  const getRiskColor = (risk: string) => {
    switch(risk) {
      case 'LOW': return 'text-green-400';
      case 'MEDIUM': return 'text-yellow-400';
      case 'HIGH': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getSafetyColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800 hover:border-green-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold">{protocol.name}</h3>
            {protocol.verified && (
              <span className="text-green-400" title="Verified Protocol">✓</span>
            )}
            <a
              href={protocol.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-300"
            >
              ↗
            </a>
          </div>

          <div className="flex flex-wrap gap-2 text-sm text-gray-400 mb-3">
            <span className="px-2 py-1 bg-gray-800 rounded">
              {protocol.chain}
            </span>
            <span className="px-2 py-1 bg-gray-800 rounded">
              {protocol.category}
            </span>
            <span className="px-2 py-1 bg-gray-800 rounded">
              TVL: {formatTVL(protocol.tvl)}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {protocol.audits.map((audit) => (
              <span
                key={audit}
                className="text-xs px-2 py-1 bg-green-900/30 text-green-400 rounded border border-green-800/50"
              >
                ✓ {audit}
              </span>
            ))}
          </div>

          {protocol.description && (
            <p className="text-sm text-gray-500 mt-2">{protocol.description}</p>
          )}
        </div>

        <div className="flex gap-6 items-center">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">
              {protocol.apy}%
            </div>
            <div className="text-xs text-gray-500">APY</div>
          </div>

          <div className="text-center">
            <div className={`text-2xl font-bold ${getSafetyColor(protocol.safetyScore)}`}>
              {protocol.safetyScore}
            </div>
            <div className="text-xs text-gray-500">Safety</div>
            <div className={`text-xs mt-1 ${getRiskColor(protocol.risk)}`}>
              {protocol.risk} RISK
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mt-4 pt-4 border-t border-gray-800">
        {protocol.hasInsurance && (
          <span className="text-xs text-blue-400">🛡️ Insured</span>
        )}
        {protocol.hasBugBounty && (
          <span className="text-xs text-purple-400">🐛 Bug Bounty</span>
        )}
        {!protocol.incidentHistory && (
          <span className="text-xs text-green-400">✓ No Hacks</span>
        )}
      </div>
    </div>
  );
}