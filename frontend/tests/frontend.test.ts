import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';
import Home from '../src/pages/index';
import { ApiClient } from '../src/services/apiClient';
import { Effect } from 'effect';

// Mock the Effect API client
jest.mock('../src/services/apiClient', () => ({
  ApiClient: {
    getAllCosts: jest.fn(),
  },
}));

// Mock Effect.runPromise
const mockRunPromise = jest.fn();
jest.mock('effect', () => ({
  Effect: {
    gen: jest.fn((fn) => fn),
    runPromise: mockRunPromise,
  },
}));

describe('Frontend Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockCostEntries = [
    {
      id: '1',
      apiName: 'GPT-4',
      provider: 'OpenAI',
      cost: 0.03,
      currency: 'USD',
      timestamp: new Date('2023-12-01T10:00:00Z'),
      metadata: { tokens: 1500 },
    },
    {
      id: '2',
      apiName: 'Claude-3',
      provider: 'Anthropic',
      cost: 0.025,
      currency: 'USD',
      timestamp: new Date('2023-12-01T11:00:00Z'),
      metadata: { tokens: 1200 },
    },
  ];

  describe('Home Page', () => {
    test('should display loading state initially', () => {
      mockRunPromise.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<Home />);

      expect(screen.getByText('Loading costs...')).toBeInTheDocument();
    });

    test('should display cost entries when loaded successfully', async () => {
      mockRunPromise.mockResolvedValue(mockCostEntries);

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('API Cost Tracker')).toBeInTheDocument();
        expect(screen.getByText('Recent API Costs')).toBeInTheDocument();
      });

      // Check if cost entries are displayed
      expect(screen.getByText('GPT-4')).toBeInTheDocument();
      expect(screen.getByText('Claude-3')).toBeInTheDocument();
      expect(screen.getByText('OpenAI')).toBeInTheDocument();
      expect(screen.getByText('Anthropic')).toBeInTheDocument();
      expect(screen.getByText('0.0300 USD')).toBeInTheDocument();
      expect(screen.getByText('0.0250 USD')).toBeInTheDocument();
    });

    test('should display error message when loading fails', async () => {
      mockRunPromise.mockRejectedValue(new Error('API Error'));

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText(/Error: API Error/)).toBeInTheDocument();
      });
    });

    test('should display empty state when no costs are found', async () => {
      mockRunPromise.mockResolvedValue([]);

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('API Cost Tracker')).toBeInTheDocument();
        expect(
          screen.getByText('No cost entries found. Start tracking your API usage!')
        ).toBeInTheDocument();
      });
    });
  });

  describe('ApiClient Service', () => {
    test('should have the correct interface', () => {
      expect(typeof ApiClient).toBeDefined();
      expect(typeof ApiClient.getAllCosts).toBe('function');
    });
  });

  describe('Cost Entry Display', () => {
    test('should format cost values correctly', async () => {
      const costEntry = {
        id: '1',
        apiName: 'GPT-4',
        provider: 'OpenAI',
        cost: 0.123456,
        currency: 'USD',
        timestamp: new Date('2023-12-01T10:00:00Z'),
      };

      mockRunPromise.mockResolvedValue([costEntry]);

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('0.1235 USD')).toBeInTheDocument();
      });
    });

    test('should format timestamp correctly', async () => {
      const costEntry = {
        id: '1',
        apiName: 'GPT-4',
        provider: 'OpenAI',
        cost: 0.03,
        currency: 'USD',
        timestamp: new Date('2023-12-01T10:30:45Z'),
      };

      mockRunPromise.mockResolvedValue([costEntry]);

      render(<Home />);

      await waitFor(() => {
        // Check if timestamp is formatted (exact format may vary by locale)
        const timestampElement = screen.getByText(/12\/1\/2023|2023-12-01|Dec/);
        expect(timestampElement).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    test('should have proper CSS classes for responsive layout', async () => {
      mockRunPromise.mockResolvedValue(mockCostEntries);

      const { container } = render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('API Cost Tracker')).toBeInTheDocument();
      });

      // Check for responsive container classes
      const mainContainer = container.querySelector('.max-w-6xl');
      expect(mainContainer).toBeInTheDocument();

      const table = container.querySelector('.overflow-x-auto');
      expect(table).toBeInTheDocument();
    });
  });
});
