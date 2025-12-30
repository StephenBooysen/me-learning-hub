/**
 * File Watcher Module
 * Monitors file system for changes and syncs UI
 */

const chokidar = require('chokidar');
const path = require('path');
const fsSync = require('fs');

class FileWatcher {
  constructor(projectsDir, fileManager, mainWindow) {
    this.projectsDir = projectsDir;
    this.fileManager = fileManager;
    this.mainWindow = mainWindow;
    this.watcher = null;
    this.watchers = new Map();
    this.debounceTimers = new Map();
    this.debounceDelay = 500; // ms
  }

  /**
   * Start watching project directory
   */
  start() {
    if (this.watcher) {
      console.warn('File watcher already started');
      return;
    }

    try {
      if (!fsSync.existsSync(this.projectsDir)) {
        console.warn('Projects directory does not exist:', this.projectsDir);
        return;
      }

      this.watcher = chokidar.watch(this.projectsDir, {
        ignored: /(^|[\/\\])\.|node_modules/,
        ignoreInitial: true,
        persistent: true,
        awaitWriteFinish: {
          stabilityThreshold: 200,
          pollInterval: 100
        }
      });

      this.watcher.on('add', (filePath) => this.handleFileAdd(filePath));
      this.watcher.on('change', (filePath) => this.handleFileChange(filePath));
      this.watcher.on('unlink', (filePath) => this.handleFileDelete(filePath));
      this.watcher.on('addDir', (dirPath) => this.handleDirAdd(dirPath));
      this.watcher.on('unlinkDir', (dirPath) => this.handleDirDelete(dirPath));

      this.watcher.on('error', (error) => this.handleError(error));

      console.log('File watcher started for:', this.projectsDir);
    } catch (error) {
      console.error('Failed to start file watcher:', error);
    }
  }

  /**
   * Stop watching
   */
  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      this.watchers.clear();
      this.debounceTimers.clear();
      console.log('File watcher stopped');
    }
  }

  /**
   * Handle file addition
   */
  handleFileAdd(filePath) {
    if (!filePath.endsWith('.md')) return;

    this.debounce(filePath, () => {
      try {
        const relative = path.relative(this.projectsDir, filePath);
        const parts = relative.split(path.sep);

        // Determine what was added
        if (parts.length >= 3) {
          const projectId = parts[0];
          const folder = parts[1]; // sources, study-plans, progress
          const fileName = parts[parts.length - 1];

          if (folder === 'sources' && fileName !== 'manifest.md') {
            this.notifyDocumentAdded(projectId, fileName);
          } else if (folder === 'study-plans' && fileName !== 'index.md') {
            this.notifyStudyPlanAdded(projectId, fileName);
          } else if (folder === 'progress' && fileName !== 'index.md') {
            this.notifySessionAdded(projectId, fileName);
          }
        }
      } catch (error) {
        console.error('Error handling file add:', error);
      }
    });
  }

  /**
   * Handle file change
   */
  handleFileChange(filePath) {
    if (!filePath.endsWith('.md')) return;

    this.debounce(filePath, () => {
      try {
        const relative = path.relative(this.projectsDir, filePath);
        const parts = relative.split(path.sep);

        if (parts.length >= 3) {
          const projectId = parts[0];
          const fileName = parts[parts.length - 1];

          this.notifyFileChanged(projectId, fileName);
        }
      } catch (error) {
        console.error('Error handling file change:', error);
      }
    });
  }

  /**
   * Handle file deletion
   */
  handleFileDelete(filePath) {
    if (!filePath.endsWith('.md')) return;

    try {
      const relative = path.relative(this.projectsDir, filePath);
      const parts = relative.split(path.sep);

      if (parts.length >= 3) {
        const projectId = parts[0];
        const fileName = parts[parts.length - 1];
        const folder = parts[1];

        if (folder === 'sources') {
          this.notifyDocumentDeleted(projectId, fileName);
        } else if (folder === 'study-plans') {
          this.notifyStudyPlanDeleted(projectId, fileName);
        }
      }
    } catch (error) {
      console.error('Error handling file delete:', error);
    }
  }

  /**
   * Handle directory addition
   */
  handleDirAdd(dirPath) {
    try {
      const relative = path.relative(this.projectsDir, dirPath);
      const parts = relative.split(path.sep);

      if (parts.length === 1) {
        this.notifyProjectAdded(parts[0]);
      }
    } catch (error) {
      console.error('Error handling dir add:', error);
    }
  }

  /**
   * Handle directory deletion
   */
  handleDirDelete(dirPath) {
    try {
      const relative = path.relative(this.projectsDir, dirPath);
      const parts = relative.split(path.sep);

      if (parts.length === 1) {
        this.notifyProjectDeleted(parts[0]);
      }
    } catch (error) {
      console.error('Error handling dir delete:', error);
    }
  }

  /**
   * Handle watcher error
   */
  handleError(error) {
    console.error('File watcher error:', error);
  }

  /**
   * Debounce handler for rapid changes
   */
  debounce(key, callback) {
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }

    const timer = setTimeout(() => {
      callback();
      this.debounceTimers.delete(key);
    }, this.debounceDelay);

    this.debounceTimers.set(key, timer);
  }

  /**
   * Notify renderer of events
   */
  notifyRenderer(channel, data) {
    if (this.mainWindow && this.mainWindow.webContents) {
      try {
        this.mainWindow.webContents.send(channel, data);
      } catch (error) {
        console.error('Failed to notify renderer:', error);
      }
    }
  }

  /**
   * Notify document added
   */
  notifyDocumentAdded(projectId, fileName) {
    console.log(`Document added: ${projectId}/${fileName}`);
    this.notifyRenderer('file:document-added', {
      projectId: projectId,
      fileName: fileName,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Notify document deleted
   */
  notifyDocumentDeleted(projectId, fileName) {
    console.log(`Document deleted: ${projectId}/${fileName}`);
    this.notifyRenderer('file:document-deleted', {
      projectId: projectId,
      fileName: fileName,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Notify study plan added
   */
  notifyStudyPlanAdded(projectId, fileName) {
    console.log(`Study plan added: ${projectId}/${fileName}`);
    this.notifyRenderer('file:study-plan-added', {
      projectId: projectId,
      fileName: fileName,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Notify study plan deleted
   */
  notifyStudyPlanDeleted(projectId, fileName) {
    console.log(`Study plan deleted: ${projectId}/${fileName}`);
    this.notifyRenderer('file:study-plan-deleted', {
      projectId: projectId,
      fileName: fileName,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Notify session added
   */
  notifySessionAdded(projectId, fileName) {
    console.log(`Session added: ${projectId}/${fileName}`);
    this.notifyRenderer('file:session-added', {
      projectId: projectId,
      fileName: fileName,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Notify project added
   */
  notifyProjectAdded(projectId) {
    console.log(`Project added: ${projectId}`);
    this.notifyRenderer('file:project-added', {
      projectId: projectId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Notify project deleted
   */
  notifyProjectDeleted(projectId) {
    console.log(`Project deleted: ${projectId}`);
    this.notifyRenderer('file:project-deleted', {
      projectId: projectId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Notify file changed
   */
  notifyFileChanged(projectId, fileName) {
    this.notifyRenderer('file:changed', {
      projectId: projectId,
      fileName: fileName,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get watcher status
   */
  getStatus() {
    return {
      isWatching: this.watcher !== null,
      projectsDir: this.projectsDir,
      watchedPaths: this.watcher ? this.watcher.getWatched() : {}
    };
  }
}

module.exports = FileWatcher;
