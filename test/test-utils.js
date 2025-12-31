/**
 * Unit Tests for Utils Module
 */

const {
  generateUUID,
  formatISO8601,
  formatDate,
  formatDateShort,
  parseFrontmatter,
  createFrontmatter,
  createProjectMetadata,
  createDocumentMetadata,
  createStudyPlanMetadata,
  createStudySessionMetadata,
  sanitizeFilename,
  deepClone,
  debounce,
  formatFileSize,
  truncateText,
  isValidJSON
} = require('../electron/app/js/utils');

describe('Utils Module', () => {
  describe('generateUUID', () => {
    test('should generate a valid UUID v4', () => {
      const uuid = generateUUID();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    test('should generate different UUIDs', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });

    test('should have correct length', () => {
      const uuid = generateUUID();
      expect(uuid.length).toBe(36);
    });
  });

  describe('formatISO8601', () => {
    test('should format date to ISO 8601 string', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = formatISO8601(date);
      expect(result).toBe('2024-01-15T10:30:00.000Z');
    });

    test('should use current date if not provided', () => {
      const result = formatISO8601();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('formatDate', () => {
    test('should format date for display', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = formatDate(date);
      expect(result).toMatch(/Jan 15, 2024/);
    });

    test('should include time', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = formatDate(date);
      expect(result).toMatch(/\d{2}:\d{2}/);
    });
  });

  describe('formatDateShort', () => {
    test('should format date in short format', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = formatDateShort(date);
      expect(result).toBe('Jan 15, 2024');
    });

    test('should not include time', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = formatDateShort(date);
      expect(result).not.toMatch(/\d{2}:\d{2}/);
    });
  });

  describe('parseFrontmatter', () => {
    test('should parse frontmatter and content', () => {
      const markdown = '---\ntitle: Test\nauthor: John\n---\nContent here';
      const result = parseFrontmatter(markdown);
      expect(result.metadata.title).toBe('Test');
      expect(result.metadata.author).toBe('John');
      expect(result.content).toBe('Content here');
    });

    test('should handle missing frontmatter', () => {
      const content = 'Just content';
      const result = parseFrontmatter(content);
      expect(result.metadata).toEqual({});
      expect(result.content).toBe('Just content');
    });

    test('should handle quoted values', () => {
      const markdown = '---\ntitle: "Test Title"\n---\nContent';
      const result = parseFrontmatter(markdown);
      expect(result.metadata.title).toBe('Test Title');
    });

    test('should handle empty frontmatter', () => {
      const markdown = '---\n---\nContent';
      const result = parseFrontmatter(markdown);
      expect(result.content).toContain('Content');
    });
  });

  describe('createFrontmatter', () => {
    test('should create frontmatter from metadata object', () => {
      const metadata = { title: 'Test', author: 'John' };
      const result = createFrontmatter(metadata);
      expect(result).toContain('---');
      expect(result).toContain('title: Test');
      expect(result).toContain('author: John');
    });

    test('should quote values with colons', () => {
      const metadata = { url: 'https://example.com' };
      const result = createFrontmatter(metadata);
      expect(result).toContain('"https://example.com"');
    });

    test('should start and end with frontmatter markers', () => {
      const metadata = { test: 'value' };
      const result = createFrontmatter(metadata);
      expect(result.startsWith('---\n')).toBe(true);
      expect(result.endsWith('---\n')).toBe(true);
    });
  });

  describe('createProjectMetadata', () => {
    test('should create project metadata with required fields', () => {
      const result = createProjectMetadata('My Project', 'Test description');
      expect(result).toContain('title: My Project');
      expect(result).toContain('description: Test description');
      expect(result).toContain('id:');
      expect(result).toContain('created:');
    });

    test('should generate unique IDs', () => {
      const metadata1 = createProjectMetadata('Project 1');
      const metadata2 = createProjectMetadata('Project 2');
      expect(metadata1).not.toBe(metadata2);
    });

    test('should set document count to zero', () => {
      const result = createProjectMetadata('Test');
      expect(result).toContain('documents: 0');
    });
  });

  describe('createDocumentMetadata', () => {
    test('should create document metadata', () => {
      const result = createDocumentMetadata('My Document', 'https://example.com');
      expect(result).toContain('title: My Document');
      expect(result).toContain('source-url:');
      expect(result).toContain('https://example.com');
      expect(result).toContain('captured:');
    });

    test('should handle missing source URL', () => {
      const result = createDocumentMetadata('My Document');
      expect(result).toContain('title: My Document');
      expect(result).toContain('source-url:');
    });
  });

  describe('createStudyPlanMetadata', () => {
    test('should create study plan metadata', () => {
      const docIds = ['doc1', 'doc2'];
      const techniques = ['spaced-repetition', 'active-recall'];
      const result = createStudyPlanMetadata('Study Plan', docIds, techniques);

      expect(result).toContain('title: Study Plan');
      expect(result).toContain('source-documents: doc1, doc2');
      expect(result).toContain('techniques: spaced-repetition, active-recall');
    });

    test('should set initial status to active', () => {
      const result = createStudyPlanMetadata('Test Plan');
      expect(result).toContain('status: active');
    });

    test('should set completed and mastered to zero', () => {
      const result = createStudyPlanMetadata('Test Plan');
      expect(result).toContain('completed: 0');
      expect(result).toContain('mastered: 0');
    });
  });

  describe('createStudySessionMetadata', () => {
    test('should create study session metadata', () => {
      const result = createStudySessionMetadata('plan123', 30);
      expect(result).toContain('plan-id: plan123');
      expect(result).toContain('duration-minutes: 30');
      expect(result).toContain('timestamp:');
    });

    test('should handle zero duration', () => {
      const result = createStudySessionMetadata('plan123', 0);
      expect(result).toContain('duration-minutes: 0');
    });
  });

  describe('sanitizeFilename', () => {
    test('should convert to lowercase', () => {
      expect(sanitizeFilename('MyFile')).toContain('myfile');
    });

    test('should remove special characters', () => {
      const result = sanitizeFilename('My@File!.txt');
      expect(result).not.toContain('@');
      expect(result).not.toContain('!');
    });

    test('should replace spaces with hyphens', () => {
      expect(sanitizeFilename('my file name')).toBe('my-file-name');
    });

    test('should remove multiple consecutive hyphens', () => {
      const result = sanitizeFilename('my---file');
      expect(result).not.toContain('---');
    });

    test('should trim whitespace', () => {
      const result = sanitizeFilename('  my file  ');
      expect(result).not.toMatch(/^\s|\s$/);
    });
  });

  describe('deepClone', () => {
    test('should clone an object', () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });

    test('should deep clone nested objects', () => {
      const original = { a: { b: { c: 3 } } };
      const cloned = deepClone(original);
      expect(cloned.a).not.toBe(original.a);
      expect(cloned.a.b).not.toBe(original.a.b);
    });

    test('should clone arrays', () => {
      const original = { items: [1, 2, 3] };
      const cloned = deepClone(original);
      expect(cloned.items).not.toBe(original.items);
      expect(cloned.items).toEqual(original.items);
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    test('should debounce function calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('should use default delay of 300ms', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn);

      debouncedFn();
      jest.advanceTimersByTime(299);
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      expect(mockFn).toHaveBeenCalled();
    });

    test('should pass arguments to debounced function', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 50);

      debouncedFn('arg1', 'arg2');
      jest.advanceTimersByTime(50);

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    afterEach(() => {
      jest.useRealTimers();
    });
  });

  describe('formatFileSize', () => {
    test('should format bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    test('should round to 2 decimal places', () => {
      const result = formatFileSize(1536); // 1.5 KB
      expect(result).toMatch(/1\.5\s+KB/);
    });

    test('should handle large numbers', () => {
      const result = formatFileSize(1024 * 1024 * 1024 * 5);
      expect(result).toContain('GB');
    });
  });

  describe('truncateText', () => {
    test('should truncate text longer than limit', () => {
      const text = 'This is a long text that needs truncation';
      const result = truncateText(text, 10);
      expect(result).toBe('This is a ...');
      expect(result.length).toBeLessThanOrEqual(13);
    });

    test('should not truncate text within limit', () => {
      const text = 'Short text';
      const result = truncateText(text, 20);
      expect(result).toBe('Short text');
    });

    test('should use default length of 100', () => {
      const text = 'a'.repeat(50);
      const result = truncateText(text);
      expect(result).toBe(text);
    });

    test('should add ellipsis to truncated text', () => {
      const result = truncateText('This is long', 5);
      expect(result).toContain('...');
    });
  });

  describe('isValidJSON', () => {
    test('should return true for valid JSON', () => {
      expect(isValidJSON('{"key": "value"}')).toBe(true);
      expect(isValidJSON('[]')).toBe(true);
      expect(isValidJSON('123')).toBe(true);
      expect(isValidJSON('"string"')).toBe(true);
    });

    test('should return false for invalid JSON', () => {
      expect(isValidJSON('{invalid}')).toBe(false);
      expect(isValidJSON('undefined')).toBe(false);
      expect(isValidJSON('')).toBe(false);
    });

    test('should handle nested objects', () => {
      const validJson = '{"nested": {"key": "value"}}';
      expect(isValidJSON(validJson)).toBe(true);
    });
  });
});
