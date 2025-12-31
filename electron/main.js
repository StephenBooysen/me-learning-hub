const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const Store = require('electron-store');
const express = require('express');
const cors = require('cors');
const FileManager = require('./app/js/file-manager');
const AIClient = require('./app/js/ai-client');
const StudyPlanGenerator = require('./app/js/study-plan');
const FileWatcher = require('./app/js/file-watcher');
const SpacedRepetition = require('./app/js/learning-modes/spaced-repetition');
const SessionManager = require('./app/js/session-manager');
const AnalyticsEngine = require('./app/js/analytics-engine');
const DocumentProcessor = require('./app/js/document-processor');
const ContentCleaner = require('./app/js/content-cleaner');

const store = new Store();
let mainWindow;
let fileManager;
let aiClient;
let studyPlanGenerator;
let fileWatcher;
let spacedRepetition;
let sessionManager;
let analyticsEngine;
let documentProcessor;
let contentCleaner;
let httpServer;

// HTTP Bridge Configuration
const HTTP_BRIDGE_PORT = 47823;

// Default app configuration
const getDefaultConfig = () => ({
  windowWidth: 1200,
  windowHeight: 800,
  dataDir: process.env.DATA_DIR || path.join(__dirname, '..', 'projects'),
  theme: 'light'
});

const defaultConfig = getDefaultConfig();

// Initialize configuration
function initConfig() {
  if (!store.has('config')) {
    store.set('config', defaultConfig);
  }

  // Always update dataDir from environment variable if set
  const config = store.get('config', defaultConfig);
  const newDataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'projects');

  if (config.dataDir !== newDataDir) {
    config.dataDir = newDataDir;
    store.set('config', config);
    console.log('[DEBUG] Updated data directory to:', newDataDir);
  }
}

// Initialize HTTP Bridge for Chrome Extension
function initHTTPBridge() {
  const expressApp = express();

  // Middleware
  expressApp.use(express.json({ limit: '50mb' }));
  expressApp.use(cors({
    origin: (origin, callback) => {
      // Allow all origins (only local connections on localhost:47823)
      callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type'],
    credentials: true
  }));

  // Health check endpoint
  expressApp.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Get all projects
  expressApp.get('/api/projects', async (req, res) => {
    try {
      const projects = await fileManager.listProjects();
      res.json({ success: true, projects: projects });
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Save document with AI cleaning and duplicate detection
  expressApp.post('/api/documents', async (req, res) => {
    try {
      let { projectId, content, title, sourceUrl, autoGenerateStudyPlan, override } = req.body;

      // Validation
      if (!projectId || !content) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: projectId, content'
        });
      }

      console.log('[HTTP Bridge] Processing document for project:', projectId);

      // Clean and validate content with Claude if available
      let cleanedContent = content;
      let finalTitle = title || 'Untitled Document';
      let processingInfo = {};

      if (contentCleaner) {
        console.log('[HTTP Bridge] Cleaning content with Claude...');
        try {
          const cleanResult = await contentCleaner.analyzeContent(content, title, sourceUrl);

          if (cleanResult.isValid) {
            cleanedContent = cleanResult.content;
            finalTitle = cleanResult.title;
            processingInfo = {
              cleaned: true,
              qualityScore: cleanResult.qualityScore,
              topics: cleanResult.topics,
              wordCount: cleanResult.wordCount
            };
            console.log(`[HTTP Bridge] Content cleaned. Quality score: ${cleanResult.qualityScore}/10`);
          } else {
            console.log('[HTTP Bridge] Content quality too low, using original');
            processingInfo = {
              cleaned: false,
              reason: cleanResult.reason,
              qualityScore: cleanResult.qualityScore
            };
          }
        } catch (error) {
          console.warn('[HTTP Bridge] Content cleaning failed, using original:', error.message);
          processingInfo = { cleaned: false, error: error.message };
        }
      }

      // Check for duplicate by sourceUrl
      let duplicate = null;
      if (sourceUrl) {
        try {
          const documents = await fileManager.listDocuments(projectId);
          duplicate = documents.find(doc => doc.sourceUrl === sourceUrl);
        } catch (error) {
          console.warn('Error checking for duplicates:', error);
        }
      }

      if (duplicate && !override) {
        return res.status(409).json({
          success: false,
          isDuplicate: true,
          error: 'Similar content already exists',
          existingDocument: {
            id: duplicate.id,
            title: duplicate.title || 'Untitled'
          }
        });
      }

      // Generate document ID
      const { v4: uuidv4 } = require('uuid');
      const docId = uuidv4();

      // Prepare metadata with processing info
      const metadata = {
        title: finalTitle,
        sourceUrl: sourceUrl || '',
        tags: req.body.domain ? [req.body.domain] : [],
        processingInfo: processingInfo
      };

      // Save cleaned document as markdown
      await fileManager.saveMarkdownFile(projectId, docId, cleanedContent, metadata);

      // Auto-generate study plan if requested
      let studyPlanId = null;
      if ((autoGenerateStudyPlan || processingInfo.cleaned) && documentProcessor) {
        console.log('[HTTP Bridge] Auto-generating study plan...');
        try {
          const planResult = await documentProcessor.generateStudyPlan(finalTitle, cleanedContent, 7);

          // Save the study plan
          const planFilePath = path.join(fileManager.dataDir, 'projects', projectId, 'study-plans', `${docId}.md`);
          await fileManager.saveStudyPlan(projectId, docId, planResult.plan, {
            title: planResult.title,
            duration: planResult.duration,
            associatedDocumentId: docId,
            generatedAt: new Date().toISOString()
          });

          studyPlanId = docId;
          console.log('[HTTP Bridge] Study plan generated successfully');
        } catch (error) {
          console.warn('[HTTP Bridge] Failed to auto-generate study plan:', error.message);
          // Continue anyway
        }
      }

      res.json({
        success: true,
        documentId: docId,
        studyPlanId: studyPlanId,
        title: finalTitle,
        processingInfo: processingInfo,
        message: 'Document saved and processed successfully'
      });
    } catch (error) {
      console.error('[HTTP Bridge] Error saving document:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Start server
  httpServer = expressApp.listen(HTTP_BRIDGE_PORT, 'localhost', () => {
    console.log(`[HTTP Bridge] Server running on http://localhost:${HTTP_BRIDGE_PORT}`);
  });

  httpServer.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.warn(`[HTTP Bridge] Port ${HTTP_BRIDGE_PORT} is in use, skipping HTTP bridge`);
    } else {
      console.error('[HTTP Bridge] Error:', error);
    }
  });
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

  // Initialize core modules
  fileManager = new FileManager(config.dataDir);
  aiClient = new AIClient({
    provider: process.env.AI_PROVIDER || 'openai',
    apiKey: process.env.AI_API_KEY,
    model: process.env.AI_MODEL || 'gpt-4'
  });
  studyPlanGenerator = new StudyPlanGenerator(fileManager, aiClient);
  spacedRepetition = new SpacedRepetition();
  sessionManager = new SessionManager(fileManager, spacedRepetition, aiClient);
  analyticsEngine = new AnalyticsEngine(fileManager, spacedRepetition);

  // Initialize Claude-based modules
  if (process.env.CLAUDE_API_KEY && process.env.CLAUDE_API_KEY !== 'your_new_claude_api_key_here') {
    try {
      documentProcessor = new DocumentProcessor(process.env.CLAUDE_API_KEY, process.env.CLAUDE_MODEL);
      contentCleaner = new ContentCleaner(process.env.CLAUDE_API_KEY);
      console.log('[App] Claude modules initialized');
    } catch (error) {
      console.warn('[App] Claude modules failed to initialize:', error.message);
      console.warn('[App] Document processing features will be disabled');
    }
  } else {
    console.warn('[App] CLAUDE_API_KEY not configured - document processing disabled');
  }

  // Initialize HTTP bridge for Chrome extension
  initHTTPBridge();

  createWindow();
  createMenu();

  // Start file watcher
  fileWatcher = new FileWatcher(
    path.join(config.dataDir, 'projects'),
    fileManager,
    mainWindow
  );
  fileWatcher.start();
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

ipcMain.handle('project:create', async (event, projectName, projectDescription = '') => {
  console.log('[DEBUG] IPC handler project:create called');
  console.log('[DEBUG] projectName:', projectName);
  console.log('[DEBUG] projectDescription:', projectDescription);
  try {
    console.log('[DEBUG] Calling fileManager.createProject');
    const result = await fileManager.createProject(projectName, projectDescription);
    console.log('[DEBUG] fileManager.createProject returned:', result);
    return result;
  } catch (error) {
    console.error('[DEBUG] Error in project:create handler:', error);
    console.error('[DEBUG] Error message:', error.message);
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

ipcMain.handle('study-plan:generate', async (event, projectId, documentId, options) => {
  try {
    if (!studyPlanGenerator) {
      throw new Error('Study plan generator not initialized');
    }
    return await studyPlanGenerator.generatePlan(projectId, documentId, options);
  } catch (error) {
    console.error('Error generating study plan:', error);
    throw error;
  }
});

ipcMain.handle('study-plan:get-techniques', () => {
  try {
    return studyPlanGenerator.getAvailableTechniques();
  } catch (error) {
    console.error('Error getting techniques:', error);
    throw error;
  }
});

// IPC Handlers - Spaced Repetition
ipcMain.handle('spaced-repetition:calculate', async (event, quality, repetitions, interval, easeFactor) => {
  try {
    return spacedRepetition.calculateNextReview(quality, repetitions, interval, easeFactor);
  } catch (error) {
    console.error('Error calculating spaced repetition:', error);
    throw error;
  }
});

ipcMain.handle('spaced-repetition:record-review', async (event, item, quality, timeSpent, confidence) => {
  try {
    return spacedRepetition.recordReview(item, quality, timeSpent, confidence);
  } catch (error) {
    console.error('Error recording review:', error);
    throw error;
  }
});

ipcMain.handle('spaced-repetition:get-due-items', async (event, items) => {
  try {
    return spacedRepetition.getItemsDueForReview(items);
  } catch (error) {
    console.error('Error getting due items:', error);
    throw error;
  }
});

ipcMain.handle('spaced-repetition:get-session-plan', async (event, items, durationMinutes) => {
  try {
    return spacedRepetition.getSessionPlan(items, durationMinutes);
  } catch (error) {
    console.error('Error getting session plan:', error);
    throw error;
  }
});

ipcMain.handle('spaced-repetition:calculate-stats', async (event, items) => {
  try {
    return spacedRepetition.calculateStudyStats(items);
  } catch (error) {
    console.error('Error calculating statistics:', error);
    throw error;
  }
});

ipcMain.handle('spaced-repetition:get-recommended-time', async (event, stats) => {
  try {
    return spacedRepetition.getRecommendedStudyTime(stats);
  } catch (error) {
    console.error('Error getting recommended time:', error);
    throw error;
  }
});

// IPC Handlers - AI Features
ipcMain.handle('ai:test-connection', async (event) => {
  try {
    if (!aiClient) {
      return { success: false, message: 'AI client not initialized' };
    }
    const result = await aiClient.testConnection();
    return { success: result };
  } catch (error) {
    console.error('Error testing AI connection:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('ai:generate-summary', async (event, markdown, maxLength) => {
  try {
    if (!aiClient) {
      throw new Error('AI client not initialized');
    }
    return await aiClient.generateSummary(markdown, maxLength);
  } catch (error) {
    console.error('Error generating summary:', error);
    throw error;
  }
});

ipcMain.handle('ai:generate-objectives', async (event, markdown) => {
  try {
    if (!aiClient) {
      throw new Error('AI client not initialized');
    }
    return await aiClient.generateLearningObjectives(markdown);
  } catch (error) {
    console.error('Error generating objectives:', error);
    throw error;
  }
});

// IPC Handlers - Session Management
ipcMain.handle('session:start', async (event, projectId, planId, options) => {
  try {
    if (!sessionManager) {
      throw new Error('Session manager not initialized');
    }
    return await sessionManager.startSession(projectId, planId, options);
  } catch (error) {
    console.error('Error starting session:', error);
    throw error;
  }
});

ipcMain.handle('session:get-current', async (event, sessionId) => {
  try {
    return await sessionManager.getCurrentSession(sessionId);
  } catch (error) {
    console.error('Error getting current session:', error);
    throw error;
  }
});

ipcMain.handle('session:next-item', async (event, sessionId) => {
  try {
    return await sessionManager.nextItem(sessionId);
  } catch (error) {
    console.error('Error navigating to next item:', error);
    throw error;
  }
});

ipcMain.handle('session:previous-item', async (event, sessionId) => {
  try {
    return await sessionManager.previousItem(sessionId);
  } catch (error) {
    console.error('Error navigating to previous item:', error);
    throw error;
  }
});

ipcMain.handle('session:record-response', async (event, sessionId, itemId, response) => {
  try {
    return await sessionManager.recordItemResponse(sessionId, itemId, response);
  } catch (error) {
    console.error('Error recording response:', error);
    throw error;
  }
});

ipcMain.handle('session:pause', async (event, sessionId) => {
  try {
    return await sessionManager.pauseSession(sessionId);
  } catch (error) {
    console.error('Error pausing session:', error);
    throw error;
  }
});

ipcMain.handle('session:resume', async (event, sessionId) => {
  try {
    return await sessionManager.resumeSession(sessionId);
  } catch (error) {
    console.error('Error resuming session:', error);
    throw error;
  }
});

ipcMain.handle('session:complete', async (event, sessionId) => {
  try {
    return await sessionManager.completeSession(sessionId);
  } catch (error) {
    console.error('Error completing session:', error);
    throw error;
  }
});

ipcMain.handle('session:get-stats', async (event, sessionId) => {
  try {
    return await sessionManager.getSessionStats(sessionId);
  } catch (error) {
    console.error('Error getting session stats:', error);
    throw error;
  }
});

// IPC Handler - AI Explanation Evaluation
ipcMain.handle('ai:evaluate-explanation', async (event, originalContent, userExplanation) => {
  try {
    if (!aiClient) {
      throw new Error('AI client not initialized');
    }
    return await aiClient.evaluateExplanation(originalContent, userExplanation);
  } catch (error) {
    console.error('Error evaluating explanation:', error);
    throw error;
  }
});

// IPC Handlers - Analytics & Dashboard
ipcMain.handle('analytics:get-metrics', async (event, projectId) => {
  try {
    if (!analyticsEngine) {
      throw new Error('Analytics engine not initialized');
    }
    return await analyticsEngine.calculateDashboardMetrics(projectId);
  } catch (error) {
    console.error('Error getting analytics metrics:', error);
    throw error;
  }
});

ipcMain.handle('analytics:get-session-history', async (event, projectId, options) => {
  try {
    if (!analyticsEngine) {
      throw new Error('Analytics engine not initialized');
    }
    return await analyticsEngine.aggregateSessionHistory(projectId, options);
  } catch (error) {
    console.error('Error getting session history:', error);
    throw error;
  }
});

ipcMain.handle('analytics:get-recommendations', async (event, projectId, stats) => {
  try {
    if (!analyticsEngine) {
      throw new Error('Analytics engine not initialized');
    }
    return await analyticsEngine.generateRecommendations(projectId, stats);
  } catch (error) {
    console.error('Error generating recommendations:', error);
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
