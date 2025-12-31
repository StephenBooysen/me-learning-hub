/**
 * Unit Tests for Claude Client and Document Processor
 *
 * Run with: npm test -- claude-client.test.js
 *
 * NOTE: These tests require a valid CLAUDE_API_KEY in your .env file
 * Set: CLAUDE_API_KEY=your_actual_api_key_here
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const ClaudeClient = require('../electron/app/js/claude-client');
const DocumentProcessor = require('../electron/app/js/document-processor');

describe('Claude Client', () => {
  let claudeClient;
  const apiKey = process.env.CLAUDE_API_KEY;

  beforeAll(() => {
    if (!apiKey || apiKey === 'your_new_claude_api_key_here') {
      console.warn('⚠️  CLAUDE_API_KEY not set in .env file. Skipping API tests.');
      console.warn('Set a valid API key in your .env file to run these tests.');
    }
  });

  describe('Constructor', () => {
    test('should create a client with valid API key', () => {
      if (!apiKey || apiKey === 'your_new_claude_api_key_here') {
        console.log('Skipping: No valid API key');
        return;
      }

      claudeClient = new ClaudeClient(apiKey);
      expect(claudeClient).toBeDefined();
      expect(claudeClient.apiKey).toBe(apiKey);
      expect(claudeClient.model).toBe('claude-opus-4-5');
    });

    test('should throw error if API key is missing', () => {
      expect(() => {
        new ClaudeClient(null);
      }).toThrow('Claude API key is required');
    });

    test('should throw error if API key is empty string', () => {
      expect(() => {
        new ClaudeClient('');
      }).toThrow('Claude API key is required');
    });

    test('should accept custom model', () => {
      if (!apiKey || apiKey === 'your_new_claude_api_key_here') {
        console.log('Skipping: No valid API key');
        return;
      }

      const customModel = 'claude-3-sonnet-20240229';
      claudeClient = new ClaudeClient(apiKey, customModel);
      expect(claudeClient.model).toBe(customModel);
    });
  });

  describe('API Connection Tests', () => {
    beforeAll(() => {
      if (apiKey && apiKey !== 'your_new_claude_api_key_here') {
        claudeClient = new ClaudeClient(apiKey);
      }
    });

    test('should test connection successfully', async () => {
      if (!apiKey || apiKey === 'your_new_claude_api_key_here') {
        console.log('⏭️  Skipping: No valid API key');
        return;
      }

      try {
        const result = await claudeClient.testConnection();
        expect(result.success).toBe(true);
        expect(result.model).toBe(claudeClient.model);
        expect(result.message).toBeDefined();
        console.log('✓ API Connection Test Passed');
      } catch (error) {
        console.error('✗ API Connection Test Failed:', error.message);
        throw error;
      }
    }, 30000); // 30 second timeout

    test('should handle API errors gracefully', async () => {
      if (!apiKey || apiKey === 'your_new_claude_api_key_here') {
        console.log('⏭️  Skipping: No valid API key');
        return;
      }

      const invalidClient = new ClaudeClient('invalid_key');
      try {
        await invalidClient.testConnection();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Claude API Error');
        console.log('✓ Error Handling Test Passed');
      }
    }, 30000);
  });

  describe('Summarization', () => {
    const testContent = `
      Artificial Intelligence (AI) is transforming industries worldwide. Machine learning enables
      computers to learn from data without explicit programming. Deep learning, a subset of machine
      learning, uses neural networks with multiple layers. Applications include natural language
      processing, computer vision, and predictive analytics. The field is advancing rapidly with
      new models and techniques emerging regularly.
    `;

    beforeAll(() => {
      if (apiKey && apiKey !== 'your_new_claude_api_key_here') {
        claudeClient = new ClaudeClient(apiKey);
      }
    });

    test('should throw error if content is empty', async () => {
      if (!apiKey || apiKey === 'your_new_claude_api_key_here') {
        return;
      }

      try {
        await claudeClient.summarizeContent('');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Content is required');
      }
    });

    test('should summarize content successfully', async () => {
      if (!apiKey || apiKey === 'your_new_claude_api_key_here') {
        console.log('⏭️  Skipping: No valid API key');
        return;
      }

      try {
        const result = await claudeClient.summarizeContent(testContent, 150);
        expect(result.success).toBe(true);
        expect(result.summary).toBeDefined();
        expect(result.summary.length).toBeGreaterThan(0);
        expect(result.usage).toBeDefined();
        console.log('✓ Summarization Test Passed');
        console.log('Summary:', result.summary);
      } catch (error) {
        console.error('✗ Summarization Test Failed:', error.message);
        throw error;
      }
    }, 30000);
  });

  describe('Key Points Extraction', () => {
    const testContent = `
      Climate change is primarily caused by human activities, particularly the burning of fossil fuels.
      This releases greenhouse gases like CO2 and methane into the atmosphere. These gases trap heat,
      causing global temperatures to rise. Consequences include rising sea levels, extreme weather events,
      and ecosystem disruption. Solutions involve transitioning to renewable energy, improving energy
      efficiency, and protecting forests.
    `;

    beforeAll(() => {
      if (apiKey && apiKey !== 'your_new_claude_api_key_here') {
        claudeClient = new ClaudeClient(apiKey);
      }
    });

    test('should extract key points successfully', async () => {
      if (!apiKey || apiKey === 'your_new_claude_api_key_here') {
        console.log('⏭️  Skipping: No valid API key');
        return;
      }

      try {
        const result = await claudeClient.extractKeyPoints(testContent, 3);
        expect(result.success).toBe(true);
        expect(result.keyPoints).toBeDefined();
        expect(result.keyPoints.length).toBeGreaterThan(0);
        expect(result.usage).toBeDefined();
        console.log('✓ Key Points Extraction Test Passed');
        console.log('Key Points:', result.keyPoints);
      } catch (error) {
        console.error('✗ Key Points Extraction Test Failed:', error.message);
        throw error;
      }
    }, 30000);
  });

  describe('Learning Objectives Generation', () => {
    const testContent = `
      Photosynthesis is the process by which plants convert light energy into chemical energy stored
      in glucose. It occurs in two stages: light reactions in the thylakoid membrane and the Calvin
      cycle in the stroma. During light reactions, water is split, releasing oxygen as a byproduct.
      The Calvin cycle uses ATP and NADPH to fix CO2 into glucose. This process is essential for
      life as it produces oxygen and food, forming the base of most food chains.
    `;

    beforeAll(() => {
      if (apiKey && apiKey !== 'your_new_claude_api_key_here') {
        claudeClient = new ClaudeClient(apiKey);
      }
    });

    test('should generate learning objectives successfully', async () => {
      if (!apiKey || apiKey === 'your_new_claude_api_key_here') {
        console.log('⏭️  Skipping: No valid API key');
        return;
      }

      try {
        const result = await claudeClient.generateLearningObjectives(testContent);
        expect(result.success).toBe(true);
        expect(result.objectives).toBeDefined();
        expect(result.objectives.length).toBeGreaterThan(0);
        console.log('✓ Learning Objectives Test Passed');
        console.log('Objectives:', result.objectives);
      } catch (error) {
        console.error('✗ Learning Objectives Test Failed:', error.message);
        throw error;
      }
    }, 30000);
  });

  describe('Study Questions Generation', () => {
    const testContent = `
      The water cycle, also known as the hydrological cycle, describes the continuous movement
      of water on, above, and below the surface of Earth. Water evaporates from oceans, lakes,
      and rivers, rising into the atmosphere. As it rises, it cools and condenses into clouds.
      Precipitation returns water to Earth as rain or snow. Some water infiltrates the ground,
      becoming groundwater, while some runs off into rivers and back to the ocean.
    `;

    beforeAll(() => {
      if (apiKey && apiKey !== 'your_new_claude_api_key_here') {
        claudeClient = new ClaudeClient(apiKey);
      }
    });

    test('should generate study questions successfully', async () => {
      if (!apiKey || apiKey === 'your_new_claude_api_key_here') {
        console.log('⏭️  Skipping: No valid API key');
        return;
      }

      try {
        const result = await claudeClient.generateStudyQuestions(testContent, 3);
        expect(result.success).toBe(true);
        expect(result.questions).toBeDefined();
        expect(result.questions.length).toBeGreaterThan(0);
        console.log('✓ Study Questions Test Passed');
        console.log('Questions:', result.questions);
      } catch (error) {
        console.error('✗ Study Questions Test Failed:', error.message);
        throw error;
      }
    }, 30000);
  });

  describe('Study Plan Generation', () => {
    const testContent = `
      Newton's Laws of Motion form the foundation of classical mechanics. The first law states that
      objects in motion stay in motion unless acted upon by a force. The second law defines force as
      mass times acceleration (F=ma). The third law states that for every action, there's an equal
      and opposite reaction. These laws explain planetary motion, projectile motion, and everyday
      phenomena like friction and collisions.
    `;

    beforeAll(() => {
      if (apiKey && apiKey !== 'your_new_claude_api_key_here') {
        claudeClient = new ClaudeClient(apiKey);
      }
    });

    test('should generate study plan successfully', async () => {
      if (!apiKey || apiKey === 'your_new_claude_api_key_here') {
        console.log('⏭️  Skipping: No valid API key');
        return;
      }

      try {
        const result = await claudeClient.generateStudyPlanOutline(
          'Physics: Newton\'s Laws',
          testContent,
          3
        );
        expect(result.success).toBe(true);
        expect(result.studyPlan).toBeDefined();
        expect(result.studyPlan.length).toBeGreaterThan(0);
        console.log('✓ Study Plan Generation Test Passed');
        console.log('Study Plan:', result.studyPlan.substring(0, 200) + '...');
      } catch (error) {
        console.error('✗ Study Plan Generation Test Failed:', error.message);
        throw error;
      }
    }, 40000); // Longer timeout for plan generation
  });

  describe('Explanation Evaluation', () => {
    const originalContent = `
      Mitochondria are the powerhouses of the cell. They generate ATP through cellular respiration,
      breaking down glucose to provide energy for cellular processes. The inner membrane is folded
      into cristae, increasing surface area for the electron transport chain.
    `;

    const studentExplanation = `
      Mitochondria make energy for the cell. They break down sugar to make ATP that cells use.
      They have folds inside to make more space for making energy.
    `;

    beforeAll(() => {
      if (apiKey && apiKey !== 'your_new_claude_api_key_here') {
        claudeClient = new ClaudeClient(apiKey);
      }
    });

    test('should evaluate explanation successfully', async () => {
      if (!apiKey || apiKey === 'your_new_claude_api_key_here') {
        console.log('⏭️  Skipping: No valid API key');
        return;
      }

      try {
        const result = await claudeClient.evaluateExplanation(originalContent, studentExplanation);
        expect(result.success).toBe(true);
        expect(result.evaluation).toBeDefined();
        console.log('✓ Explanation Evaluation Test Passed');
        console.log('Evaluation:', result.evaluation.substring(0, 200) + '...');
      } catch (error) {
        console.error('✗ Explanation Evaluation Test Failed:', error.message);
        throw error;
      }
    }, 30000);
  });
});

describe('Document Processor', () => {
  let processor;
  const apiKey = process.env.CLAUDE_API_KEY;

  describe('Constructor', () => {
    test('should throw error if API key is missing', () => {
      expect(() => {
        new DocumentProcessor(null);
      }).toThrow('Claude API key is required');
    });

    test('should create processor with valid API key', () => {
      if (!apiKey || apiKey === 'your_new_claude_api_key_here') {
        console.log('Skipping: No valid API key');
        return;
      }

      processor = new DocumentProcessor(apiKey);
      expect(processor).toBeDefined();
      expect(processor.claudeClient).toBeDefined();
    });
  });

  describe('Document Processing', () => {
    const testContent = `
      DNA (deoxyribonucleic acid) is the molecule that carries genetic instructions for all living
      organisms. It consists of four nucleotide bases: adenine, thymine, guanine, and cytosine.
      These bases pair in the famous double helix structure discovered by Watson, Crick, Franklin,
      and Wilkins. DNA replication ensures genetic information is copied accurately during cell division.
      Mutations in DNA can lead to evolution or disease.
    `;

    beforeAll(() => {
      if (apiKey && apiKey !== 'your_new_claude_api_key_here') {
        processor = new DocumentProcessor(apiKey);
      }
    });

    test('should process document successfully', async () => {
      if (!apiKey || apiKey === 'your_new_claude_api_key_here') {
        console.log('⏭️  Skipping: No valid API key');
        return;
      }

      try {
        const result = await processor.processDocument('DNA Basics', testContent, {
          generateSummary: true,
          extractKeyPoints: true,
          generateObjectives: true,
          generateQuestions: false, // Skip to save time
          generatePracticeProblems: false,
          numKeyPoints: 3
        });

        expect(result.success).toBe(true);
        expect(result.title).toBe('DNA Basics');
        expect(result.processing.summary).toBeDefined();
        expect(result.processing.keyPoints).toBeDefined();
        expect(result.processing.objectives).toBeDefined();
        console.log('✓ Document Processing Test Passed');
      } catch (error) {
        console.error('✗ Document Processing Test Failed:', error.message);
        throw error;
      }
    }, 60000); // 60 second timeout for multiple operations

    test('should generate study plan successfully', async () => {
      if (!apiKey || apiKey === 'your_new_claude_api_key_here') {
        console.log('⏭️  Skipping: No valid API key');
        return;
      }

      try {
        const result = await processor.generateStudyPlan('DNA Basics', testContent, 2);
        expect(result.title).toContain('Study Plan');
        expect(result.plan).toBeDefined();
        console.log('✓ Study Plan Generation Test Passed');
      } catch (error) {
        console.error('✗ Study Plan Generation Test Failed:', error.message);
        throw error;
      }
    }, 40000);
  });

  describe('Quick Methods', () => {
    const testContent = `
      Quantum mechanics describes how particles behave at the atomic scale. The Heisenberg uncertainty
      principle states we cannot simultaneously know both position and momentum precisely. Quantum
      superposition allows particles to exist in multiple states until measured. Entanglement links
      particles so measuring one affects the other instantly.
    `;

    beforeAll(() => {
      if (apiKey && apiKey !== 'your_new_claude_api_key_here') {
        processor = new DocumentProcessor(apiKey);
      }
    });

    test('should generate quick summary', async () => {
      if (!apiKey || apiKey === 'your_new_claude_api_key_here') {
        console.log('⏭️  Skipping: No valid API key');
        return;
      }

      try {
        const result = await processor.quickSummary(testContent);
        expect(result.success).toBe(true);
        expect(result.summary).toBeDefined();
        console.log('✓ Quick Summary Test Passed');
      } catch (error) {
        console.error('✗ Quick Summary Test Failed:', error.message);
        throw error;
      }
    }, 30000);

    test('should extract quick key points', async () => {
      if (!apiKey || apiKey === 'your_new_claude_api_key_here') {
        console.log('⏭️  Skipping: No valid API key');
        return;
      }

      try {
        const result = await processor.quickKeyPoints(testContent, 3);
        expect(result.success).toBe(true);
        expect(result.keyPoints).toBeDefined();
        console.log('✓ Quick Key Points Test Passed');
      } catch (error) {
        console.error('✗ Quick Key Points Test Failed:', error.message);
        throw error;
      }
    }, 30000);
  });
});

/**
 * SETUP INSTRUCTIONS
 *
 * 1. Get your API key from: https://console.anthropic.com/
 * 2. Update your .env file:
 *    CLAUDE_API_KEY=your_actual_key_here
 *
 * 3. Run the tests:
 *    npm test -- claude-client.test.js
 *
 * Tests will skip if no valid API key is found
 */
