/**
 * Content Script
 * Runs on web pages to extract content and communicate with extension
 */

// Inject selection highlighting script
injectSelectionHighlighter();

/**
 * Listen for messages from background script or popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received:', request.action);

  if (request.action === 'extractPageContent') {
    const content = extractPageContent();
    sendResponse({
      title: getPageTitle(),
      markdown: content,
      html: document.documentElement.outerHTML.substring(0, 100000) // Limited size
    });
  } else if (request.action === 'extractSelectedContent') {
    const selectedText = window.getSelection().toString();
    if (selectedText) {
      const container = getSelectionContainer();
      const markdown = htmlToMarkdown(container.innerHTML || selectedText);
      sendResponse({
        title: 'Selected Content - ' + getPageTitle(),
        markdown: markdown,
        html: container.innerHTML
      });
    } else {
      sendResponse(null);
    }
  }
});

/**
 * Extract main content from page
 */
function extractPageContent() {
  // Try to find main content area
  const article = document.querySelector('article') ||
                 document.querySelector('main') ||
                 document.querySelector('[role="main"]') ||
                 document.querySelector('.content') ||
                 document.querySelector('.post') ||
                 document.querySelector('.entry-content') ||
                 document.body;

  if (!article) {
    return htmlToMarkdown(document.body.innerHTML);
  }

  return htmlToMarkdown(article.innerHTML);
}

/**
 * Get page title
 */
function getPageTitle() {
  return document.title ||
         document.querySelector('h1')?.textContent ||
         'Untitled Document';
}

/**
 * Get container for selected content
 */
function getSelectionContainer() {
  const selection = window.getSelection();
  if (selection.rangeCount === 0) return document.body;

  const range = selection.getRangeAt(0);
  let container = range.commonAncestorContainer;

  // If text node, get parent
  if (container.nodeType === 3) {
    container = container.parentElement;
  }

  return container;
}

/**
 * Convert HTML to Markdown
 * Basic implementation - can be enhanced
 */
function htmlToMarkdown(html) {
  let markdown = html;

  // Remove script and style elements
  markdown = markdown.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  markdown = markdown.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Headers
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
  markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
  markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');

  // Bold
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');

  // Italic
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

  // Links
  markdown = markdown.replace(/<a\s+href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // Images
  markdown = markdown.replace(/<img\s+src=["']([^"']*)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi, '![$2]($1)');
  markdown = markdown.replace(/<img\s+src=["']([^"']*)["'][^>]*>/gi, '![]($1)');

  // Code blocks
  markdown = markdown.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gi, '```\n$1\n```\n\n');
  markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

  // Line breaks
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n');
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
  markdown = markdown.replace(/<div[^>]*>(.*?)<\/div>/gi, '$1\n\n');

  // Lists
  markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
  markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/gi, '$1\n');
  markdown = markdown.replace(/<ol[^>]*>(.*?)<\/ol>/gi, '$1\n');

  // Remove remaining HTML tags
  markdown = markdown.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  markdown = decodeHtmlEntities(markdown);

  // Clean up excessive whitespace
  markdown = markdown.replace(/\n\n\n+/g, '\n\n');
  markdown = markdown.replace(/\t+/g, '  ');
  markdown = markdown.trim();

  return markdown;
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
 * Inject selection highlighter
 */
function injectSelectionHighlighter() {
  const style = document.createElement('style');
  style.textContent = `
    .me-learning-hub-highlight {
      background-color: rgba(255, 215, 0, 0.4) !important;
      border: 2px solid #FFD700 !important;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);
}

console.log('Me Learning Hub content script loaded');
