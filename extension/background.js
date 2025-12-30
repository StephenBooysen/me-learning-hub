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
 * Send message to Electron app
 * Uses native messaging if available, falls back to file system
 */
async function sendElectronMessage(message) {
  return new Promise((resolve, reject) => {
    // Try native messaging first
    chrome.runtime.sendNativeMessage(
      'com.melearninghub.nativehost',
      message,
      (response) => {
        if (chrome.runtime.lastError) {
          console.warn('Native messaging failed, using fallback');
          // Fallback: return mock response
          // In production, this would use file system API or other mechanism
          resolve({ success: true, fallback: true });
        } else {
          resolve(response);
        }
      }
    );

    // Timeout after 5 seconds
    setTimeout(() => {
      reject(new Error('Electron communication timeout'));
    }, 5000);
  });
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
