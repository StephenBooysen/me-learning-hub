/**
 * Utility Functions for Me Learning Hub
 */

/**
 * Generate a UUID v4
 * @returns {string} UUID string
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Format date to ISO 8601 string
 * @param {Date} date - Date object to format
 * @returns {string} ISO 8601 formatted string
 */
function formatISO8601(date = new Date()) {
  return date.toISOString();
}

/**
 * Format date for display
 * @param {Date} date - Date object to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(date).toLocaleDateString('en-US', options);
}

/**
 * Format date for display (short format)
 * @param {Date} date - Date object to format
 * @returns {string} Formatted date string
 */
function formatDateShort(date) {
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  return new Date(date).toLocaleDateString('en-US', options);
}

/**
 * Parse markdown frontmatter
 * @param {string} content - Markdown content
 * @returns {object} Parsed frontmatter and content
 */
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return {
      metadata: {},
      content: content
    };
  }

  const frontmatterStr = match[1];
  const bodyContent = match[2];
  const metadata = {};

  // Parse simple YAML-like format
  frontmatterStr.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > -1) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      metadata[key] = value.replace(/^["']|["']$/g, '');
    }
  });

  return {
    metadata,
    content: bodyContent
  };
}

/**
 * Create markdown frontmatter
 * @param {object} metadata - Metadata object
 * @returns {string} Formatted frontmatter
 */
function createFrontmatter(metadata) {
  let frontmatter = '---\n';
  Object.entries(metadata).forEach(([key, value]) => {
    const escapedValue = String(value).includes(':') ? `"${value}"` : value;
    frontmatter += `${key}: ${escapedValue}\n`;
  });
  frontmatter += '---\n';
  return frontmatter;
}

/**
 * Create a project metadata template
 * @param {string} name - Project name
 * @param {string} description - Project description
 * @returns {string} Markdown metadata
 */
function createProjectMetadata(name, description = '') {
  const metadata = {
    'id': generateUUID(),
    'title': name,
    'description': description,
    'created': formatISO8601(),
    'modified': formatISO8601(),
    'documents': '0',
    'study-plans': '0'
  };
  return createFrontmatter(metadata);
}

/**
 * Create a document metadata template
 * @param {string} title - Document title
 * @param {string} sourceUrl - Original source URL
 * @returns {string} Markdown metadata
 */
function createDocumentMetadata(title, sourceUrl = '') {
  const metadata = {
    'id': generateUUID(),
    'title': title,
    'source-url': sourceUrl,
    'captured': formatISO8601(),
    'modified': formatISO8601(),
    'tags': ''
  };
  return createFrontmatter(metadata);
}

/**
 * Create a study plan metadata template
 * @param {string} title - Study plan title
 * @param {array} documentIds - IDs of source documents
 * @param {array} techniques - Learning techniques to use
 * @returns {string} Markdown metadata
 */
function createStudyPlanMetadata(title, documentIds = [], techniques = []) {
  const metadata = {
    'id': generateUUID(),
    'title': title,
    'source-documents': documentIds.join(', '),
    'created': formatISO8601(),
    'modified': formatISO8601(),
    'techniques': techniques.join(', '),
    'status': 'active',
    'intensity': 'medium',
    'total-items': '0',
    'completed': '0',
    'mastered': '0'
  };
  return createFrontmatter(metadata);
}

/**
 * Create a study session metadata template
 * @param {string} planId - Associated study plan ID
 * @param {number} duration - Session duration in minutes
 * @returns {string} Markdown metadata
 */
function createStudySessionMetadata(planId, duration = 0) {
  const metadata = {
    'id': generateUUID(),
    'plan-id': planId,
    'timestamp': formatISO8601(),
    'duration-minutes': String(duration),
    'items-reviewed': '0',
    'performance': '0'
  };
  return createFrontmatter(metadata);
}

/**
 * Sanitize filename
 * @param {string} filename - Filename to sanitize
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename) {
  return filename
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Deep clone an object
 * @param {object} obj - Object to clone
 * @returns {object} Cloned object
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Debounce function
 * @param {function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {function} Debounced function
 */
function debounce(fn, delay = 300) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Format bytes to human readable size
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted size string
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Truncate text
 * @param {string} text - Text to truncate
 * @param {number} length - Max length
 * @returns {string} Truncated text
 */
function truncateText(text, length = 100) {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

/**
 * Check if string is valid JSON
 * @param {string} str - String to check
 * @returns {boolean}
 */
function isValidJSON(str) {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

// Export utilities for use in Node.js context
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
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
  };
}
