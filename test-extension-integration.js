/**
 * Extension Integration Test
 * Simulates what the Chrome extension background.js would do
 */

const http = require('http');

const BRIDGE_URL = 'http://localhost:47823';
const TEST_TIMEOUT = 10000;

/**
 * Make HTTP request - mimics extension's sendElectronMessage function
 */
async function sendElectronMessage(message) {
  const TIMEOUT = 5000;

  try {
    // First check if Electron app is running
    const healthCheck = await makeRequest('GET', '/api/health');
    if (!healthCheck.ok) {
      throw new Error('Electron app health check failed');
    }

    // Map native messaging format to HTTP API format
    let endpoint, payload;

    if (message.action === 'document:save') {
      endpoint = '/api/import-document';
      payload = {
        projectId: message.projectId,
        docId: message.docId,
        content: message.content,
        metadata: message.metadata || {},
        autoGeneratePlan: message.autoGeneratePlan || false
      };
    } else if (message.action === 'project:list') {
      endpoint = '/api/projects';
      payload = {};
    } else {
      throw new Error(`Unknown action: ${message.action}`);
    }

    // Send HTTP request to Electron bridge
    const response = await makeRequest('POST', endpoint, payload);

    if (!response.ok) {
      const errorData = response.body;
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = response.body;

    if (data.duplicate) {
      return {
        success: false,
        duplicate: true,
        existingDoc: data.existingDoc,
        message: 'Document already imported from this URL'
      };
    }

    return { success: true, data: data.data || data };
  } catch (error) {
    console.error('Electron communication error:', error.message);
    throw new Error(`Failed to communicate with Me Learning Hub app: ${error.message}`);
  }
}

/**
 * Make HTTP request
 */
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BRIDGE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: TEST_TIMEOUT
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const response = body ? JSON.parse(body) : {};
          resolve({
            ok: res.statusCode === 200,
            status: res.statusCode,
            headers: res.headers,
            body: response
          });
        } catch (e) {
          resolve({
            ok: res.statusCode === 200,
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

/**
 * Run integration tests
 */
async function runTests() {
  console.log('🔌 Extension Integration Tests');
  console.log('================================\n');

  let passCount = 0;
  let failCount = 0;
  const timestamp = Date.now();

  // Test 1: Extension saves document with auto-generate plan
  console.log('Test 1: Save Document with Auto-Generate Study Plan');
  try {
    const result = await sendElectronMessage({
      action: 'document:save',
      projectId: 'test-project-001',
      docId: `integration-test-${timestamp}-1`,
      content: '# Web Article\n\nThis is a **test article** from the web.\n\n## Introduction\nSome intro text.\n\n## Main Content\nMain content here.',
      metadata: {
        title: 'Integration Test Article',
        sourceUrl: `https://example.com/integration-test-${timestamp}-1`,
        tags: ['integration', 'test'],
        captured: new Date().toISOString()
      },
      autoGeneratePlan: true
    });

    if (result.success) {
      console.log('✓ PASS: Document saved with study plan');
      console.log(`  Document ID: ${result.data.id}`);
      console.log(`  Study Plan: ${result.data.studyPlan?.title}`);
      console.log(`  Plan items: ${result.data.studyPlan?.itemCount}\n`);
      passCount++;
    } else {
      console.log(`✗ FAIL: ${result.message || 'Unknown error'}\n`);
      failCount++;
    }
  } catch (error) {
    console.log(`✗ FAIL: ${error.message}\n`);
    failCount++;
  }

  // Test 2: Extension saves document without auto-generate
  console.log('Test 2: Save Document without Auto-Generate Study Plan');
  try {
    const result = await sendElectronMessage({
      action: 'document:save',
      projectId: 'test-project-001',
      docId: `integration-test-${timestamp}-2`,
      content: '# Quick Note\n\nJust a quick reference.',
      metadata: {
        title: 'Quick Reference',
        sourceUrl: `https://example.com/integration-test-${timestamp}-2`,
        tags: ['reference'],
        captured: new Date().toISOString()
      },
      autoGeneratePlan: false
    });

    if (result.success) {
      console.log('✓ PASS: Document saved without study plan');
      console.log(`  Document ID: ${result.data.id}`);
      console.log(`  Study Plan: ${result.data.studyPlan ? 'Generated' : 'Not generated'}\n`);
      passCount++;
    } else {
      console.log(`✗ FAIL: ${result.message || 'Unknown error'}\n`);
      failCount++;
    }
  } catch (error) {
    console.log(`✗ FAIL: ${error.message}\n`);
    failCount++;
  }

  // Test 3: Extension detects duplicate
  console.log('Test 3: Duplicate Detection - Extension Flow');
  try {
    // First save
    await sendElectronMessage({
      action: 'document:save',
      projectId: 'test-project-001',
      docId: `integration-test-${timestamp}-3a`,
      content: 'Original content',
      metadata: {
        title: 'Original',
        sourceUrl: `https://example.com/integration-test-${timestamp}-3`,
        tags: ['original'],
        captured: new Date().toISOString()
      },
      autoGeneratePlan: true
    });

    // Try to save duplicate
    const result = await sendElectronMessage({
      action: 'document:save',
      projectId: 'test-project-001',
      docId: `integration-test-${timestamp}-3b`,
      content: 'Different content',
      metadata: {
        title: 'Different Title',
        sourceUrl: `https://example.com/integration-test-${timestamp}-3`, // Same URL
        tags: ['duplicate'],
        captured: new Date().toISOString()
      },
      autoGeneratePlan: true
    });

    if (!result.success && result.duplicate) {
      console.log('✓ PASS: Duplicate detected correctly');
      console.log(`  Existing Doc: ${result.existingDoc.title}`);
      console.log(`  Source URL: ${result.existingDoc.sourceUrl}\n`);
      passCount++;
    } else {
      console.log(`✗ FAIL: Duplicate not detected\n`);
      failCount++;
    }
  } catch (error) {
    console.log(`✗ FAIL: ${error.message}\n`);
    failCount++;
  }

  // Test 4: Extension handles validation errors
  console.log('Test 4: Error Handling - Missing Fields');
  try {
    const result = await sendElectronMessage({
      action: 'document:save',
      projectId: 'test-project-001',
      // Missing docId and content
      metadata: { title: 'Incomplete' }
    });
    console.log(`✗ FAIL: Should have thrown error but got: ${result.message}\n`);
    failCount++;
  } catch (error) {
    console.log('✓ PASS: Error caught correctly');
    console.log(`  Error: ${error.message}\n`);
    passCount++;
  }

  // Test 5: Extension with large metadata
  console.log('Test 5: Save with Rich Metadata');
  try {
    const result = await sendElectronMessage({
      action: 'document:save',
      projectId: 'test-project-001',
      docId: `integration-test-${timestamp}-5`,
      content: '# Comprehensive Article\n\n' + 'Detailed content here.\n'.repeat(100),
      metadata: {
        title: 'Comprehensive Learning Resource',
        sourceUrl: `https://example.com/integration-test-${timestamp}-5`,
        description: 'A detailed article about learning',
        author: 'Test Author',
        tags: ['comprehensive', 'learning', 'resource', 'detailed', 'reference'],
        captured: new Date().toISOString(),
        domain: 'example.com'
      },
      autoGeneratePlan: true
    });

    if (result.success) {
      console.log('✓ PASS: Rich metadata saved');
      console.log(`  Document ID: ${result.data.id}`);
      console.log(`  Path: ${result.data.path}\n`);
      passCount++;
    } else {
      console.log(`✗ FAIL: ${result.message || 'Unknown error'}\n`);
      failCount++;
    }
  } catch (error) {
    console.log(`✗ FAIL: ${error.message}\n`);
    failCount++;
  }

  // Summary
  console.log('================================');
  console.log(`Test Results: ${passCount} passed, ${failCount} failed`);
  console.log('================================\n');

  if (failCount === 0) {
    console.log('✓ All integration tests passed!');
    console.log('✓ Extension-to-Electron communication is fully functional.\n');
    process.exit(0);
  } else {
    console.log(`✗ ${failCount} test(s) failed.\n`);
    process.exit(1);
  }
}

// Run tests
console.log('Ensure Electron app is running...\n');
setTimeout(runTests, 1000);
