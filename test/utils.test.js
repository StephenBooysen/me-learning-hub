/**
 * Unit Tests for Utility Functions
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

describe('UUID Generation', () => {
  test('should generate a valid UUID v4', () => {
    const uuid = generateUUID();
    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuid).toMatch(uuidRegex);
  });

  test('should generate unique UUIDs', () => {
    const uuid1 = generateUUID();
    const uuid2 = generateUUID();
    expect(uuid1).not.toBe(uuid2);
  });

  test('should generate correct UUID format', () => {
    const uuid = generateUUID();
    const parts = uuid.split('-');
    expect(parts.length).toBe(5);
    expect(parts[0].length).toBe(8);
    expect(parts[1].length).toBe(4);
    expect(parts[2].length).toBe(4);
    expect(parts[3].length).toBe(4);
    expect(parts[4].length).toBe(12);
  });
});

describe('Date Formatting', () => {
  const testDate = new Date('2024-12-31T10:30:00Z');

  test('should format date to ISO 8601', () => {
    const iso = formatISO8601(testDate);
    expect(iso).toBe('2024-12-31T10:30:00.000Z');
  });

  test('should format date for display', () => {
    const formatted = formatDate(testDate);
    expect(formatted).toMatch(/Dec 31, 2024, \d{2}:\d{2}/);
  });

  test('should format date short', () => {
    const formatted = formatDateShort(testDate);
    expect(formatted).toBe('Dec 31, 2024');
  });

  test('should use current date if not provided to formatISO8601', () => {
    const iso = formatISO8601();
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  test('should handle string dates', () => {
    const formatted = formatDate('2024-12-31T10:30:00Z');
    expect(formatted).toMatch(/Dec 31, 2024/);
  });
});

describe('Frontmatter Parsing', () => {
  test('should parse valid frontmatter', () => {
    const content = `---
title: Test Document
author: John Doe
---
This is the content`;

    const result = parseFrontmatter(content);
    expect(result.metadata.title).toBe('Test Document');
    expect(result.metadata.author).toBe('John Doe');
    expect(result.content).toBe('This is the content');
  });

  test('should handle content without frontmatter', () => {
    const content = 'This is just content';
    const result = parseFrontmatter(content);
    expect(result.metadata).toEqual({});
    expect(result.content).toBe('This is just content');
  });

  test('should handle quoted values', () => {
    const content = `---
title: "Document with: colons"
---
Content`;

    const result = parseFrontmatter(content);
    expect(result.metadata.title).toBe('Document with: colons');
  });

  test('should preserve multiline content', () => {
    const content = `---
title: Test
---
Line 1
Line 2
Line 3`;

    const result = parseFrontmatter(content);
    expect(result.content).toBe('Line 1\nLine 2\nLine 3');
  });

  test('should handle empty frontmatter', () => {
    const content = `---
---
Content`;

    const result = parseFrontmatter(content);
    expect(result.metadata).toEqual({});
    expect(result.content).toBe('Content');
  });
});

describe('Frontmatter Creation', () => {
  test('should create valid frontmatter', () => {
    const metadata = {
      title: 'Test',
      author: 'John'
    };
    const frontmatter = createFrontmatter(metadata);
    expect(frontmatter).toContain('---');
    expect(frontmatter).toContain('title: Test');
    expect(frontmatter).toContain('author: John');
  });

  test('should quote values with colons', () => {
    const metadata = {
      url: 'https://example.com:8080'
    };
    const frontmatter = createFrontmatter(metadata);
    expect(frontmatter).toContain('url: "https://example.com:8080"');
  });

  test('should handle empty metadata', () => {
    const frontmatter = createFrontmatter({});
    expect(frontmatter).toBe('---\n---\n');
  });

  test('should be parseable back', () => {
    const original = {
      title: 'Test Document',
      author: 'Jane Doe'
    };
    const frontmatter = createFrontmatter(original);
    const parsed = parseFrontmatter(frontmatter + 'Content');
    expect(parsed.metadata.title).toBe(original.title);
    expect(parsed.metadata.author).toBe(original.author);
  });
});

describe('Metadata Creators', () => {
  test('should create project metadata', () => {
    const metadata = createProjectMetadata('My Project', 'Description');
    const parsed = parseFrontmatter(metadata);
    expect(parsed.metadata.title).toBe('My Project');
    expect(parsed.metadata.description).toBe('Description');
    expect(parsed.metadata.id).toMatch(/^[0-9a-f]{8}-/);
    expect(parsed.metadata.created).toBeTruthy();
    expect(parsed.metadata.documents).toBe('0');
    expect(parsed.metadata['study-plans']).toBe('0');
  });

  test('should create document metadata', () => {
    const metadata = createDocumentMetadata('My Doc', 'https://example.com');
    const parsed = parseFrontmatter(metadata);
    expect(parsed.metadata.title).toBe('My Doc');
    expect(parsed.metadata['source-url']).toBe('https://example.com');
    expect(parsed.metadata.id).toBeTruthy();
    expect(parsed.metadata.captured).toBeTruthy();
    expect(parsed.metadata.tags).toBe('');
  });

  test('should create study plan metadata', () => {
    const metadata = createStudyPlanMetadata('Physics Plan', ['doc1', 'doc2'], ['Spaced Repetition', 'Active Recall']);
    const parsed = parseFrontmatter(metadata);
    expect(parsed.metadata.title).toBe('Physics Plan');
    expect(parsed.metadata['source-documents']).toContain('doc1');
    expect(parsed.metadata.techniques).toContain('Spaced Repetition');
    expect(parsed.metadata.status).toBe('active');
    expect(parsed.metadata['total-items']).toBe('0');
  });

  test('should create study session metadata', () => {
    const metadata = createStudySessionMetadata('plan123', 45);
    const parsed = parseFrontmatter(metadata);
    expect(parsed.metadata['plan-id']).toBe('plan123');
    expect(parsed.metadata['duration-minutes']).toBe('45');
    expect(parsed.metadata.timestamp).toBeTruthy();
    expect(parsed.metadata['items-reviewed']).toBe('0');
  });
});

describe('Filename Sanitization', () => {
  test('should convert to lowercase', () => {
    expect(sanitizeFilename('MyDocument')).toBe('mydocument');
  });

  test('should remove special characters', () => {
    expect(sanitizeFilename('My@Doc!#$%')).toBe('mydoc');
  });

  test('should replace spaces with hyphens', () => {
    expect(sanitizeFilename('My Document Name')).toBe('my-document-name');
  });

  test('should remove multiple consecutive hyphens', () => {
    expect(sanitizeFilename('My---Document')).toBe('my-document');
  });

  test('should handle mixed cases', () => {
    expect(sanitizeFilename('The Quick Brown Fox!')).toBe('the-quick-brown-fox');
  });

  test('should preserve valid characters', () => {
    expect(sanitizeFilename('document-2024')).toBe('document-2024');
  });
});

describe('Deep Clone', () => {
  test('should clone simple objects', () => {
    const original = { name: 'John', age: 30 };
    const cloned = deepClone(original);
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
  });

  test('should clone nested objects', () => {
    const original = {
      user: {
        name: 'John',
        address: {
          city: 'New York'
        }
      }
    };
    const cloned = deepClone(original);
    expect(cloned).toEqual(original);
    expect(cloned.user).not.toBe(original.user);
    expect(cloned.user.address).not.toBe(original.user.address);
  });

  test('should clone arrays', () => {
    const original = [1, 2, { name: 'John' }];
    const cloned = deepClone(original);
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned[2]).not.toBe(original[2]);
  });

  test('should not clone functions', () => {
    const original = {
      name: 'John',
      greet: function() { return 'Hi'; }
    };
    const cloned = deepClone(original);
    expect(cloned.name).toBe('John');
    expect(cloned.greet).toBeUndefined();
  });
});

describe('Debounce', () => {
  jest.useFakeTimers();

  test('should debounce function calls', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 300);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    expect(mockFn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(300);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('should use default delay', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn);

    debouncedFn();
    jest.advanceTimersByTime(299);
    expect(mockFn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(mockFn).toHaveBeenCalled();
  });

  test('should pass arguments to function', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('arg1', 'arg2');
    jest.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
  });
});

describe('File Size Formatting', () => {
  test('should format bytes', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
    expect(formatFileSize(1)).toBe('1 Bytes');
    expect(formatFileSize(1023)).toBe('1023 Bytes');
  });

  test('should format kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });

  test('should format megabytes', () => {
    expect(formatFileSize(1048576)).toBe('1 MB');
    expect(formatFileSize(5242880)).toBe('5 MB');
  });

  test('should format gigabytes', () => {
    expect(formatFileSize(1073741824)).toBe('1 GB');
  });

  test('should round properly', () => {
    const result = formatFileSize(1536);
    expect(result).toBe('1.5 KB');
  });
});

describe('Text Truncation', () => {
  test('should not truncate short text', () => {
    expect(truncateText('Hello')).toBe('Hello');
    expect(truncateText('Hello', 100)).toBe('Hello');
  });

  test('should truncate long text', () => {
    const long = 'a'.repeat(150);
    const result = truncateText(long, 100);
    expect(result).toBe('a'.repeat(100) + '...');
    expect(result.length).toBe(103);
  });

  test('should use custom length', () => {
    const text = 'This is a long text';
    expect(truncateText(text, 4)).toBe('This...');
    expect(truncateText(text, 10)).toBe('This is a ...');
  });

  test('should handle edge cases', () => {
    expect(truncateText('', 10)).toBe('');
    expect(truncateText('a', 1)).toBe('a');
  });
});

describe('JSON Validation', () => {
  test('should validate valid JSON', () => {
    expect(isValidJSON('{"name": "John"}')).toBe(true);
    expect(isValidJSON('{"array": [1, 2, 3]}')).toBe(true);
    expect(isValidJSON('{"nested": {"key": "value"}}')).toBe(true);
    expect(isValidJSON('[]')).toBe(true);
    expect(isValidJSON('"string"')).toBe(true);
    expect(isValidJSON('123')).toBe(true);
  });

  test('should reject invalid JSON', () => {
    expect(isValidJSON('{invalid}')).toBe(false);
    expect(isValidJSON("{'single': 'quotes'}'")).toBe(false);
    expect(isValidJSON('{name: "John"}')).toBe(false);
    expect(isValidJSON('undefined')).toBe(false);
    expect(isValidJSON('')).toBe(false);
  });
});
