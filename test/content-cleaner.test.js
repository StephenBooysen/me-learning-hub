/**
 * Unit Tests for Content Cleaner
 */

const ContentCleaner = require('../electron/app/js/content-cleaner');
const ClaudeClient = require('../electron/app/js/claude-client');

jest.mock('../electron/app/js/claude-client');

describe('ContentCleaner', () => {
  let contentCleaner;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mock responses
    ClaudeClient.prototype.request = jest.fn()
      .mockResolvedValue({
        content: [{ text: 'Mocked response' }]
      });
    contentCleaner = new ContentCleaner(mockApiKey);
  });

  describe('Constructor', () => {
    test('should throw error if API key is missing', () => {
      expect(() => new ContentCleaner(null))
        .toThrow('Claude API key is required for content cleaning');
    });

    test('should throw error if API key is empty', () => {
      expect(() => new ContentCleaner(''))
        .toThrow('Claude API key is required for content cleaning');
    });

    test('should create ContentCleaner instance with valid API key', () => {
      const cleaner = new ContentCleaner('valid-key');
      expect(cleaner).toBeDefined();
      expect(cleaner.claudeClient).toBeDefined();
    });
  });

  describe('Content Cleaning', () => {
    test('should throw error if content is empty', async () => {
      await expect(contentCleaner.cleanContent(''))
        .rejects.toThrow('Content is required for cleaning');
    });

    test('should throw error if content is only whitespace', async () => {
      await expect(contentCleaner.cleanContent('   \n\n  '))
        .rejects.toThrow('Content is required for cleaning');
    });

    test('should clean content successfully', async () => {
      ClaudeClient.prototype.request = jest.fn()
        .mockResolvedValueOnce({
          content: [{ text: '# Cleaned Content\n\nThis is cleaned.' }]
        })
        .mockResolvedValueOnce({
          content: [{ text: 'SCORE: 8 - Well structured content' }]
        });

      const result = await contentCleaner.cleanContent('Raw content with noise');

      expect(result.success).toBe(true);
      expect(result.cleaned).toBe('# Cleaned Content\n\nThis is cleaned.');
      expect(result.qualityScore).toBe(8);
      expect(result.isValid).toBe(true);
      expect(result.contentLength).toBeGreaterThan(0);
      expect(result.wordCount).toBeGreaterThan(0);
    });

    test('should extract quality score from validation response', async () => {
      ClaudeClient.prototype.request = jest.fn()
        .mockResolvedValueOnce({
          content: [{ text: 'Cleaned content' }]
        })
        .mockResolvedValueOnce({
          content: [{ text: 'SCORE: 7 - Good quality' }]
        });

      const result = await contentCleaner.cleanContent('Some content');

      expect(result.qualityScore).toBe(7);
    });

    test('should default quality score if parsing fails', async () => {
      ClaudeClient.prototype.request = jest.fn()
        .mockResolvedValueOnce({
          content: [{ text: 'Cleaned content' }]
        })
        .mockResolvedValueOnce({
          content: [{ text: 'Invalid response format' }]
        });

      const result = await contentCleaner.cleanContent('Content');

      expect(result.qualityScore).toBe(5);
    });

    test('should mark content as invalid if quality score < 5', async () => {
      ClaudeClient.prototype.request = jest.fn()
        .mockResolvedValueOnce({
          content: [{ text: 'Poor content' }]
        })
        .mockResolvedValueOnce({
          content: [{ text: 'SCORE: 3 - Too short' }]
        });

      const result = await contentCleaner.cleanContent('Minimal content');

      expect(result.isValid).toBe(false);
      expect(result.qualityScore).toBe(3);
    });

    test('should include validation message', async () => {
      const validationMessage = 'SCORE: 7 - Excellent structure';
      ClaudeClient.prototype.request = jest.fn()
        .mockResolvedValueOnce({
          content: [{ text: 'Cleaned' }]
        })
        .mockResolvedValueOnce({
          content: [{ text: validationMessage }]
        });

      const result = await contentCleaner.cleanContent('Content');

      expect(result.validation).toBe(validationMessage);
    });

    test('should throw error on API failure', async () => {
      ClaudeClient.prototype.request = jest.fn()
        .mockRejectedValueOnce(new Error('API Error'));

      await expect(contentCleaner.cleanContent('Content'))
        .rejects.toThrow('Failed to clean content');
    });
  });

  describe('Topic Extraction', () => {
    test('should throw error if content is empty', async () => {
      await expect(contentCleaner.extractTopics(''))
        .rejects.toThrow('Content is required');
    });

    test('should extract topics successfully', async () => {
      ClaudeClient.prototype.request = jest.fn()
        .mockResolvedValueOnce({
          content: [{ text: '1. Topic 1\n2. Topic 2\n3. Topic 3' }]
        });

      const result = await contentCleaner.extractTopics('Content about topics');

      expect(result.success).toBe(true);
      expect(result.topics.length).toBeGreaterThan(0);
      expect(result.count).toBeGreaterThan(0);
    });

    test('should respect numTopics parameter', async () => {
      ClaudeClient.prototype.request = jest.fn()
        .mockResolvedValueOnce({
          content: [{ text: '1. A\n2. B\n3. C\n4. D\n5. E' }]
        });

      const result = await contentCleaner.extractTopics('Content', 3);

      expect(result.topics.length).toBeLessThanOrEqual(3);
    });

    test('should filter empty lines from topics', async () => {
      ClaudeClient.prototype.request = jest.fn()
        .mockResolvedValueOnce({
          content: [{ text: '1. Topic A\n\n2. Topic B\n\n\n3. Topic C' }]
        });

      const result = await contentCleaner.extractTopics('Content');

      expect(result.topics.every(t => t.trim())).toBe(true);
    });

    test('should throw error on API failure', async () => {
      ClaudeClient.prototype.request = jest.fn()
        .mockRejectedValueOnce(new Error('API Error'));

      await expect(contentCleaner.extractTopics('Content'))
        .rejects.toThrow('Failed to extract topics');
    });
  });

  describe('Title Suggestion', () => {
    test('should throw error if content is empty', async () => {
      await expect(contentCleaner.suggestTitle(''))
        .rejects.toThrow('Content is required');
    });

    test('should suggest title for new content', async () => {
      ClaudeClient.prototype.request = jest.fn()
        .mockResolvedValueOnce({
          content: [{ text: 'Understanding Machine Learning' }]
        });

      const result = await contentCleaner.suggestTitle('Content about ML');

      expect(result.success).toBe(true);
      expect(result.title).toBeDefined();
      expect(result.title.length).toBeGreaterThan(0);
    });

    test('should improve existing title', async () => {
      ClaudeClient.prototype.request = jest.fn()
        .mockResolvedValueOnce({
          content: [{ text: 'Advanced Machine Learning Concepts' }]
        });

      const result = await contentCleaner.suggestTitle('Content', 'ML');

      expect(result.success).toBe(true);
      expect(result.original).toBe('ML');
    });

    test('should remove surrounding quotes from title', async () => {
      ClaudeClient.prototype.request = jest.fn()
        .mockResolvedValueOnce({
          content: [{ text: '"Machine Learning Guide"' }]
        });

      const result = await contentCleaner.suggestTitle('Content');

      expect(result.title).toBe('Machine Learning Guide');
    });

    test('should limit title length to 200 characters', async () => {
      const longTitle = 'x'.repeat(300);
      ClaudeClient.prototype.request = jest.fn()
        .mockResolvedValueOnce({
          content: [{ text: longTitle }]
        });

      const result = await contentCleaner.suggestTitle('Content');

      expect(result.title.length).toBeLessThanOrEqual(200);
    });

    test('should throw error on API failure', async () => {
      ClaudeClient.prototype.request = jest.fn()
        .mockRejectedValueOnce(new Error('API Error'));

      await expect(contentCleaner.suggestTitle('Content'))
        .rejects.toThrow('Failed to suggest title');
    });
  });

  describe('Content Analysis', () => {
    test('should throw error if content is empty', async () => {
      await expect(contentCleaner.analyzeContent(''))
        .rejects.toThrow('Content is required for analysis');
    });

    test('should perform comprehensive analysis', async () => {
      ClaudeClient.prototype.request = jest.fn()
        .mockResolvedValueOnce({ // Clean
          content: [{ text: 'Cleaned content' }]
        })
        .mockResolvedValueOnce({ // Validate
          content: [{ text: 'SCORE: 8 - Quality' }]
        })
        .mockResolvedValueOnce({ // Topics
          content: [{ text: 'Topic1\nTopic2\nTopic3' }]
        })
        .mockResolvedValueOnce({ // Title
          content: [{ text: 'Suggested Title' }]
        });

      const result = await contentCleaner.analyzeContent('Raw content', 'Original Title', 'https://example.com');

      expect(result.success).toBe(true);
      expect(result.isValid).toBe(true);
      expect(result.content).toBe('Cleaned content');
      expect(result.title).toBe('Suggested Title');
      expect(result.originalTitle).toBe('Original Title');
      expect(result.topics).toBeDefined();
      expect(result.wordCount).toBeGreaterThan(0);
      expect(result.qualityScore).toBe(8);
      expect(result.pageUrl).toBe('https://example.com');
      expect(result.analyzedAt).toBeTruthy();
    });

    test('should return invalid result if quality score too low', async () => {
      ClaudeClient.prototype.request = jest.fn()
        .mockResolvedValueOnce({ // Clean
          content: [{ text: 'Minimal content' }]
        })
        .mockResolvedValueOnce({ // Validate
          content: [{ text: 'SCORE: 2 - Too short' }]
        });

      const result = await contentCleaner.analyzeContent('Minimal');

      expect(result.success).toBe(false);
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Content quality score too low');
      expect(result.qualityScore).toBe(2);
    });

    test('should use page title as original title', async () => {
      ClaudeClient.prototype.request = jest.fn()
        .mockResolvedValueOnce({ content: [{ text: 'Content' }] })
        .mockResolvedValueOnce({ content: [{ text: 'SCORE: 7' }] })
        .mockResolvedValueOnce({ content: [{ text: 'Topic' }] })
        .mockResolvedValueOnce({ content: [{ text: 'New Title' }] });

      const result = await contentCleaner.analyzeContent('Content', 'My Page Title');

      expect(result.originalTitle).toBe('My Page Title');
    });

    test('should include page URL in analysis', async () => {
      ClaudeClient.prototype.request = jest.fn()
        .mockResolvedValueOnce({ content: [{ text: 'Content' }] })
        .mockResolvedValueOnce({ content: [{ text: 'SCORE: 7' }] })
        .mockResolvedValueOnce({ content: [{ text: 'Topic' }] })
        .mockResolvedValueOnce({ content: [{ text: 'Title' }] });

      const url = 'https://github.com/example';
      const result = await contentCleaner.analyzeContent('Content', undefined, url);

      expect(result.pageUrl).toBe(url);
    });

    test('should throw error if any API call fails', async () => {
      ClaudeClient.prototype.request = jest.fn()
        .mockResolvedValueOnce({ content: [{ text: 'Content' }] })
        .mockResolvedValueOnce({ content: [{ text: 'SCORE: 7' }] })
        .mockRejectedValueOnce(new Error('Topics API failed'));

      await expect(contentCleaner.analyzeContent('Content'))
        .rejects.toThrow('Failed to analyze content');
    });
  });

  describe('API Request Verification', () => {
    test('should send correct model to cleaning API', async () => {
      ClaudeClient.prototype.request = jest.fn()
        .mockResolvedValue({ content: [{ text: 'Response' }] });

      contentCleaner.claudeClient.model = 'claude-opus-4-5';
      await contentCleaner.cleanContent('Content');

      expect(ClaudeClient.prototype.request).toHaveBeenCalledWith(
        '/v1/messages',
        'POST',
        expect.objectContaining({
          model: 'claude-opus-4-5'
        })
      );
    });

    test('should limit API response tokens appropriately', async () => {
      ClaudeClient.prototype.request = jest.fn()
        .mockResolvedValue({ content: [{ text: 'Response' }] });

      await contentCleaner.cleanContent('Content');

      const cleanCall = ClaudeClient.prototype.request.mock.calls[0][2];
      expect(cleanCall.max_tokens).toBe(4000);

      const validateCall = ClaudeClient.prototype.request.mock.calls[1][2];
      expect(validateCall.max_tokens).toBe(500);
    });
  });
});
