# Complete AI-Powered Learning Workflow

Comprehensive guide for the complete end-to-end learning content capture, processing, and study workflow.

## 📋 Workflow Overview

```
┌─────────────────────┐
│  Browse Web         │
│  (Any Website)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  Chrome Extension Captures Content   │
│  ✓ Full page or selected text        │
│  ✓ Removes styles & formatting       │
│  ✓ Extracts metadata                 │
└──────────┬──────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  Extension Sends to Electron App     │
│  (HTTP Bridge: localhost:47823)      │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────┐
│  Electron HTTP Bridge Processes              │
│  ✓ Validates duplicate by URL                │
│  ✓ Cleans content with Claude AI             │
│  ✓ Extracts quality score & topics           │
│  ✓ Suggests improved title                   │
│  ✓ Converts to clean markdown                │
└──────────┬───────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────┐
│  Save Cleaned Markdown Document              │
│  ✓ Stores in project/sources/                │
│  ✓ Includes metadata & processing info       │
│  ✓ Saved as UUID.md format                   │
└──────────┬───────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────┐
│  Auto-Generate Study Plan (Optional)         │
│  ✓ Uses Claude to create 7-day plan          │
│  ✓ Daily topics with time estimates          │
│  ✓ Key concepts to focus on                  │
│  ✓ Practice exercises & checkpoints          │
│  ✓ Saved in project/study-plans/             │
└──────────┬───────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────┐
│  View & Study Materials                      │
│  ✓ Click document to open markdown viewer    │
│  ✓ Beautiful formatted display               │
│  ✓ Copy content to clipboard                 │
│  ✓ Download as markdown file                 │
│  ✓ See word count & reading time             │
└──────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Step 1: Setup API Key
```bash
# Edit .env file
CLAUDE_API_KEY=sk-ant-xxxxxxxxxxxxx
CLAUDE_MODEL=claude-opus-4-5
```

### Step 2: Start Electron App
```bash
npm run electron:dev
```
Look for: `[HTTP Bridge] Server running on http://localhost:47823`

### Step 3: Load Chrome Extension
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `extension` folder
5. Extension appears in toolbar

### Step 4: Capture Content
1. Navigate to any webpage
2. Click extension icon
3. Select project from dropdown
4. Choose "Full Page" or "Selected Text"
5. Click "Capture & Save"
6. Watch as content is cleaned and processed! ✨

### Step 5: View Documents
1. Go to Electron app → Documents
2. Click on any document card
3. Markdown viewer opens in new window
4. Copy, download, or read!

## 🔄 Detailed Workflow Steps

### Step 1: Web Content Capture (Extension)

**What Happens:**
- Extension content script extracts webpage content
- All styles, scripts, ads, navigation are removed
- Converts HTML to clean markdown
- Extracts metadata: title, URL, domain, word count, reading time

**Files Involved:**
- `extension/content.js` - Content extraction
- `extension/popup.js` - User interface
- `extension/background.js` - Communication with app

### Step 2: Content Cleaning (Claude AI)

**What Happens:**
- Raw content sent to Claude API
- Claude analyzes and cleans content
- Quality assessment (1-10 score)
- Topic extraction (5 main topics)
- Title improvement suggestion

**Quality Scoring:**
- 1-3: Too short/mostly noise
- 4-6: Some useful content
- 7-8: Good educational content
- 9-10: Excellent structured content

**Files Involved:**
- `electron/app/js/content-cleaner.js` - Cleaning logic
- Claude API (v1/messages endpoint)

**Example Claude Prompts:**
```
1. Clean and structure the raw content
2. Remove promotional/ad content
3. Fix formatting issues
4. Preserve logical structure
5. Return as markdown
```

### Step 3: Document Storage

**What Happens:**
- Cleaned markdown saved to disk
- Project folder structure: `projects/{projectId}/sources/{docId}.md`
- Metadata stored in YAML frontmatter
- Includes: title, URL, quality score, topics, word count

**File Structure:**
```
projects/
└── fb40ec51-4575-47f3-aee0-d2a23227fc02/
    ├── metadata.md
    ├── sources/
    │   ├── doc1-uuid.md
    │   ├── doc2-uuid.md
    │   └── ...
    └── study-plans/
        └── doc1-uuid.md
```

**Markdown Frontmatter:**
```yaml
---
id: document-uuid
title: Improved Document Title
source-url: https://example.com/article
captured: 2024-12-31T...
modified: 2024-12-31T...
tags: domain, topic1, topic2
---

# Document Content Here
...
```

### Step 4: Auto Study Plan Generation

**What Happens:**
- If document quality score ≥ 5, study plan auto-generates
- Claude creates 7-day learning schedule
- Includes topics, time estimates, exercises, checkpoints
- Saved alongside document

**Study Plan Structure:**
```
# Study Plan: Topic Name

## Day 1: Introduction & Basics
- Time: 45 minutes
- Topics: Core concept 1, Core concept 2
- Key focus: Understanding fundamentals
- Practice: 5 review questions

## Day 2: Deep Dive
- Time: 60 minutes
- Topics: Advanced concept 1, Advanced concept 2
- Key focus: Application and analysis
- Practice: Problem set 1

... (Days 3-7)

## Assessment Checkpoints
- Daily quizzes
- Cumulative review exercises
```

**Files Involved:**
- `electron/app/js/document-processor.js` - Plan generation
- Claude API (v1/messages endpoint)

### Step 5: Document Viewing

**What Happens:**
- Click document card in Electron app
- Content loaded from disk
- Opens in beautiful markdown viewer window
- Full HTML rendering with styling
- Copy/download functionality

**Features:**
- ✓ Beautiful markdown rendering
- ✓ Proper heading hierarchy
- ✓ Code blocks with syntax highlighting
- ✓ Tables and blockquotes
- ✓ Links and images
- ✓ Word count and reading time
- ✓ Copy to clipboard button
- ✓ Download as markdown button
- ✓ Responsive design

**Files Involved:**
- `electron/app/markdown-viewer.html` - Viewer UI
- `electron/preload.js` - IPC bridge
- `electron/main.js` - Window management

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER'S COMPUTER                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  BROWSER (Chrome)          ELECTRON APP                     │
│  ┌─────────────────────┐  ┌────────────────────────────┐   │
│  │  Extension Icon     │  │  Main Window               │   │
│  │  ┌───────────────┐  │  │  ┌──────────────────────┐  │   │
│  │  │  Popup UI     │  │  │  │  Projects View       │  │   │
│  │  │  (port 47823) │◄─┼──┼─►│  Documents View      │  │   │
│  │  └───────────────┘  │  │  │  Markdown Viewer     │  │   │
│  │  Content Script     │  │  └──────────────────────┘  │   │
│  │  (Webpage)          │  │  HTTP Bridge               │   │
│  │                     │  │  Content Cleaner (Claude)  │   │
│  └─────────────────────┘  │  Document Processor        │   │
│                            │  File Manager              │   │
│                            └────────────────────────────┘   │
│                                      │                      │
│                                      ▼                      │
│                            ┌────────────────────┐           │
│                            │  File System       │           │
│                            │  projects/         │           │
│                            │  └─ sources/       │           │
│                            │  └─ study-plans/   │           │
│                            └────────────────────┘           │
│                                                              │
│                                      │                      │
│                                      ▼                      │
│                            ┌────────────────────┐           │
│                            │  Claude API        │           │
│                            │  Content Cleaning  │           │
│                            │  Study Plans       │           │
│                            └────────────────────┘           │
│                            (Internet Connection)            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🔑 Key Features

### Content Extraction
- ✅ Removes styles, classes, IDs, data attributes
- ✅ Strips ads, navigation, footers, modals
- ✅ Removes scripts and style blocks
- ✅ Preserves document structure
- ✅ Converts to clean markdown

### AI Processing
- ✅ Content validation & quality scoring
- ✅ Topic extraction
- ✅ Title improvement
- ✅ Duplicate detection by source URL
- ✅ Auto study plan generation

### Document Management
- ✅ Project-based organization
- ✅ Metadata storage
- ✅ Source URL tracking
- ✅ Word count & reading time
- ✅ Quality score preservation

### Viewing & Export
- ✅ Beautiful markdown renderer
- ✅ Syntax-highlighted code blocks
- ✅ Proper table rendering
- ✅ Responsive design
- ✅ Copy to clipboard
- ✅ Download as .md file

## ⚙️ API Integration Points

### Claude API Calls

**1. Content Cleaning**
```javascript
POST /v1/messages
{
  "model": "claude-opus-4-5",
  "max_tokens": 4000,
  "messages": [{
    "role": "user",
    "content": "Clean this content: ..."
  }]
}
```

**2. Quality Validation**
```javascript
POST /v1/messages
{
  "model": "claude-opus-4-5",
  "max_tokens": 500,
  "messages": [{
    "role": "user",
    "content": "Rate content quality 1-10: ..."
  }]
}
```

**3. Topic Extraction**
```javascript
POST /v1/messages
{
  "model": "claude-opus-4-5",
  "max_tokens": 500,
  "messages": [{
    "role": "user",
    "content": "Extract 5 main topics: ..."
  }]
}
```

**4. Study Plan Generation**
```javascript
POST /v1/messages
{
  "model": "claude-opus-4-5",
  "max_tokens": 2000,
  "messages": [{
    "role": "user",
    "content": "Create 7-day study plan: ..."
  }]
}
```

## 📈 Processing Timeline

**Total Processing Time:** 30-60 seconds per document

```
Step 1: Content Extraction      ~2 seconds
Step 2: Content Cleaning (AI)   ~15-20 seconds
Step 3: Quality Validation      ~5-10 seconds
Step 4: Topic Extraction        ~5-10 seconds
Step 5: Title Suggestion        ~5-10 seconds
Step 6: Study Plan Generation   ~15-25 seconds
Step 7: File Saving             ~1-2 seconds
──────────────────────────────
Total:                          ~48-79 seconds
```

## 🎯 Use Cases

### 1. Learning Articles
- Capture technical articles
- Remove ads and clutter
- Auto-generate study plan
- Study with structured materials

### 2. Research Papers
- Capture paper content
- Extract key topics
- Generate learning objectives
- Create study schedule

### 3. Tutorial Content
- Capture step-by-step tutorials
- Organize in projects
- Create practice exercises
- Track learning progress

### 4. Course Notes
- Capture course materials
- Clean formatting
- Organize by topic
- Generate review plans

## 🛠️ Configuration

### .env Variables
```env
# Claude API
CLAUDE_API_KEY=sk-ant-xxxxxxxxxxxxx
CLAUDE_MODEL=claude-opus-4-5

# App Data
DATA_DIR=/path/to/projects

# Logging
LOG_LEVEL=info
DEBUG=false
```

### Customization Options

**Content Cleaning Settings:**
- Edit `content-cleaner.js` to adjust quality thresholds
- Modify removal selectors in `content.js` for specific websites
- Adjust token limits in Claude API calls

**Study Plan Duration:**
- Default: 7 days
- Modify in `document-processor.js` line 52
- Can be adjusted per document

**Markdown Viewer Styling:**
- Edit `markdown-viewer.html` CSS section
- Customize colors, fonts, spacing
- Add syntax highlighting themes

## ✅ Quality Assurance

### Validation Checks
1. Content not empty
2. Quality score threshold (5+)
3. Duplicate detection by URL
4. Markdown formatting validation
5. Study plan coherence check

### Error Handling
- Network failures: Retry with exponential backoff
- API limits: Queue and retry later
- Invalid content: Save original, log quality score
- Duplicates: Notify user with option to override

## 📝 Examples

### Example 1: Capture & Study

```
User navigates to: www.example.com/machine-learning-101
Clicks extension icon
Selects project: "AI & ML Learning"
Clicks "Capture & Save"

Behind the scenes:
1. Extension extracts content (~2s)
2. Sends to Electron HTTP bridge
3. Claude cleans content (~20s)
4. Validates quality: 8.5/10 ✓
5. Extracts topics: ML, Neural Networks, Training...
6. Improves title: "Machine Learning 101: Fundamentals & Applications"
7. Generates 7-day study plan (~20s)
8. Saves document and plan to disk

User can then:
1. View cleaned document
2. Follow study plan
3. Review daily topics
4. Track progress
```

### Example 2: Manual Processing

```
Content looks low quality (score: 3/10)
→ User can see in processing info
→ Document saved with original title
→ No study plan generated
→ User can manually review or re-capture
```

## 🚨 Troubleshooting

**Issue:** Content quality too low
- **Solution**: Original source may have limited content, try longer article

**Issue:** Study plan not generating
- **Solution**: Check CLAUDE_API_KEY is valid, content quality must be 5+

**Issue:** Duplicate warning appears
- **Solution**: Same URL detected, click "Override & Save" to replace

**Issue:** Markdown viewer doesn't open
- **Solution**: Ensure document content was saved successfully, check console logs

## 📚 Next Steps

1. ✅ Start capturing web content
2. ✅ Review cleaned documents
3. ✅ Follow auto-generated study plans
4. ✅ Track learning progress
5. ✅ Build study materials library

Enjoy your intelligent learning workflow! 🚀
