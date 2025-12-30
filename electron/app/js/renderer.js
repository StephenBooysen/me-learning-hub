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
  loadProjects();
  loadConfig();
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
  const pageTitle = document.querySelector('.page-title');
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
    <div class="card-title">${escapeHtml(project.name)}</div>
    <div class="card-description">${escapeHtml(project.description || 'No description')}</div>
    <div class="card-meta">
      <span>${project.documents} documents</span>
      <span>${formatDateShort(project.created)}</span>
    </div>
  `;
  card.addEventListener('click', () => {
    currentProject = project;
    switchView('documents');
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
    showErrorMessage('Failed to load projects');
  }
}

/**
 * Display projects
 */
function displayProjects() {
  const container = document.getElementById('projects-list');
  container.innerHTML = '';

  if (projects.length === 0) {
    container.innerHTML = '<p class="empty-state">No projects yet.</p>';
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
 * Create a new project
 */
async function createNewProject() {
  const projectName = projectNameInput.value.trim();
  const projectDescription = projectDescriptionInput.value.trim();

  if (!projectName) {
    showErrorMessage('Please enter a project name');
    return;
  }

  try {
    btnCreateProject.disabled = true;
    const newProject = await window.electronAPI.createProject(projectName, projectDescription);

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
    console.error('Error creating project:', error);
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
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
  }
}

/**
 * Close modal
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
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
