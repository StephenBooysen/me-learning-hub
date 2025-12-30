/**
 * Content Script
 * Runs on web pages to extract content and communicate with extension
 * Uses advanced utility modules for content extraction and markdown conversion
 */

// Inject selection highlighting script
injectSelectionHighlighter();

/**
 * Listen for messages from background script or popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received:', request.action);

  if (request.action === 'extractPageContent') {
    // Use advanced content extractor utility
    const extracted = ContentExtractor.extractPageContent({
      removeNavigation: true,
      removeFooter: true,
      removeSidebars: true,
      removeComments: true,
      maxChars: 100000
    });

    // Get enhanced metadata from page
    const metadata = ContentExtractor.getPageMetadata();

    // Convert to markdown using advanced converter
    const markdown = MarkdownConverter.htmlToMarkdown(extracted.content, {
      includeLinks: true,
      includeImages: true,
      includeCodeBlocks: true
    });

    // Calculate reading time estimate
    const readingTime = ContentExtractor.estimateReadingTime(markdown);

    sendResponse({
      title: metadata.title || extracted.title,
      markdown: markdown,
      html: extracted.content.substring(0, 100000),
      metadata: {
        author: metadata.author || '',
        description: metadata.description || '',
        image: metadata.image || '',
        publishDate: metadata.publishDate || '',
        domain: metadata.domain || '',
        readingTime: readingTime
      }
    });
  } else if (request.action === 'extractSelectedContent') {
    const selection = window.getSelection();
    const selectedText = selection.toString();

    if (selectedText) {
      const container = getSelectionContainer();

      // Use advanced markdown converter for selection
      const markdown = MarkdownConverter.htmlToMarkdown(
        container.innerHTML || selectedText,
        { includeLinks: true, includeImages: true, includeCodeBlocks: true }
      );

      // Calculate reading time for selection
      const readingTime = ContentExtractor.estimateReadingTime(markdown);

      sendResponse({
        title: 'Selected Content - ' + document.title,
        markdown: markdown,
        html: container.innerHTML,
        metadata: {
          readingTime: readingTime,
          selectedText: selectedText.substring(0, 160)
        }
      });
    } else {
      sendResponse(null);
    }
  }
});

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
