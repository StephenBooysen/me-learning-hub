#!/usr/bin/env node

/**
 * Claude API Key Tester
 * Quick validation tool to test your Claude API key
 *
 * Usage: node test-claude-api.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const ClaudeClient = require('./electron/app/js/claude-client');

const apiKey = process.env.CLAUDE_API_KEY;
const model = process.env.CLAUDE_MODEL || 'claude-opus-4-5';

async function testAPI() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║     Claude API Key Test                            ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  // Check if API key is set
  if (!apiKey || apiKey === 'your_new_claude_api_key_here') {
    console.error('❌ ERROR: CLAUDE_API_KEY not configured!');
    console.error('\nTo fix this:');
    console.error('1. Get your API key from: https://console.anthropic.com/');
    console.error('2. Edit your .env file and set:');
    console.error('   CLAUDE_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxx');
    console.error('3. Run this test again\n');
    process.exit(1);
  }

  console.log('📝 Configuration:');
  console.log(`   API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 10)}`);
  console.log(`   Model: ${model}`);
  console.log(`   Status: Testing...\n`);

  try {
    const client = new ClaudeClient(apiKey, model);

    console.log('🔗 Connecting to Claude API...');
    const result = await client.testConnection();

    console.log('\n✅ SUCCESS! API connection is working!\n');
    console.log('📊 Test Results:');
    console.log(`   Model: ${result.model}`);
    console.log(`   Response: "${result.message}"\n`);

    // Test a quick operation
    console.log('🧪 Testing summarization feature...');
    const summaryResult = await client.summarizeContent(
      'Artificial intelligence is transforming how we work and live. Machine learning enables systems to improve from experience without being explicitly programmed. Deep learning uses neural networks with multiple layers to process information.'
    );

    console.log('✅ Summarization working!\n');
    console.log('Summary generated:');
    console.log(`"${summaryResult.summary}"\n`);

    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║ ✅ All Tests Passed!                              ║');
    console.log('║ Your Claude API is ready to use.                  ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    console.log('💡 Next Steps:');
    console.log('   1. Run the full test suite: npm test -- claude-client.test.js');
    console.log('   2. Start using document processing in your app');
    console.log('   3. Check electron/app/js/document-processor.js for usage\n');

  } catch (error) {
    console.error('\n❌ ERROR: API test failed!\n');
    console.error('Error Details:');
    console.error(`   ${error.message}\n`);

    if (error.message.includes('API Error (401)')) {
      console.error('💡 This usually means:');
      console.error('   - Your API key is invalid or expired');
      console.error('   - Check your key at: https://console.anthropic.com/\n');
    } else if (error.message.includes('API Error (429)')) {
      console.error('💡 This usually means:');
      console.error('   - Rate limit exceeded');
      console.error('   - Wait a moment and try again\n');
    }

    process.exit(1);
  }
}

testAPI().catch(console.error);
