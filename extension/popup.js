/**
 * Popup Script
 * Handles UI logic and user interactions
 */

// DOM Elements
const projectSelect = document.getElementById('projectSelect');
const captureTypeRadios = document.querySelectorAll('input[name="captureType"]');
const autoGenerateCheckbox = document.getElementById('autoGenerateStudyPlan');
const captureButton = document.getElementById('captureButton');
const settingsButton = document.getElementById('settingsButton');
const loadingOverlay = document.getElementById('loadingOverlay');
const metadataSection = document.getElementById('metadataSection');
const connectionStatus = document.getElementById('connectionStatus');
const duplicateWarning = document.getElementById('duplicateWarning');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const actionButtons = document.getElementById('actionButtons');
const overrideButton = document.getElementById('overrideButton');
const cancelButton = document.getElementById('cancelButton');

let currentContent = null;
let currentMetadata = null;
let pendingDuplicate = null;

/**
 * Show loading overlay
 */
function showLoading() {
    loadingOverlay.style.display = 'flex';
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    loadingOverlay.style.display = 'none';
}

/**
 * Update connection status indicator
 */
async function updateConnectionStatus() {
    try {
        chrome.runtime.sendMessage(
            { action: 'checkBridgeConnection' },
            (response) => {
                if (response.success && response.connected) {
                    connectionStatus.textContent = '●';
                    connectionStatus.classList.add('connected');
                    connectionStatus.classList.remove('disconnected');
                } else {
                    connectionStatus.textContent = '●';
                    connectionStatus.classList.add('disconnected');
                    connectionStatus.classList.remove('connected');
                }
            }
        );
    } catch (error) {
        console.error('Error checking connection:', error);
        connectionStatus.classList.add('disconnected');
    }
}

/**
 * Load projects from Electron app
 */
function loadProjects() {
    projectSelect.innerHTML = '<option value="">Loading projects...</option>';
    projectSelect.disabled = true;

    chrome.runtime.sendMessage(
        { action: 'fetchProjects' },
        (response) => {
            projectSelect.disabled = false;

            if (response.success && response.projects && response.projects.length > 0) {
                projectSelect.innerHTML = '<option value="">-- Select a Project --</option>';
                response.projects.forEach(project => {
                    const option = document.createElement('option');
                    option.value = project.id;
                    option.textContent = project.name;
                    projectSelect.appendChild(option);
                });
            } else {
                const errorMsg = response.error || 'No projects found. Please create a project in Me Learning Hub first.';
                projectSelect.innerHTML = `<option value="" disabled>${errorMsg}</option>`;
            }
        }
    );
}

/**
 * Show error message
 */
function showError(title, message) {
    errorMessage.style.display = 'block';
    document.getElementById('errorDetail').textContent = message;
    successMessage.style.display = 'none';
    duplicateWarning.style.display = 'none';
}

/**
 * Show success message
 */
function showSuccess(title, message) {
    successMessage.style.display = 'block';
    document.getElementById('successDetail').textContent = message;
    errorMessage.style.display = 'none';
    duplicateWarning.style.display = 'none';
    actionButtons.style.display = 'none';
}

/**
 * Show duplicate warning
 */
function showDuplicate(existingDoc) {
    duplicateWarning.style.display = 'block';
    const message = `Similar content already exists: "${existingDoc.title || 'Untitled'}"`;
    document.getElementById('duplicateMessage').textContent = message;
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
}

/**
 * Display page metadata
 */
function displayMetadata(metadata) {
    metadataSection.style.display = 'block';
    document.getElementById('pageTitle').textContent = metadata.title || 'Unknown';
    document.getElementById('pageUrl').textContent = new URL(metadata.url).hostname;
    document.getElementById('wordCount').textContent = metadata.wordCount ? `${metadata.wordCount.toLocaleString()}` : '-';
    document.getElementById('readTime').textContent = metadata.readingTime ? `${metadata.readingTime} min` : '-';
}

/**
 * Get current tab's content
 */
async function captureContent() {
    const captureType = document.querySelector('input[name="captureType"]:checked').value;

    showLoading();

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // First, inject the content script to ensure it's loaded
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
        });

        // Now send the message to capture content
        chrome.tabs.sendMessage(
            tab.id,
            { action: 'getPageContent', captureType: captureType },
            (response) => {
                hideLoading();

                // Check for runtime errors
                if (chrome.runtime.lastError) {
                    console.error('Runtime error:', chrome.runtime.lastError);
                    showError('Error', 'Failed to communicate with page. Try refreshing and try again.');
                    return;
                }

                // Check if response exists
                if (!response) {
                    console.error('No response from content script');
                    showError('Error', 'Failed to capture content. Try refreshing the page.');
                    return;
                }

                if (response.success) {
                    currentContent = response.content;
                    currentMetadata = response.metadata;
                    displayMetadata(currentMetadata);

                    // After capturing, proceed to save
                    proceedToSave();
                } else {
                    showError('Error', response.error || 'Failed to capture content');
                }
            }
        );
    } catch (error) {
        hideLoading();
        console.error('Capture error:', error);
        showError('Error', 'Failed to capture content: ' + error.message);
    }
}

/**
 * Save document to Electron app
 */
function proceedToSave() {
    const projectId = projectSelect.value;
    const autoGenerateStudyPlan = autoGenerateCheckbox.checked;

    showLoading();

    chrome.runtime.sendMessage(
        {
            action: 'saveDocument',
            projectId: projectId,
            content: currentContent,
            metadata: currentMetadata,
            autoGenerateStudyPlan: autoGenerateStudyPlan
        },
        (response) => {
            hideLoading();

            // Check for runtime errors
            if (chrome.runtime.lastError) {
                console.error('Runtime error:', chrome.runtime.lastError);
                showError('Error', 'Failed to communicate with application. Is the Me Learning Hub app running?');
                return;
            }

            // Check if response exists
            if (!response) {
                console.error('No response from background script');
                showError('Error', 'No response from application. Check that Me Learning Hub is running.');
                return;
            }

            if (response.success) {
                showSuccess('Success', `Document saved! (ID: ${response.documentId})`);
                // Reset after 2 seconds
                setTimeout(() => {
                    currentContent = null;
                    currentMetadata = null;
                    metadataSection.style.display = 'none';
                    errorMessage.style.display = 'none';
                    successMessage.style.display = 'none';
                    actionButtons.style.display = 'flex';
                }, 2000);
            } else if (response.isDuplicate) {
                pendingDuplicate = response;
                showDuplicate(response.existingDocument || {});
                actionButtons.style.display = 'none';
            } else {
                showError('Error', response.error || 'Failed to save document');
            }
        }
    );
}

/**
 * Handle capture and save workflow
 */
function handleCapture() {
    const projectId = projectSelect.value;

    if (!projectId) {
        showError('Error', 'Please select a project');
        return;
    }

    // First, capture the content from the page
    if (!currentContent) {
        captureContent();
        return;
    }

    // If content is already captured, proceed to save
    proceedToSave();
}

/**
 * Handle duplicate override
 */
function handleOverride() {
    if (!pendingDuplicate) return;

    const autoGenerateStudyPlan = autoGenerateCheckbox.checked;

    showLoading();

    chrome.runtime.sendMessage(
        {
            action: 'overrideDuplicate',
            projectId: projectSelect.value,
            content: currentContent,
            metadata: currentMetadata,
            autoGenerateStudyPlan: autoGenerateStudyPlan
        },
        (response) => {
            hideLoading();

            if (response.success) {
                showSuccess('Success', `Document saved successfully!`);
                pendingDuplicate = null;
                setTimeout(() => {
                    currentContent = null;
                    currentMetadata = null;
                    metadataSection.style.display = 'none';
                    errorMessage.style.display = 'none';
                    successMessage.style.display = 'none';
                    duplicateWarning.style.display = 'none';
                    actionButtons.style.display = 'flex';
                }, 2000);
            } else {
                showError('Error', response.error || 'Failed to save document');
            }
        }
    );
}

/**
 * Handle cancel duplicate override
 */
function handleCancel() {
    pendingDuplicate = null;
    duplicateWarning.style.display = 'none';
    actionButtons.style.display = 'flex';
}

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
    captureButton.addEventListener('click', handleCapture);
    settingsButton.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });
    overrideButton.addEventListener('click', handleOverride);
    cancelButton.addEventListener('click', handleCancel);

    // Capture on any capture type change (to show/hide selection reminder)
    captureTypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'selection') {
                // Could show a tooltip here
            }
        });
    });
}

/**
 * Initialize popup
 */
document.addEventListener('DOMContentLoaded', () => {
    updateConnectionStatus();
    loadProjects();
    initializeEventListeners();

    // Refresh connection status every 5 seconds
    setInterval(updateConnectionStatus, 5000);
});
