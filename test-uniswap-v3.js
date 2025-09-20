// Test script for Uniswap V3 implementation
const { fetchUniswapV3Data, getMockUniswapV3Data } = require('./lib/data/protocols/uniswap-v3');

async function testUniswapV3() {
  console.log('Testing Uniswap V3 implementation...\n');

  // Test 1: Mock data
  console.log('1. Testing mock data:');
  const mockData = getMockUniswapV3Data();
  console.log('  ✓ Mock TVL: $' + (mockData.tvl / 1000000000).toFixed(2) + 'B');
  console.log('  ✓ Mock Pools: ' + mockData.poolCount);
  console.log('  ✓ Top Pool: ' + mockData.topPools[0].pair + ' (' + mockData.topPools[0].apy.toFixed(2) + '% APY)');

  // Test 2: Live data fetch
  console.log('\n2. Testing live data fetch:');
  try {
    const liveData = await fetchUniswapV3Data();
    if (liveData) {
      console.log('  ✓ Live TVL: $' + (liveData.tvl / 1000000000).toFixed(2) + 'B');
      console.log('  ✓ Live Pools: ' + liveData.poolCount);
      if (liveData.topPools && liveData.topPools.length > 0) {
        console.log('  ✓ Top Pool: ' + liveData.topPools[0].pair + ' (' + liveData.topPools[0].apy.toFixed(2) + '% APY)');
      }
      console.log('  ✓ From Cache: ' + liveData.fromCache);
    } else {
      console.log('  ⚠ No live data available (using fallback)');
    }
  } catch (error) {
    console.log('  ❌ Error fetching live data:', error.message);
  }

  console.log('\n✅ Uniswap V3 implementation test complete!');
}

testUniswapV3().catch(console.error);