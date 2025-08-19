import { jest } from '@jest/globals';

// Mock pg Pool before importing the service - shared instance returned by constructor
const mockPool = {
  query: jest.fn()
};

jest.mock('pg', () => ({
  Pool: jest.fn(() => mockPool)
}));

// Import after mocking
import HistoryService from '../../services/historyService.js';

describe('History Service', () => {
  let historyService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create history service instance
    historyService = new HistoryService();
    historyService.pool = mockPool;
  });

  describe('Store Metric', () => {
    test('should store metric successfully', async () => {
      const mockResult = {
        rows: [{ id: 1 }]
      };

      mockPool.query.mockResolvedValueOnce(mockResult);

      const result = await historyService.storeMetric(
        '1234567890',
        'youtube',
        'test-channel-id',
        'subscribers',
        1000
      );

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO platform_history'),
        ['1234567890', 'youtube', 'test-channel-id', 'subscribers', 1000]
      );
      expect(result).toEqual(mockResult.rows[0]);
    });

    test('should store metric with specific date', async () => {
      const specificDate = new Date('2024-01-01');
      const mockResult = {
        rows: [{ id: 1 }]
      };

      mockPool.query.mockResolvedValueOnce(mockResult);

      const result = await historyService.storeMetric(
        '1234567890',
        'youtube',
        'test-channel-id',
        'subscribers',
        1000,
        specificDate
      );

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO platform_history'),
        ['1234567890', 'youtube', 'test-channel-id', 'subscribers', 1000, specificDate]
      );
      expect(result).toEqual(mockResult.rows[0]);
    });

    test('should handle database errors in store metric', async () => {
      const dbError = new Error('Database error');
      mockPool.query.mockRejectedValueOnce(dbError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(historyService.storeMetric(
        '1234567890',
        'youtube',
        'test-channel-id',
        'subscribers',
        1000
      )).rejects.toThrow('Database error');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error storing platform metric:',
        dbError
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Get Historical Data', () => {
    test('should get historical data successfully', async () => {
      const mockHistoricalData = [
        { metric_value: 1000, recorded_at: new Date('2024-01-01') },
        { metric_value: 1100, recorded_at: new Date('2024-01-02') }
      ];

      mockPool.query.mockResolvedValueOnce({
        rows: mockHistoricalData
      });

      const result = await historyService.getHistoricalData(
        '1234567890',
        'youtube',
        'test-channel-id',
        'subscribers',
        30
      );

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT metric_value, recorded_at'),
        ['1234567890', 'youtube', 'test-channel-id', 'subscribers']
      );
      expect(result).toEqual(mockHistoricalData);
    });

    test('should return empty array for no historical data', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: []
      });

      const result = await historyService.getHistoricalData(
        '1234567890',
        'youtube',
        'test-channel-id',
        'subscribers'
      );

      expect(result).toEqual([]);
    });

    test('should handle database errors in get historical data', async () => {
      const dbError = new Error('Database error');
      mockPool.query.mockRejectedValueOnce(dbError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await historyService.getHistoricalData(
        '1234567890',
        'youtube',
        'test-channel-id',
        'subscribers'
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error retrieving historical data:',
        dbError
      );
      expect(result).toEqual([]);

      consoleSpy.mockRestore();
    });
  });

  describe('Calculate Growth Rate', () => {
    test('should calculate growth rate successfully', async () => {
      const mockHistoricalData = [
        { metric_value: 1000, recorded_at: new Date('2024-01-01') },
        { metric_value: 1100, recorded_at: new Date('2024-01-02') }
      ];

      mockPool.query.mockResolvedValueOnce({
        rows: mockHistoricalData
      });

      const result = await historyService.calculateGrowthRate(
        '1234567890',
        'youtube',
        'test-channel-id',
        'subscribers',
        1200
      );

      // Growth rate should be calculated as: ((1200 - 1000) / 1000) * 100 = 20%
      expect(result).toBe(20);
    });

    test('should return 0 for no historical data', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: []
      });

      const result = await historyService.calculateGrowthRate(
        '1234567890',
        'youtube',
        'test-channel-id',
        'subscribers',
        1200
      );

      expect(result).toBe(0);
    });

    test('should return 0 for zero oldest value', async () => {
      const mockHistoricalData = [
        { metric_value: 0, recorded_at: new Date('2024-01-01') }
      ];

      mockPool.query.mockResolvedValueOnce({
        rows: mockHistoricalData
      });

      const result = await historyService.calculateGrowthRate(
        '1234567890',
        'youtube',
        'test-channel-id',
        'subscribers',
        1200
      );

      expect(result).toBe(0);
    });

    test('should return 0 for same current and oldest value', async () => {
      const mockHistoricalData = [
        { metric_value: 1000, recorded_at: new Date('2024-01-01') }
      ];

      mockPool.query.mockResolvedValueOnce({
        rows: mockHistoricalData
      });

      const result = await historyService.calculateGrowthRate(
        '1234567890',
        'youtube',
        'test-channel-id',
        'subscribers',
        1000
      );

      expect(result).toBe(0);
    });

    test('should handle database errors in growth rate calculation', async () => {
      const dbError = new Error('Database error');
      mockPool.query.mockRejectedValueOnce(dbError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await historyService.calculateGrowthRate(
        '1234567890',
        'youtube',
        'test-channel-id',
        'subscribers',
        1200
      );

      // In calculateGrowthRate, errors from inner getHistoricalData are logged as 'Error retrieving historical data:'
      expect(consoleSpy).toHaveBeenCalled();
      expect(result).toBe(0);

      consoleSpy.mockRestore();
    });
  });

  describe('Data Validation', () => {
    test('should handle large metric values', async () => {
      const largeValue = 1000000000;
      const mockResult = {
        rows: [{ id: 1 }]
      };

      mockPool.query.mockResolvedValueOnce(mockResult);

      const result = await historyService.storeMetric(
        '1234567890',
        'youtube',
        'test-channel-id',
        'subscribers',
        largeValue
      );

      expect(result).toEqual(mockResult.rows[0]);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['1234567890', 'youtube', 'test-channel-id', 'subscribers', largeValue]
      );
    });
  });
});
