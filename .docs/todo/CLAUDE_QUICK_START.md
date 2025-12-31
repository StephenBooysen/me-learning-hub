# Claude Integration - Quick Start Guide

## ⚠️ IMPORTANT SECURITY WARNING

**You exposed your API key in the chat!**

1. **IMMEDIATELY GO TO**: https://console.anthropic.com/
2. **REVOKE** the exposed API key (`sk-ant-api03-LUb-6yg6g29eEEFl_...`)
3. **CREATE A NEW API KEY**
4. **UPDATE YOUR .env FILE** with the new key
5. **NEVER share API keys in conversations again**

---

## What's Been Created

### 🔧 Core Modules

| File | Purpose |
|------|---------|
| `electron/app/js/claude-client.js` | Low-level Claude API client |
| `electron/app/js/document-processor.js` | High-level document processing interface |
| `test/claude-client.test.js` | Comprehensive unit tests |
| `test-claude-api.js` | Quick API key validation tool |

### 📚 Documentation

| File | Purpose |
|------|---------|
| `CLAUDE_INTEGRATION.md` | Complete integration guide |
| `CLAUDE_QUICK_START.md` | This file |

---

## 5-Minute Setup

### Step 1: Get a New API Key

1. Go to https://console.anthropic.com/
2. Click "API Keys" or "Keys"
3. Click "Create Key"
4. Copy the new key (starts with `sk-ant-`)

### Step 2: Update .env File

Edit `.env` and update:

```env
CLAUDE_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLAUDE_MODEL=claude-opus-4-5
```

### Step 3: Test Your Setup

```bash
# Quick test (1 minute)
node test-claude-api.js

# Full test suite (5 minutes)
npm test -- claude-client.test.js
```

Expected output:
```
✅ SUCCESS! API connection is working!
```

---

## Available Features

### Document Processing

```javascript
// Generate summary, key points, objectives, questions, and practice problems
const processor = new DocumentProcessor(process.env.CLAUDE_API_KEY);
const result = await processor.processDocument('Topic', content, {
  generateSummary: true,
  extractKeyPoints: true,
  generateObjectives: true,
  generateQuestions: true,
  generatePracticeProblems: true
});
```

### Individual Features

```javascript
const client = new ClaudeClient(process.env.CLAUDE_API_KEY);

// 1. Summarization
await client.summarizeContent(text);

// 2. Key Points
await client.extractKeyPoints(text, 5);

// 3. Learning Objectives
await client.generateLearningObjectives(text);

// 4. Study Questions
await client.generateStudyQuestions(text, 5);

// 5. Study Plans
await client.generateStudyPlanOutline('Title', text, 7);

// 6. Evaluation
await client.evaluateExplanation(originalText, studentText);

// 7. Practice Problems
await client.generatePracticeProblems(text, 3);
```

---

## Integration with Your App

### Option 1: Simple IPC Handler

Add to `electron/main.js`:

```javascript
const DocumentProcessor = require('./app/js/document-processor');

let docProcessor;

app.on('ready', () => {
  docProcessor = new DocumentProcessor(process.env.CLAUDE_API_KEY);
});

ipcMain.handle('process:document', async (event, title, content) => {
  return await docProcessor.processDocument(title, content);
});
```

### Option 2: Extend Chrome Extension

The extension can now trigger document processing:

```javascript
// In extension/background.js
chrome.runtime.sendMessage({
  action: 'processDocument',
  title: document.title,
  content: extractedContent
});
```

---

## Troubleshooting

### Test Not Running?

```bash
# Check if API key is set
echo $CLAUDE_API_KEY

# Check .env file directly
cat .env | grep CLAUDE
```

### API Error (401)?

Your API key is invalid:
1. Go to https://console.anthropic.com/
2. Create a new key
3. Update `.env`
4. Test again

### API Error (429)?

Rate limit hit - wait a few minutes and retry

### "Cannot read properties of undefined"?

Ensure `.env` has the correct key format:
- Should start with `sk-ant-`
- No spaces around the equals sign
- No quotes around the key

---

## Key Files Explained

### claude-client.js

Low-level API wrapper. Use this for:
- Direct API control
- Single operations
- Custom configurations

```javascript
const client = new ClaudeClient(apiKey);
const result = await client.summarizeContent(text);
```

### document-processor.js

High-level interface. Use this for:
- Complete document processing
- Multiple operations at once
- Study material generation

```javascript
const processor = new DocumentProcessor(apiKey);
const result = await processor.processDocument('Title', text);
```

### test-claude-api.js

Quick validation tool:
```bash
node test-claude-api.js
```

### claude-client.test.js

Full test suite:
```bash
npm test -- claude-client.test.js
```

Tests:
- API connection
- Summarization
- Key point extraction
- Learning objectives
- Study questions
- Study plans
- Explanation evaluation
- Practice problems

---

## Cost Estimation

### Example Usage

| Operation | Input Tokens | Output Tokens | Cost |
|-----------|--------------|---------------|------|
| Summarize 500-word article | ~750 | ~150 | ~$0.003 |
| Extract 5 key points | ~750 | ~200 | ~$0.004 |
| Generate study plan | ~1500 | ~500 | ~$0.009 |
| Full document processing | ~3000 | ~1500 | ~$0.024 |

**Current API Pricing**: ~$3 per 1M input tokens, ~$15 per 1M output tokens

Monitor usage: https://console.anthropic.com/usage

---

## Next Steps

1. ✅ Update your API key in `.env`
2. ✅ Run `node test-claude-api.js`
3. ✅ Run `npm test -- claude-client.test.js`
4. ✅ Review `CLAUDE_INTEGRATION.md` for detailed docs
5. ✅ Integrate into your Electron app (IPC handlers)
6. ✅ Test with real documents

---

## Quick Commands Reference

```bash
# Test API key validity
node test-claude-api.js

# Run all Claude tests
npm test -- claude-client.test.js

# Run only connection test
npm test -- claude-client.test.js -t "API Connection"

# Run only summarization test
npm test -- claude-client.test.js -t "Summarization"

# View .env configuration
grep CLAUDE .env

# Check if API key is set
test -n "$CLAUDE_API_KEY" && echo "Set" || echo "Not set"
```

---

## Support Resources

- **API Documentation**: https://docs.anthropic.com/
- **Console/Keys**: https://console.anthropic.com/
- **Pricing Info**: https://www.anthropic.com/pricing
- **Status Page**: https://status.anthropic.com/

---

## File Locations

```
📦 me-learning-hub/
├── electron/app/js/
│   ├── claude-client.js          ← Core API client
│   └── document-processor.js      ← High-level interface
├── test/
│   └── claude-client.test.js      ← Full test suite
├── test-claude-api.js             ← Quick validation
├── .env                           ← Your API key (SECRET!)
├── CLAUDE_INTEGRATION.md          ← Detailed guide
└── CLAUDE_QUICK_START.md          ← This file
```

---

## Summary

✅ **Created**: 2 core modules + comprehensive tests
✅ **Setup**: Add your API key to `.env`
✅ **Test**: Run `node test-claude-api.js`
✅ **Integrate**: Add IPC handlers or extension integration
✅ **Use**: Start processing documents with Claude!

For more details, see `CLAUDE_INTEGRATION.md`
