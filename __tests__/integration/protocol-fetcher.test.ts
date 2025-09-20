// Protocol Data Fetcher Integration Tests

import { ProtocolDataFetcher } from '@/lib/data/protocol-fetcher';

// Mock the individual protocol fetchers
jest.mock('@/lib/data/protocols/lido', () => ({
  fetchLidoAPR: jest.fn()
}));

jest.mock('@/lib/data/protocols/compound-v3', () => ({
  fetchCompoundAPY: jest.fn()
}));

jest.mock('@/lib/data/protocols/aave-v3', () => ({
  fetchAaveAPY: jest.fn()
}));

jest.mock('@/lib/data/apy-fetcher', () => ({
  getProtocolAPY: jest.fn()
}));

jest.mock('@/lib/monitoring/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    logCacheHit: jest.fn(),
    logAPISuccess: jest.fn(),
    logAPIFailure: jest.fn()
  }
}));

import { fetchLidoAPR } from '@/lib/data/protocols/lido';
import { fetchCompoundAPY } from '@/lib/data/protocols/compound-v3';
import { fetchAaveAPY } from '@/lib/data/protocols/aave-v3';
import { getProtocolAPY } from '@/lib/data/apy-fetcher';

describe('ProtocolDataFetcher Integration', () => {
  let fetcher: ProtocolDataFetcher;

  beforeEach(() => {
    jest.clearAllMocks();
    fetcher = new ProtocolDataFetcher();
  });

  describe('Protocol-specific API fetching', () => {
    it('should fetch Lido data and cache it', async () => {
      const mockAPY = 3.8;
      (fetchLidoAPR as jest.Mock).mockResolvedValue(mockAPY);

      // First fetch - from API
      const data1 = await fetcher.fetch('lido');

      expect(data1).toMatchObject({
        id: 'lido',
        apy: mockAPY,
        source: 'protocol',
        fromCache: false
      });
      expect(fetchLidoAPR).toHaveBeenCalledTimes(1);

      // Second fetch - from cache
      const data2 = await fetcher.fetch('lido');

      expect(data2).toMatchObject({
        id: 'lido',
        apy: mockAPY,
        fromCache: true
      });
      expect(fetchLidoAPR).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should fetch Compound V3 data', async () => {
      const mockAPY = 2.5;
      (fetchCompoundAPY as jest.Mock).mockResolvedValue(mockAPY);

      const data = await fetcher.fetch('compound-v3');

      expect(data).toMatchObject({
        id: 'compound-v3',
        apy: mockAPY,
        source: 'protocol'
      });
    });

    it('should fetch Aave V3 data', async () => {
      const mockAPY = 3.2;
      (fetchAaveAPY as jest.Mock).mockResolvedValue(mockAPY);

      const data = await fetcher.fetch('aave-v3');

      expect(data).toMatchObject({
        id: 'aave-v3',
        apy: mockAPY,
        source: 'protocol'
      });
    });
  });

  describe('Fallback mechanism', () => {
    it('should fallback to DeFiLlama when protocol API fails', async () => {
      (fetchLidoAPR as jest.Mock).mockResolvedValue(null);
      (getProtocolAPY as jest.Mock).mockResolvedValue({
        apy: 3.5,
        pools: []
      });

      const data = await fetcher.fetch('lido');

      expect(data).toMatchObject({
        id: 'lido',
        apy: 3.5,
        source: 'defillama'
      });
      expect(fetchLidoAPR).toHaveBeenCalled();
      expect(getProtocolAPY).toHaveBeenCalledWith('lido');
    });

    it('should use expired cache as last resort', async () => {
      const mockAPY = 3.8;
      (fetchLidoAPR as jest.Mock).mockResolvedValue(mockAPY);

      // Initial fetch to populate cache
      await fetcher.fetch('lido');

      // Simulate cache expiration by advancing time
      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 10 * 60 * 1000); // 10 minutes later

      // Mock all data sources to fail
      (fetchLidoAPR as jest.Mock).mockResolvedValue(null);
      (getProtocolAPY as jest.Mock).mockResolvedValue({
        apy: null,
        pools: []
      });

      const data = await fetcher.fetch('lido');

      expect(data).toMatchObject({
        source: 'fallback',
        fromCache: true
      });
    });

    it('should return null APY when all sources fail', async () => {
      (fetchCompoundAPY as jest.Mock).mockResolvedValue(null);
      (getProtocolAPY as jest.Mock).mockResolvedValue({
        apy: null,
        pools: []
      });

      const data = await fetcher.fetch('compound-v3');

      expect(data).toMatchObject({
        id: 'compound-v3',
        apy: null,
        source: 'fallback'
      });
    });
  });

  describe('Batch fetching', () => {
    it('should fetch multiple protocols in parallel', async () => {
      (fetchLidoAPR as jest.Mock).mockResolvedValue(3.8);
      (fetchCompoundAPY as jest.Mock).mockResolvedValue(2.5);
      (fetchAaveAPY as jest.Mock).mockResolvedValue(3.2);

      const results = await fetcher.fetchMultiple(['lido', 'compound-v3', 'aave-v3']);

      expect(results.size).toBe(3);
      expect(results.get('lido')?.apy).toBe(3.8);
      expect(results.get('compound-v3')?.apy).toBe(2.5);
      expect(results.get('aave-v3')?.apy).toBe(3.2);
    });
  });

  describe('Cache management', () => {
    it('should clear cache for specific protocol', async () => {
      (fetchLidoAPR as jest.Mock).mockResolvedValue(3.8);

      // Fetch to populate cache
      await fetcher.fetch('lido');

      // Clear cache
      fetcher.clearCache('lido');

      // Next fetch should call API again
      await fetcher.fetch('lido');

      expect(fetchLidoAPR).toHaveBeenCalledTimes(2);
    });

    it('should clear all cache', async () => {
      (fetchLidoAPR as jest.Mock).mockResolvedValue(3.8);
      (fetchCompoundAPY as jest.Mock).mockResolvedValue(2.5);

      // Fetch to populate cache
      await fetcher.fetch('lido');
      await fetcher.fetch('compound-v3');

      // Clear all cache
      fetcher.clearCache();

      // Next fetches should call APIs again
      await fetcher.fetch('lido');
      await fetcher.fetch('compound-v3');

      expect(fetchLidoAPR).toHaveBeenCalledTimes(2);
      expect(fetchCompoundAPY).toHaveBeenCalledTimes(2);
    });
  });

  describe('Protocol-specific TTL', () => {
    it('should respect different TTL for different protocols', async () => {
      // This test would require mocking time progression
      // and verifying cache expiration at different intervals
      const fetcher = new ProtocolDataFetcher();

      // Lido has 5 minute TTL
      // Compound V3 has 10 minute TTL

      (fetchLidoAPR as jest.Mock).mockResolvedValue(3.8);
      (fetchCompoundAPY as jest.Mock).mockResolvedValue(2.5);

      // Initial fetch
      await fetcher.fetch('lido');
      await fetcher.fetch('compound-v3');

      // Advance time by 6 minutes (Lido expired, Compound still cached)
      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 6 * 60 * 1000);

      await fetcher.fetch('lido');
      await fetcher.fetch('compound-v3');

      // Lido should be fetched again, Compound should use cache
      expect(fetchLidoAPR).toHaveBeenCalledTimes(2);
      expect(fetchCompoundAPY).toHaveBeenCalledTimes(1);
    });
  });
});