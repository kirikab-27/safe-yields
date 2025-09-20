// Compound V3 APY Fetcher Unit Tests

import { fetchCompoundAPY, calculateWeightedAPY } from '@/lib/data/protocols/compound-v3';

// Mock fetch
global.fetch = jest.fn();

describe('Compound V3 APY Fetcher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchCompoundAPY', () => {
    it('should fetch APY from official API successfully', async () => {
      const mockAPY = '3.5';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          market: {
            totalSupplyUsd: '1000000',
            totalBorrowUsd: '500000',
            supplyApr: mockAPY,
            borrowApr: '5.0',
            asset: 'USDC'
          }
        })
      });

      const result = await fetchCompoundAPY();

      expect(result).toBe(parseFloat(mockAPY));
    });

    it('should return null when TVL is below $1000', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          market: {
            totalSupplyUsd: '500', // Below threshold
            supplyApr: '3.5'
          }
        })
      });

      const result = await fetchCompoundAPY();

      expect(result).toBeNull();
    });

    it('should try multiple endpoints on failure', async () => {
      // First endpoint fails
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      // Second endpoint succeeds
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [{
          totalSupplyUsd: '2000000',
          supplyApr: '3.0'
        }]
      });

      const result = await fetchCompoundAPY();

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result).toBe(3.0);
    });

    it('should return null when all endpoints fail', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await fetchCompoundAPY();

      expect(result).toBeNull();
    });
  });

  describe('calculateWeightedAPY', () => {
    it('should calculate weighted average correctly', () => {
      const markets = [
        {
          totalSupplyUsd: '2000000',
          totalBorrowUsd: '1000000',
          supplyApr: '3.0',
          borrowApr: '5.0',
          asset: 'USDC'
        },
        {
          totalSupplyUsd: '1000000',
          totalBorrowUsd: '500000',
          supplyApr: '4.5',
          borrowApr: '6.0',
          asset: 'WETH'
        }
      ];

      const result = calculateWeightedAPY(markets);

      // Expected: (3.0 * 2M + 4.5 * 1M) / 3M = 3.5
      expect(result).toBeCloseTo(3.5, 2);
    });

    it('should filter out markets with TVL below $1M', () => {
      const markets = [
        {
          totalSupplyUsd: '2000000',
          supplyApr: '3.0',
          totalBorrowUsd: '0',
          borrowApr: '0',
          asset: 'USDC'
        },
        {
          totalSupplyUsd: '500000', // Below $1M threshold
          supplyApr: '10.0',
          totalBorrowUsd: '0',
          borrowApr: '0',
          asset: 'TEST'
        }
      ];

      const result = calculateWeightedAPY(markets);

      // Only first market should be considered
      expect(result).toBe(3.0);
    });

    it('should return null for empty markets array', () => {
      const result = calculateWeightedAPY([]);
      expect(result).toBeNull();
    });

    it('should return null when no valid markets exist', () => {
      const markets = [
        {
          totalSupplyUsd: '0',
          supplyApr: '3.0',
          totalBorrowUsd: '0',
          borrowApr: '0',
          asset: 'TEST1'
        },
        {
          totalSupplyUsd: '1000000',
          supplyApr: '0', // Zero APR
          totalBorrowUsd: '0',
          borrowApr: '0',
          asset: 'TEST2'
        }
      ];

      const result = calculateWeightedAPY(markets);
      expect(result).toBeNull();
    });
  });
});