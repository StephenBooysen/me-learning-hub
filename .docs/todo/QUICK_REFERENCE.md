# Quick Reference Guide - Complete AI Learning Workflow

## 🚀 5-Minute Quick Start

### 1. Setup
```bash
# Set API key in .env
CLAUDE_API_KEY=sk-ant-xxxxxxxxxxxxx

# Start Electron app
npm run electron:dev

# Wait for: [HTTP Bridge] Server running on http://localhost:47823
```

### 2. Load Extension
- Go to `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked"
- Select `extension` folder

### 3. Capture Content
- Navigate to any webpage
- Click extension icon
- Select project
- Click "Capture & Save"
- Wait 30-60 seconds for processing

### 4. View Document
- Go to Documents in Electron app
- Click on document card
- Beautiful markdown viewer opens!

---

## 📊 What Happens Behind the Scenes

```
Webpage Content
      ↓
Extension Extracts (removes styles)
      ↓
Sends to HTTP Bridge (localhost:47823)
      ↓
Claude AI Cleans Content
      ↓
Claude Validates Quality (1-10)
      ↓
Claude Extracts Topics (5 main)
      ↓
Claude Suggests Title
      ↓
Check for Duplicate URL
      ↓
Save Cleaned Markdown
      ↓
If Quality ≥ 5: Auto-Generate Study Plan
      ↓
Save Study Plan (7 days)
      ↓
Done! Document Ready to Review
```

---

## 🎯 File Locations

### Extension Files
```
extension/
├── manifest.json         ← Configuration
├── popup.html/css/js     ← User interface
├── content.js            ← Content extraction
├── background.js         ← Communication
└── README.md             ← Extension docs
```

### Electron Files
```
electron/
├── main.js               ← HTTP bridge + IPC handlers
├── preload.js            ← API exposure
└── app/
    ├── js/renderer.js    ← UI logic
    ├── markdown-viewer.html ← Document viewer
    └── js/
        ├── claude-client.js ← API client
        ├── content-cleaner.js ← AI cleaning
        └── document-processor.js ← Study plans
```

### Data Storage
```
projects/
└── {projectId}/
    ├── metadata.md       ← Project info
    ├── sources/          ← Documents
    │   └── {docId}.md
    └── study-plans/      ← Auto-generated plans
        └── {docId}.md
```

---

## 🔧 Key Components

### 1. Content Cleaner (Claude AI)
**File:** `electron/app/js/content-cleaner.js`

```javascript
const cleaner = new ContentCleaner(apiKey);
const result = await cleaner.analyzeContent(content);
// Returns: { content, title, topics, qualityScore }
```

### 2. Document Processor (Study Plans)
**File:** `electron/app/js/document-processor.js`

```javascript
const processor = new DocumentProcessor(apiKey);
const plan = await processor.generateStudyPlan(title, content);
// Returns: { title, duration, plan }
```

### 3. Markdown Viewer
**File:** `electron/app/markdown-viewer.html`

- Beautiful rendering of markdown
- Copy & download buttons
- Responsive design
- Code highlighting
- Word count & reading time

---

## 📈 Processing Summary

### Input
- Raw HTML from webpage
- Or selected text
- Page metadata (title, URL)

### Processing
1. **Content Cleaning** (Claude)
   - Remove noise, ads, styles
   - Improve structure
   - Convert to markdown

2. **Quality Validation** (Claude)
   - Score 1-10
   - If < 5: Save as-is
   - If ≥ 5: Generate study plan

3. **Metadata Extraction** (Claude)
   - 5 main topics
   - Improved title
   - Key concepts

### Output
- Clean markdown file
- 7-day study plan (if quality ≥ 5)
- Metadata with quality score
- Topics list

---

## ⚡ Performance

| Operation | Time |
|-----------|------|
| Content extraction | ~2s |
| Content cleaning | ~15-20s |
| Quality validation | ~5-10s |
| Topic extraction | ~5-10s |
| Title improvement | ~5-10s |
| Study plan generation | ~15-25s |
| **Total** | **~48-79s** |

---

## 🎨 Markdown Viewer Features

### Display
✓ Beautiful typography
✓ Proper heading hierarchy
✓ Code syntax highlighting
✓ Tables with borders
✓ Blockquotes styling
✓ List formatting
✓ Links and images

### Metadata
✓ Word count
✓ Reading time
✓ Main topics
✓ Document title

### Actions
✓ Copy to clipboard (📋 button)
✓ Download as .md (💾 button)
✓ Close window (✕ button)

---

## 🔍 Quality Scoring

```
1-3: Too short or mostly noise
     └─ Save with original title, no study plan

4-6: Some useful content but needs work
     └─ Save with improved title, no study plan

7-8: Good quality educational content
     └─ Save and generate study plan

9-10: Excellent, well-structured content
      └─ Save and generate detailed study plan
```

---

## 📝 Document Structure

### Saved File Format
```
projects/fb40ec51.../sources/25c4c0e9.../25c4c0e9.md
```

### File Contents
```yaml
---
id: 25c4c0e9-06da-488e-9554-8c04282afd8f
title: Machine Learning 101: Fundamentals
source-url: https://example.com/article
captured: 2024-12-31T12:00:00Z
modified: 2024-12-31T12:00:00Z
tags: technology, ai, learning
---

# Machine Learning 101: Fundamentals

Content here in clean markdown format...

## Section 1
Properly formatted content...

## Section 2
More structured content...
```

---

## 🛠️ Configuration Options

### .env File
```bash
# Required
CLAUDE_API_KEY=sk-ant-xxxxxxxxxxxxx
CLAUDE_MODEL=claude-opus-4-5

# Optional
DATA_DIR=/path/to/projects
LOG_LEVEL=info
DEBUG=false
NODE_ENV=development
```

### Customizable Settings

**In content-cleaner.js:**
- Quality threshold (default: 5)
- Number of topics (default: 5)

**In document-processor.js:**
- Study plan duration (default: 7 days)
- Max tokens for study plan

**In extension/content.js:**
- Elements to remove (selectors)
- Markdown conversion rules

**In markdown-viewer.html:**
- Colors and styling
- Font sizes
- Spacing and layouts

---

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "No projects found" | Create a project in Electron app first |
| Red connection indicator | Start Electron app, wait for HTTP Bridge message |
| Content quality too low | Source may not have enough content |
| Study plan not generating | Quality score must be ≥ 5 |
| Markdown viewer won't open | Check browser console for errors |
| API key errors | Check .env file, ensure no extra spaces |
| Duplicate warning | Same URL found, click "Override & Save" |

---

## 📱 Browser Support

### Chrome Extension
- ✅ Chrome 88+
- ✅ Chromium-based browsers
- ❌ Firefox (requires different format)
- ❌ Safari (requires different format)

### Markdown Viewer
- ✅ Electron browser window
- ✅ All modern browsers
- ✅ Mobile responsive

---

## 🎓 Learning Tips

### Best Content to Capture
- Technical tutorials
- Blog articles
- Course materials
- Research summaries
- Documentation
- Educational articles

### Getting Best Results
1. Choose long-form content (500+ words)
2. Capture well-written sources
3. Let AI clean and organize
4. Follow generated study plans
5. Take notes while studying

### Study Plan Usage
1. Read overview (Day 1)
2. Deep dive into topics (Days 2-5)
3. Practice exercises (Days 3-6)
4. Review and consolidate (Day 7)
5. Take assessment tests

---

## 🔗 Useful Links

| Resource | Link |
|----------|------|
| Anthropic Docs | https://docs.anthropic.com/ |
| API Console | https://console.anthropic.com/ |
| Pricing | https://www.anthropic.com/pricing |
| Status | https://status.anthropic.com/ |

---

## 📊 Key Metrics to Track

### Per Document
- Quality score
- Word count
- Reading time
- Topics extracted
- Study plan created (Y/N)

### Per Project
- Total documents
- Average quality score
- Total study plans
- Total study time

### Overall
- Documents captured
- Content cleaned
- Study plans generated
- Topics learned

---

## ✅ Checklist Before You Start

- [ ] CLAUDE_API_KEY set in .env
- [ ] Electron app running (`npm run electron:dev`)
- [ ] HTTP Bridge initialized (check console)
- [ ] Chrome extension loaded
- [ ] At least one project created
- [ ] Can see green connection indicator

---

## 🎯 Next Steps

1. **First Capture:** Find an interesting article and capture it
2. **Review Results:** Open the document in markdown viewer
3. **Check Quality:** Note the quality score and topics
4. **Follow Plan:** Open the study plan and start learning
5. **Repeat:** Build your library of learning materials

---

## 💡 Pro Tips

1. **Batch Capture:** Capture multiple articles in one session
2. **Project Organization:** Group documents by topic/subject
3. **Quality Improvement:** Choose longer, well-written sources
4. **Study Planning:** Follow the auto-generated plans closely
5. **Note Taking:** Take notes while using markdown viewer
6. **Export:** Download study plans and use offline
7. **Sharing:** Share cleaned documents with others

---

## 🚀 You're Ready!

Everything is set up and ready to use. Start capturing web content and building your intelligent learning materials library!

**Questions?** Check WORKFLOW_GUIDE.md for detailed information.
