# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**me-learning-hub** is a desktop learning application built with Electron that helps users create personalized study plans using advanced learning techniques like spaced repetition, active recall, and interleaving.

### Current Status

The project includes:
- ✅ Electron-based desktop application
- ✅ Project and document management system
- ✅ Study plan generation with SM-2 algorithm
- ✅ Multiple learning modes (flashcards, questions, etc.)
- ✅ Progress tracking and analytics dashboard
- ✅ File-based data persistence

## Development Setup

### Installation

```bash
npm install
cd electron && npm install
```

### Running the Application

```bash
npm run electron:dev
```

### Testing

```bash
npm test
```

## Architecture

The application consists of:

1. **Main Process** (`electron/main.js`) - Handles window management, file system operations, and IPC
2. **Renderer Process** (`electron/app/js/renderer.js`) - UI logic and view management
3. **HTTP Bridge** - RESTful API for external integrations
4. **File System** - JSON-based data storage in user's documents folder

### Key Components

- **Project Management** - Create, update, and organize learning projects
- **Document Handler** - Import and manage learning documents
- **Study Plan Generator** - Creates spaced repetition schedules
- **Learning Modes** - Interactive flashcards, Q&A, and reading sessions
- **Analytics** - Tracks learning progress and performance metrics

## Technology Stack

- **Electron** - Desktop application framework
- **Vanilla JavaScript** - No external dependencies
- **Bootstrap 5** - UI styling (main app)
- **File-based JSON** - Data persistence
