/**
 * Background Service Worker
 * Handles communication between extension and Electron app
 */

console.log('[Me Learning Hub] Background service worker loaded');

const ELECTRON_BRIDGE_URL = 'http://localhost:47823';
const HEALTH_CHECK_TIMEOUT = 5000;

/**
 * Check if Electron bridge is running
 */
async function checkElectronBridge() {
    try {
        const response = await fetch(`${ELECTRON_BRIDGE_URL}/api/health`, {
            method: 'GET',
            timeout: HEALTH_CHECK_TIMEOUT
        });
        return response.ok;
    } catch (error) {
        console.error('Electron bridge health check failed:', error);
        return false;
    }
}

/**
 * Fetch projects from Electron app
 */
async function fetchProjects() {
    try {
        const bridgeAvailable = await checkElectronBridge();
        if (!bridgeAvailable) {
            throw new Error('Electron app is not running or HTTP bridge is unavailable');
        }

        const response = await fetch(`${ELECTRON_BRIDGE_URL}/api/projects`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch projects: ${response.statusText}`);
        }

        const data = await response.json();
        return data.projects || [];
    } catch (error) {
        console.error('Error fetching projects:', error);
        throw error;
    }
}

/**
 * Save document to Electron app
 */
async function saveDocument(projectId, content, metadata, autoGenerateStudyPlan = false) {
    try {
        const bridgeAvailable = await checkElectronBridge();
        if (!bridgeAvailable) {
            throw new Error('Electron app is not running');
        }

        const payload = {
            projectId: projectId,
            content: content,
            title: metadata.title || 'Untitled Document',
            sourceUrl: metadata.url,
            domain: metadata.domain,
            wordCount: metadata.wordCount,
            readingTime: metadata.readingTime,
            captureType: metadata.captureType,
            autoGenerateStudyPlan: autoGenerateStudyPlan,
            metadata: metadata
        };

        const response = await fetch(`${ELECTRON_BRIDGE_URL}/api/documents`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            // Check for duplicate error
            if (response.status === 409) {
                return {
                    success: false,
                    isDuplicate: true,
                    message: data.message || 'Similar content already exists in this project',
                    existingDocument: data.existingDocument
                };
            }
            throw new Error(data.message || `Failed to save document: ${response.statusText}`);
        }

        return {
            success: true,
            documentId: data.documentId,
            message: data.message || 'Document saved successfully'
        };
    } catch (error) {
        console.error('Error saving document:', error);
        throw error;
    }
}

/**
 * Override and save duplicate document
 */
async function overrideDuplicateDocument(projectId, content, metadata, autoGenerateStudyPlan = false) {
    try {
        const payload = {
            projectId: projectId,
            content: content,
            title: metadata.title || 'Untitled Document',
            sourceUrl: metadata.url,
            domain: metadata.domain,
            wordCount: metadata.wordCount,
            readingTime: metadata.readingTime,
            captureType: metadata.captureType,
            autoGenerateStudyPlan: autoGenerateStudyPlan,
            metadata: metadata,
            override: true
        };

        const response = await fetch(`${ELECTRON_BRIDGE_URL}/api/documents`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `Failed to save document: ${response.statusText}`);
        }

        return {
            success: true,
            documentId: data.documentId,
            message: 'Document saved successfully'
        };
    } catch (error) {
        console.error('Error overriding duplicate:', error);
        throw error;
    }
}

/**
 * Listen for messages from popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[Me Learning Hub] Message received from popup:', request.action);

    try {
        if (request.action === 'fetchProjects') {
            fetchProjects()
                .then(projects => {
                    console.log('[Me Learning Hub] Projects fetched:', projects.length);
                    sendResponse({ success: true, projects: projects });
                })
                .catch(error => {
                    console.error('[Me Learning Hub] Error fetching projects:', error);
                    sendResponse({ success: false, error: error.message });
                });
            return true; // Keep channel open for async response
        }

        if (request.action === 'checkBridgeConnection') {
            checkElectronBridge()
                .then(isAvailable => {
                    console.log('[Me Learning Hub] Bridge connection check:', isAvailable);
                    sendResponse({ success: true, connected: isAvailable });
                })
                .catch(error => {
                    console.error('[Me Learning Hub] Bridge connection error:', error);
                    sendResponse({ success: false, error: error.message });
                });
            return true;
        }

        if (request.action === 'saveDocument') {
            console.log('[Me Learning Hub] Saving document...');
            const { projectId, content, metadata, autoGenerateStudyPlan } = request;
            saveDocument(projectId, content, metadata, autoGenerateStudyPlan)
                .then(result => {
                    console.log('[Me Learning Hub] Document saved successfully:', result);
                    sendResponse(result);
                })
                .catch(error => {
                    console.error('[Me Learning Hub] Error saving document:', error);
                    sendResponse({ success: false, error: error.message });
                });
            return true;
        }

        if (request.action === 'overrideDuplicate') {
            console.log('[Me Learning Hub] Overriding duplicate...');
            const { projectId, content, metadata, autoGenerateStudyPlan } = request;
            overrideDuplicateDocument(projectId, content, metadata, autoGenerateStudyPlan)
                .then(result => {
                    console.log('[Me Learning Hub] Duplicate override successful:', result);
                    sendResponse(result);
                })
                .catch(error => {
                    console.error('[Me Learning Hub] Error overriding duplicate:', error);
                    sendResponse({ success: false, error: error.message });
                });
            return true;
        }
    } catch (error) {
        console.error('[Me Learning Hub] Unexpected error in message handler:', error);
        sendResponse({ success: false, error: error.message });
    }
});
