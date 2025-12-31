/**
 * Document Processor
 * Processes captured documents using Claude to extract learning materials
 */

const ClaudeClient = require('./claude-client');

class DocumentProcessor {
  constructor(claudeApiKey, claudeModel = 'claude-opus-4-5') {
    if (!claudeApiKey) {
      throw new Error('Claude API key is required for document processing');
    }
    this.claudeClient = new ClaudeClient(claudeApiKey, claudeModel);
  }

  /**
   * Test if the processor is working
   */
  async testConnection() {
    try {
      return await this.claudeClient.testConnection();
    } catch (error) {
      throw new Error(`Document processor connection test failed: ${error.message}`);
    }
  }

  /**
   * Process a document and extract all learning materials
   */
  async processDocument(title, content, options = {}) {
    if (!content || content.trim().length === 0) {
      throw new Error('Document content is required for processing');
    }

    const {
      generateSummary = true,
      extractKeyPoints = true,
      generateObjectives = true,
      generateQuestions = true,
      generatePracticeProblems = true,
      numKeyPoints = 5,
      numQuestions = 5,
      numProblems = 3
    } = options;

    const results = {
      title: title,
      processedAt: new Date().toISOString(),
      content: content,
      processing: {}
    };

    try {
      // Generate summary
      if (generateSummary) {
        console.log('[DocumentProcessor] Generating summary...');
        results.processing.summary = await this.claudeClient.summarizeContent(content);
      }

      // Extract key points
      if (extractKeyPoints) {
        console.log('[DocumentProcessor] Extracting key points...');
        results.processing.keyPoints = await this.claudeClient.extractKeyPoints(content, numKeyPoints);
      }

      // Generate learning objectives
      if (generateObjectives) {
        console.log('[DocumentProcessor] Generating learning objectives...');
        results.processing.objectives = await this.claudeClient.generateLearningObjectives(content);
      }

      // Generate study questions
      if (generateQuestions) {
        console.log('[DocumentProcessor] Generating study questions...');
        results.processing.questions = await this.claudeClient.generateStudyQuestions(content, numQuestions);
      }

      // Generate practice problems
      if (generatePracticeProblems) {
        console.log('[DocumentProcessor] Generating practice problems...');
        results.processing.problems = await this.claudeClient.generatePracticeProblems(content, numProblems);
      }

      results.success = true;
      return results;
    } catch (error) {
      results.success = false;
      results.error = error.message;
      throw error;
    }
  }

  /**
   * Generate a study plan for a document
   */
  async generateStudyPlan(title, content, duration = 7) {
    if (!content || content.trim().length === 0) {
      throw new Error('Document content is required for study plan generation');
    }

    try {
      console.log('[DocumentProcessor] Generating study plan...');
      const result = await this.claudeClient.generateStudyPlanOutline(title, content, duration);
      return {
        title: `Study Plan: ${title}`,
        duration: duration,
        plan: result.studyPlan,
        usage: result.usage,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to generate study plan: ${error.message}`);
    }
  }

  /**
   * Quick summary - just the summary part
   */
  async quickSummary(content) {
    try {
      return await this.claudeClient.summarizeContent(content);
    } catch (error) {
      throw new Error(`Failed to generate quick summary: ${error.message}`);
    }
  }

  /**
   * Quick key points - just the key points
   */
  async quickKeyPoints(content, numPoints = 5) {
    try {
      return await this.claudeClient.extractKeyPoints(content, numPoints);
    } catch (error) {
      throw new Error(`Failed to extract quick key points: ${error.message}`);
    }
  }

  /**
   * Evaluate student's understanding
   */
  async evaluateUnderstanding(originalContent, studentExplanation) {
    if (!originalContent || !studentExplanation) {
      throw new Error('Both original content and student explanation are required');
    }

    try {
      console.log('[DocumentProcessor] Evaluating student understanding...');
      return await this.claudeClient.evaluateExplanation(originalContent, studentExplanation);
    } catch (error) {
      throw new Error(`Failed to evaluate understanding: ${error.message}`);
    }
  }

  /**
   * Get processor status
   */
  getStatus() {
    return {
      available: true,
      model: this.claudeClient.model,
      apiVersion: this.claudeClient.apiVersion,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = DocumentProcessor;
