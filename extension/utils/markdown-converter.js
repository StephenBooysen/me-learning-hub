/**
 * Markdown Converter Module
 * Converts HTML to Markdown format
 */

/**
 * Convert HTML to Markdown
 * @param {string} html - HTML content
 * @param {object} options - Conversion options
 * @returns {string} Markdown content
 */
export function htmlToMarkdown(html, options = {}) {
  const {
    includeLinks = true,
    includeImages = true,
    includeCodeBlocks = true,
    maxImageWidth = 100
  } = options;

  let markdown = html;

  // Remove script and style tags
  markdown = removeScriptAndStyle(markdown);

  // Convert semantic HTML
  markdown = convertHeaders(markdown);
  markdown = convertBold(markdown);
  markdown = convertItalic(markdown);
  markdown = convertStrikethrough(markdown);
  markdown = convertLists(markdown);
  markdown = convertBlockquotes(markdown);
  markdown = convertHorizontalRules(markdown);

  // Convert code
  if (includeCodeBlocks) {
    markdown = convertCodeBlocks(markdown);
    markdown = convertInlineCode(markdown);
  }

  // Convert links
  if (includeLinks) {
    markdown = convertLinks(markdown);
  }

  // Convert images
  if (includeImages) {
    markdown = convertImages(markdown, maxImageWidth);
  }

  // Convert paragraphs and line breaks
  markdown = convertParagraphs(markdown);
  markdown = convertLineBreaks(markdown);
  markdown = convertDivs(markdown);

  // Remove remaining HTML tags
  markdown = removeHtmlTags(markdown);

  // Decode HTML entities
  markdown = decodeHtmlEntities(markdown);

  // Clean up whitespace
  markdown = cleanupWhitespace(markdown);

  return markdown.trim();
}

/**
 * Remove script and style elements
 */
function removeScriptAndStyle(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');
}

/**
 * Convert headers
 */
function convertHeaders(html) {
  html = html.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  html = html.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  html = html.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  html = html.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
  html = html.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
  html = html.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');
  return html;
}

/**
 * Convert bold text
 */
function convertBold(html) {
  html = html.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  html = html.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  return html;
}

/**
 * Convert italic text
 */
function convertItalic(html) {
  html = html.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  html = html.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
  return html;
}

/**
 * Convert strikethrough text
 */
function convertStrikethrough(html) {
  html = html.replace(/<s[^>]*>(.*?)<\/s>/gi, '~~$1~~');
  html = html.replace(/<del[^>]*>(.*?)<\/del>/gi, '~~$1~~');
  html = html.replace(/<strike[^>]*>(.*?)<\/strike>/gi, '~~$1~~');
  return html;
}

/**
 * Convert links
 */
function convertLinks(html) {
  return html.replace(/<a\s+href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, (match, url, text) => {
    const cleanText = text.trim();
    const cleanUrl = url.trim();
    return cleanText ? `[${cleanText}](${cleanUrl})` : cleanUrl;
  });
}

/**
 * Convert images
 */
function convertImages(html, maxWidth = 100) {
  // Image with src and alt
  html = html.replace(/<img\s+[^>]*src=["']([^"']*)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi, '![$2]($1)');

  // Image with alt and src
  html = html.replace(/<img\s+[^>]*alt=["']([^"']*)["'][^>]*src=["']([^"']*)["'][^>]*>/gi, '![$1]($2)');

  // Image with only src
  html = html.replace(/<img\s+[^>]*src=["']([^"']*)["'][^>]*>/gi, '![]($1)');

  return html;
}

/**
 * Convert code blocks
 */
function convertCodeBlocks(html) {
  // Pre with code
  html = html.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (match, code) => {
    const cleanCode = decodeHtmlEntities(code).trim();
    return '```\n' + cleanCode + '\n```\n\n';
  });

  return html;
}

/**
 * Convert inline code
 */
function convertInlineCode(html) {
  return html.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
}

/**
 * Convert lists
 */
function convertLists(html) {
  // Unordered lists
  html = html.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, content) => {
    const items = content.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
    const listItems = items.map(item => {
      const text = item.replace(/<\/?li[^>]*>/gi, '').trim();
      return '- ' + text;
    }).join('\n');
    return listItems + '\n\n';
  });

  // Ordered lists
  html = html.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, content) => {
    const items = content.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
    const listItems = items.map((item, index) => {
      const text = item.replace(/<\/?li[^>]*>/gi, '').trim();
      return (index + 1) + '. ' + text;
    }).join('\n');
    return listItems + '\n\n';
  });

  // Remove any remaining li tags
  html = html.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1');

  return html;
}

/**
 * Convert blockquotes
 */
function convertBlockquotes(html) {
  return html.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (match, content) => {
    const lines = content.trim().split('\n');
    return lines.map(line => '> ' + line).join('\n') + '\n\n';
  });
}

/**
 * Convert horizontal rules
 */
function convertHorizontalRules(html) {
  html = html.replace(/<hr[^>]*>/gi, '\n---\n\n');
  return html;
}

/**
 * Convert paragraphs
 */
function convertParagraphs(html) {
  return html.replace(/<p[^>]*>(.*?)<\/p>/gi, (match, content) => {
    const text = content.trim();
    return text ? text + '\n\n' : '';
  });
}

/**
 * Convert line breaks
 */
function convertLineBreaks(html) {
  html = html.replace(/<br\s*\/?>/gi, '\n');
  html = html.replace(/<br\s+\/>/gi, '\n');
  return html;
}

/**
 * Convert divs
 */
function convertDivs(html) {
  return html.replace(/<div[^>]*>(.*?)<\/div>/gi, '$1\n');
}

/**
 * Remove remaining HTML tags
 */
function removeHtmlTags(html) {
  return html.replace(/<[^>]+>/g, '');
}

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(text) {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

/**
 * Clean up excess whitespace
 */
function cleanupWhitespace(markdown) {
  // Remove multiple consecutive blank lines
  markdown = markdown.replace(/\n\n\n+/g, '\n\n');

  // Remove trailing whitespace from lines
  markdown = markdown.split('\n').map(line => line.trimEnd()).join('\n');

  // Replace tabs with spaces
  markdown = markdown.replace(/\t/g, '  ');

  return markdown;
}

/**
 * Create markdown document with metadata
 */
export function createMarkdownDocument(title, sourceUrl, content, tags = []) {
  const timestamp = new Date().toISOString();
  const tagString = tags.length > 0 ? tags.join(', ') : '';

  let markdown = '---\n';
  markdown += `title: "${title}"\n`;
  markdown += `source: ${sourceUrl}\n`;
  markdown += `captured: ${timestamp}\n`;
  if (tagString) {
    markdown += `tags: ${tagString}\n`;
  }
  markdown += '---\n\n';
  markdown += `# ${title}\n\n`;
  markdown += `**Source**: [${sourceUrl}](${sourceUrl})\n`;
  markdown += `**Captured**: ${new Date(timestamp).toLocaleString()}\n\n`;
  markdown += '---\n\n';
  markdown += content;

  return markdown;
}

/**
 * Extract title from HTML
 */
export function extractTitle(html) {
  // Try og:title meta tag
  let match = html.match(/<meta\s+property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
  if (match) return match[1];

  // Try title tag
  match = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (match) return match[1];

  // Try h1
  match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (match) return match[1].replace(/<[^>]+>/g, '');

  // Fallback
  return 'Untitled Document';
}

/**
 * Extract description from HTML
 */
export function extractDescription(html) {
  // Try og:description meta tag
  let match = html.match(/<meta\s+property=["']og:description["'][^>]*content=["']([^"']*)["']/i);
  if (match) return match[1];

  // Try description meta tag
  match = html.match(/<meta\s+name=["']description["'][^>]*content=["']([^"']*)["']/i);
  if (match) return match[1];

  // Fallback
  return '';
}

console.log('Markdown converter module loaded');
