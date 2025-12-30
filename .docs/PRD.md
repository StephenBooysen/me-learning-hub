# Product Requirements Document
## Me Learning Hub

### 1. Executive Summary

Me Learning Hub is an intelligent learning platform that empowers users to capture web content and transform it into personalized study materials using advanced learning methodologies. The application comprises a Chrome extension for content extraction and an Electron desktop application for study plan generation, organization, and active learning.

---

### 2. Vision & Purpose

Enable learners to efficiently convert any web content into structured, adaptive study materials that leverage scientifically-proven learning techniques (Spaced Repetition, Active Recall, Interleaving, Feynman Technique) to maximize knowledge retention and understanding.

---

### 3. Core Features

#### 3.1 Chrome Extension
- **Web Content Capture**: Extract articles, documentation, blog posts, and other web content
- **Smart Selection**: Allow users to select specific portions of a page or capture entire content
- **Markdown Export**: Convert captured content to clean, structured markdown format
- **Quick Save**: One-click saving to learning projects
- **Content Preview**: Preview markdown before saving

#### 3.2 Electron Desktop Application
- **Project Management**: Create and organize learning projects
- **Markdown Editor**: View and edit captured markdown documents
- **AI-Powered Analysis**:
  - Parse markdown documentation
  - Generate study notes using AI
  - Break down complex topics into digestible chunks
- **Study Plan Generation**: Automatically create learning plans using advanced techniques
- **Study Modes**:
  - **Spaced Repetition**: Algorithmically schedule review sessions based on forgetting curve
  - **Active Recall**: Generate questions and prompts requiring retrieval of knowledge
  - **Interleaving**: Mix different topics and difficulty levels to strengthen learning
  - **Feynman Technique**: Simplify concepts into plain language explanations
- **Progress Tracking**: Monitor learning progress across all study modes
- **Local Data Storage**: All data persisted in markdown files for portability and version control
- **Search & Organization**: Find and organize study materials across projects

#### 3.3 Study Plan Features
- **Customizable Learning Paths**: Users can adjust study intensity, frequency, and focus areas
- **Multi-Format Output**: Study plans available in different formats (scheduled tasks, flashcards, essays, etc.)
- **Adaptive Scheduling**: Adjust review frequency based on user performance
- **Analytics**: Insights into learning patterns, weak areas, and progress

---

### 4. User Personas

#### 4.1 Professional Developer
- Captures technical documentation, blog posts, and tutorials
- Uses spaced repetition to retain new programming concepts
- Generates quick-reference study notes
- Tracks learning of new frameworks and languages

#### 4.2 Student
- Converts lecture notes and research articles into study materials
- Creates flashcards using active recall technique
- Prepares for exams with adaptive spacing
- Combines multiple sources into cohesive study guides

#### 4.3 Lifelong Learner
- Captures articles on diverse topics of interest
- Uses Feynman Technique to deepen understanding
- Interleaves topics to develop broader knowledge
- Maintains a personal knowledge repository

---

### 5. User Workflows

#### 5.1 Capture Workflow
1. User encounters content on the web
2. Opens Chrome extension
3. Selects content or captures full page
4. Reviews markdown preview
5. Assigns to learning project
6. Saves (syncs to Electron app)

#### 5.2 Study Plan Generation Workflow
1. User opens Electron app and selects a document
2. Clicks "Generate Study Plan"
3. AI analyzes markdown content
4. User selects study techniques (spaced repetition, active recall, etc.)
5. Configures learning parameters (intensity, duration)
6. System generates personalized study plan
7. User begins learning journey

#### 5.3 Active Learning Workflow
1. User opens study session from dashboard
2. Application presents study item based on selected technique
3. User completes learning activity (answer question, explain concept, etc.)
4. System records performance and updates schedule
5. Application provides feedback and next steps
6. User tracks progress through dashboard

---

### 6. Technical Requirements

#### 6.1 Chrome Extension
- Manifest V3 compatible
- Lightweight and responsive
- Minimal permissions required
- Fast content extraction and markdown generation
- Communication with Electron app via IPC or local file system

#### 6.2 Electron Application
- Cross-platform (Windows, macOS, Linux)
- Native JavaScript (no complex frameworks initially)
- Offline-first operation
- Real-time file watching and sync with markdown files
- System tray integration
- Keyboard shortcuts for power users

#### 6.3 AI Integration
- Local or remote API integration for markdown analysis
- Batch processing of documents for study plan generation
- Support for multiple LLM providers (OpenAI, Anthropic, etc.)
- Configurable prompts for different study techniques

#### 6.4 Data Storage
- File-based storage using structured markdown
- Human-readable directory hierarchy
- Git-friendly format for version control
- No database server required
- Automatic backups and export capabilities

---

### 7. Data Structure Overview

```
projects/
├── [project-name]/
│   ├── metadata.md
│   ├── sources/
│   │   ├── [source-1].md
│   │   └── [source-2].md
│   ├── study-plans/
│   │   ├── [plan-1].md
│   │   └── [plan-2].md
│   └── progress/
│       ├── [study-session-1].md
│       └── [study-session-2].md
```

---

### 8. Success Metrics

- Users successfully capture and save web content
- Study plans generated for captured documents
- Users engage with study modes and complete sessions
- Progress tracked and visible in analytics dashboard
- User retention rate (30-day, 90-day)
- Average learning session duration
- Study plan completion rates

---

### 9. Out of Scope (MVP)

- Cloud synchronization across devices
- Social features (sharing, collaboration)
- Mobile apps
- Real-time collaboration
- Advanced analytics and ML-based recommendations
- Browser support beyond Chrome

---

### 10. Timeline & Phases

### Phase 1: Foundation (Weeks 1-2)
- Electron application scaffolding
- Basic markdown file management
- Chrome extension skeleton with content capture

### Phase 2: Core Features (Weeks 3-5)
- Markdown generation from web content
- Study plan generation with AI
- Spaced Repetition implementation

### Phase 3: Learning Modes (Weeks 6-8)
- Active Recall interface
- Interleaving system
- Feynman Technique prompts

### Phase 4: Polish & Launch (Weeks 9+)
- UI/UX refinement
- Performance optimization
- Testing and bug fixes
- Documentation and user guides

---

### 11. Acceptance Criteria

✅ Users can capture web content via Chrome extension
✅ Captured content is converted to markdown and saved
✅ Electron app displays and organizes markdown files
✅ Study plans can be generated from markdown content
✅ At least one study technique (Spaced Repetition) is fully functional
✅ Progress is tracked and persisted
✅ Application works offline
✅ All data is stored in markdown files

