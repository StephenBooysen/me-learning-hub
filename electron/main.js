const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const Store = require('electron-store');
const FileManager = require('./app/js/file-manager');

const store = new Store();
let mainWindow;
let fileManager;

// Default app configuration
const defaultConfig = {
  windowWidth: 1200,
  windowHeight: 800,
  dataDir: path.join(app.getPath('home'), '.me-learning-hub'),
  theme: 'light'
};

// Initialize configuration
function initConfig() {
  if (!store.has('config')) {
    store.set('config', defaultConfig);
  }
}

// Create main window
function createWindow() {
  const config = store.get('config', defaultConfig);

  mainWindow = new BrowserWindow({
    width: config.windowWidth || defaultConfig.windowWidth,
    height: config.windowHeight || defaultConfig.windowHeight,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true
    },
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  // Load index.html
  const indexPath = path.join(__dirname, 'app', 'index.html');
  mainWindow.loadFile(indexPath);

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Save window state on resize/move
  mainWindow.on('resized', () => {
    const bounds = mainWindow.getBounds();
    const config = store.get('config', defaultConfig);
    config.windowWidth = bounds.width;
    config.windowHeight = bounds.height;
    store.set('config', config);
  });
}

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu:new-project');
          }
        },
        {
          label: 'Open Project',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('menu:open-project');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Me Learning Hub',
              message: 'Me Learning Hub v1.0.0',
              detail: 'An intelligent learning platform that captures web content and transforms it into personalized study materials.'
            });
          }
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// App event handlers
app.on('ready', () => {
  initConfig();
  const config = store.get('config', defaultConfig);
  fileManager = new FileManager(config.dataDir);
  createWindow();
  createMenu();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Handlers - Project Management
ipcMain.handle('project:list', async () => {
  try {
    return await fileManager.listProjects();
  } catch (error) {
    console.error('Error listing projects:', error);
    throw error;
  }
});

ipcMain.handle('project:create', async (event, projectName) => {
  try {
    return await fileManager.createProject(projectName);
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
});

ipcMain.handle('project:get', async (event, projectId) => {
  try {
    return await fileManager.getProject(projectId);
  } catch (error) {
    console.error('Error getting project:', error);
    throw error;
  }
});

ipcMain.handle('project:delete', async (event, projectId) => {
  try {
    return await fileManager.deleteProject(projectId);
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
});

ipcMain.handle('project:rename', async (event, projectId, newName) => {
  try {
    return await fileManager.renameProject(projectId, newName);
  } catch (error) {
    console.error('Error renaming project:', error);
    throw error;
  }
});

// IPC Handlers - Document Management
ipcMain.handle('document:list', async (event, projectId) => {
  try {
    return await fileManager.listDocuments(projectId);
  } catch (error) {
    console.error('Error listing documents:', error);
    throw error;
  }
});

ipcMain.handle('document:read', async (event, projectId, docId) => {
  try {
    return await fileManager.readMarkdownFile(projectId, docId);
  } catch (error) {
    console.error('Error reading document:', error);
    throw error;
  }
});

ipcMain.handle('document:save', async (event, projectId, docId, content, metadata) => {
  try {
    return await fileManager.saveMarkdownFile(projectId, docId, content, metadata);
  } catch (error) {
    console.error('Error saving document:', error);
    throw error;
  }
});

ipcMain.handle('document:delete', async (event, projectId, docId) => {
  try {
    return await fileManager.deleteMarkdownFile(projectId, docId);
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
});

// IPC Handlers - Study Plans
ipcMain.handle('study-plan:list', async (event, projectId) => {
  try {
    return await fileManager.listStudyPlans(projectId);
  } catch (error) {
    console.error('Error listing study plans:', error);
    throw error;
  }
});

ipcMain.handle('study-plan:save', async (event, projectId, planId, content, metadata) => {
  try {
    return await fileManager.saveStudyPlan(projectId, planId, content, metadata);
  } catch (error) {
    console.error('Error saving study plan:', error);
    throw error;
  }
});

ipcMain.handle('study-plan:read', async (event, projectId, planId) => {
  try {
    return await fileManager.readStudyPlan(projectId, planId);
  } catch (error) {
    console.error('Error reading study plan:', error);
    throw error;
  }
});

ipcMain.handle('study-plan:delete', async (event, projectId, planId) => {
  try {
    return await fileManager.deleteStudyPlan(projectId, planId);
  } catch (error) {
    console.error('Error deleting study plan:', error);
    throw error;
  }
});

// IPC Handlers - Configuration
ipcMain.handle('config:get', () => {
  return store.get('config', defaultConfig);
});

ipcMain.handle('config:set', async (event, key, value) => {
  try {
    const config = store.get('config', defaultConfig);
    config[key] = value;
    store.set('config', config);
    return config;
  } catch (error) {
    console.error('Error setting config:', error);
    throw error;
  }
});

// IPC Handlers - File Dialog
ipcMain.handle('dialog:select-directory', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });
    return result.filePaths[0] || null;
  } catch (error) {
    console.error('Error selecting directory:', error);
    throw error;
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
