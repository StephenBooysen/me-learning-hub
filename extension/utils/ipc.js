/**
 * IPC Module
 * Handles communication between extension and Electron app
 */

/**
 * Send message to Electron app using native messaging
 */
export function sendToElectron(message) {
  return new Promise((resolve, reject) => {
    // Try native messaging
    chrome.runtime.sendNativeMessage(
      'com.melearninghub.nativehost',
      message,
      (response) => {
        if (chrome.runtime.lastError) {
          // Fallback: store in local storage for polling
          console.warn('Native messaging failed, using fallback');
          fallbackSendMessage(message, resolve, reject);
        } else {
          resolve(response);
        }
      }
    );

    // Timeout
    setTimeout(() => {
      reject(new Error('Electron communication timeout (5s)'));
    }, 5000);
  });
}

/**
 * Fallback mechanism using shared directory
 * In production, this would write to a monitored directory
 */
function fallbackSendMessage(message, resolve, reject) {
  try {
    // Store in chrome.storage.local as temporary solution
    const messageId = generateMessageId();
    chrome.storage.local.set({
      [`electron_message_${messageId}`]: {
        id: messageId,
        message: message,
        timestamp: Date.now(),
        status: 'pending'
      }
    }, () => {
      // Check periodically for response
      checkForResponse(messageId, resolve, reject);
    });
  } catch (error) {
    reject(error);
  }
}

/**
 * Check for response from Electron
 */
function checkForResponse(messageId, resolve, reject, attempts = 0) {
  if (attempts > 50) { // ~5 seconds with 100ms intervals
    reject(new Error('No response from Electron'));
    return;
  }

  chrome.storage.local.get(`electron_response_${messageId}`, (result) => {
    if (result[`electron_response_${messageId}`]) {
      const response = result[`electron_response_${messageId}`];
      chrome.storage.local.remove([
        `electron_message_${messageId}`,
        `electron_response_${messageId}`
      ]);
      resolve(response);
    } else {
      setTimeout(() => {
        checkForResponse(messageId, resolve, reject, attempts + 1);
      }, 100);
    }
  });
}

/**
 * List projects from Electron
 */
export function getProjects() {
  return sendToElectron({
    action: 'project:list'
  });
}

/**
 * Create project
 */
export function createProject(name, description = '') {
  return sendToElectron({
    action: 'project:create',
    name: name,
    description: description
  });
}

/**
 * Get project details
 */
export function getProject(projectId) {
  return sendToElectron({
    action: 'project:get',
    projectId: projectId
  });
}

/**
 * Save document to project
 */
export function saveDocument(projectId, docId, content, metadata = {}) {
  return sendToElectron({
    action: 'document:save',
    projectId: projectId,
    docId: docId,
    content: content,
    metadata: metadata
  });
}

/**
 * Get stored data from chrome.storage
 */
export function getStorageData(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      resolve(result[key] || null);
    });
  });
}

/**
 * Set stored data in chrome.storage
 */
export function setStorageData(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}

/**
 * Generate unique message ID
 */
function generateMessageId() {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Listen for messages from background script
 */
export function onMessage(callback) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    callback(request, sender, sendResponse);
  });
}

/**
 * Send message to background script
 */
export function sendMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

console.log('IPC module loaded');
