/**
 * Popup Logic
 * Handles UI interactions and communication with background script
 */

let currentView = 'extraction';
let currentExtraction = null;
let projects = [];

// DOM Elements
const views = document.querySelectorAll('.view');
const btnCaptureFullPage = document.getElementById('btn-capture-page');
const btnCaptureSelection = document.getElementById('btn-capture-selection');
const btnSettings = document.getElementById('settings-btn');
const btnBack = document.getElementById('btn-back');
const btnBackSettings = document.getElementById('btn-back-settings');
const btnCancelSave = document.getElementById('btn-cancel-save');
const btnSaveDocument = document.getElementById('btn-save-document');
const btnStatusClose = document.getElementById('btn-status-close');
const btnResetSettings = document.getElementById('btn-reset-settings');

// Form Elements
const previewTitle = document.getElementById('preview-title');
const previewUrl = document.getElementById('preview-url');
const previewProject = document.getElementById('preview-project');
const previewContent = document.getElementById('preview-content');
const previewTags = document.getElementById('preview-tags');
const projectsList = document.getElementById('projects-list');

// Settings Elements
const settingDefaultProject = document.getElementById('setting-default-project');
const settingAutoSave = document.getElementById('setting-auto-save');
const settingCopyClipboard = document.getElementById('setting-copy-clipboard');
const settingContextMenu = document.getElementById('setting-context-menu');
const settingIncludeImages = document.getElementById('setting-include-images');
const settingIncludeLinks = document.getElementById('setting-include-links');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  loadProjects();
  loadSettings();
  checkForLastExtraction();
});

/**
 * Initialize all event listeners
 */
function initializeEventListeners() {
  // Capture buttons
  btnCaptureFullPage.addEventListener('click', captureFullPage);
  btnCaptureSelection.addEventListener('click', captureSelection);

  // Settings
  btnSettings.addEventListener('click', () => switchView('settings'));
  btnBack.addEventListener('click', () => switchView('extraction'));
  btnBackSettings.addEventListener('click', () => switchView('extraction'));
  btnResetSettings.addEventListener('click', resetSettings);

  // Preview/Save
  btnCancelSave.addEventListener('click', () => switchView('extraction'));
  btnSaveDocument.addEventListener('click', saveDocument);

  // Status
  btnStatusClose.addEventListener('click', () => switchView('extraction'));

  // Settings changes
  settingAutoSave.addEventListener('change', () => saveSettings());
  settingCopyClipboard.addEventListener('change', () => saveSettings());
  settingContextMenu.addEventListener('change', () => saveSettings());
  settingIncludeImages.addEventListener('change', () => saveSettings());
  settingIncludeLinks.addEventListener('change', () => saveSettings());
  settingDefaultProject.addEventListener('change', () => saveSettings());

  // Project selection in extraction view
  projectsList.addEventListener('click', (e) => {
    const projectItem = e.target.closest('.project-item');
    if (projectItem) {
      const projectId = projectItem.dataset.projectId;
      previewProject.value = projectId;
      captureCurrentPage();
    }
  });
}

/**
 * Switch views
 */
function switchView(viewName) {
  currentView = viewName;
  views.forEach(view => view.classList.remove('active'));
  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) {
    targetView.classList.add('active');
  }
}

/**
 * Capture full page
 */
async function captureFullPage() {
  try {
    btnCaptureFullPage.disabled = true;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.tabs.sendMessage(tab.id, {
      action: 'extractPageContent',
      type: 'full'
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error:', chrome.runtime.lastError);
        showStatus('error', 'Error', 'Failed to capture page. Please try again.');
        return;
      }

      if (!response || !response.markdown) {
        showStatus('error', 'Error', 'No content found to capture.');
        return;
      }

      currentExtraction = {
        title: response.title || tab.title,
        sourceUrl: tab.url,
        markdown: response.markdown,
        html: response.html
      };

      showPreview();
      switchView('preview');
    });
  } catch (error) {
    console.error('Error capturing page:', error);
    showStatus('error', 'Error', error.message);
  } finally {
    btnCaptureFullPage.disabled = false;
  }
}

/**
 * Capture selected text
 */
async function captureSelection() {
  try {
    btnCaptureSelection.disabled = true;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.tabs.sendMessage(tab.id, {
      action: 'extractSelectedContent'
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error:', chrome.runtime.lastError);
        showStatus('error', 'Error', 'Failed to capture selection.');
        return;
      }

      if (!response || !response.markdown) {
        showStatus('error', 'No Selection', 'Please select some text first.');
        return;
      }

      currentExtraction = {
        title: response.title || 'Selected Content',
        sourceUrl: tab.url,
        markdown: response.markdown,
        html: response.html
      };

      showPreview();
      switchView('preview');
    });
  } catch (error) {
    console.error('Error capturing selection:', error);
    showStatus('error', 'Error', error.message);
  } finally {
    btnCaptureSelection.disabled = false;
  }
}

/**
 * Capture current page (from projects list click)
 */
async function captureCurrentPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.tabs.sendMessage(tab.id, {
      action: 'extractPageContent',
      type: 'full'
    }, (response) => {
      if (chrome.runtime.lastError || !response?.markdown) {
        showStatus('error', 'Error', 'Failed to capture page.');
        return;
      }

      currentExtraction = {
        title: response.title || tab.title,
        sourceUrl: tab.url,
        markdown: response.markdown,
        html: response.html
      };

      showPreview();
      switchView('preview');
    });
  } catch (error) {
    console.error('Error:', error);
    showStatus('error', 'Error', error.message);
  }
}

/**
 * Show preview of extracted content
 */
function showPreview() {
  if (!currentExtraction) return;

  previewTitle.value = currentExtraction.title;
  previewUrl.value = currentExtraction.sourceUrl;
  previewContent.textContent = currentExtraction.markdown.substring(0, 500);
  previewTags.value = '';

  // Populate project select
  previewProject.innerHTML = '<option value="">-- Select a project --</option>';
  projects.forEach(project => {
    const option = document.createElement('option');
    option.value = project.id;
    option.textContent = project.name;
    previewProject.appendChild(option);
  });

  // Set default project if exists
  const settings = chrome.storage.local.get('settings', (result) => {
    if (result.settings?.defaultProject) {
      previewProject.value = result.settings.defaultProject;
    }
  });
}

/**
 * Save document to Electron app
 */
async function saveDocument() {
  if (!currentExtraction) {
    showStatus('error', 'Error', 'No content to save.');
    return;
  }

  const projectId = previewProject.value;
  const title = previewTitle.value.trim();
  const tags = previewTags.value.trim();

  if (!projectId) {
    showStatus('error', 'Error', 'Please select a project.');
    return;
  }

  if (!title) {
    showStatus('error', 'Error', 'Please enter a title.');
    return;
  }

  try {
    btnSaveDocument.disabled = true;

    const docId = generateUUID();
    const metadata = {
      title: title,
      sourceUrl: currentExtraction.sourceUrl,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      captured: new Date().toISOString()
    };

    // Send to background script for Electron communication
    chrome.runtime.sendMessage({
      action: 'saveDocument',
      projectId: projectId,
      docId: docId,
      content: currentExtraction.markdown,
      metadata: metadata
    }, (response) => {
      if (response?.success) {
        // Copy to clipboard if enabled
        const settings = chrome.storage.local.get('settings', (result) => {
          if (result.settings?.copyClipboard) {
            navigator.clipboard.writeText(currentExtraction.markdown);
          }
        });

        showStatus('success', 'Success!', `Document saved to "${title}"`);
        currentExtraction = null;
        setTimeout(() => switchView('extraction'), 2000);
      } else {
        showStatus('error', 'Error', response?.error || 'Failed to save document.');
      }
    });
  } catch (error) {
    console.error('Error saving document:', error);
    showStatus('error', 'Error', error.message);
  } finally {
    btnSaveDocument.disabled = false;
  }
}

/**
 * Load projects from Electron
 */
async function loadProjects() {
  try {
    chrome.runtime.sendMessage({ action: 'listProjects' }, (response) => {
      if (response?.success && response.data) {
        projects = response.data;
        displayProjects();
        updateProjectSelects();
      }
    });
  } catch (error) {
    console.error('Error loading projects:', error);
    projectsList.innerHTML = '<p class="empty-state">Unable to load projects. Is Electron running?</p>';
  }
}

/**
 * Display projects in extraction view
 */
function displayProjects() {
  projectsList.innerHTML = '';

  if (projects.length === 0) {
    projectsList.innerHTML = '<p class="empty-state">No projects yet. Create one in Me Learning Hub!</p>';
    return;
  }

  const recentProjects = projects.slice(0, 3);
  recentProjects.forEach(project => {
    const projectItem = document.createElement('div');
    projectItem.className = 'project-item';
    projectItem.dataset.projectId = project.id;
    projectItem.innerHTML = `
      <div class="project-name">${escapeHtml(project.name)}</div>
      <div class="project-meta">${project.documents || 0} documents</div>
    `;
    projectsList.appendChild(projectItem);
  });
}

/**
 * Update project select dropdowns
 */
function updateProjectSelects() {
  [previewProject, settingDefaultProject].forEach(select => {
    const currentValue = select.value;
    select.innerHTML = '<option value="">-- Select a project --</option>';
    projects.forEach(project => {
      const option = document.createElement('option');
      option.value = project.id;
      option.textContent = project.name;
      select.appendChild(option);
    });
    if (currentValue) select.value = currentValue;
  });
}

/**
 * Load settings
 */
function loadSettings() {
  chrome.storage.local.get('settings', (result) => {
    const settings = result.settings || {};
    settingAutoSave.checked = settings.autoSave !== false;
    settingCopyClipboard.checked = settings.copyClipboard !== false;
    settingContextMenu.checked = settings.contextMenu !== false;
    settingIncludeImages.checked = settings.includeImages !== false;
    settingIncludeLinks.checked = settings.includeLinks !== false;
    if (settings.defaultProject) {
      settingDefaultProject.value = settings.defaultProject;
    }
  });
}

/**
 * Save settings
 */
function saveSettings() {
  const settings = {
    autoSave: settingAutoSave.checked,
    copyClipboard: settingCopyClipboard.checked,
    contextMenu: settingContextMenu.checked,
    includeImages: settingIncludeImages.checked,
    includeLinks: settingIncludeLinks.checked,
    defaultProject: settingDefaultProject.value
  };

  chrome.storage.local.set({ settings: settings });
}

/**
 * Reset settings to defaults
 */
function resetSettings() {
  const defaultSettings = {
    autoSave: true,
    copyClipboard: true,
    contextMenu: true,
    includeImages: true,
    includeLinks: true,
    defaultProject: ''
  };

  chrome.storage.local.set({ settings: defaultSettings }, () => {
    loadSettings();
    showStatus('success', 'Success', 'Settings reset to defaults');
  });
}

/**
 * Check for last extraction from background script
 */
function checkForLastExtraction() {
  chrome.storage.local.get('lastExtraction', (result) => {
    if (result.lastExtraction) {
      currentExtraction = result.lastExtraction;
      showPreview();
      switchView('preview');
      chrome.storage.local.remove('lastExtraction');
    }
  });
}

/**
 * Show status message
 */
function showStatus(type, title, message) {
  const statusIcon = document.getElementById('status-icon');
  const statusTitle = document.getElementById('status-title');
  const statusMessage = document.getElementById('status-message');

  statusIcon.textContent = type === 'success' ? '✓' : '✕';
  statusIcon.className = `status-icon ${type}`;
  statusTitle.textContent = title;
  statusMessage.textContent = message;

  switchView('status');
}

/**
 * Generate UUID
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

console.log('Me Learning Hub popup script loaded');
