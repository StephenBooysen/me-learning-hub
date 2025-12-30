/**
 * Content Extractor Module
 * Intelligently extracts main content from web pages
 */

(function(window) {
  'use strict';

/**
 * Extract main content from page
 * @param {object} options - Extraction options
 * @returns {object} Extracted content with title and body
 */
function extractPageContent(options = {}) {
  const {
    removeNavigation = true,
    removeFooter = true,
    removeSidebars = true,
    removeComments = true,
    maxChars = null
  } = options;

  // Find main content area
  let mainContent = findMainContent();

  // Clean up unwanted elements
  if (removeNavigation) {
    mainContent = removeNavigationElements(mainContent);
  }
  if (removeFooter) {
    mainContent = removeFooterElements(mainContent);
  }
  if (removeSidebars) {
    mainContent = removeSidebarElements(mainContent);
  }
  if (removeComments) {
    mainContent = removeCommentElements(mainContent);
  }

  const title = extractPageTitle();
  const content = mainContent.innerHTML || '';

  // Truncate if needed
  let finalContent = content;
  if (maxChars && finalContent.length > maxChars) {
    finalContent = finalContent.substring(0, maxChars) + '...';
  }

  return {
    title: title,
    content: finalContent,
    url: window.location.href
  };
}

/**
 * Extract selected text
 * @returns {object} Selected content
 */
function extractSelectedContent() {
  const selection = window.getSelection();

  if (selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const selectedText = selection.toString();
  let container = range.commonAncestorContainer;

  // If text node, get parent
  if (container.nodeType === 3) {
    container = container.parentElement;
  }

  // Clone container to preserve structure
  const clonedContainer = container.cloneNode(true);

  return {
    text: selectedText,
    html: clonedContainer.innerHTML,
    url: window.location.href
  };
}

/**
 * Find main content area of page
 */
function findMainContent() {
  // Priority list of selectors that likely contain main content
  const selectors = [
    'article',
    'main',
    '[role="main"]',
    '.main-content',
    '.post-content',
    '.entry-content',
    '.content',
    '.page-content',
    '#content',
    '#main',
    '.article-body',
    '.post',
    '.post-body',
    '.story-body',
    '[data-component="ArticleBody"]'
  ];

  // Try each selector
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.innerText.length > 100) {
      return element;
    }
  }

  // Fallback to body
  return document.body;
}

/**
 * Remove navigation elements
 */
function removeNavigationElements(element) {
  const cloned = element.cloneNode(true);
  const navSelectors = [
    'nav',
    '[role="navigation"]',
    '.navbar',
    '.navigation',
    '.menu',
    'header',
    '.header'
  ];

  navSelectors.forEach(selector => {
    cloned.querySelectorAll(selector).forEach(el => el.remove());
  });

  return cloned;
}

/**
 * Remove footer elements
 */
function removeFooterElements(element) {
  const cloned = element.cloneNode(true);
  const footerSelectors = [
    'footer',
    '[role="contentinfo"]',
    '.footer',
    '.site-footer'
  ];

  footerSelectors.forEach(selector => {
    cloned.querySelectorAll(selector).forEach(el => el.remove());
  });

  return cloned;
}

/**
 * Remove sidebar elements
 */
function removeSidebarElements(element) {
  const cloned = element.cloneNode(true);
  const sidebarSelectors = [
    'aside',
    '[role="complementary"]',
    '.sidebar',
    '.side-bar',
    '.widget-area',
    '.comment-form'
  ];

  sidebarSelectors.forEach(selector => {
    cloned.querySelectorAll(selector).forEach(el => el.remove());
  });

  return cloned;
}

/**
 * Remove comment elements
 */
function removeCommentElements(element) {
  const cloned = element.cloneNode(true);
  const commentSelectors = [
    '.comments',
    '.comment-section',
    '#comments',
    '[id*="comment"]',
    '.disqus',
    'iframe[src*="disqus"]'
  ];

  commentSelectors.forEach(selector => {
    try {
      cloned.querySelectorAll(selector).forEach(el => el.remove());
    } catch (e) {
      // Ignore invalid selectors
    }
  });

  return cloned;
}

/**
 * Extract page title
 */
function extractPageTitle() {
  // Try Open Graph title
  let metaTag = document.querySelector('meta[property="og:title"]');
  if (metaTag) return metaTag.getAttribute('content');

  // Try Twitter title
  metaTag = document.querySelector('meta[name="twitter:title"]');
  if (metaTag) return metaTag.getAttribute('content');

  // Try title tag
  const titleTag = document.querySelector('title');
  if (titleTag) return titleTag.textContent;

  // Try h1
  const h1 = document.querySelector('h1');
  if (h1) return h1.textContent;

  // Fallback
  return 'Untitled Document';
}

/**
 * Get page metadata
 */
function getPageMetadata() {
  return {
    title: extractPageTitle(),
    url: window.location.href,
    description: extractPageDescription(),
    image: extractPageImage(),
    author: extractPageAuthor(),
    publishDate: extractPublishDate(),
    domain: new URL(window.location.href).hostname
  };
}

/**
 * Extract page description
 */
function extractPageDescription() {
  // Try og:description
  let metaTag = document.querySelector('meta[property="og:description"]');
  if (metaTag) return metaTag.getAttribute('content');

  // Try description meta tag
  metaTag = document.querySelector('meta[name="description"]');
  if (metaTag) return metaTag.getAttribute('content');

  // Fallback to first paragraph
  const p = document.querySelector('p');
  if (p) return p.textContent.substring(0, 160);

  return '';
}

/**
 * Extract page image
 */
function extractPageImage() {
  // Try og:image
  let metaTag = document.querySelector('meta[property="og:image"]');
  if (metaTag) return metaTag.getAttribute('content');

  // Try twitter:image
  metaTag = document.querySelector('meta[name="twitter:image"]');
  if (metaTag) return metaTag.getAttribute('content');

  // Try first img tag
  const img = document.querySelector('img');
  if (img) return img.src;

  return '';
}

/**
 * Extract page author
 */
function extractPageAuthor() {
  // Try article:author
  let metaTag = document.querySelector('meta[property="article:author"]');
  if (metaTag) return metaTag.getAttribute('content');

  // Try author meta tag
  metaTag = document.querySelector('meta[name="author"]');
  if (metaTag) return metaTag.getAttribute('content');

  // Try .author class
  const authorEl = document.querySelector('.author, [rel="author"]');
  if (authorEl) return authorEl.textContent.trim();

  return '';
}

/**
 * Extract publish date
 */
function extractPublishDate() {
  // Try article:published_time
  let metaTag = document.querySelector('meta[property="article:published_time"]');
  if (metaTag) return metaTag.getAttribute('content');

  // Try time element
  const timeEl = document.querySelector('time');
  if (timeEl) return timeEl.getAttribute('datetime');

  return '';
}

/**
 * Get readability score of content
 */
function calculateReadability(text) {
  if (!text) return 0;

  const words = text.split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).length;
  const paragraphs = text.split(/\n\n+/).length;

  // Simple readability score (0-100)
  const avgWordsPerSentence = sentences > 0 ? words / sentences : 0;
  const avgWordsPerParagraph = paragraphs > 0 ? words / paragraphs : 0;

  let score = 100;

  // Deduct points for complexity
  if (avgWordsPerSentence > 20) score -= 10;
  if (avgWordsPerSentence > 25) score -= 10;
  if (avgWordsPerParagraph > 100) score -= 10;

  // Bonus for good structure
  if (paragraphs > 5) score += 5;
  if (words > 500) score += 5;

  return Math.max(0, Math.min(100, score));
}

/**
 * Estimate reading time in minutes
 */
function estimateReadingTime(text) {
  if (!text) return 0;

  const wordsPerMinute = 200;
  const words = text.split(/\s+/).length;

  return Math.ceil(words / wordsPerMinute);
}

  // Export to global scope
  window.ContentExtractor = {
    extractPageContent,
    extractSelectedContent,
    getPageMetadata,
    calculateReadability,
    estimateReadingTime
  };
})(window);
