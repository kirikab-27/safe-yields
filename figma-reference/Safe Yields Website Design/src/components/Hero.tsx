export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-green-950/20 to-transparent py-20">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Find Safe DeFi Yields. 
            <br />
            <span className="text-green-400">Skip the Scams.</span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Verified protocols only. Real APYs. Safety scores. No BS.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">247</div>
              <div className="text-gray-400">Verified Protocols</div>
            </div>
            
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">$42.7B</div>
              <div className="text-gray-400">Total TVL</div>
            </div>
            
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">8.4%</div>
              <div className="text-gray-400">Average Safe APY</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}