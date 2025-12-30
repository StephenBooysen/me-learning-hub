/**
 * Background Service Worker
 * Handles extension lifecycle and message routing
 */

// Initialize extension
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Me Learning Hub extension installed');
    // Open welcome page or settings
    chrome.tabs.create({
      url: 'popup.html'
    });
  } else if (details.reason === 'update') {
    console.log('Me Learning Hub extension updated');
  }
});

// Handle command shortcuts
chrome.commands.onCommand.addListener((command) => {
  console.log('Command received:', command);

  if (command === 'capture-page') {
    captureCurrentPage();
  } else if (command === 'capture-selection') {
    captureSelection();
  }
});

/**
 * Capture entire current page
 */
async function captureCurrentPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Send message to content script to extract content
    chrome.tabs.sendMessage(tab.id, {
      action: 'extractPageContent',
      type: 'full'
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error:', chrome.runtime.lastError);
        return;
      }
      handleExtractedContent(response, tab);
    });
  } catch (error) {
    console.error('Error capturing page:', error);
  }
}

/**
 * Capture selected text
 */
async function captureSelection() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.tabs.sendMessage(tab.id, {
      action: 'extractSelectedContent'
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error:', chrome.runtime.lastError);
        return;
      }
      handleExtractedContent(response, tab);
    });
  } catch (error) {
    console.error('Error capturing selection:', error);
  }
}

/**
 * Handle extracted content from content script
 */
function handleExtractedContent(content, tab) {
  if (!content || !content.markdown) {
    console.warn('No content extracted');
    return;
  }

  // Store in chrome.storage for popup to access
  chrome.storage.local.set({
    'lastExtraction': {
      title: content.title || tab.title,
      sourceUrl: tab.url,
      markdown: content.markdown,
      html: content.html,
      timestamp: new Date().toISOString(),
      tabId: tab.id
    }
  }, () => {
    console.log('Content stored, opening popup');
    // Open popup for user to confirm and save
    chrome.action.openPopup();
  });
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request.action);

  if (request.action === 'getLastExtraction') {
    chrome.storage.local.get('lastExtraction', (result) => {
      sendResponse({ success: true, data: result.lastExtraction });
    });
    return true; // Will respond asynchronously
  }

  if (request.action === 'clearLastExtraction') {
    chrome.storage.local.remove('lastExtraction', () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === 'listProjects') {
    // This would be called from popup to get projects from Electron
    sendElectronMessage({
      action: 'project:list'
    }).then(result => {
      sendResponse({ success: true, data: result });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }

  if (request.action === 'saveDocument') {
    // Save document to Electron app
    sendElectronMessage({
      action: 'document:save',
      projectId: request.projectId,
      docId: request.docId,
      content: request.content,
      metadata: request.metadata
    }).then(result => {
      sendResponse({ success: true, data: result });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
});

/**
 * Send message to Electron app via HTTP bridge
 * Uses localhost:47823 HTTP bridge for document import and project management
 */
async function sendElectronMessage(message) {
  const BRIDGE_URL = 'http://localhost:47823';
  const TIMEOUT = 5000;

  try {
    // First check if Electron app is running
    const healthCheck = await Promise.race([
      fetch(`${BRIDGE_URL}/api/health`),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Health check timeout')), TIMEOUT)
      )
    ]);

    if (!healthCheck.ok) {
      throw new Error('Electron app health check failed');
    }

    // Map native messaging format to HTTP API format
    let endpoint, payload;

    if (message.action === 'document:save') {
      endpoint = '/api/import-document';
      payload = {
        projectId: message.projectId,
        docId: message.docId,
        content: message.content,
        metadata: message.metadata || {},
        autoGeneratePlan: message.autoGeneratePlan || false
      };
    } else if (message.action === 'project:list') {
      endpoint = '/api/projects';
      payload = {};
    } else {
      throw new Error(`Unknown action: ${message.action}`);
    }

    // Send HTTP request to Electron bridge
    const response = await Promise.race([
      fetch(`${BRIDGE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), TIMEOUT)
      )
    ]);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.duplicate) {
      // Handle duplicate document case
      return {
        success: false,
        duplicate: true,
        existingDoc: data.existingDoc,
        message: 'Document already imported from this URL'
      };
    }

    return { success: true, data: data.data || data };
  } catch (error) {
    console.error('Electron communication error:', error.message);
    throw new Error(`Failed to communicate with Me Learning Hub app: ${error.message}`);
  }
}

/**
 * Handle tab updates
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    console.log('Tab loaded:', tab.url);
    // Could inject content script dynamically if needed
  }
});

/**
 * Handle context menu clicks
 */
chrome.contextMenus?.create?.({
  id: 'capture-page-context',
  title: 'Capture page to Me Learning Hub',
  contexts: ['page']
});

chrome.contextMenus?.create?.({
  id: 'capture-selection-context',
  title: 'Capture selection to Me Learning Hub',
  contexts: ['selection']
});

chrome.contextMenus?.onClicked?.addListener?.((info, tab) => {
  if (info.menuItemId === 'capture-page-context') {
    captureCurrentPage();
  } else if (info.menuItemId === 'capture-selection-context') {
    captureSelection();
  }
});

console.log('Me Learning Hub background service worker loaded');
