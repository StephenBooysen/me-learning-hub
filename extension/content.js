/**
 * Content Script - Runs in the context of web pages
 * Handles content extraction and selection management
 */

console.log('[Me Learning Hub] Content script loaded');

// Get the current page selection
function getSelectedText() {
    const selection = window.getSelection();
    return selection ? selection.toString().trim() : '';
}

// Extract full page content (body only, no styles)
function extractFullPageContent() {
    // Clone the body to avoid modifying the original
    const clone = document.body.cloneNode(true);

    // Remove unwanted elements - MUST include style and script tags
    const removeSelectors = [
        'script', 'style', 'noscript',  // Remove ALL scripts and styles
        'nav', 'footer', '.nav', '.navbar',
        '.advertisement', '.ad', '.sidebar',
        '[role="navigation"]', '[role="complementary"]',
        '[aria-label="Advertisement"]',
        '.cookie-notice', '.cookie-banner',
        '.modal', '.popup', '.overlay',
        'iframe', '[data-ad-slot]',
        'meta', 'link', 'head'  // Also remove any head elements
    ];

    removeSelectors.forEach(selector => {
        clone.querySelectorAll(selector).forEach(el => el.remove());
    });

    // Remove all inline styles, classes, and data attributes
    clone.querySelectorAll('*').forEach(el => {
        el.removeAttribute('style');      // Remove inline styles
        el.removeAttribute('class');      // Remove classes
        el.removeAttribute('id');         // Remove IDs
        el.removeAttribute('data-*');     // Remove data attributes
        el.removeAttribute('onclick');    // Remove event handlers
        el.removeAttribute('onload');
    });

    // Get clean HTML to preserve structure
    let html = clone.innerHTML;

    // Convert to markdown to remove any remaining HTML
    const markdown = htmlToMarkdown(html);

    // Clean up excessive whitespace
    let text = markdown
        .replace(/\n\n\n+/g, '\n\n')  // Multiple newlines to double
        .replace(/\t/g, '')            // Remove tabs
        .replace(/\r\n/g, '\n')        // Normalize line endings
        .replace(/ {2,}/g, ' ')        // Remove multiple spaces
        .trim();

    return text;
}

// Extract page metadata
function getPageMetadata() {
    const meta = {
        title: document.title || '',
        url: window.location.href,
        domain: window.location.hostname,
        description: ''
    };

    // Try to get description from meta tags
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) {
        meta.description = descMeta.getAttribute('content') || '';
    }

    // Try og:description
    const ogDescMeta = document.querySelector('meta[property="og:description"]');
    if (ogDescMeta) {
        meta.description = ogDescMeta.getAttribute('content') || meta.description;
    }

    return meta;
}

// Calculate reading time (average 200 words per minute)
function calculateReadingTime(text) {
    const words = text.split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return minutes;
}

// Convert HTML to Markdown with proper structure preservation
function htmlToMarkdown(html) {
    let markdown = html;

    // Convert headings (preserve structure)
    markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
    markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
    markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
    markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
    markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
    markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');

    // Convert bold and strong
    markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
    markdown = markdown.replace(/<\/?b>/gi, '**');

    // Convert italic and emphasis
    markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
    markdown = markdown.replace(/<\/?i>/gi, '*');

    // Convert links
    markdown = markdown.replace(/<a[^>]*href=["'](.*?)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)');

    // Convert code blocks
    markdown = markdown.replace(/<pre[^>]*>(.*?)<\/pre>/gi, '```\n$1\n```\n\n');
    markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

    // Convert lists
    markdown = markdown.replace(/<ul[^>]*>/gi, '');
    markdown = markdown.replace(/<\/ul>/gi, '\n');
    markdown = markdown.replace(/<ol[^>]*>/gi, '');
    markdown = markdown.replace(/<\/ol>/gi, '\n');
    markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');

    // Convert blockquotes
    markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n\n');

    // Convert paragraphs and line breaks
    markdown = markdown.replace(/<\/p>/gi, '\n\n');
    markdown = markdown.replace(/<br[^>]*>/gi, '\n');
    markdown = markdown.replace(/<hr[^>]*>/gi, '\n---\n');

    // Remove remaining HTML tags
    markdown = markdown.replace(/<[^>]+>/g, '');

    // Decode HTML entities
    markdown = markdown
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));

    // Clean up extra whitespace
    markdown = markdown
        .replace(/\n\n\n+/g, '\n\n')  // Multiple newlines to double
        .replace(/\n +/g, '\n')        // Remove leading spaces on lines
        .replace(/ +\n/g, '\n')        // Remove trailing spaces
        .trim();

    return markdown;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[Me Learning Hub] Received message:', request.action);

    try {
        if (request.action === 'getPageContent') {
            const captureType = request.captureType || 'full';
            const metadata = getPageMetadata();

            let content = '';

            if (captureType === 'selection') {
                content = getSelectedText();
                if (!content) {
                    console.log('[Me Learning Hub] No text selected');
                    sendResponse({
                        success: false,
                        error: 'No text selected. Please select text on the page and try again.'
                    });
                    return;
                }
            } else {
                // Full page capture - body only, no styles
                console.log('[Me Learning Hub] Capturing full page (body only, no styles)');
                content = extractFullPageContent();
            }

            // Calculate metadata
            const wordCount = content.split(/\s+/).length;
            const readingTime = calculateReadingTime(content);

            const response = {
                success: true,
                content: content,
                metadata: {
                    ...metadata,
                    wordCount: wordCount,
                    readingTime: readingTime,
                    captureType: captureType,
                    capturedAt: new Date().toISOString()
                }
            };

            console.log('[Me Learning Hub] Sending response:', {
                success: response.success,
                contentLength: response.content.length,
                wordCount: response.metadata.wordCount,
                pageTitle: metadata.title
            });

            sendResponse(response);
        }
    } catch (error) {
        console.error('[Me Learning Hub] Error in message listener:', error);
        sendResponse({
            success: false,
            error: 'Error capturing content: ' + error.message
        });
    }
});

console.log('[Me Learning Hub] Message listener registered');
