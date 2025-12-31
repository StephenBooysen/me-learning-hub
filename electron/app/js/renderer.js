/**
 * Renderer Process - Main UI Logic
 */

let currentProject = null;
let projects = [];
let currentView = 'dashboard';

// DOM Elements
const navButtons = document.querySelectorAll('.nav-button');
const views = document.querySelectorAll('.view');
const newProjectBtns = document.querySelectorAll('#new-project-btn, #create-project-btn');
const settingsBtn = document.getElementById('settings-btn');
const toggleSidebarBtn = document.getElementById('toggle-sidebar');

// Modals
const newProjectModal = document.getElementById('modal-new-project');
const settingsModal = document.getElementById('modal-settings');
const modalCloseButtons = document.querySelectorAll('.modal-close');
const formNewProject = document.getElementById('form-new-project');
const btnCreateProject = document.getElementById('btn-create-project');

// Input fields
const projectNameInput = document.getElementById('project-name');
const projectDescriptionInput = document.getElementById('project-description');
const dataDirInput = document.getElementById('data-dir');
const themeSelect = document.getElementById('theme-select');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  loadConfig();
  // Show dashboard first, then load projects
  switchView('dashboard');
  loadProjects();
});

/**
 * Initialize all event listeners
 */
function initializeEventListeners() {
  // Navigation
  navButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const viewName = btn.dataset.view;
      switchView(viewName);
    });
  });

  // New Project buttons
  newProjectBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      console.log('[DEBUG] New project button clicked');
      openModal('modal-new-project');
    });
  });

  // Settings button
  settingsBtn.addEventListener('click', () => {
    openModal('modal-settings');
  });

  // Modal close buttons
  modalCloseButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modalId = btn.dataset.modal;
      closeModal(modalId);
    });
  });

  // Modal backdrop close
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });

  // Modal action buttons
  document.querySelectorAll('[data-modal]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (btn.tagName === 'BUTTON' && btn.textContent.includes('Cancel')) {
        closeModal(btn.dataset.modal);
      }
    });
  });

  // Form submission
  if (btnCreateProject) {
    btnCreateProject.addEventListener('click', createNewProject);
  }

  if (formNewProject) {
    formNewProject.addEventListener('submit', (e) => {
      e.preventDefault();
      createNewProject();
    });
  }

  // Sidebar toggle (mobile)
  if (toggleSidebarBtn) {
    toggleSidebarBtn.addEventListener('click', () => {
      document.querySelector('.sidebar').classList.toggle('open');
    });
  }

  // Close sidebar on nav button click (mobile)
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        document.querySelector('.sidebar').classList.remove('open');
      }
    });
  });

  // Settings changes
  if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
      window.electronAPI.setConfig('theme', e.target.value);
    });
  }

  // Document viewer controls
  const breadcrumbBack = document.getElementById('breadcrumb-docs');
  const copyBtn = document.getElementById('btn-copy-content');
  const downloadBtn = document.getElementById('btn-download-content');

  if (breadcrumbBack) {
    breadcrumbBack.addEventListener('click', (e) => {
      e.preventDefault();
      goBackToDocumentsList();
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', copyContentToClipboard);
  }

  if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadDocumentAsMarkdown);
  }

  // Study plan viewer controls
  const studyBreadcrumbBack = document.getElementById('breadcrumb-study');
  if (studyBreadcrumbBack) {
    studyBreadcrumbBack.addEventListener('click', (e) => {
      e.preventDefault();
      backToStudyPlansList();
    });
  }
}

/**
 * Switch to a different view
 */
function switchView(viewName) {
  currentView = viewName;

  // Update nav buttons
  navButtons.forEach(btn => {
    btn.classList.remove('nav-button--active');
    if (btn.dataset.view === viewName) {
      btn.classList.add('nav-button--active');
    }
  });

  // Update views
  views.forEach(view => {
    view.classList.remove('active');
    if (view.id === `view-${viewName}`) {
      view.classList.add('active');
    }
  });

  // Update page title
  const pageTitle = document.getElementById('page-title');
  const titles = {
    dashboard: 'Dashboard',
    projects: 'My Projects',
    documents: 'Documents',
    study: 'Study Plans',
    progress: 'Learning Progress'
  };
  pageTitle.textContent = titles[viewName] || 'Dashboard';

  // Load view-specific content
  if (viewName === 'dashboard') {
    loadDashboard();
  } else if (viewName === 'projects') {
    loadProjectsList();
  } else if (viewName === 'documents') {
    loadDocuments();
  } else if (viewName === 'progress') {
    loadProgressView();
  }
}

/**
 * Load dashboard
 */
async function loadDashboard() {
  try {
    projects = await window.electronAPI.listProjects();
    updateDashboardStats();
    displayRecentProjects();
  } catch (error) {
    console.error('Error loading dashboard:', error);
    showErrorMessage('Failed to load dashboard');
  }
}

/**
 * Update dashboard statistics
 */
function updateDashboardStats() {
  document.getElementById('stat-projects').textContent = projects.length;

  let totalDocuments = 0;
  let totalPlans = 0;

  projects.forEach(project => {
    totalDocuments += project.documents || 0;
    totalPlans += project.studyPlans || 0;
  });

  document.getElementById('stat-documents').textContent = totalDocuments;
  document.getElementById('stat-plans').textContent = totalPlans;
  document.getElementById('stat-sessions').textContent = '0';
}

/**
 * Display recent projects
 */
function displayRecentProjects() {
  const container = document.getElementById('recent-projects');
  container.innerHTML = '';

  if (projects.length === 0) {
    container.innerHTML = '<p class="empty-state">No projects yet. Create one to get started!</p>';
    return;
  }

  const recentProjects = projects.slice(0, 6);

  recentProjects.forEach(project => {
    const card = createProjectCard(project);
    container.appendChild(card);
  });
}

/**
 * Create a project card element
 */
function createProjectCard(project) {
  const card = document.createElement('div');
  card.className = 'project-card';
  card.innerHTML = `
    <div class="card-header">
      <div class="card-title">${escapeHtml(project.name)}</div>
      <button class="btn-delete" title="Delete project">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 17 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="7" y1="14" x2="13" y2="14"></line>
        </svg>
      </button>
    </div>
    <div class="card-description">${escapeHtml(project.description || 'No description')}</div>
    <div class="card-meta">
      <span>${project.documents} documents</span>
      <span>${formatDateShort(project.created)}</span>
    </div>
  `;

  // Click on card to open documents view
  card.addEventListener('click', (e) => {
    // Don't navigate if delete button was clicked
    if (e.target.closest('.btn-delete')) {
      return;
    }
    currentProject = project;
    switchView('documents');
    loadDocuments();
  });

  // Delete button handler
  const deleteBtn = card.querySelector('.btn-delete');
  deleteBtn.addEventListener('click', async (e) => {
    e.stopPropagation();

    // Confirmation dialog
    if (confirm(`Are you sure you want to delete "${project.name}" and all of its contents? This cannot be undone.`)) {
      try {
        console.log('[DEBUG] Deleting project:', project.id);
        await window.electronAPI.deleteProject(project.id);
        console.log('[DEBUG] Project deleted successfully');

        // Reload projects list
        await loadProjects();

        // Show success message
        showSuccessMessage(`Project "${project.name}" deleted successfully`);

        // If deleted project was current, switch away
        if (currentProject && currentProject.id === project.id) {
          currentProject = null;
          switchView('dashboard');
        }
      } catch (error) {
        console.error('[DEBUG] Error deleting project:', error);
        showErrorMessage(`Failed to delete project: ${error.message}`);
      }
    }
  });

  return card;
}

/**
 * Load and display projects list
 */
async function loadProjectsList() {
  try {
    projects = await window.electronAPI.listProjects();
    displayProjects();
  } catch (error) {
    console.error('Error loading projects:', error);
    const container = document.getElementById('projects-list');
    if (container) {
      container.innerHTML = `<p class="empty-state">Error loading projects: ${error.message}</p>`;
    }
    showErrorMessage('Failed to load projects: ' + error.message);
  }
}

/**
 * Display projects
 */
function displayProjects() {
  const container = document.getElementById('projects-list');
  if (!container) {
    console.error('projects-list container not found');
    return;
  }

  container.innerHTML = '';

  if (projects.length === 0) {
    container.innerHTML = '<p class="empty-state">No projects yet. Click "+ New Project" to create one.</p>';
    return;
  }

  projects.forEach(project => {
    const card = createProjectCard(project);
    container.appendChild(card);
  });
}

/**
 * Load projects from API
 */
async function loadProjects() {
  try {
    projects = await window.electronAPI.listProjects();
  } catch (error) {
    console.error('Error loading projects:', error);
  }
}

/**
 * Load documents for current project
 */
async function loadDocuments() {
  if (!currentProject) {
    const container = document.getElementById('documents-list');
    if (container) {
      container.innerHTML = '<p class="empty-state">Please select a project first.</p>';
    }
    return;
  }

  try {
    const documents = await window.electronAPI.listDocuments(currentProject.id);
    displayDocuments(documents);
  } catch (error) {
    console.error('Error loading documents:', error);
    const container = document.getElementById('documents-list');
    if (container) {
      container.innerHTML = `<p class="empty-state">Error loading documents: ${error.message}</p>`;
    }
  }
}

/**
 * Display documents
 */
function displayDocuments(documents) {
  const container = document.getElementById('documents-list');
  if (!container) {
    console.error('documents-list container not found');
    return;
  }

  container.innerHTML = '';

  // Update header with project info
  const projectHeader = document.querySelector('.view-header h3');
  if (projectHeader) {
    projectHeader.textContent = `${currentProject.name} - Documents`;
  }

  if (!documents || documents.length === 0) {
    container.innerHTML = '<p class="empty-state">No documents in this project yet. Import documents to get started.</p>';
    return;
  }

  documents.forEach(doc => {
    const card = createDocumentCard(doc);
    container.appendChild(card);
  });
}

/**
 * Create document card
 */
function createDocumentCard(doc) {
  const card = document.createElement('div');
  card.className = 'document-card';
  card.style.cursor = 'pointer';
  card.innerHTML = `
    <div class="card-title">${escapeHtml(doc.title || doc.id)}</div>
    <div class="card-description">${escapeHtml(doc.description || 'No description')}</div>
    <div class="card-meta">
      <span>${doc.wordCount || 0} words</span>
      <span>${formatDateShort(doc.created || new Date().toISOString())}</span>
    </div>
  `;
  card.addEventListener('click', async () => {
    console.log('Document clicked:', doc);
    try {
      // Read the document content
      const docContent = await window.electronAPI.readDocument(currentProject.id, doc.id);

      // Display markdown inline
      displayMarkdownInline(doc, docContent);
    } catch (error) {
      console.error('Error opening document:', error);
      showErrorMessage('Failed to open document: ' + error.message);
    }
  });

  // Add hover effect
  card.addEventListener('mouseenter', () => {
    card.style.transform = 'translateY(-2px)';
    card.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'translateY(0)';
    card.style.boxShadow = '';
  });

  return card;
}

/**
 * Display markdown content inline
 */
async function displayMarkdownInline(doc, docContent) {
  try {
    // Hide documents list, show markdown viewer
    const listContainer = document.getElementById('documents-list-container');
    const viewerContainer = document.getElementById('markdown-viewer-container');
    const breadcrumb = document.getElementById('docs-breadcrumb');

    listContainer.style.display = 'none';
    viewerContainer.style.display = 'block';
    breadcrumb.style.display = 'block';

    // Update breadcrumb title
    document.getElementById('breadcrumb-doc-title').textContent = doc.title || 'Document';

    // Update document title
    document.getElementById('doc-title-display').textContent = doc.title || 'Untitled Document';

    // Calculate and display metadata
    const wordCount = docContent.content ? docContent.content.split(/\s+/).length : 0;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));

    document.getElementById('doc-wordcount').querySelector('span').textContent = wordCount.toLocaleString();
    document.getElementById('doc-readtime').querySelector('span').textContent = readTime;

    // Display quality score if available
    if (docContent.metadata && docContent.metadata.processingInfo && docContent.metadata.processingInfo.qualityScore) {
      const qualitySpan = document.getElementById('doc-quality');
      qualitySpan.querySelector('span').textContent = docContent.metadata.processingInfo.qualityScore;
      qualitySpan.style.display = 'inline-flex';
    }

    // Display topics if available
    if (docContent.metadata && docContent.metadata.processingInfo && docContent.metadata.processingInfo.topics) {
      const topicsSpan = document.getElementById('doc-topics');
      const topics = docContent.metadata.processingInfo.topics;
      topicsSpan.querySelector('span').textContent = topics.slice(0, 3).join(', ');
      topicsSpan.style.display = 'inline-flex';
    }

    // Render markdown content
    const markdownContainer = document.getElementById('markdown-content');
    const content = docContent.content || '';

    // Use marked library if available, otherwise show plain text
    if (typeof marked !== 'undefined') {
      markdownContainer.innerHTML = marked.parse(content);
    } else {
      markdownContainer.innerHTML = `<pre>${escapeHtml(content)}</pre>`;
    }

    // Store current document content for copy/download functionality
    window.currentDocumentContent = content;
    window.currentDocumentTitle = doc.title || 'document';

    // Add scroll to top
    const contentArea = document.querySelector('.content');
    if (contentArea) {
      contentArea.scrollTop = 0;
    }

    // Highlight code blocks
    highlightCodeBlocks();
  } catch (error) {
    console.error('Error displaying markdown:', error);
    showErrorMessage('Failed to display document: ' + error.message);
  }
}

/**
 * Go back to documents list
 */
function goBackToDocumentsList() {
  const listContainer = document.getElementById('documents-list-container');
  const viewerContainer = document.getElementById('markdown-viewer-container');
  const breadcrumb = document.getElementById('docs-breadcrumb');

  viewerContainer.style.display = 'none';
  listContainer.style.display = 'block';
  breadcrumb.style.display = 'none';

  window.currentDocumentContent = null;
  window.currentDocumentTitle = null;

  const contentArea = document.querySelector('.content');
  if (contentArea) {
    contentArea.scrollTop = 0;
  }
}

/**
 * Highlight code blocks
 */
function highlightCodeBlocks() {
  const codeBlocks = document.querySelectorAll('pre code');
  codeBlocks.forEach(block => {
    // Add language class if not present
    if (!block.className) {
      block.className = 'language-javascript';
    }
  });
}

/**
 * Copy all content to clipboard
 */
function copyContentToClipboard() {
  if (window.currentDocumentContent) {
    navigator.clipboard.writeText(window.currentDocumentContent).then(() => {
      const btn = document.getElementById('btn-copy-content');
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i class="bi bi-check-circle"></i> Copied!';
      setTimeout(() => {
        btn.innerHTML = originalText;
      }, 2000);
    }).catch(err => {
      showErrorMessage('Failed to copy content: ' + err.message);
    });
  }
}

/**
 * Download document as markdown file
 */
function downloadDocumentAsMarkdown() {
  if (window.currentDocumentContent && window.currentDocumentTitle) {
    const element = document.createElement('a');
    const file = new Blob([window.currentDocumentContent], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = window.currentDocumentTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase() + '.md';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }
}

/**
 * Create a new project
 */
async function createNewProject() {
  console.log('[DEBUG] createNewProject function called');
  const projectName = projectNameInput.value.trim();
  const projectDescription = projectDescriptionInput.value.trim();

  console.log('[DEBUG] Project name:', projectName);
  console.log('[DEBUG] Project description:', projectDescription);

  if (!projectName) {
    console.log('[DEBUG] ERROR: Project name is empty');
    showErrorMessage('Please enter a project name');
    return;
  }

  try {
    console.log('[DEBUG] Calling window.electronAPI.createProject');
    btnCreateProject.disabled = true;
    const newProject = await window.electronAPI.createProject(projectName, projectDescription);
    console.log('[DEBUG] Project created successfully:', newProject);

    // Reset form
    formNewProject.reset();
    closeModal('modal-new-project');

    // Reload projects
    await loadProjects();

    // Show success message
    showSuccessMessage(`Project "${projectName}" created successfully!`);

    // Refresh current view
    if (currentView === 'dashboard') {
      loadDashboard();
    } else if (currentView === 'projects') {
      loadProjectsList();
    }
  } catch (error) {
    console.error('[DEBUG] ERROR creating project:', error);
    console.error('[DEBUG] Error message:', error.message);
    console.error('[DEBUG] Error stack:', error.stack);
    showErrorMessage(`Failed to create project: ${error.message}`);
  } finally {
    btnCreateProject.disabled = false;
  }
}

/**
 * Load configuration
 */
async function loadConfig() {
  try {
    const config = await window.electronAPI.getConfig();
    if (dataDirInput) {
      dataDirInput.value = config.dataDir || '';
    }
    if (themeSelect) {
      themeSelect.value = config.theme || 'light';
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
}

/**
 * Open modal
 */
function openModal(modalId) {
  console.log(`[DEBUG] openModal called with modalId: ${modalId}`);
  const modal = document.getElementById(modalId);
  console.log(`[DEBUG] Modal element found:`, modal ? 'YES' : 'NO');
  if (modal) {
    console.log(`[DEBUG] Adding show class to modal`);
    modal.classList.add('show');
    console.log(`[DEBUG] Modal classes after update:`, modal.className);
  } else {
    console.log(`[DEBUG] ERROR: Modal with id "${modalId}" not found in DOM`);
  }
}

/**
 * Close modal
 */
function closeModal(modalId) {
  console.log(`[DEBUG] closeModal called with modalId: ${modalId}`);
  const modal = document.getElementById(modalId);
  if (modal) {
    console.log(`[DEBUG] Removing show class from modal`);
    modal.classList.remove('show');
  }
}

/**
 * Show success message
 */
function showSuccessMessage(message) {
  console.log('✅', message);
  // TODO: Implement toast notification UI
}

/**
 * Show error message
 */
function showErrorMessage(message) {
  console.error('❌', message);
  // TODO: Implement toast notification UI
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Format date for display (short format)
 */
function formatDateShort(date) {
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  return new Date(date).toLocaleDateString('en-US', options);
}

// Listen for menu events from main process
window.electronAPI.onMenuNewProject(() => {
  openModal('modal-new-project');
});

window.electronAPI.onMenuOpenProject(() => {
  switchView('projects');
});

// ============================================
// Study Session Management
// ============================================

let currentSession = null;
let sessionTimer = null;
let sessionStartTime = null;
let sessionPausedTime = 0;

// Session UI Elements
const sessionView = document.getElementById('view-session');
const sessionTitle = document.getElementById('session-title');
const sessionTimerDisplay = document.getElementById('session-timer');
const sessionProgressFill = document.getElementById('session-progress-fill');
const sessionProgressText = document.getElementById('session-progress-text');

// Item display elements
const flashcardView = document.getElementById('flashcard-view');
const questionView = document.getElementById('question-view');
const explanationView = document.getElementById('explanation-view');

// Control buttons
const sessionCloseBtn = document.getElementById('session-close-btn');
const sessionPauseBtn = document.getElementById('session-pause-btn');
const sessionPrevBtn = document.getElementById('session-prev-btn');
const sessionNextBtn = document.getElementById('session-next-btn');
const sessionSkipBtn = document.getElementById('session-skip-btn');

// Quality rating
const qualityRating = document.getElementById('quality-rating');
const ratingButtons = document.querySelectorAll('.rating-btn');

// Flashcard elements
const flashcardFlipBtn = document.getElementById('flashcard-flip-btn');
const flashcardQuestion = document.getElementById('flashcard-question');
const flashcardAnswer = document.getElementById('flashcard-answer');

// Question elements
const questionContent = document.getElementById('question-content');
const questionAnswerInput = document.getElementById('question-answer-input');
const showAnswerBtn = document.getElementById('show-answer-btn');
const correctAnswer = document.getElementById('correct-answer');
const correctAnswerContent = document.getElementById('correct-answer-content');

// Explanation elements
const explanationPrompt = document.getElementById('explanation-prompt');
const explanationInput = document.getElementById('explanation-input');
const evaluateExplanationBtn = document.getElementById('evaluate-explanation-btn');
const evaluationResult = document.getElementById('evaluation-result');

// Session complete modal
const sessionCompleteModal = document.getElementById('modal-session-complete');
const btnContinueStudying = document.getElementById('btn-continue-studying');

/**
 * Start a new study session
 */
async function startStudySession(projectId, planId, options = {}) {
  try {
    // Initialize session via IPC
    currentSession = await window.electronAPI.startSession(projectId, planId, options);

    // Switch to session view
    switchView('session');

    // Update UI
    sessionTitle.textContent = currentSession.planTitle || 'Study Session';
    updateSessionProgress();
    displayCurrentItem();
    startSessionTimer();

    // Show initial state
    sessionNextBtn.disabled = true;
    sessionPrevBtn.disabled = true;

  } catch (error) {
    console.error('Error starting session:', error);
    showErrorMessage('Failed to start study session');
  }
}

/**
 * Display the current study item
 */
function displayCurrentItem() {
  if (!currentSession || !currentSession.items) return;

  const currentItem = currentSession.items[currentSession.currentIndex];
  if (!currentItem) return;

  // Hide all item views
  flashcardView.style.display = 'none';
  questionView.style.display = 'none';
  explanationView.style.display = 'none';
  qualityRating.style.display = 'none';

  // Reset item states
  resetItemStates();

  // Display based on item type
  switch (currentItem.type) {
    case 'Flashcard':
      displayFlashcard(currentItem);
      break;
    case 'Question':
      displayQuestion(currentItem);
      break;
    case 'Explanation':
      displayExplanation(currentItem);
      break;
    default:
      displayFlashcard(currentItem); // Default to flashcard
  }

  // Update navigation
  updateNavigationButtons();
}

/**
 * Display flashcard item
 */
function displayFlashcard(item) {
  flashcardView.style.display = 'block';
  flashcardQuestion.textContent = item.content.question || item.content;
  flashcardAnswer.textContent = item.content.answer || '';

  // Show front, hide back
  document.querySelector('.flashcard-front').style.display = 'block';
  document.querySelector('.flashcard-back').style.display = 'none';
  flashcardFlipBtn.textContent = 'Show Answer';

  // Apply technique-specific styling
  const flashcard = document.querySelector('.flashcard');
  flashcard.className = 'flashcard technique-' +
    (item.technique || 'spaced-repetition').toLowerCase().replace(/\s+/g, '-');
}

/**
 * Display question item
 */
function displayQuestion(item) {
  questionView.style.display = 'block';
  questionContent.textContent = item.content.question || item.content;
  correctAnswerContent.textContent = item.content.answer || '';
  questionAnswerInput.value = '';
  correctAnswer.style.display = 'none';
}

/**
 * Display explanation item (Feynman)
 */
function displayExplanation(item) {
  explanationView.style.display = 'block';
  explanationPrompt.textContent = item.content.prompt || item.content;
  explanationInput.value = '';
  evaluationResult.style.display = 'none';
}

/**
 * Flip flashcard
 */
flashcardFlipBtn?.addEventListener('click', () => {
  const front = document.querySelector('.flashcard-front');
  const back = document.querySelector('.flashcard-back');

  if (front.style.display !== 'none') {
    // Show back
    front.style.display = 'none';
    back.style.display = 'block';
    flashcardFlipBtn.textContent = 'Show Question';

    // Show quality rating
    qualityRating.style.display = 'block';
  } else {
    // Show front
    front.style.display = 'block';
    back.style.display = 'none';
    flashcardFlipBtn.textContent = 'Show Answer';
    qualityRating.style.display = 'none';
  }
});

/**
 * Show answer for question
 */
showAnswerBtn?.addEventListener('click', () => {
  correctAnswer.style.display = 'block';
  qualityRating.style.display = 'block';
  showAnswerBtn.disabled = true;
});

/**
 * Evaluate explanation (Feynman)
 */
evaluateExplanationBtn?.addEventListener('click', async () => {
  const currentItem = currentSession.items[currentSession.currentIndex];
  const explanation = explanationInput.value.trim();

  if (!explanation) {
    showErrorMessage('Please enter your explanation first');
    return;
  }

  try {
    evaluateExplanationBtn.disabled = true;
    evaluateExplanationBtn.textContent = 'Evaluating...';

    const evaluation = await window.electronAPI.evaluateExplanation(
      currentItem.content.originalContent || currentItem.content,
      explanation
    );

    // Display evaluation
    displayEvaluation(evaluation);

    // Auto-record with quality based on score
    const quality = Math.floor(evaluation.score / 2); // Convert 0-10 to 0-5
    await recordItemResponse(quality);

  } catch (error) {
    console.error('Error evaluating explanation:', error);
    showErrorMessage('Failed to evaluate explanation');
  } finally {
    evaluateExplanationBtn.disabled = false;
    evaluateExplanationBtn.textContent = 'Evaluate My Explanation';
  }
});

/**
 * Display AI evaluation results
 */
function displayEvaluation(evaluation) {
  evaluationResult.style.display = 'block';

  document.getElementById('evaluation-score').textContent = evaluation.score;

  // Strengths
  const strengthsList = document.getElementById('evaluation-strengths');
  strengthsList.innerHTML = '';
  (evaluation.strengths || []).forEach(strength => {
    const li = document.createElement('li');
    li.textContent = strength;
    strengthsList.appendChild(li);
  });

  // Gaps
  const gapsList = document.getElementById('evaluation-gaps');
  gapsList.innerHTML = '';
  (evaluation.gaps || []).forEach(gap => {
    const li = document.createElement('li');
    li.textContent = gap;
    gapsList.appendChild(li);
  });

  // Suggestions
  const suggestionsList = document.getElementById('evaluation-suggestions');
  suggestionsList.innerHTML = '';
  (evaluation.suggestions || []).forEach(suggestion => {
    const li = document.createElement('li');
    li.textContent = suggestion;
    suggestionsList.appendChild(li);
  });

  // Show quality rating
  qualityRating.style.display = 'block';
}

/**
 * Handle quality rating selection
 */
ratingButtons.forEach(btn => {
  btn.addEventListener('click', async () => {
    const quality = parseInt(btn.dataset.quality);

    // Visual feedback
    ratingButtons.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');

    // Record response
    await recordItemResponse(quality);

    // Enable next button
    sessionNextBtn.disabled = false;
  });
});

/**
 * Record item response
 */
async function recordItemResponse(quality) {
  const currentItem = currentSession.items[currentSession.currentIndex];
  const timeSpent = Math.floor((Date.now() - sessionStartTime - sessionPausedTime) / 1000);

  try {
    const response = {
      quality: quality,
      timeSpent: timeSpent,
      timestamp: new Date().toISOString()
    };

    await window.electronAPI.recordResponse(
      currentSession.id,
      currentItem.id,
      response
    );

  } catch (error) {
    console.error('Error recording response:', error);
  }
}

/**
 * Navigate to next item
 */
sessionNextBtn?.addEventListener('click', async () => {
  if (currentSession.currentIndex < currentSession.items.length - 1) {
    currentSession.currentIndex++;
    updateSessionProgress();
    displayCurrentItem();
  } else {
    // Session complete
    await completeSession();
  }
});

/**
 * Navigate to previous item
 */
sessionPrevBtn?.addEventListener('click', () => {
  if (currentSession.currentIndex > 0) {
    currentSession.currentIndex--;
    updateSessionProgress();
    displayCurrentItem();
  }
});

/**
 * Skip current item
 */
sessionSkipBtn?.addEventListener('click', async () => {
  // Record skip with quality 0
  await recordItemResponse(0);

  // Move to next
  if (currentSession.currentIndex < currentSession.items.length - 1) {
    currentSession.currentIndex++;
    updateSessionProgress();
    displayCurrentItem();
  } else {
    await completeSession();
  }
});

/**
 * Update session progress
 */
function updateSessionProgress() {
  if (!currentSession) return;

  const current = currentSession.currentIndex + 1;
  const total = currentSession.items.length;
  const percentage = (current / total) * 100;

  sessionProgressFill.style.width = `${percentage}%`;
  sessionProgressText.textContent = `Item ${current} of ${total}`;

  // Update navigation buttons
  sessionPrevBtn.disabled = currentSession.currentIndex === 0;
}

/**
 * Update navigation buttons state
 */
function updateNavigationButtons() {
  sessionPrevBtn.disabled = currentSession.currentIndex === 0;
  sessionNextBtn.disabled = true; // Enabled after quality rating
}

/**
 * Start session timer
 */
function startSessionTimer() {
  sessionStartTime = Date.now();
  sessionPausedTime = 0;

  sessionTimer = setInterval(() => {
    const elapsed = Date.now() - sessionStartTime - sessionPausedTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);

    sessionTimerDisplay.textContent =
      `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, 1000);
}

/**
 * Pause/resume session
 */
sessionPauseBtn?.addEventListener('click', async () => {
  if (!currentSession.pausedAt) {
    // Pause
    currentSession.pausedAt = Date.now();
    sessionPauseBtn.textContent = 'Resume';
    clearInterval(sessionTimer);

    await window.electronAPI.pauseSession(currentSession.id);
  } else {
    // Resume
    sessionPausedTime += Date.now() - currentSession.pausedAt;
    currentSession.pausedAt = null;
    sessionPauseBtn.textContent = 'Pause';
    startSessionTimer();

    await window.electronAPI.resumeSession(currentSession.id);
  }
});

/**
 * Complete session
 */
async function completeSession() {
  try {
    clearInterval(sessionTimer);

    // Get final stats
    const stats = await window.electronAPI.completeSession(currentSession.id);

    // Show summary modal
    displaySessionSummary(stats);

    // Clear current session
    currentSession = null;

  } catch (error) {
    console.error('Error completing session:', error);
    showErrorMessage('Failed to complete session');
  }
}

/**
 * Display session summary
 */
function displaySessionSummary(stats) {
  document.getElementById('summary-items-reviewed').textContent = stats.itemsReviewed;
  document.getElementById('summary-time-spent').textContent =
    `${Math.floor(stats.totalTime / 60)}m`;
  document.getElementById('summary-completion').textContent =
    `${stats.completionRate}%`;
  document.getElementById('summary-avg-quality').textContent =
    stats.averageQuality.toFixed(1);

  // Motivational message
  document.getElementById('summary-message').textContent = stats.message;

  openModal('modal-session-complete');
}

/**
 * Continue studying - start new session
 */
btnContinueStudying?.addEventListener('click', () => {
  closeModal('modal-session-complete');
  switchView('study');
  // User can select another plan to study
});

/**
 * Close session
 */
sessionCloseBtn?.addEventListener('click', async () => {
  if (currentSession && currentSession.itemsReviewed > 0) {
    const confirm = window.confirm('Are you sure you want to exit? Your progress will be saved.');
    if (!confirm) return;

    await window.electronAPI.pauseSession(currentSession.id);
  }

  clearInterval(sessionTimer);
  currentSession = null;
  switchView('study');
});

/**
 * Reset item states
 */
function resetItemStates() {
  // Reset flashcard
  const front = document.querySelector('.flashcard-front');
  const back = document.querySelector('.flashcard-back');
  if (front && back) {
    front.style.display = 'block';
    back.style.display = 'none';
  }
  if (flashcardFlipBtn) {
    flashcardFlipBtn.textContent = 'Show Answer';
  }

  // Reset question
  questionAnswerInput.value = '';
  correctAnswer.style.display = 'none';
  if (showAnswerBtn) {
    showAnswerBtn.disabled = false;
  }

  // Reset explanation
  explanationInput.value = '';
  evaluationResult.style.display = 'none';

  // Reset rating
  ratingButtons.forEach(b => b.classList.remove('selected'));
  qualityRating.style.display = 'none';

  // Reset buttons
  sessionNextBtn.disabled = true;
}

/**
 * Load study plans and enable session start
 */
async function loadStudyPlansWithSessions() {
  try {
    const container = document.getElementById('study-plans-list');
    container.innerHTML = '';

    if (!projects || projects.length === 0) {
      container.innerHTML =
        '<p class="empty-state">No projects yet. Create a project to generate study plans.</p>';
      return;
    }

    let totalPlans = 0;
    const projectsWithPlans = [];

    // Load study plans for each project
    for (const project of projects) {
      try {
        const plans = await window.electronAPI.listStudyPlans(project.id);
        if (plans && plans.length > 0) {
          projectsWithPlans.push({ project, plans });
          totalPlans += plans.length;
        }
      } catch (error) {
        console.warn(`Error loading plans for project ${project.id}:`, error);
      }
    }

    if (totalPlans === 0) {
      container.innerHTML =
        '<p class="empty-state">No study plans yet. Create documents to generate study plans.</p>';
      return;
    }

    // Display grouped study plans
    projectsWithPlans.forEach(({ project, plans }) => {
      // Create project section
      const projectSection = document.createElement('div');
      projectSection.className = 'study-plans-section';

      // Project heading
      const heading = document.createElement('div');
      heading.className = 'study-plans-project-heading';
      heading.innerHTML = `
        <div class="heading-content">
          <i class="bi bi-folder-fill"></i>
          <h4>${escapeHtml(project.name)}</h4>
          <span class="badge badge-secondary">${plans.length} ${plans.length === 1 ? 'plan' : 'plans'}</span>
        </div>
      `;
      projectSection.appendChild(heading);

      // Plans grid for this project
      const plansGrid = document.createElement('div');
      plansGrid.className = 'study-plans-grid';

      plans.forEach(plan => {
        const card = createStudyPlanCard(plan);
        plansGrid.appendChild(card);
      });

      projectSection.appendChild(plansGrid);
      container.appendChild(projectSection);
    });

  } catch (error) {
    console.error('Error loading study plans:', error);
    showErrorMessage('Failed to load study plans');
  }
}

/**
 * Create study plan card with session start button
 */
function createStudyPlanCard(plan) {
  const card = document.createElement('div');
  card.className = 'study-plan-card';

  // Calculate completion percentage
  const total = plan.totalItems || 0;
  const completed = plan.completed || 0;
  const completionPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Format techniques
  const techniques = (plan.techniques || [])
    .filter(t => t && t.trim())
    .join(', ') || 'No techniques specified';

  card.innerHTML = `
    <div class="card-title">
      <i class="bi bi-book-half" style="margin-right: 0.5rem; color: #0d6efd;"></i>
      ${escapeHtml(plan.title)}
    </div>
    <div class="card-description">
      ${escapeHtml(techniques)}
    </div>
    <div class="card-meta">
      <span><i class="bi bi-list-check"></i> ${total} items</span>
      <span><i class="bi bi-check-circle"></i> ${completed}/${total} done</span>
    </div>
    <div class="study-plan-progress">
      <div class="progress-bar-small">
        <div class="progress-fill" style="width: ${completionPercent}%"></div>
      </div>
      <span style="min-width: 35px; color: #6c757d;">${completionPercent}%</span>
    </div>
    <div class="card-actions">
      <button class="btn-start-session" data-plan-id="${plan.id}">
        <i class="bi bi-play-circle"></i> Start Session
      </button>
      <button class="btn-view-details" data-plan-id="${plan.id}" title="View details">
        <i class="bi bi-eye"></i>
      </button>
    </div>
  `;

  // Add event listeners
  const startBtn = card.querySelector('.btn-start-session');
  const viewBtn = card.querySelector('.btn-view-details');

  startBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    startStudySession(currentProject.id, plan.id);
  });

  viewBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    loadStudyPlanDetails(plan);
  });

  return card;
}

/**
 * Load study plan details inline with breadcrumb
 */
async function loadStudyPlanDetails(plan) {
  try {
    // Read the study plan markdown file
    const planContent = await window.electronAPI.readStudyPlan(currentProject.id, plan.id);

    // Calculate metrics
    const total = plan.totalItems || 0;
    const completed = plan.completed || 0;
    const completionPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
    const qualityScore = planContent.metadata?.processingInfo?.qualityScore || 0;

    // Update title
    document.getElementById('plan-title-display').textContent = plan.title || 'Untitled Plan';
    document.getElementById('breadcrumb-plan-title').textContent = plan.title || 'Untitled Plan';

    // Update metrics display
    document.getElementById('plan-total-display').innerHTML =
      `<i class="bi bi-list-ul"></i> <span>${total}</span> items`;
    document.getElementById('plan-completed-display').innerHTML =
      `<i class="bi bi-check-circle"></i> <span>${completed}</span> completed`;
    document.getElementById('plan-progress-display').innerHTML =
      `<i class="bi bi-graph-up"></i> <span>${completionPercent}</span>% progress`;
    document.getElementById('plan-quality-display').innerHTML =
      `<i class="bi bi-star-fill" style="color: #ffc107;"></i> Quality: <span>${qualityScore}</span>/10`;

    // Display techniques as badges
    const techniquesContainer = document.getElementById('plan-detail-techniques');
    techniquesContainer.innerHTML = '';
    if (plan.techniques && plan.techniques.length > 0) {
      plan.techniques.forEach(technique => {
        const badge = document.createElement('span');
        badge.className = 'badge bg-primary';
        badge.style.fontSize = '0.9rem';
        badge.style.padding = '0.5rem 0.75rem';

        // Add icon based on technique
        let icon = '🔄';
        if (technique === 'Active Recall') icon = '❓';
        else if (technique === 'Interleaving') icon = '🔀';
        else if (technique === 'Feynman Technique') icon = '💭';

        badge.innerHTML = `${icon} ${technique}`;
        techniquesContainer.appendChild(badge);
      });
    }

    // Display plan content
    const overviewContainer = document.getElementById('plan-detail-overview');
    const content = planContent.content || '';

    // Use marked library if available, otherwise show plain text
    if (typeof marked !== 'undefined' && content) {
      overviewContainer.innerHTML = marked.parse(content);
    } else if (content) {
      overviewContainer.innerHTML = `<pre>${escapeHtml(content)}</pre>`;
    } else {
      overviewContainer.innerHTML = '<p class="text-muted">No plan overview available.</p>';
    }

    // Setup start session button
    const startBtn = document.getElementById('btn-start-study-session');
    startBtn.onclick = () => {
      startStudySession(currentProject.id, plan.id);
    };

    // Show details view, hide list view
    document.getElementById('study-plans-list-container').style.display = 'none';
    document.getElementById('study-plan-details-container').style.display = 'block';
    document.getElementById('study-breadcrumb').style.display = 'block';

  } catch (error) {
    console.error('Error loading study plan details:', error);
    showErrorMessage('Failed to load study plan details: ' + error.message);
  }
}

/**
 * Go back to study plans list
 */
function backToStudyPlansList() {
  document.getElementById('study-plans-list-container').style.display = 'block';
  document.getElementById('study-plan-details-container').style.display = 'none';
  document.getElementById('study-breadcrumb').style.display = 'none';
}

/**
 * Load progress view with analytics
 */
async function loadProgressView() {
  if (!currentProject) {
    document.getElementById('progress-content').innerHTML =
      '<p class="empty-state">Select a project to view progress.</p>';
    return;
  }

  try {
    // Fetch analytics data
    const metrics = await window.electronAPI.getAnalyticsMetrics(currentProject.id);
    const sessions = await window.electronAPI.getSessionHistory(currentProject.id, { limit: 20 });
    const recommendations = await window.electronAPI.getStudyRecommendations(currentProject.id, metrics);

    // Update dashboard metrics
    updateProgressDashboardMetrics(metrics);
    updateMasteryProgress(metrics);
    updateForecast(metrics);
    updateTechniqueBreakdown(sessions);
    displayRecommendations(recommendations);
    displaySessionHistory(sessions);
    setupSessionFilters(sessions);
  } catch (error) {
    console.error('Error loading progress view:', error);
    showErrorMessage('Failed to load analytics data');
  }
}

/**
 * Update dashboard metrics display
 */
function updateProgressDashboardMetrics(metrics) {
  document.getElementById('analytics-mastered').textContent = metrics.itemsMastered || 0;
  document.getElementById('analytics-streak').textContent = metrics.currentStreak || 0;
  document.getElementById('analytics-due-today').textContent = metrics.itemsDueToday || 0;
  document.getElementById('analytics-time-week').textContent = `${metrics.studyTimeThisWeek || 0}m`;
  document.getElementById('analytics-avg-quality').textContent = (metrics.averageQuality || 0).toFixed(1);
  document.getElementById('analytics-completion').textContent = `${metrics.completionProgress || 0}%`;
}

/**
 * Update mastery progress bar
 */
function updateMasteryProgress(metrics) {
  const percentage = metrics.completionProgress || 0;
  document.getElementById('mastery-fill').style.width = `${percentage}%`;
  document.getElementById('mastery-fraction').textContent =
    `${metrics.itemsMastered || 0} / ${metrics.totalItems || 0}`;
}

/**
 * Update forecast bars
 */
function updateForecast(metrics) {
  const today = metrics.itemsDueToday || 0;
  const tomorrow = metrics.itemsDueTomorrow || 0;
  const week = metrics.itemsDueWeek || 0;
  const max = Math.max(today, tomorrow, week, 1);

  document.getElementById('forecast-today').style.width = `${(today / max) * 100}%`;
  document.getElementById('forecast-today-count').textContent = today;

  document.getElementById('forecast-tomorrow').style.width = `${(tomorrow / max) * 100}%`;
  document.getElementById('forecast-tomorrow-count').textContent = tomorrow;

  document.getElementById('forecast-week').style.width = `${(week / max) * 100}%`;
  document.getElementById('forecast-week-count').textContent = week;
}

/**
 * Update technique breakdown
 */
function updateTechniqueBreakdown(sessions) {
  const container = document.getElementById('technique-breakdown');

  if (sessions.length === 0) {
    container.innerHTML = '<p class="empty-state">No sessions yet.</p>';
    return;
  }

  // Count technique usage
  const techniqueUsage = {};
  sessions.forEach(session => {
    const technique = session.technique || 'Unknown';
    techniqueUsage[technique] = (techniqueUsage[technique] || 0) + 1;
  });

  const techniques = Object.entries(techniqueUsage)
    .sort((a, b) => b[1] - a[1]);

  container.innerHTML = '';
  techniques.forEach(([technique, count]) => {
    const percentage = Math.round((count / sessions.length) * 100);
    const techniqueCssClass = technique.toLowerCase().replace(/\s+/g, '-');

    const item = document.createElement('div');
    item.className = 'technique-item';
    item.innerHTML = `
      <div class="technique-name">${escapeHtml(technique)}</div>
      <div class="technique-bar-container">
        <div class="technique-bar technique-bar--${techniqueCssClass}" style="width: ${percentage}%"></div>
      </div>
      <div class="technique-percentage">${percentage}%</div>
    `;
    container.appendChild(item);
  });
}

/**
 * Display recommendations
 */
function displayRecommendations(recommendations) {
  const container = document.getElementById('recommendations-container');

  if (!recommendations || recommendations.length === 0) {
    container.innerHTML = '<p class="empty-state">Complete some study sessions to get personalized recommendations.</p>';
    return;
  }

  container.innerHTML = '';
  recommendations.forEach(rec => {
    const card = document.createElement('div');
    card.className = `recommendation-card recommendation-${rec.priority}`;
    card.innerHTML = `
      <div class="recommendation-icon">${rec.icon}</div>
      <div class="recommendation-content">
        <div class="recommendation-title">${escapeHtml(rec.title)}</div>
        <div class="recommendation-message">${escapeHtml(rec.message)}</div>
        <div class="recommendation-action">${escapeHtml(rec.actionText)}</div>
      </div>
    `;
    container.appendChild(card);
  });
}

/**
 * Display session history
 */
function displaySessionHistory(sessions) {
  const container = document.getElementById('session-history-list');

  if (!sessions || sessions.length === 0) {
    container.innerHTML = '<p class="empty-state">No sessions yet. Start a study session to begin tracking!</p>';
    return;
  }

  container.innerHTML = '';
  sessions.forEach(session => {
    const qualityClass = session.quality >= 4 ? 'high' : session.quality >= 3 ? 'medium' : 'low';
    const trendIcon = session.trend === 'improving' ? '📈' : session.trend === 'declining' ? '📉' : '➡️';
    const techniqueCssClass = (session.technique || 'Unknown').toLowerCase().replace(/\s+/g, '-');

    const card = document.createElement('div');
    card.className = 'session-history-card';
    card.innerHTML = `
      <div class="session-date">${formatSessionDate(session.date)}</div>
      <div class="session-technique">
        <span class="session-technique-badge badge--${techniqueCssClass}">
          ${escapeHtml(session.technique || 'Unknown')}
        </span>
      </div>
      <div class="session-items">${session.itemsReviewed} items</div>
      <div class="session-quality quality-${qualityClass}">
        ${(session.quality || 0).toFixed(1)}/5
      </div>
      <div class="session-time">${session.timeSpent}m</div>
      <div class="session-trend trend-${session.trend || 'stable'}">
        ${trendIcon}
      </div>
    `;
    container.appendChild(card);
  });
}

/**
 * Setup session history filtering and sorting
 */
function setupSessionFilters(allSessions) {
  const techniqueSelect = document.getElementById('session-filter-technique');
  const sortSelect = document.getElementById('session-sort');

  techniqueSelect.addEventListener('change', () => filterAndDisplaySessions(allSessions));
  sortSelect.addEventListener('change', () => filterAndDisplaySessions(allSessions));
}

/**
 * Filter and display sessions based on selected filters
 */
function filterAndDisplaySessions(allSessions) {
  const techniqueSelect = document.getElementById('session-filter-technique');
  const sortSelect = document.getElementById('session-sort');

  const technique = techniqueSelect.value;
  const sort = sortSelect.value;

  let filtered = [...allSessions];

  // Apply technique filter
  if (technique) {
    filtered = filtered.filter(s => s.technique === technique);
  }

  // Apply sorting
  switch (sort) {
    case 'date-asc':
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
      break;
    case 'quality-desc':
      filtered.sort((a, b) => b.quality - a.quality);
      break;
    case 'quality-asc':
      filtered.sort((a, b) => a.quality - b.quality);
      break;
    case 'date-desc':
    default:
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  // Limit to 20 sessions
  displaySessionHistory(filtered.slice(0, 20));
}

/**
 * Format session date for display
 */
function formatSessionDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
}

// Hook into existing view switching
const originalSwitchView = window.switchView;
window.switchView = function(viewName) {
  originalSwitchView.call(this, viewName);
  if (viewName === 'study') {
    loadStudyPlansWithSessions();
  }
};

// Ensure modals have proper close functionality
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-close')) {
    const modalId = e.target.dataset.modal;
    if (modalId === 'modal-session-complete') {
      closeModal(modalId);
    }
  }
});
