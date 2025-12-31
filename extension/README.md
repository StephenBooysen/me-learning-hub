# Me Learning Hub - Chrome Extension

A Chrome extension that captures web content and saves it to your Me Learning Hub projects as markdown files with automatic study plan generation.

## Features

- **Web Content Capture**: Capture entire webpages or just selected text
- **Project Integration**: Save captured content directly to your Me Learning Hub projects
- **Markdown Conversion**: Automatically converts HTML to clean markdown format
- **Duplicate Detection**: Prevents saving duplicate content from the same source URL
- **Metadata Extraction**: Captures page title, URL, word count, and estimated reading time
- **Auto Study Plans**: Optionally generate study plans for captured content using AI
- **Connection Status**: Visual indicator showing whether the Electron app is running

## Installation

### Prerequisites

- Me Learning Hub desktop application running on your computer
- Google Chrome or Chromium-based browser

### Setup Steps

1. **Ensure Electron App is Running**
   - Start the Me Learning Hub desktop application before using the extension

2. **Load Extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in the top right)
   - Click "Load unpacked"
   - Select the `extension` folder from the Me Learning Hub project
   - The extension should now appear in your Chrome extensions

3. **Verify Connection**
   - Click the extension icon in the Chrome toolbar
   - You should see a green indicator (●) showing the connection is active
   - If red (●), ensure the Me Learning Hub application is running

## Usage

### Basic Workflow

1. **Open a Webpage** you want to capture
2. **Click the Extension Icon** in the Chrome toolbar
3. **Select a Project** from the dropdown menu
4. **Choose Capture Mode**:
   - **Full Page**: Captures all content from the webpage
   - **Selected Text**: Captures only the text you've selected on the page
5. **Review Metadata**: The extension shows word count and estimated reading time
6. **Optional Settings**:
   - Check "Auto-generate Study Plan" to have AI create a study plan for the content
7. **Click "Capture & Save"** button

### Handling Duplicates

If content from the same URL already exists in the project:
- A warning dialog will appear
- Click "Override & Save" to replace the existing document
- Click "Cancel" to abort

### Capture Modes Explained

**Full Page Mode**:
- Captures the entire webpage content
- Removes navigation menus, ads, and other non-content elements
- Best for comprehensive content archiving

**Selected Text Mode**:
- Only captures text you've highlighted on the page
- Useful for capturing specific sections or quotes
- Requires you to select text before capturing

## How It Works

### Architecture

```
Chrome Extension
    ↓
    ├─ popup.js: UI interaction and user input
    ├─ content.js: Web page content extraction
    └─ background.js: Communicates with Electron app
         ↓
    HTTP Bridge (Electron)
         ↓
    Me Learning Hub Application
         ↓
    File Manager (Saves documents & metadata)
```

### Communication Flow

1. **Content Capture**: Content script extracts webpage HTML and metadata
2. **HTTP Communication**: Extension sends content to Electron app via HTTP bridge
3. **Duplicate Detection**: Server checks for existing documents from same URL
4. **Storage**: Document is saved with metadata and frontmatter
5. **Optional**: Study plan generated using AI if requested

## File Structure

```
extension/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup UI
├── popup.css             # Popup styling
├── popup.js              # Popup logic
├── content.js            # Web page content extraction
├── background.js         # Background service worker
└── README.md             # This file
```

## Metadata Captured

The extension captures and stores the following metadata for each document:

- **Title**: Page title
- **URL**: Source webpage URL
- **Domain**: Page domain
- **Word Count**: Number of words in captured content
- **Reading Time**: Estimated reading time in minutes
- **Capture Type**: Full page or selected text
- **Timestamp**: When the content was captured

## Troubleshooting

### "Electron app is not running" Error

**Problem**: The extension can't connect to the Electron app

**Solution**:
1. Open Me Learning Hub desktop application
2. Wait a few seconds for the HTTP bridge to initialize
3. Retry the capture operation
4. Check that no other application is using port 47823

### "No projects found"

**Problem**: The project dropdown shows an error message

**Solution**:
1. Ensure at least one project is created in Me Learning Hub
2. Go back to the Me Learning Hub window and create a new project
3. Refresh the extension popup and try again

### Red Connection Indicator (●)

**Problem**: The extension shows a red dot

**Solution**:
1. Start/restart the Me Learning Hub application
2. Wait for the HTTP bridge to initialize (look for console message)
3. Click the extension icon again to refresh

### Selected Text Not Capturing

**Problem**: You selected text but it's not capturing

**Solution**:
1. Make sure you select "Selected Text" radio button
2. Highlight the text on the page (make sure it's visible)
3. Open the extension popup and try capturing again
4. If text is in an iframe, the extension may not be able to access it

### Document Saves but Study Plan Doesn't Generate

**Problem**: Document is saved but no study plan was created

**Solution**:
1. Ensure AI configuration is set up in Me Learning Hub
2. Check that your AI API key is valid and has sufficient credits
3. Try manually generating the study plan from the Me Learning Hub app
4. Check the browser console for error messages

## Configuration

### Electron HTTP Bridge

The extension communicates with the Electron app through a local HTTP bridge:

- **URL**: `http://localhost:47823`
- **Endpoints**:
  - `GET /api/health` - Connection health check
  - `GET /api/projects` - List all projects
  - `POST /api/documents` - Save a new document

### Timeout Settings

- **Health Check**: 5 seconds
- **API Requests**: 10 seconds

## Privacy & Security

- All communication happens **locally** on your computer
- The extension only connects to the HTTP bridge on localhost
- No data is sent to external servers for the capture itself
- Only the AI study plan generation (if enabled) uses external APIs
- Content is stored locally in your Me Learning Hub data directory

## Browser Support

- **Chrome/Chromium**: Full support
- **Edge**: Full support
- **Firefox**: Not currently supported (requires different extension format)
- **Safari**: Not currently supported

## Development

### File-by-File Overview

**manifest.json**
- Defines extension permissions and configuration
- Specifies which scripts run and where

**popup.html & popup.css**
- User interface for the extension popup
- Responsive design with visual feedback

**popup.js**
- Handles user interactions (button clicks, selections)
- Manages loading states and error messages
- Communicates with background script

**content.js**
- Runs in the context of web pages
- Extracts page content and metadata
- Converts HTML to markdown
- Listens for capture requests

**background.js**
- Service worker that runs in the background
- Communicates with the Electron HTTP bridge
- Handles project fetching and document saving
- Manages duplicate detection

## License

ISC - See main project repository for details

## Support

For issues or feature requests, please refer to the main Me Learning Hub project repository.
