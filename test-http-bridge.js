/**
 * Test script for Extension-to-Electron HTTP bridge
 * Tests all communication endpoints and flows
 */

const http = require('http');

const BRIDGE_URL = 'http://localhost:47823';
const TEST_TIMEOUT = 10000; // 10 seconds for large uploads

// Test data with unique timestamps
const timestamp = Date.now();
const testDocument = {
  projectId: 'test-project-001',
  docId: `doc-${timestamp}`,
  content: '# Test Article\n\nThis is a **test document** for the HTTP bridge.\n\n## Section 1\nSome content here.\n\n## Section 2\nMore content.',
  metadata: {
    title: 'Test Article',
    sourceUrl: `https://example.com/test-article-${timestamp}`,
    tags: ['test', 'http-bridge'],
    captured: new Date().toISOString()
  },
  autoGeneratePlan: true
};

const testDocumentDuplicate = {
  projectId: 'test-project-001',
  docId: `doc-${timestamp}-dup`,
  content: '# Different Content',
  metadata: {
    title: 'Different Article',
    sourceUrl: `https://example.com/test-article-${timestamp}`, // Same URL for duplicate test
    tags: ['test'],
    captured: new Date().toISOString()
  },
  autoGeneratePlan: false
};

/**
 * Make HTTP request to bridge
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
          resolve({ status: res.statusCode, headers: res.headers, body: response });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: body });
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
 * Run all tests
 */
async function runTests() {
  console.log('🧪 Starting HTTP Bridge Tests');
  console.log('================================\n');

  let passCount = 0;
  let failCount = 0;

  // Test 1: Health Check
  console.log('Test 1: Health Check (/api/health)');
  try {
    const result = await makeRequest('GET', '/api/health');
    if (result.status === 200) {
      console.log('✓ PASS: Health check successful');
      console.log(`  Status: ${result.status}`);
      console.log(`  Response: ${JSON.stringify(result.body)}\n`);
      passCount++;
    } else {
      console.log(`✗ FAIL: Expected 200, got ${result.status}\n`);
      failCount++;
    }
  } catch (error) {
    console.log(`✗ FAIL: ${error.message}`);
    console.log('  Make sure Electron app is running!\n');
    failCount++;
    process.exit(1);
  }

  // Test 2: Document Import (First save - should succeed)
  console.log('Test 2: Document Import - First Save (/api/import-document)');
  try {
    const result = await makeRequest('POST', '/api/import-document', testDocument);
    if (result.status === 200 && result.body.success) {
      console.log('✓ PASS: Document imported successfully');
      console.log(`  Response: ${JSON.stringify(result.body, null, 2)}\n`);
      passCount++;
    } else {
      console.log(`✗ FAIL: Expected success, got status ${result.status}`);
      console.log(`  Response: ${JSON.stringify(result.body)}\n`);
      failCount++;
    }
  } catch (error) {
    console.log(`✗ FAIL: ${error.message}\n`);
    failCount++;
  }

  // Test 3: Duplicate Detection (Second save with same URL - should detect duplicate)
  console.log('Test 3: Duplicate Detection (/api/import-document)');
  try {
    const result = await makeRequest('POST', '/api/import-document', testDocumentDuplicate);
    if (result.status === 200 && result.body.duplicate) {
      console.log('✓ PASS: Duplicate detected successfully');
      console.log(`  Duplicate: ${result.body.duplicate}`);
      console.log(`  Existing Doc: ${JSON.stringify(result.body.existingDoc, null, 2)}\n`);
      passCount++;
    } else if (result.status === 200 && result.body.success) {
      console.log('⚠ WARNING: Document saved but duplicate was not detected');
      console.log('  This may indicate the sourceUrl comparison is not working\n');
      failCount++;
    } else {
      console.log(`✗ FAIL: Expected duplicate detection, got status ${result.status}`);
      console.log(`  Response: ${JSON.stringify(result.body)}\n`);
      failCount++;
    }
  } catch (error) {
    console.log(`✗ FAIL: ${error.message}\n`);
    failCount++;
  }

  // Test 4: Missing Required Fields
  console.log('Test 4: Input Validation - Missing Required Fields');
  try {
    const invalidData = {
      projectId: 'test-project',
      // Missing docId
      content: 'Test content'
    };
    const result = await makeRequest('POST', '/api/import-document', invalidData);
    if (result.status === 400 || (result.status === 200 && !result.body.success)) {
      console.log('✓ PASS: Validation error caught');
      console.log(`  Status: ${result.status}`);
      console.log(`  Response: ${JSON.stringify(result.body)}\n`);
      passCount++;
    } else {
      console.log(`✗ FAIL: Expected validation error, got ${result.status}`);
      console.log(`  Response: ${JSON.stringify(result.body)}\n`);
      failCount++;
    }
  } catch (error) {
    console.log(`✗ FAIL: ${error.message}\n`);
    failCount++;
  }

  // Test 5: Large Content Upload
  console.log('Test 5: Large Content Upload');
  try {
    const largeData = {
      ...testDocument,
      docId: `doc-large-${timestamp}`,
      content: 'Test content '.repeat(5000), // ~60KB
      metadata: {
        ...testDocument.metadata,
        sourceUrl: `https://example.com/large-test-${timestamp}`, // Unique URL
        title: 'Large Test Document'
      }
    };
    const result = await makeRequest('POST', '/api/import-document', largeData);
    if (result.status === 200 && result.body.success) {
      console.log('✓ PASS: Large content uploaded successfully');
      console.log(`  Content size: ~${(JSON.stringify(largeData.content).length / 1024).toFixed(1)}KB`);
      console.log(`  Response: ${JSON.stringify(result.body.success)}\n`);
      passCount++;
    } else {
      console.log(`✗ FAIL: Expected success, got status ${result.status}`);
      console.log(`  Response: ${JSON.stringify(result.body)}\n`);
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
    console.log('✓ All tests passed! HTTP bridge is working correctly.\n');
    process.exit(0);
  } else {
    console.log(`✗ ${failCount} test(s) failed. Check the implementation.\n`);
    process.exit(1);
  }
}

// Run tests
console.log('Make sure the Electron app is running before continuing...\n');
setTimeout(runTests, 1000);
