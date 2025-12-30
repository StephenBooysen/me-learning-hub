# Architecture Document
## Me Learning Hub - Technical Architecture

### 1. System Overview

Me Learning Hub is a distributed learning application consisting of three main components:

```
┌─────────────────────────────────────────────────────────────┐
│                    User's Computer                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐          ┌──────────────────────┐     │
│  │ Chrome Extension │          │   Electron App       │     │
│  │  - Content       │◄────────►│  - Study Plan Mgmt   │     │
│  │    Extraction    │          │  - UI/UX             │     │
│  │  - Markdown Gen  │          │  - File Management   │     │
│  │  - IPC Comm.     │          │  - AI Integration    │     │
│  └──────────────────┘          └──────────────────────┘     │
│           │                              │                  │
│           └──────────────┬───────────────┘                  │
│                          │                                  │
│                  ┌───────▼────────┐                         │
│                  │  Markdown      │                         │
│                  │  File System   │                         │
│                  │  (Local Disk)  │                         │
│                  └────────────────┘                         │
│                                                             │
│  Optional:                                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         AI API (OpenAI, Anthropic, etc.)             │   │
│  │        (Internet connection required)                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

### 2. Technology Stack

#### 2.1 Core Technologies
- **Language**: Native JavaScript (ES6+)
- **Desktop Framework**: Electron
- **Package Manager**: npm
- **Runtime**: Node.js

#### 2.2 Electron Application Stack
- **Frontend**: Native HTML5, CSS3, JavaScript (no heavy frameworks initially)
- **Backend**: Node.js with file system APIs
- **Data Storage**: Markdown files
- **File Watching**: chokidar or Node.js fs.watch
- **Process Management**: Electron's IPC for inter-process communication

#### 2.3 Chrome Extension
- **Manifest**: V3
- **Content Scripts**: JavaScript
- **Background Service Worker**: JavaScript
- **Popup UI**: HTML5 + CSS3 + JavaScript
- **Communication**: Chrome Messaging API + File System Access API

#### 2.4 Optional External Services
- **AI/LLM API**: OpenAI API, Anthropic Claude API, or similar
- **Data Format**: JSON for API requests, Markdown for storage

---

### 3. Directory Structure

```
me-learning-hub/
├── .docs/                          # Documentation
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   └── API.md (future)
├── electron/                       # Electron Desktop App
│   ├── main.js                     # Main process
│   ├── preload.js                  # Preload script for security
│   ├── app/
│   │   ├── index.html              # Main window HTML
│   │   ├── css/
│   │   │   └── styles.css          # Global styles
│   │   ├── js/
│   │   │   ├── renderer.js         # Renderer process
│   │   │   ├── ui.js               # UI management
│   │   │   ├── file-manager.js     # Markdown file operations
│   │   │   ├── study-plan.js       # Study plan logic
│   │   │   ├── learning-modes/     # Study technique implementations
│   │   │   │   ├── spaced-repetition.js
│   │   │   │   ├── active-recall.js
│   │   │   │   ├── interleaving.js
│   │   │   │   └── feynman.js
│   │   │   ├── ai-client.js        # AI/LLM integration
│   │   │   └── utils.js            # Utility functions
│   │   └── views/
│   │       ├── project-list.html
│   │       ├── document-editor.html
│   │       ├── study-plan.html
│   │       └── dashboard.html
│   └── package.json
├── extension/                      # Chrome Extension
│   ├── manifest.json               # Manifest V3
│   ├── background.js               # Service worker
│   ├── content.js                  # Content script
│   ├── popup.html                  # Extension popup
│   ├── popup.js                    # Popup logic
│   ├── popup.css                   # Popup styles
│   ├── styles/
│   │   └── content-highlighter.css # Content highlighting
│   └── utils/
│       ├── markdown-converter.js   # HTML to Markdown
│       ├── content-extractor.js    # Web content extraction
│       └── ipc.js                  # Communication with Electron
├── data/                           # Default data directory (created at runtime)
│   └── projects/
│       └── [user projects stored here]
├── package.json                    # Root package file
├── README.md
└── .gitignore
```

---

### 4. Data Storage Architecture

#### 4.1 File System Structure

All data is stored in structured markdown files for maximum portability and version control compatibility.

```
$HOME/.me-learning-hub/  (or user-configured path)
└── projects/
    └── [project-id]/
        ├── metadata.md             # Project metadata (title, created date, description)
        ├── README.md               # Project overview
        ├── sources/
        │   ├── [doc-id].md         # Captured markdown documents
        │   ├── [doc-id].md
        │   └── manifest.md         # Index of all source documents
        ├── study-plans/
        │   ├── [plan-id].md        # Generated study plans
        │   └── index.md            # Index of all plans
        ├── progress/
        │   ├── [session-id].md     # Study session records
        │   └── index.md            # Progress index
        └── config.md               # Project-specific settings
```

#### 4.2 Markdown File Formats

##### Project Metadata (metadata.md)
```markdown
# [Project Name]

## Metadata
- **ID**: uuid
- **Created**: ISO 8601 timestamp
- **Modified**: ISO 8601 timestamp
- **Description**: Project description

## Statistics
- **Documents**: N
- **Study Plans**: N
- **Study Sessions**: N
```

##### Source Document ([doc-id].md)
```markdown
# [Document Title]

## Metadata
- **Source URL**: [original URL]
- **Captured**: ISO 8601 timestamp
- **Original Format**: web page / article / documentation

## Content
[Markdown content from extracted web page]

## Tags
- tag1
- tag2
```

##### Study Plan ([plan-id].md)
```markdown
# Study Plan: [Title]

## Metadata
- **ID**: uuid
- **Source Documents**: [list of doc IDs]
- **Created**: ISO 8601 timestamp
- **Techniques**: Spaced Repetition, Active Recall, etc.
- **Status**: Active / Completed / Paused

## Configuration
- **Learning Intensity**: [Low / Medium / High]
- **Session Duration**: [minutes]
- **Review Frequency**: [custom schedule]

## Study Items
### Item 1: [Title]
- **Type**: [Flashcard / Question / Summary / Explanation]
- **Content**: [Item content]
- **Scheduled Reviews**: [dates]
- **Performance**: [data]

### Item 2: [Title]
...

## Progress Summary
- **Total Items**: N
- **Completed**: N
- **Mastered**: N
- **Current Streak**: N days
```

##### Study Session ([session-id].md)
```markdown
# Study Session: [Date] [Time]

## Session Metadata
- **Plan ID**: [associated plan]
- **Duration**: [minutes]
- **Items Reviewed**: N
- **Performance**: [average score]

## Session Log
### Review 1: [Item Title]
- **Result**: Correct / Incorrect / Partial
- **Time Spent**: [seconds]
- **Confidence**: [1-5]

### Review 2: [Item Title]
...
```

---

### 5. Component Architecture

#### 5.1 Electron Main Process (main.js)
**Responsibilities:**
- Window lifecycle management
- File system operations
- IPC message handling
- Configuration management
- System tray integration

**Key Functions:**
```javascript
- createWindow()
- handleProjectCreate()
- handleProjectOpen()
- handleMarkdownSave()
- handleStudyPlanGenerate()
- handleStudySession()
```

#### 5.2 Electron Preload Script (preload.js)
**Responsibilities:**
- Expose safe APIs to renderer process
- IPC bridge setup
- Security context enforcement

#### 5.3 Renderer Process (renderer.js)
**Responsibilities:**
- UI state management
- Event handling
- Communication with main process
- DOM manipulation

**Key Modules:**
- `file-manager.js`: Read/write markdown files
- `study-plan.js`: Study plan logic and scheduling
- `learning-modes/`: Individual technique implementations
- `ai-client.js`: API calls to LLM services
- `ui.js`: UI component management

#### 5.4 Chrome Extension Components

**manifest.json:**
- Permissions (tabs, activeTab, scripting, files)
- Content script declarations
- Background service worker
- Extension icons and UI assets

**content.js (Content Script):**
- DOM traversal and content extraction
- Highlighting and selection handling
- Communication with background service worker

**background.js (Service Worker):**
- Extension lifecycle
- Tab event handling
- Message routing to Electron
- Storage of captured content temporarily

**popup.js & popup.html:**
- User interface for capture options
- Preview of markdown before saving
- Quick project selection
- Save/cancel actions

---

### 6. Communication Protocols

#### 6.1 Chrome Extension ↔ Electron App

**Method 1: File System (Primary)**
- Extension writes captured content to monitored directory
- Electron watches directory and imports files
- More reliable and doesn't require special permissions

**Method 2: Native Messaging (Alternative)**
- Uses Chrome Native Messaging API
- Requires additional setup but more direct communication

**Data Flow:**
```
User selects content in browser
    ↓
content.js extracts and converts to markdown
    ↓
popup.js shows preview
    ↓
User confirms and selects project
    ↓
background.js sends to Electron via file system or native messaging
    ↓
Electron main process receives and saves to project directory
    ↓
File watcher detects new file
    ↓
File is indexed and appears in UI
```

#### 6.2 Electron IPC Communication

**Main ↔ Renderer Process:**
```javascript
// Main process
ipcMain.handle('project:create', handleProjectCreate)
ipcMain.on('study:session-update', handleSessionUpdate)

// Renderer process
ipcRenderer.invoke('project:create', projectData)
ipcRenderer.send('study:session-update', sessionData)
```

#### 6.3 AI/LLM Integration

**Request Flow:**
```
Markdown document loaded
    ↓
User requests study plan generation
    ↓
ai-client.js prepares prompt with markdown content
    ↓
HTTP/API call to LLM service (e.g., OpenAI)
    ↓
Parse LLM response and structure study items
    ↓
Generate markdown study plan file
    ↓
Display study plan in UI
```

---

### 7. Study Techniques Implementation

#### 7.1 Spaced Repetition (spaced-repetition.js)
- **Algorithm**: SM-2 (SuperMemo-2) or variant
- **Data Structure**: Schedule intervals based on performance
- **Storage**: Dates recorded in study plan markdown
- **Review Triggering**: Background process checks for due items
- **Difficulty Factor**: Adjusted based on user performance

#### 7.2 Active Recall (active-recall.js)
- **Item Generation**: AI generates questions from markdown
- **UI Interaction**: Flash card style reveal/hide
- **Performance Tracking**: Correct/incorrect/partial
- **Difficulty Adaptation**: Easier/harder questions based on performance

#### 7.3 Interleaving (interleaving.js)
- **Item Mixing**: Shuffle different topics and difficulty levels
- **Block Organization**: Groups of mixed items instead of sequential
- **Progress Tracking**: Separate statistics for each topic
- **Optimization**: Adjust mix based on learning curves

#### 7.4 Feynman Technique (feynman.js)
- **Explanation Prompts**: AI generates specific prompts
- **User Input**: Collect user's simple explanations
- **Feedback**: AI evaluates understanding and identifies gaps
- **Iteration**: Suggest areas for deeper learning

---

### 8. Security Considerations

#### 8.1 Electron Security
- Preload scripts for IPC security
- No `nodeIntegration` in renderer
- Content security policies in HTML files
- File path validation before operations

#### 8.2 Chrome Extension Security
- Minimal permissions requested
- Content script sandboxing
- No sensitive data in localStorage
- Message validation from background service worker

#### 8.3 Data Protection
- Local file storage only (no cloud sync without explicit opt-in)
- Optional encryption for sensitive project files
- Git-friendly format (consider .gitignore for projects)

#### 8.4 API Communication
- HTTPS-only for AI API calls
- API keys stored in electron config file (not committed to git)
- Environment variables for sensitive config

---

### 9. Performance Considerations

#### 9.1 File Operations
- Async file I/O (non-blocking)
- Debouncing for file system watchers
- Lazy loading of project contents
- Caching of frequently accessed files

#### 9.2 AI Integration
- Batch processing for multiple documents
- Caching of LLM responses
- Configurable timeout limits
- Graceful degradation if API unavailable

#### 9.3 UI Responsiveness
- Worker threads for heavy computations
- Progressive rendering of large markdown files
- Virtual scrolling for long lists

---

### 10. Development Workflow

#### 10.1 Build & Run Commands

```bash
# Install dependencies
npm install

# Run Electron app in development
npm run electron:dev

# Build extension
npm run extension:build

# Run tests
npm test

# Package application
npm run dist
```

#### 10.2 Configuration Files

**electron/package.json**
```json
{
  "main": "main.js",
  "homepage": "./",
  "dependencies": {
    "electron-store": "latest",
    "chokidar": "latest"
  }
}
```

**extension/manifest.json**
```json
{
  "manifest_version": 3,
  "name": "Me Learning Hub",
  "version": "1.0.0",
  "permissions": ["tabs", "activeTab", "scripting"],
  "action": {
    "default_popup": "popup.html"
  },
  "background": {
    "service_worker": "background.js"
  }
}
```

---

### 11. Deployment & Distribution

#### 11.1 Electron App
- Distributable for Windows (.exe, .msi)
- Distributable for macOS (.dmg, .app)
- Distributable for Linux (.AppImage, .deb)
- Auto-update capability via electron-updater

#### 11.2 Chrome Extension
- Publish to Chrome Web Store
- Manual sideloading for development

#### 11.3 Versioning
- Semantic versioning (MAJOR.MINOR.PATCH)
- Changelog documentation
- Release notes in README

---

### 12. Future Scalability

#### 12.1 Potential Enhancements
- Cloud synchronization (optional)
- Plugin system for custom learning techniques
- Multi-user profiles on same machine
- Advanced analytics and dashboards
- Integration with other learning tools (Anki, Notion, etc.)

#### 12.2 Architectural Flexibility
- Current design supports modular additions
- File-based storage allows easy export/import
- IPC patterns support future microservices if needed
- Markdown format enables tool independence

---

### 13. API Endpoints (Future Backend Reference)

If backend is added later:

```
POST /api/projects           # Create project
GET  /api/projects           # List projects
POST /api/documents          # Add document to project
POST /api/study-plans        # Generate study plan
POST /api/study-sessions     # Record study session
GET  /api/progress           # Fetch progress data
```

---

### 14. Testing Strategy

#### 14.1 Unit Tests
- File operations (read/write markdown)
- Study algorithm calculations
- Markdown parsing and generation

#### 14.2 Integration Tests
- Extension → Electron communication
- File system watchers
- AI API integration

#### 14.3 E2E Tests
- Complete user workflows
- UI interactions
- Study session flows

---

### Conclusion

This architecture prioritizes simplicity, portability, and user privacy through:
- **Native JavaScript**: Minimal dependencies, fast execution
- **Electron**: Cross-platform desktop application
- **File-Based Storage**: Human-readable, version-controllable, portable
- **Modular Design**: Easy to extend and maintain
- **Optional AI Integration**: Works offline, enhanced with internet connection

The design allows users to own their learning data completely while providing a smooth, integrated experience across browsing and studying.

