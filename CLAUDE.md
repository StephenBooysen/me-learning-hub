# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**me-learning-hub** is a desktop learning application built with Electron that helps users create personalized study plans using advanced learning techniques like spaced repetition, active recall, and interleaving. It features a Chrome extension for content capture and a local HTTP API bridge for external integrations.

### Current Status

The project includes:
- ✅ Electron-based desktop application
- ✅ Chrome extension for web content capture
- ✅ Project and document management system
- ✅ Study plan generation with SM-2 algorithm
- ✅ Multiple learning modes (flashcards, questions, etc.)
- ✅ Progress tracking and analytics dashboard
- ✅ RESTful HTTP API bridge for external tools
- ✅ File-based JSON data persistence

## Development Commands

### Setup & Installation
```bash
npm install
cd electron && npm install
```

### Running
```bash
npm run electron:dev      # Run Electron app with logging
npm run electron:start    # Production-like run
cd electron && npm run build  # Build distributable
```

### Code Quality
```bash
npm run lint              # Check code style (ESLint)
npm run lint:fix          # Auto-fix linting issues
npm test                  # Run all Jest tests
npm test -- --testNamePattern="pattern"  # Run specific test
npm test -- --watch       # Run tests in watch mode
npm test -- --coverage    # Generate coverage report
```

## Architecture

The application is structured as three interconnected systems:

### 1. Electron Main Process (`electron/main.js`)
- Window management and lifecycle
- IPC communication with renderer
- HTTP bridge initialization (Express server on port 47823)
- File system operations through FileManager
- Global component instances for renderer communication

### 2. Renderer Process (`electron/app/js/renderer.js`)
- UI initialization and view management
- IPC message handling
- User interaction logic
- DOM manipulation and Bootstrap 5 UI
- Communication with main process for file/data operations

### 3. HTTP Bridge (Express API in `electron/main.js`)
- Port 47823 - local only for Chrome extension
- CORS enabled for localhost connections
- Endpoints: `/api/health`, `/api/projects`, `/api/documents`, `/api/sessions`, `/api/analytics`
- Accepts large payloads (50MB JSON limit)
- Used for external integrations without IPC

### Core Components

**Data & File Management**
- `FileManager` (`electron/app/js/file-manager.js`) - Projects, documents, persistence
- `DocumentProcessor` - Content extraction and cleaning
- `ContentCleaner` - HTML/text normalization
- `FileWatcher` - Monitors file changes for sync

**Learning & Analytics**
- `StudyPlanGenerator` (`study-plan.js`) - Creates schedules with SM-2 algorithm
- `SpacedRepetition` (`learning-modes/spaced-repetition.js`) - Review scheduling logic
- `AnalyticsEngine` (`analytics-engine.js`) - Tracks progress, performance metrics
- `SessionManager` (`session-manager.js`) - Manages learning sessions

**External Integration**
- `AIClient` (`ai-client.js`) - Claude API integration for content processing
- Chrome Extension (`extension/`) - Web content capture and communication

## Data Persistence

Files stored in `projects/` directory (configurable via `DATA_DIR` env var):
```
projects/
├── [projectId]/
│   ├── metadata.json          # Project info
│   ├── documents/
│   │   ├── [docId].json       # Document content & metadata
│   │   └── [docId].html       # Cached HTML version
│   ├── study_plans/
│   │   └── [planId].json      # Study plan & review schedule
│   └── sessions/
│       └── [sessionId].json   # Learning session data
```

## Key Patterns

**IPC Communication** (Renderer ↔ Main Process)
- Main channels: `request-file-operation`, `save-project`, `update-progress`
- Renderer listens with `ipcRenderer.on()`, sends with `ipcRenderer.send()`

**Component Initialization**
- Main process creates singleton instances
- Passes config/paths from environment (`.env` file)
- Renderer accesses via preload.js bridge

**Testing**
- Unit tests in `test/` directory
- Jest configuration in `jest.config.js`
- Coverage thresholds: statements 15%, branches 10%, functions 15%, lines 15%
- Uses `moduleNameMapper` for `@/` path alias in tests

## Technology Stack

- **Electron 28** - Desktop application framework
- **Express 4** - HTTP API server
- **Vanilla JavaScript** - No frontend framework
- **Bootstrap 5** - UI styling
- **Jest 29** - Testing framework
- **ESLint 8** - Code linting
- **electron-store** - Persistent configuration storage
- **Chokidar** - File system watching
- **Marked** - Markdown parsing for documents

## Important Notes

- Application data is stored locally in the `projects/` folder; no cloud sync
- HTTP bridge only accepts localhost connections for security
- Chrome extension requires the app to be running to capture content
- SM-2 algorithm implementation handles spaced repetition intervals
- `.env` file can override `DATA_DIR` for testing/development
- No external npm dependencies in core logic (vanilla JS approach)
