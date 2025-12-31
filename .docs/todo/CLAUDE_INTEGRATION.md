# Claude API Integration Guide

Complete guide for using Anthropic's Claude API for document processing in Me Learning Hub.

## Table of Contents

- [Quick Start](#quick-start)
- [Setup Instructions](#setup-instructions)
- [API Features](#api-features)
- [Usage Examples](#usage-examples)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Quick Start

### 1. Get Your API Key

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. **Copy the key immediately** (you won't see it again!)

### 2. Configure Your .env File

Edit `.env` in your project root:

```bash
# Anthropic Claude configuration
CLAUDE_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxx
CLAUDE_MODEL=claude-opus-4-5
```

### 3. Test Your Setup

```bash
# Run the quick API test
node test-claude-api.js

# Run the full test suite
npm test -- claude-client.test.js
```

## Setup Instructions

### Detailed Configuration

1. **Locate your .env file**:
   ```
   /home/stephen/Code/stephenbooysen/me-learning-hub/.env
   ```

2. **Add your API key**:
   ```env
   CLAUDE_API_KEY=sk-ant-api03-xxxxx...xxxxx
   CLAUDE_MODEL=claude-opus-4-5
   ```

3. **Verify the setup**:
   ```bash
   node test-claude-api.js
   ```

### API Key Security

**IMPORTANT: Keep your API key secret!**

- Never commit `.env` to version control
- Never share your API key in messages or public channels
- If you accidentally expose your key:
  1. Go to [Anthropic Console](https://console.anthropic.com/)
  2. Revoke the exposed key immediately
  3. Create a new API key
  4. Update your `.env` file

## API Features

### Available Methods in ClaudeClient

#### Connection Testing
```javascript
async testConnection()
```
Tests if the API key is valid and the connection works.

#### Text Summarization
```javascript
async summarizeContent(content, maxLength = 300)
```
Generates a concise summary of the provided content.

**Parameters:**
- `content` (string): The text to summarize
- `maxLength` (number): Maximum length of summary in characters

**Returns:**
```javascript
{
  success: true,
  summary: "...",
  usage: { input_tokens: 123, output_tokens: 45 }
}
```

#### Key Points Extraction
```javascript
async extractKeyPoints(content, numPoints = 5)
```
Extracts the most important points from content.

**Parameters:**
- `content` (string): The text to analyze
- `numPoints` (number): How many points to extract

#### Learning Objectives Generation
```javascript
async generateLearningObjectives(content)
```
Generates measurable learning objectives based on content.

#### Study Questions Generation
```javascript
async generateStudyQuestions(content, numQuestions = 5)
```
Creates progressively challenging study questions.

#### Study Plan Generation
```javascript
async generateStudyPlanOutline(title, content, duration = 7)
```
Creates a detailed day-by-day study plan.

#### Explanation Evaluation
```javascript
async evaluateExplanation(originalContent, studentExplanation)
```
Evaluates how well a student understood the material.

#### Practice Problems Generation
```javascript
async generatePracticeProblems(content, numProblems = 3)
```
Generates practice problems based on the content.

## Usage Examples

### Basic Usage with ClaudeClient

```javascript
const ClaudeClient = require('./electron/app/js/claude-client');

const client = new ClaudeClient(process.env.CLAUDE_API_KEY);

// Test connection
const testResult = await client.testConnection();
console.log('Connected:', testResult.success);

// Summarize content
const summary = await client.summarizeContent(
  'Your long text content here...'
);
console.log('Summary:', summary.summary);

// Extract key points
const keyPoints = await client.extractKeyPoints(
  'Your content here...',
  5 // Get 5 key points
);
console.log('Key Points:', keyPoints.keyPoints);
```

### Using DocumentProcessor

The `DocumentProcessor` is a higher-level interface that handles multiple operations:

```javascript
const DocumentProcessor = require('./electron/app/js/document-processor');

const processor = new DocumentProcessor(process.env.CLAUDE_API_KEY);

// Full document processing
const result = await processor.processDocument(
  'Python Basics',
  'Your course content here...',
  {
    generateSummary: true,
    extractKeyPoints: true,
    generateObjectives: true,
    generateQuestions: true,
    generatePracticeProblems: true,
    numKeyPoints: 5,
    numQuestions: 5,
    numProblems: 3
  }
);

console.log('Summary:', result.processing.summary.summary);
console.log('Key Points:', result.processing.keyPoints.keyPoints);
console.log('Objectives:', result.processing.objectives.objectives);
console.log('Questions:', result.processing.questions.questions);
console.log('Problems:', result.processing.problems.problems);
```

### Integration with Electron IPC

Add this to `electron/main.js`:

```javascript
const DocumentProcessor = require('./app/js/document-processor');

let documentProcessor;

app.on('ready', () => {
  // ... existing code ...

  documentProcessor = new DocumentProcessor(
    process.env.CLAUDE_API_KEY,
    process.env.CLAUDE_MODEL
  );
});

// IPC Handler
ipcMain.handle('claude:process-document', async (event, title, content, options) => {
  try {
    return await documentProcessor.processDocument(title, content, options);
  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
});

ipcMain.handle('claude:generate-study-plan', async (event, title, content) => {
  try {
    return await documentProcessor.generateStudyPlan(title, content);
  } catch (error) {
    console.error('Error generating study plan:', error);
    throw error;
  }
});
```

### Calling from Renderer Process

```javascript
// In renderer process (browser window)
const { ipcRenderer } = require('electron');

async function processDocument() {
  try {
    const result = await ipcRenderer.invoke('claude:process-document',
      'Document Title',
      'Document content here...',
      {
        generateSummary: true,
        generateObjectives: true
      }
    );

    console.log('Processing complete:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## Testing

### Run the API Key Tester

Quick validation of your setup:

```bash
node test-claude-api.js
```

Expected output:
```
✅ SUCCESS! API connection is working!
   Model: claude-opus-4-5
   Response: "Hi! I'm Claude, an AI assistant..."
```

### Run Full Test Suite

Comprehensive tests with various content types:

```bash
npm test -- claude-client.test.js
```

What's tested:
- ✅ API connection
- ✅ Summarization
- ✅ Key points extraction
- ✅ Learning objectives
- ✅ Study questions
- ✅ Study plans
- ✅ Explanation evaluation
- ✅ Practice problems

### Test Configuration

Tests require:
1. Valid `CLAUDE_API_KEY` in `.env`
2. Network access to `api.anthropic.com`
3. Sufficient API quota

Tests will skip if no valid API key is configured.

## Troubleshooting

### "CLAUDE_API_KEY not configured"

**Problem**: Tests won't run
**Solution**:
1. Check your `.env` file has the API key set
2. Ensure it's not `your_new_claude_api_key_here` (placeholder)
3. Verify the key format starts with `sk-ant-`

### "API Error (401)"

**Problem**: Unauthorized access
**Cause**:
- Invalid or expired API key
- Corrupted API key (extra spaces, etc.)

**Solution**:
1. Check API key in `.env` (no extra spaces)
2. Regenerate the key in [Anthropic Console](https://console.anthropic.com/)
3. Update `.env` with new key
4. Restart your application

### "API Error (429)"

**Problem**: Rate limit exceeded
**Cause**: Too many requests in short time
**Solution**:
- Wait a few minutes before retrying
- Implement request throttling for production

### "Failed to parse API response"

**Problem**: Network or response format issue
**Solution**:
1. Check network connectivity
2. Verify API endpoint is accessible
3. Check request payload format

### API Key Exposed

**If you accidentally exposed your API key:**

1. **Immediately revoke it**:
   - Go to [Anthropic Console](https://console.anthropic.com/)
   - Find the key in API Keys section
   - Click "Delete" or "Revoke"

2. **Create a new key**:
   - Generate a new API key
   - Update `.env` file
   - Restart your application

3. **Prevent future exposure**:
   - Never commit `.env` to git
   - Use `.gitignore` (already configured)
   - Don't share keys in chat/email

## API Limits and Pricing

### Rate Limits
- Check current limits in [Anthropic Console](https://console.anthropic.com/)
- Typical limits: requests per minute vary by plan

### Pricing
- Based on tokens used (input and output)
- Check [Anthropic Pricing](https://www.anthropic.com/pricing)
- Monitor usage in console

### Token Usage
Each operation returns token counts:

```javascript
const result = await client.summarizeContent(content);
console.log('Tokens used:', result.usage);
// { input_tokens: 150, output_tokens: 45 }
```

## Advanced Configuration

### Using Different Models

```javascript
// Use a different Claude model
const client = new ClaudeClient(
  process.env.CLAUDE_API_KEY,
  'claude-3-sonnet-20240229' // Different model
);
```

Available models:
- `claude-opus-4-5` (most capable)
- `claude-3-sonnet-20240229` (faster, cheaper)
- Check latest at [Anthropic Console](https://console.anthropic.com/)

### Custom API Configuration

Modify request parameters in `claude-client.js`:

```javascript
const maxTokens = 2000; // Adjust max output length
const temperature = 0.7; // Adjust creativity (0-1)
```

## Production Recommendations

1. **Environment Variables**:
   - Use `.env` file for development
   - Use environment secrets in production
   - Never hardcode API keys

2. **Error Handling**:
   - Wrap all API calls in try-catch
   - Implement retry logic for network errors
   - Log errors for debugging

3. **Caching**:
   - Cache common summaries and questions
   - Reduce API calls and costs
   - Improve user experience

4. **Monitoring**:
   - Track API usage and costs
   - Monitor response times
   - Alert on API errors

5. **Rate Limiting**:
   - Implement request queuing
   - Add delays between requests
   - Handle rate limit (429) errors gracefully

## Example: Complete Integration

See `test/claude-client.test.js` for complete examples of:
- Error handling
- Multiple operation chaining
- Response parsing
- Token usage tracking

## Support

For issues or questions:
1. Check this documentation
2. Review test files for examples
3. Check [Anthropic Documentation](https://docs.anthropic.com/)
4. Review console logs for error messages

## Security Checklist

- [ ] API key stored only in `.env`
- [ ] `.env` added to `.gitignore`
- [ ] No API keys in source code
- [ ] `.env` file not committed to git
- [ ] API key rotated if exposed
- [ ] Error messages don't leak sensitive data
- [ ] HTTPS used for all API calls (automatic)
