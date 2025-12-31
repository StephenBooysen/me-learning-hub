const { contextBridge, ipcRenderer } = require('electron');

// Expose IPC methods to renderer process safely
contextBridge.exposeInMainWorld('electronAPI', {
  // Project Management
  listProjects: () => ipcRenderer.invoke('project:list'),
  createProject: (projectName, projectDescription) => ipcRenderer.invoke('project:create', projectName, projectDescription),
  getProject: (projectId) => ipcRenderer.invoke('project:get', projectId),
  deleteProject: (projectId) => ipcRenderer.invoke('project:delete', projectId),
  renameProject: (projectId, newName) => ipcRenderer.invoke('project:rename', projectId, newName),

  // Document Management
  listDocuments: (projectId) => ipcRenderer.invoke('document:list', projectId),
  readDocument: (projectId, docId) => ipcRenderer.invoke('document:read', projectId, docId),
  saveDocument: (projectId, docId, content, metadata) =>
    ipcRenderer.invoke('document:save', projectId, docId, content, metadata),
  deleteDocument: (projectId, docId) => ipcRenderer.invoke('document:delete', projectId, docId),

  // Study Plans
  listStudyPlans: (projectId) => ipcRenderer.invoke('study-plan:list', projectId),
  saveStudyPlan: (projectId, planId, content, metadata) =>
    ipcRenderer.invoke('study-plan:save', projectId, planId, content, metadata),
  readStudyPlan: (projectId, planId) => ipcRenderer.invoke('study-plan:read', projectId, planId),
  deleteStudyPlan: (projectId, planId) => ipcRenderer.invoke('study-plan:delete', projectId, planId),
  generateStudyPlan: (projectId, documentId, options) =>
    ipcRenderer.invoke('study-plan:generate', projectId, documentId, options),
  getStudyTechniques: () => ipcRenderer.invoke('study-plan:get-techniques'),

  // Spaced Repetition
  calculateSpacedRepetition: (quality, repetitions, interval, easeFactor) =>
    ipcRenderer.invoke('spaced-repetition:calculate', quality, repetitions, interval, easeFactor),
  recordReview: (item, quality, timeSpent, confidence) =>
    ipcRenderer.invoke('spaced-repetition:record-review', item, quality, timeSpent, confidence),
  getDueItems: (items) =>
    ipcRenderer.invoke('spaced-repetition:get-due-items', items),
  getSessionPlan: (items, durationMinutes) =>
    ipcRenderer.invoke('spaced-repetition:get-session-plan', items, durationMinutes),
  calculateStudyStats: (items) =>
    ipcRenderer.invoke('spaced-repetition:calculate-stats', items),
  getRecommendedStudyTime: (stats) =>
    ipcRenderer.invoke('spaced-repetition:get-recommended-time', stats),

  // AI Features
  testAIConnection: () => ipcRenderer.invoke('ai:test-connection'),
  generateSummary: (markdown, maxLength) =>
    ipcRenderer.invoke('ai:generate-summary', markdown, maxLength),
  generateObjectives: (markdown) =>
    ipcRenderer.invoke('ai:generate-objectives', markdown),

  // Session Management
  startSession: (projectId, planId, options) =>
    ipcRenderer.invoke('session:start', projectId, planId, options),
  getCurrentSession: (sessionId) =>
    ipcRenderer.invoke('session:get-current', sessionId),
  nextItem: (sessionId) =>
    ipcRenderer.invoke('session:next-item', sessionId),
  previousItem: (sessionId) =>
    ipcRenderer.invoke('session:previous-item', sessionId),
  recordResponse: (sessionId, itemId, response) =>
    ipcRenderer.invoke('session:record-response', sessionId, itemId, response),
  pauseSession: (sessionId) =>
    ipcRenderer.invoke('session:pause', sessionId),
  resumeSession: (sessionId) =>
    ipcRenderer.invoke('session:resume', sessionId),
  completeSession: (sessionId) =>
    ipcRenderer.invoke('session:complete', sessionId),
  getSessionStats: (sessionId) =>
    ipcRenderer.invoke('session:get-stats', sessionId),
  evaluateExplanation: (originalContent, userExplanation) =>
    ipcRenderer.invoke('ai:evaluate-explanation', originalContent, userExplanation),

  // Analytics & Progress
  getAnalyticsMetrics: (projectId) =>
    ipcRenderer.invoke('analytics:get-metrics', projectId),
  getSessionHistory: (projectId, options) =>
    ipcRenderer.invoke('analytics:get-session-history', projectId, options),
  getStudyRecommendations: (projectId, stats) =>
    ipcRenderer.invoke('analytics:get-recommendations', projectId, stats),

  // Configuration
  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: (key, value) => ipcRenderer.invoke('config:set', key, value),

  // File Dialog
  selectDirectory: () => ipcRenderer.invoke('dialog:select-directory'),

  // Event listeners
  onMenuNewProject: (callback) => ipcRenderer.on('menu:new-project', callback),
  onMenuOpenProject: (callback) => ipcRenderer.on('menu:open-project', callback),
  removeMenuListener: (channel) => ipcRenderer.removeAllListeners(channel),

  // File watcher events
  onDocumentAdded: (callback) => ipcRenderer.on('file:document-added', callback),
  onDocumentDeleted: (callback) => ipcRenderer.on('file:document-deleted', callback),
  onStudyPlanAdded: (callback) => ipcRenderer.on('file:study-plan-added', callback),
  onStudyPlanDeleted: (callback) => ipcRenderer.on('file:study-plan-deleted', callback),
  onSessionAdded: (callback) => ipcRenderer.on('file:session-added', callback),
  onProjectAdded: (callback) => ipcRenderer.on('file:project-added', callback),
  onProjectDeleted: (callback) => ipcRenderer.on('file:project-deleted', callback),
  onFileChanged: (callback) => ipcRenderer.on('file:changed', callback)
});

// Utility functions exposed to renderer
contextBridge.exposeInMainWorld('utils', {
  versions: process.versions,
  platform: process.platform
});
