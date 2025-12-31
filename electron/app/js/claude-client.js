/**
 * Claude API Client
 * Handles all interactions with Anthropic's Claude API
 */

const https = require('https');

class ClaudeClient {
  constructor(apiKey, model = 'claude-opus-4-5') {
    if (!apiKey) {
      throw new Error('Claude API key is required');
    }
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = 'api.anthropic.com';
    this.apiVersion = '2023-06-01';
  }

  /**
   * Make an API request to Claude
   */
  async request(endpoint, method, body) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.baseUrl,
        port: 443,
        path: endpoint,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': this.apiVersion
        }
      };

      if (body) {
        const bodyString = JSON.stringify(body);
        options.headers['Content-Length'] = Buffer.byteLength(bodyString);
      }

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              const parsed = JSON.parse(data);
              resolve(parsed);
            } else {
              const error = JSON.parse(data);
              reject(new Error(`Claude API Error (${res.statusCode}): ${error.message || data}`));
            }
          } catch (error) {
            reject(new Error(`Failed to parse API response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  /**
   * Test the API connection
   */
  async testConnection() {
    try {
      const response = await this.request('/v1/messages', 'POST', {
        model: this.model,
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: 'Hello, Claude! Please respond with a single word to confirm you are working.'
          }
        ]
      });

      return {
        success: true,
        model: this.model,
        message: response.content[0].text
      };
    } catch (error) {
      throw new Error(`Claude connection test failed: ${error.message}`);
    }
  }

  /**
   * Generate a summary of content
   */
  async summarizeContent(content, maxLength = 300) {
    if (!content || content.trim().length === 0) {
      throw new Error('Content is required for summarization');
    }

    try {
      const response = await this.request('/v1/messages', 'POST', {
        model: this.model,
        max_tokens: Math.min(maxLength, 1000),
        messages: [
          {
            role: 'user',
            content: `Please provide a concise summary of the following content in approximately ${maxLength} characters. Focus on the main ideas and key points.\n\nContent:\n${content}`
          }
        ]
      });

      return {
        success: true,
        summary: response.content[0].text,
        usage: response.usage
      };
    } catch (error) {
      throw new Error(`Failed to summarize content: ${error.message}`);
    }
  }

  /**
   * Extract key points from content
   */
  async extractKeyPoints(content, numPoints = 5) {
    if (!content || content.trim().length === 0) {
      throw new Error('Content is required for key point extraction');
    }

    try {
      const response = await this.request('/v1/messages', 'POST', {
        model: this.model,
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `Extract the ${numPoints} most important key points from the following content. Format as a numbered list.\n\nContent:\n${content}`
          }
        ]
      });

      return {
        success: true,
        keyPoints: response.content[0].text,
        usage: response.usage
      };
    } catch (error) {
      throw new Error(`Failed to extract key points: ${error.message}`);
    }
  }

  /**
   * Generate learning objectives
   */
  async generateLearningObjectives(content) {
    if (!content || content.trim().length === 0) {
      throw new Error('Content is required for generating learning objectives');
    }

    try {
      const response = await this.request('/v1/messages', 'POST', {
        model: this.model,
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `Based on the following content, generate 3-5 clear, measurable learning objectives that a student should be able to achieve after studying this material. Format as a numbered list with action verbs (e.g., "Understand", "Apply", "Analyze").\n\nContent:\n${content}`
          }
        ]
      });

      return {
        success: true,
        objectives: response.content[0].text,
        usage: response.usage
      };
    } catch (error) {
      throw new Error(`Failed to generate learning objectives: ${error.message}`);
    }
  }

  /**
   * Generate study questions
   */
  async generateStudyQuestions(content, numQuestions = 5) {
    if (!content || content.trim().length === 0) {
      throw new Error('Content is required for generating study questions');
    }

    try {
      const response = await this.request('/v1/messages', 'POST', {
        model: this.model,
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: `Generate ${numQuestions} study questions based on the following content. Make them progressively more challenging. Format each question on a new line with "Q1:", "Q2:", etc.\n\nContent:\n${content}`
          }
        ]
      });

      return {
        success: true,
        questions: response.content[0].text,
        usage: response.usage
      };
    } catch (error) {
      throw new Error(`Failed to generate study questions: ${error.message}`);
    }
  }

  /**
   * Generate a study plan outline
   */
  async generateStudyPlanOutline(title, content, duration = 7) {
    if (!content || content.trim().length === 0) {
      throw new Error('Content is required for generating study plan');
    }

    try {
      const response = await this.request('/v1/messages', 'POST', {
        model: this.model,
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `Create a detailed ${duration}-day study plan for the following content titled "${title}".

Structure the plan with:
- Day-by-day breakdown with topics to cover
- Time estimates for each topic
- Key concepts to focus on
- Practice exercises or review activities
- Assessment checkpoints

Content:\n${content}`
          }
        ]
      });

      return {
        success: true,
        studyPlan: response.content[0].text,
        usage: response.usage
      };
    } catch (error) {
      throw new Error(`Failed to generate study plan: ${error.message}`);
    }
  }

  /**
   * Evaluate a student's explanation
   */
  async evaluateExplanation(originalContent, studentExplanation) {
    if (!originalContent || !studentExplanation) {
      throw new Error('Both original content and student explanation are required');
    }

    try {
      const response = await this.request('/v1/messages', 'POST', {
        model: this.model,
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `Evaluate the student's explanation against the original content. Provide:
1. Accuracy score (0-100)
2. What the student got right
3. What's missing or incorrect
4. Specific feedback for improvement

Original Content:\n${originalContent}\n\nStudent's Explanation:\n${studentExplanation}`
          }
        ]
      });

      return {
        success: true,
        evaluation: response.content[0].text,
        usage: response.usage
      };
    } catch (error) {
      throw new Error(`Failed to evaluate explanation: ${error.message}`);
    }
  }

  /**
   * Generate practice problems
   */
  async generatePracticeProblems(content, numProblems = 3) {
    if (!content || content.trim().length === 0) {
      throw new Error('Content is required for generating practice problems');
    }

    try {
      const response = await this.request('/v1/messages', 'POST', {
        model: this.model,
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: `Generate ${numProblems} practice problems based on the following content. Include:
- Clear problem statement
- Relevant variables or parameters
- Expected approach/method to solve
- Note any assumptions needed

Format each problem clearly separated.

Content:\n${content}`
          }
        ]
      });

      return {
        success: true,
        problems: response.content[0].text,
        usage: response.usage
      };
    } catch (error) {
      throw new Error(`Failed to generate practice problems: ${error.message}`);
    }
  }
}

module.exports = ClaudeClient;
