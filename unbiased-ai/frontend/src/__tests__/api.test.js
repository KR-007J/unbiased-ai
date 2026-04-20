import axios from 'axios';
import { trackApiCall, trackEvent } from '../utils/analytics';

// Mock dependencies
jest.mock('axios');
jest.mock('../utils/analytics');

const mockedAxios = axios;

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      upsert: jest.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  }))
}));

describe('API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Bias Detection API', () => {
    const mockApiResponse = {
      data: {
        success: true,
        data: {
          detected: true,
          biasInstances: [
            {
              phrase: 'he is a doctor',
              biasType: 'gender',
              severity: 'medium',
              explanation: 'Uses male pronouns as default',
              suggestion: 'they are a doctor'
            }
          ],
          overallAssessment: 'Contains gender bias'
        },
        meta: {
          processingTime: 1250,
          model: 'gemini-2.5-flash',
          cached: false
        }
      }
    };

    it('successfully analyzes text for bias', async () => {
      mockedAxios.post.mockResolvedValueOnce(mockApiResponse);

      const response = await axios.post('/api/detect-bias', {
        content: 'He is a doctor and she is a nurse',
        type: 'text'
      });

      expect(response).toEqual(mockApiResponse);
      expect(trackApiCall).toHaveBeenCalledWith(
        '/api/detect-bias',
        'POST',
        200,
        expect.any(Number)
      );
    });

    it('handles API errors gracefully', async () => {
      const errorResponse = {
        response: {
          status: 429,
          data: {
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Rate limit exceeded'
            }
          }
        }
      };

      mockedAxios.post.mockRejectedValueOnce(errorResponse);

      await expect(
        axios.post('/api/detect-bias', { content: 'test content' })
      ).rejects.toEqual(errorResponse);

      expect(trackEvent).toHaveBeenCalledWith('API Call', expect.objectContaining({
        endpoint: '/api/detect-bias',
        method: 'POST',
        status: 429
      }));
    });

    it('validates input content length', async () => {
      const longContent = 'a'.repeat(10001); // Exceeds max length

      await expect(
        axios.post('/api/detect-bias', { content: longContent })
      ).rejects.toThrow('Content exceeds maximum length');

      expect(trackEvent).not.toHaveBeenCalled();
    });

    it('caches frequent requests', async () => {
      const cacheHitResponse = {
        ...mockApiResponse,
        data: {
          ...mockApiResponse.data,
          meta: {
            ...mockApiResponse.data.meta,
            cached: true
          }
        }
      };

      mockedAxios.post.mockResolvedValueOnce(cacheHitResponse);

      const response = await axios.post('/api/detect-bias', {
        content: 'frequently requested content',
        cache: true
      });

      expect(response.data.meta.cached).toBe(true);
      expect(trackEvent).toHaveBeenCalledWith('Cache Hit', expect.any(Object));
    });
  });

  describe('Web Scan API', () => {
    it('successfully scans website for bias', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            url: 'https://example.com',
            cached: false,
            analysis: {
              detected: true,
              biasInstances: [],
              credibilityScore: 0.75
            },
            metadata: {
              title: 'Example Article',
              source: 'Example Publisher',
              publishedAt: '2026-04-20T10:00:00Z'
            }
          }
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const response = await axios.post('/api/web-scan', {
        url: 'https://example.com'
      });

      expect(response.data.data.url).toBe('https://example.com');
      expect(response.data.data.analysis.credibilityScore).toBe(0.75);
    });

    it('returns cached results for repeated URLs', async () => {
      const cachedResponse = {
        data: {
          success: true,
          data: {
            cached: true,
            cachedAt: '2026-04-20T09:00:00Z'
          }
        }
      };

      mockedAxios.post.mockResolvedValueOnce(cachedResponse);

      const response = await axios.post('/api/web-scan', {
        url: 'https://example.com'
      });

      expect(response.data.data.cached).toBe(true);
    });

    it('validates URL format', async () => {
      await expect(
        axios.post('/api/web-scan', { url: 'invalid-url' })
      ).rejects.toThrow('Invalid URL format');

      expect(trackEvent).not.toHaveBeenCalled();
    });
  });

  describe('Chat API', () => {
    it('maintains conversation context', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            message: 'That\'s an interesting perspective on bias detection.',
            conversationId: 'conv-123',
            tokensUsed: 45
          }
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const response = await axios.post('/api/chat', {
        message: 'How does bias detection work?',
        conversationId: 'conv-123'
      });

      expect(response.data.data.conversationId).toBe('conv-123');
      expect(response.data.data.tokensUsed).toBe(45);
    });

    it('handles streaming responses', async () => {
      const streamingResponse = {
        data: 'data: {"token": "The"}',
        headers: { 'content-type': 'text/event-stream' }
      };

      mockedAxios.post.mockResolvedValueOnce(streamingResponse);

      const response = await axios.post('/api/chat', {
        message: 'Explain bias',
        stream: true
      });

      expect(response.headers['content-type']).toBe('text/event-stream');
    });
  });

  describe('Batch Analysis API', () => {
    it('processes multiple texts in batch', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            batchId: 'batch-456',
            status: 'processing',
            totalItems: 10,
            processedItems: 0,
            webhookUrl: 'https://example.com/webhook'
          }
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const response = await axios.post('/api/batch-analyze', {
        texts: Array(10).fill('Sample text for analysis'),
        webhookUrl: 'https://example.com/webhook'
      });

      expect(response.data.data.totalItems).toBe(10);
      expect(response.data.data.status).toBe('processing');
    });

    it('limits batch size', async () => {
      const largeBatch = Array(101).fill('text'); // Exceeds limit

      await expect(
        axios.post('/api/batch-analyze', { texts: largeBatch })
      ).rejects.toThrow('Batch size exceeds maximum limit');

      expect(trackEvent).not.toHaveBeenCalled();
    });
  });

  describe('Forecast API', () => {
    it('generates bias trend predictions', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            period: '30day',
            biasType: 'political',
            probability: 0.65,
            severityTrend: 'increasing',
            confidenceScore: 0.82,
            recommendations: [
              'Consider reviewing recent content',
              'Implement additional bias checks'
            ]
          }
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const response = await axios.get('/api/forecast/political/30day');

      expect(response.data.data.probability).toBe(0.65);
      expect(response.data.data.severityTrend).toBe('increasing');
      expect(response.data.data.recommendations).toHaveLength(2);
    });
  });

  describe('Rate Limiting', () => {
    it('enforces rate limits', async () => {
      // Simulate rate limit exceeded
      const rateLimitError = {
        response: {
          status: 429,
          data: {
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Rate limit exceeded',
              retryAfter: 60
            }
          },
          headers: {
            'x-ratelimit-limit': '30',
            'x-ratelimit-remaining': '0',
            'x-ratelimit-reset': new Date(Date.now() + 60000).toISOString()
          }
        }
      };

      mockedAxios.post.mockRejectedValueOnce(rateLimitError);

      await expect(
        axios.post('/api/detect-bias', { content: 'test' })
      ).rejects.toEqual(rateLimitError);

      expect(trackEvent).toHaveBeenCalledWith('Rate Limit Hit', expect.any(Object));
    });

    it('includes rate limit headers in responses', async () => {
      const mockResponse = {
        data: { success: true },
        headers: {
          'x-ratelimit-limit': '30',
          'x-ratelimit-remaining': '29',
          'x-ratelimit-reset': '2026-04-20T20:00:00Z'
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const response = await axios.post('/api/detect-bias', { content: 'test' });

      expect(response.headers['x-ratelimit-limit']).toBe('30');
      expect(response.headers['x-ratelimit-remaining']).toBe('29');
    });
  });

  describe('Error Handling', () => {
    it('handles network errors', async () => {
      const networkError = new Error('Network Error');
      networkError.code = 'NETWORK_ERROR';

      mockedAxios.post.mockRejectedValueOnce(networkError);

      await expect(
        axios.post('/api/detect-bias', { content: 'test' })
      ).rejects.toThrow('Network Error');

      expect(trackEvent).toHaveBeenCalledWith('Network Error', expect.any(Object));
    });

    it('handles timeout errors', async () => {
      const timeoutError = new Error('Timeout');
      timeoutError.code = 'ECONNABORTED';

      mockedAxios.post.mockRejectedValueOnce(timeoutError);

      await expect(
        axios.post('/api/detect-bias', { content: 'test' })
      ).rejects.toThrow('Timeout');

      expect(trackEvent).toHaveBeenCalledWith('Timeout Error', expect.any(Object));
    });

    it('handles server errors', async () => {
      const serverError = {
        response: {
          status: 500,
          data: {
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Internal server error'
            }
          }
        }
      };

      mockedAxios.post.mockRejectedValueOnce(serverError);

      await expect(
        axios.post('/api/detect-bias', { content: 'test' })
      ).rejects.toEqual(serverError);

      expect(trackEvent).toHaveBeenCalledWith('Server Error', expect.any(Object));
    });
  });
});
