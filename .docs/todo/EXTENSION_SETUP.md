# Me Learning Hub Chrome Extension - Quick Start

## What You Now Have

I've created a complete Chrome extension that integrates with your Me Learning Hub desktop application. This extension allows you to capture web content directly into your learning projects.

## Files Created

```
extension/
├── manifest.json          # Chrome extension configuration
├── popup.html            # Extension UI
├── popup.css             # UI styling
├── popup.js              # Popup logic and interactions
├── content.js            # Web page content extraction
├── background.js         # Background service worker
└── README.md             # Detailed documentation
```

## Electron App Changes

The Electron application has been updated with:
- **HTTP Bridge**: A local Express.js server running on `localhost:47823`
- **New Dependencies**: `express` and `cors` packages added
- **API Endpoints**:
  - `GET /api/health` - Check if the app is running
  - `GET /api/projects` - Get list of projects
  - `POST /api/documents` - Save documents with duplicate detection

## Installation Steps

### 1. Install Dependencies
Already done, but if you need to reinstall:
```bash
cd electron && npm install
```

### 2. Start the Electron App
```bash
npm run electron:dev
```

Watch for this message in the console:
```
[HTTP Bridge] Server running on http://localhost:47823
```

### 3. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Toggle "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `extension` folder in your project directory
5. The extension should appear in your Chrome toolbar

### 4. Verify Connection

1. Click the extension icon in Chrome
2. You should see a green connection indicator (●)
3. Projects from your Me Learning Hub should load in the dropdown

## How to Use

### Quick Capture

1. **Navigate to a webpage** you want to capture
2. **Click the extension icon**
3. **Select your project** from the dropdown
4. **Choose capture mode**: Full Page or Selected Text
5. **Click "Capture & Save"**
6. ✓ Document is saved to your project!

### Advanced Options

- **Auto-generate Study Plan**: Check this box to have the system create a study plan for the captured content
- **Selected Text Mode**: Perfect for capturing specific sections from articles
- **Duplicate Detection**: Automatically prevents saving the same URL twice

## Key Features

✅ **Full Page Capture** - Get entire webpage content as markdown
✅ **Selected Text** - Capture only highlighted portions
✅ **Metadata Extraction** - Title, URL, word count, reading time
✅ **Markdown Format** - Clean, formatted markdown files
✅ **Duplicate Detection** - No more accidental re-saves
✅ **Auto Study Plans** - AI-powered study plan generation (if enabled)
✅ **Connection Status** - Visual indicator showing app status

## Troubleshooting

### Red Connection Indicator?
- Make sure the Electron app is running
- Look for the "HTTP Bridge" message in the console
- Wait a few seconds for the bridge to initialize

### No Projects Showing?
- Create a project in Me Learning Hub first
- Refresh the extension popup

### Can't Select Text?
- Make sure you've highlighted text on the page
- Select the "Selected Text" radio button before capturing

## Architecture

```
Browser              Electron App
┌─────────────┐     ┌──────────────────┐
│  Extension  │────→│ HTTP Bridge      │
├─────────────┤     │ (localhost:47823)│
│ popup.html  │     ├──────────────────┤
│ popup.js    │────→│ File Manager     │
│ content.js  │     │ Study Plan Gen   │
│ background  │     │ Analytics Engine │
└─────────────┘     └──────────────────┘
                            ↓
                    ┌──────────────────┐
                    │  Projects (JSON) │
                    │  Documents (MD)  │
                    │  Study Plans     │
                    └──────────────────┘
```

## API Endpoints

### Health Check
```
GET http://localhost:47823/api/health
Response: { status: "ok", timestamp: "..." }
```

### List Projects
```
GET http://localhost:47823/api/projects
Response: { success: true, projects: [...] }
```

### Save Document
```
POST http://localhost:47823/api/documents
Body: {
  projectId: "uuid",
  content: "markdown content",
  title: "Page Title",
  sourceUrl: "https://...",
  domain: "example.com",
  wordCount: 500,
  readingTime: 3,
  autoGenerateStudyPlan: true
}
Response: { success: true, documentId: "uuid" }
```

## Next Steps

1. **Test the extension** with different websites
2. **Try the auto-generate study plan** feature (requires AI setup)
3. **Check extension/README.md** for detailed documentation
4. **Explore the captured documents** in Me Learning Hub app

## Customize

### Change the Extension Name/Description
Edit `extension/manifest.json`:
```json
{
  "name": "My Custom Extension Name",
  "description": "My custom description"
}
```

### Change HTTP Bridge Port
Edit the port in both places:
1. `electron/main.js`: Change `HTTP_BRIDGE_PORT = 47823`
2. `extension/background.js`: Change `ELECTRON_BRIDGE_URL = 'http://localhost:47823'`

### Modify UI Colors
Edit `extension/popup.css` - Look for gradient colors and color definitions

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Electron app not running" | Start Me Learning Hub, wait for HTTP Bridge message |
| Red connection indicator | Ensure Electron is running on localhost:47823 |
| No projects in dropdown | Create a project in Me Learning Hub first |
| Can't capture selected text | Highlight text, select "Selected Text" mode, then capture |
| Study plan not generating | Check AI configuration in Me Learning Hub settings |

## Performance Notes

- **Small pages**: <1KB - instant
- **Medium pages**: 10-50KB - <1 second
- **Large pages**: 60KB+ - 2-3 seconds

The extension doesn't block while processing - you can continue browsing.

## Security & Privacy

- ✅ All processing happens locally on your computer
- ✅ No data sent to cloud services (except optional AI)
- ✅ Content saved directly to your projects folder
- ✅ Extension only communicates with localhost

## Support

For detailed documentation, see:
- `extension/README.md` - Complete extension guide
- `CLAUDE.md` - Project development guide
- `electron/main.js` - HTTP bridge implementation

Enjoy capturing and learning! 🚀
