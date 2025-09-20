// Lido APR Fetcher Unit Tests

import { fetchLidoAPR } from '@/lib/data/protocols/lido';

// Mock fetch
global.fetch = jest.fn();

describe('Lido APR Fetcher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('Successful API calls', () => {
    it('should fetch APR from official API successfully', async () => {
      const mockAPR = 3.8;
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            timeUnix: Date.now(),
            apr: mockAPR,
            apr7d: 3.7,
            apr30d: 3.9
          }
        })
      });

      const result = await fetchLidoAPR();

      expect(result).toBe(mockAPR);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://stake.lido.fi/api/steth-apr',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
          next: { revalidate: 300 }
        })
      );
    });

    it('should return APR within realistic range', async () => {
      const mockAPR = 3.5;
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { apr: mockAPR }
        })
      });

      const result = await fetchLidoAPR();

      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(20); // Realistic APR range
    });
  });

  describe('Error handling', () => {
    it('should return null on API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const result = await fetchLidoAPR();

      expect(result).toBeNull();
    });

    it('should return null on network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await fetchLidoAPR();

      expect(result).toBeNull();
    });

    it('should return null on invalid response format', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          // Missing data field
          apr: 3.5
        })
      });

      const result = await fetchLidoAPR();

      expect(result).toBeNull();
    });

    it('should return null when APR is not a number', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { apr: 'invalid' }
        })
      });

      const result = await fetchLidoAPR();

      expect(result).toBeNull();
    });
  });

  describe('Timeout handling', () => {
    it('should timeout after 5 seconds', async () => {
      jest.useFakeTimers();

      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise((resolve) => {
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ data: { apr: 3.5 } })
          }), 10000); // 10 second delay
        })
      );

      const promise = fetchLidoAPR();
      jest.advanceTimersByTime(6000); // Advance past 5 second timeout

      const result = await promise;

      expect(result).toBeNull();
      jest.useRealTimers();
    });
  });
});