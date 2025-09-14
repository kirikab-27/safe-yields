'use client';

interface HeroSectionProps {
  stats: {
    protocolCount: number;
    totalTVL: string;
    avgAPY: string;
  };
}

export default function HeroSection({ stats }: HeroSectionProps) {
  return (
    <section className="relative py-20 px-4 overflow-hidden">
      {/* グラデーション背景 */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-950/20 via-transparent to-transparent" />

      <div className="relative max-w-7xl mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          Find Safe DeFi Yields.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
            Skip the Scams.
          </span>
        </h1>

        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
          Verified protocols only. Real APYs. Safety scores. No BS.
        </p>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="bg-[#0F1419] border border-gray-800 rounded-2xl p-6">
            <div className="text-4xl font-bold text-green-400 mb-2">{stats.protocolCount}</div>
            <div className="text-gray-500">Verified Protocols</div>
          </div>

          <div className="bg-[#0F1419] border border-gray-800 rounded-2xl p-6">
            <div className="text-4xl font-bold text-white mb-2">${stats.totalTVL}B</div>
            <div className="text-gray-500">Total TVL</div>
          </div>

          <div className="bg-[#0F1419] border border-gray-800 rounded-2xl p-6">
            <div className="text-4xl font-bold text-yellow-400 mb-2">{stats.avgAPY}%</div>
            <div className="text-gray-500">Average Safe APY</div>
          </div>
        </div>
      </div>
    </section>
  );
}