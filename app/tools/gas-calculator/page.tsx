'use client';

import { useState, useEffect } from 'react';
import gasUsageData from '@/data/gas-usage.json';

export default function GasCalculator() {
  const [gasPrice, setGasPrice] = useState(30); // Gwei 初期値
  const [investmentAmount, setInvestmentAmount] = useState(1000); // USD
  const [apy, setApy] = useState(5); // %
  const [ethPrice, setEthPrice] = useState(2000); // USD/ETH 初期値
  const [isLoading, setIsLoading] = useState(true);

  // 選択されたプロトコルとオペレーション
  const [selectedProtocol, setSelectedProtocol] = useState('aave-v3');
  const [selectedOperation, setSelectedOperation] = useState('deposit');

  // 現在の protocol/operation のガス使用量
  const getCurrentGasUsage = () => {
    const protocol = gasUsageData.protocols[selectedProtocol as keyof typeof gasUsageData.protocols];
    if (!protocol) return { averageGas: 150000, minGas: 120000, maxGas: 180000 };

    const operation = protocol.operations[selectedOperation as keyof typeof protocol.operations];
    if (!operation) {
      // フォールバック: general operations を使う
      const general = gasUsageData.protocols.general;
      return general.operations.transfer || { averageGas: 65000, minGas: 55000, maxGas: 80000 };
    }
    return operation;
  };

  // 複数トランザクションのガス使用量を管理
  const [transactions, setTransactions] = useState({
    deposit: 220000,
    withdraw: 260000,
    claim: 120000,
    compound: 0, // auto-compound は追加ガスなし
  });

  // Etherscan APIからガス価格取得
  useEffect(() => {
    const fetchGasPrice = async () => {
      try {
        const response = await fetch('/api/gas-price');
        const data = await response.json();

        if (data.gasPrice) {
          setGasPrice(data.gasPrice);
        }
        if (data.ethPrice) {
          setEthPrice(data.ethPrice);
        }
      } catch (error) {
        console.error('Failed to fetch gas price:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGasPrice();
    // 30秒ごとに更新
    const interval = setInterval(fetchGasPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  // プロトコル変更時にガス使用量を更新
  useEffect(() => {
    updateTransactionGasEstimates();
  }, [selectedProtocol]);

  // トランザクションガス使用量を更新
  const updateTransactionGasEstimates = () => {
    const protocol = gasUsageData.protocols[selectedProtocol as keyof typeof gasUsageData.protocols];
    if (!protocol) return;

    const ops = protocol.operations as any; // Type assertion for dynamic access

    const newTransactions = {
      deposit: ops.deposit?.averageGas ||
               ops.supply?.averageGas ||
               ops.stake?.averageGas ||
               ops.add_liquidity?.averageGas ||
               220000,
      withdraw: ops.withdraw?.averageGas ||
                ops.unstake?.averageGas ||
                ops.remove_liquidity?.averageGas ||
                260000,
      claim: ops.claim?.averageGas ||
             ops.claim_rewards?.averageGas ||
             ops.collect_fees?.averageGas ||
             120000,
      compound: 0, // auto-compound typically doesn't require user gas
    };

    setTransactions(newTransactions);
  };

  // ガス代計算（USD）
  const calculateGasCost = (gasUnits: number) => {
    return (gasUnits * gasPrice * ethPrice) / 1e9;
  };

  // 年間のトランザクション回数を推定
  const [claimFrequency, setClaimFrequency] = useState('monthly'); // monthly, weekly, daily
  const claimCounts = {
    daily: 365,
    weekly: 52,
    monthly: 12,
    quarterly: 4,
    never: 0,
  };

  // 総ガス代計算
  const depositGas = calculateGasCost(transactions.deposit);
  const withdrawGas = calculateGasCost(transactions.withdraw);
  const claimGas = calculateGasCost(transactions.claim) * claimCounts[claimFrequency as keyof typeof claimCounts];
  const totalGasCost = depositGas + withdrawGas + claimGas;

  // 実効利回り計算
  const yearlyReturn = investmentAmount * (apy / 100);
  const netReturn = yearlyReturn - totalGasCost;
  const effectiveAPY = investmentAmount > 0 ? (netReturn / investmentAmount) * 100 : 0;

  // 損益分岐点計算（何日で元が取れるか）
  const breakEvenDays = totalGasCost > 0 ? Math.ceil((totalGasCost / yearlyReturn) * 365) : 0;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
            ⛽ Gas Fee Calculator
          </h1>
          <p className="text-gray-400">
            Calculate your real DeFi returns after gas fees
          </p>
        </div>

        {/* 現在のガス価格 */}
        <div className="bg-gray-900 rounded-2xl p-6 mb-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Current Network Status</h2>
            <span className={`px-3 py-1 rounded-full text-xs ${isLoading ? 'bg-gray-700' : 'bg-green-400/10 text-green-400 border border-green-400/20'}`}>
              {isLoading ? 'Loading...' : 'Live'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">Gas Price</p>
              <p className="text-2xl font-bold">{gasPrice} Gwei</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">ETH Price</p>
              <p className="text-2xl font-bold">${ethPrice.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Network</p>
              <p className="text-2xl font-bold">Ethereum</p>
            </div>
          </div>
        </div>

        {/* 投資詳細入力 */}
        <div className="bg-gray-900 rounded-2xl p-6 mb-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4">Investment Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Investment Amount (USD)
              </label>
              <input
                type="number"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-green-400 focus:outline-none transition-colors"
                placeholder="Enter amount..."
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Protocol APY (%)
              </label>
              <input
                type="number"
                value={apy}
                onChange={(e) => setApy(Number(e.target.value))}
                className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-green-400 focus:outline-none transition-colors"
                placeholder="Enter APY..."
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Protocol
              </label>
              <select
                value={selectedProtocol}
                onChange={(e) => setSelectedProtocol(e.target.value)}
                className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-green-400 focus:outline-none transition-colors"
              >
                <optgroup label="Lending">
                  <option value="aave-v3">Aave V3</option>
                  <option value="compound-v3">Compound V3</option>
                </optgroup>
                <optgroup label="Liquid Staking">
                  <option value="lido">Lido</option>
                  <option value="rocket-pool">Rocket Pool</option>
                </optgroup>
                <optgroup label="DEX">
                  <option value="uniswap-v3">Uniswap V3</option>
                  <option value="curve">Curve Finance</option>
                </optgroup>
                <optgroup label="General">
                  <option value="general">Other DeFi</option>
                </optgroup>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Claim Frequency
              </label>
              <select
                value={claimFrequency}
                onChange={(e) => setClaimFrequency(e.target.value)}
                className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-green-400 focus:outline-none transition-colors"
              >
                <option value="never">Never (Auto-compound)</option>
                <option value="quarterly">Quarterly (4x/year)</option>
                <option value="monthly">Monthly (12x/year)</option>
                <option value="weekly">Weekly (52x/year)</option>
                <option value="daily">Daily (365x/year)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ガスコスト内訳 */}
        <div className="bg-gray-900 rounded-2xl p-6 mb-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4">
            Transaction Gas Costs
            <span className="text-sm text-gray-400 ml-2 font-normal">
              (Based on {gasUsageData.protocols[selectedProtocol as keyof typeof gasUsageData.protocols]?.name || 'Protocol'} actual data)
            </span>
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <div>
                <span className="text-white">Deposit/Supply</span>
                <span className="text-xs text-gray-400 ml-2">({transactions.deposit.toLocaleString()} gas units)</span>
              </div>
              <span className="text-white font-medium">${depositGas.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <div>
                <span className="text-white">Withdraw</span>
                <span className="text-xs text-gray-400 ml-2">({transactions.withdraw.toLocaleString()} gas units)</span>
              </div>
              <span className="text-white font-medium">${withdrawGas.toFixed(2)}</span>
            </div>
            {claimFrequency !== 'never' && (
              <div className="flex justify-between items-center py-2">
                <div>
                  <span className="text-white">Claims/Rewards ({claimCounts[claimFrequency as keyof typeof claimCounts]}x/year)</span>
                  <span className="text-xs text-gray-400 ml-2">({transactions.claim.toLocaleString()} gas units each)</span>
                </div>
                <span className="text-white font-medium">${claimGas.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-3 border-t border-gray-700">
              <span className="text-lg font-semibold">Total Gas Cost (Annual)</span>
              <span className="text-lg font-bold text-red-400">${totalGasCost.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* 実効利回り計算結果 */}
        <div className={`rounded-2xl p-6 mb-6 border ${effectiveAPY > 0 ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
          <h2 className="text-xl font-semibold mb-4">Effective Returns</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span>Gross Annual Return</span>
              <span className="font-medium">${yearlyReturn.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span>Total Gas Costs</span>
              <span className="font-medium text-red-400">-${totalGasCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-t border-gray-600">
              <span className="text-lg font-semibold">Net Annual Return</span>
              <span className={`text-lg font-bold ${netReturn > 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${netReturn.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-lg font-semibold">Effective APY</span>
              <span className={`text-2xl font-bold ${effectiveAPY > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {effectiveAPY.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* 分析と推奨事項 */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold mb-3">💡 Analysis</h3>
          <div className="space-y-3">
            {breakEvenDays > 0 && (
              <p className="text-gray-300">
                • It will take approximately <span className="text-yellow-400 font-semibold">{breakEvenDays} days</span> to break even on gas costs
              </p>
            )}
            {totalGasCost > yearlyReturn * 0.5 && (
              <p className="text-gray-300">
                • ⚠️ Gas costs are eating <span className="text-red-400 font-semibold">{((totalGasCost / yearlyReturn) * 100).toFixed(1)}%</span> of your returns
              </p>
            )}
            {investmentAmount < 5000 && effectiveAPY < 2 && (
              <p className="text-gray-300">
                • Consider using <span className="text-blue-400">Layer 2 solutions</span> (Arbitrum, Optimism) for lower gas costs
              </p>
            )}
            {claimFrequency === 'daily' && (
              <p className="text-gray-300">
                • Daily claiming is expensive! Consider <span className="text-green-400">monthly or quarterly claims</span> to reduce gas costs
              </p>
            )}
          </div>
        </div>

        {/* Layer 2 比較（ヒント） */}
        <div className="mt-6 p-4 bg-blue-900/10 border border-blue-500/20 rounded-xl">
          <p className="text-sm text-blue-400">
            <span className="font-semibold">💡 Pro Tip:</span> Layer 2 networks like Arbitrum or Optimism can reduce gas costs by 90%+.
            For your ${investmentAmount} investment, you could save approximately ${(totalGasCost * 0.9).toFixed(2)} annually.
          </p>
        </div>

        {/* データソース情報 */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>Gas usage data based on actual transaction analysis • Last updated: {gasUsageData.lastUpdated}</p>
        </div>
      </div>
    </div>
  );
}