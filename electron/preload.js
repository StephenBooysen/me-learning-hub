const { contextBridge, ipcRenderer } = require('electron');

// Expose IPC methods to renderer process safely
contextBridge.exposeInMainWorld('electronAPI', {
  // Project Management
  listProjects: () => ipcRenderer.invoke('project:list'),
  createProject: (projectName) => ipcRenderer.invoke('project:create', projectName),
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

  // Configuration
  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: (key, value) => ipcRenderer.invoke('config:set', key, value),

  // File Dialog
  selectDirectory: () => ipcRenderer.invoke('dialog:select-directory'),

  // Event listeners
  onMenuNewProject: (callback) => ipcRenderer.on('menu:new-project', callback),
  onMenuOpenProject: (callback) => ipcRenderer.on('menu:open-project', callback),
  removeMenuListener: (channel) => ipcRenderer.removeAllListeners(channel)
});

// Utility functions exposed to renderer
contextBridge.exposeInMainWorld('utils', {
  versions: process.versions,
  platform: process.platform
});
