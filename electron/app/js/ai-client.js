/**
 * AI Client Module
 * Handles communication with LLM services for study plan generation
 */

class AIClient {
  constructor(config = {}) {
    this.provider = config.provider || 'openai';
    this.apiKey = config.apiKey || process.env.AI_API_KEY;
    this.model = config.model || process.env.AI_MODEL || 'gpt-4';
    this.baseUrl = config.baseUrl;
    this.maxTokens = config.maxTokens || 4000;
    this.temperature = config.temperature || 0.7;
    this.timeout = config.timeout || 30000;
    this.retries = config.retries || 3;
    this.requestCache = new Map(); // Simple in-memory cache
  }

  /**
   * Generate study plan items from markdown content
   */
  async generateStudyItems(markdown, studyType = 'spaced-repetition', options = {}) {
    if (!markdown || markdown.trim().length === 0) {
      throw new Error('Content cannot be empty');
    }

    // Check cache
    const cacheKey = this.getCacheKey(markdown, studyType);
    if (this.requestCache.has(cacheKey)) {
      console.log('Using cached response for study items');
      return this.requestCache.get(cacheKey);
    }

    try {
      const prompt = this.buildStudyItemPrompt(markdown, studyType, options);
      const response = await this.callLLM(prompt);
      const items = this.parseStudyItems(response, studyType);

      // Cache the result
      this.requestCache.set(cacheKey, items);

      return items;
    } catch (error) {
      console.error('Error generating study items:', error);
      throw new Error(`Failed to generate study items: ${error.message}`);
    }
  }

  /**
   * Generate study plan title and description
   */
  async generatePlanMetadata(markdown, documentTitle = '') {
    try {
      const prompt = this.buildMetadataPrompt(markdown, documentTitle);
      const response = await this.callLLM(prompt);
      return this.parseMetadata(response);
    } catch (error) {
      console.error('Error generating metadata:', error);
      throw new Error(`Failed to generate plan metadata: ${error.message}`);
    }
  }

  /**
   * Evaluate user's explanation (Feynman Technique)
   */
  async evaluateExplanation(originalContent, userExplanation) {
    try {
      const prompt = this.buildEvaluationPrompt(originalContent, userExplanation);
      const response = await this.callLLM(prompt);
      return this.parseEvaluation(response);
    } catch (error) {
      console.error('Error evaluating explanation:', error);
      throw new Error(`Failed to evaluate explanation: ${error.message}`);
    }
  }

  /**
   * Generate summary of content
   */
  async generateSummary(markdown, maxLength = 500) {
    try {
      const prompt = `Please provide a concise summary of the following content in ${maxLength} words or less:\n\n${markdown}`;
      const response = await this.callLLM(prompt);
      return response.trim();
    } catch (error) {
      console.error('Error generating summary:', error);
      throw new Error(`Failed to generate summary: ${error.message}`);
    }
  }

  /**
   * Generate learning objectives from content
   */
  async generateLearningObjectives(markdown) {
    try {
      const prompt = `Extract 3-5 clear learning objectives from the following content. Format as a numbered list:

${markdown}`;
      const response = await this.callLLM(prompt);
      return this.parseLearningObjectives(response);
    } catch (error) {
      console.error('Error generating objectives:', error);
      throw new Error(`Failed to generate learning objectives: ${error.message}`);
    }
  }

  /**
   * Call LLM API with retry logic
   */
  async callLLM(prompt, retryCount = 0) {
    if (!this.apiKey) {
      throw new Error('API key not configured. Please set AI_API_KEY environment variable.');
    }

    try {
      switch (this.provider.toLowerCase()) {
        case 'openai':
          return await this.callOpenAI(prompt);
        case 'anthropic':
          return await this.callAnthropic(prompt);
        case 'ollama':
          return await this.callOllama(prompt);
        default:
          throw new Error(`Unsupported provider: ${this.provider}`);
      }
    } catch (error) {
      if (retryCount < this.retries) {
        console.warn(`Retry ${retryCount + 1}/${this.retries} after error:`, error.message);
        await this.delay(1000 * (retryCount + 1)); // Exponential backoff
        return this.callLLM(prompt, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Call OpenAI API
   */
  async callOpenAI(prompt) {
    const url = 'https://api.openai.com/v1/chat/completions';
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    };

    const body = JSON.stringify({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational assistant that creates study materials and learning plans.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: this.maxTokens,
      temperature: this.temperature
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: body,
      signal: AbortSignal.timeout(this.timeout)
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Call Anthropic Claude API
   */
  async callAnthropic(prompt) {
    const url = 'https://api.anthropic.com/v1/messages';
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01'
    };

    const body = JSON.stringify({
      model: this.model,
      max_tokens: this.maxTokens,
      system: 'You are an expert educational assistant that creates study materials and learning plans.',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: body,
      signal: AbortSignal.timeout(this.timeout)
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  /**
   * Call Ollama local API
   */
  async callOllama(prompt) {
    const url = `${this.baseUrl || 'http://localhost:11434'}/api/generate`;
    const headers = {
      'Content-Type': 'application/json'
    };

    const body = JSON.stringify({
      model: this.model,
      prompt: prompt,
      stream: false
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: body,
      signal: AbortSignal.timeout(this.timeout)
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
  }

  /**
   * Build prompt for study item generation
   */
  buildStudyItemPrompt(markdown, studyType, options = {}) {
    let prompt = '';

    if (studyType === 'spaced-repetition') {
      prompt = `Based on the following content, create 10-15 flashcard-style study items for spaced repetition learning. Each item should have a question and answer.

Format each item as:
Q: [Question]
A: [Answer]

Content:
${markdown}`;
    } else if (studyType === 'active-recall') {
      prompt = `Based on the following content, create 10-15 questions for active recall practice. Questions should vary in difficulty from easy to challenging.

Format as numbered list:
1. [Question]
2. [Question]
...

Content:
${markdown}`;
    } else if (studyType === 'interleaving') {
      prompt = `Based on the following content, create 15-20 study items that mix different concepts and difficulty levels for interleaved learning.

Format as:
Topic: [Topic Name]
Difficulty: [Easy/Medium/Hard]
Question: [Question]
Answer: [Answer]
---

Content:
${markdown}`;
    } else if (studyType === 'feynman') {
      prompt = `Based on the following content, create 8-10 prompts for the Feynman Technique to deepen understanding. Each prompt should ask the user to explain a concept in simple terms.

Format as:
1. [Feynman Prompt]
2. [Feynman Prompt]
...

Content:
${markdown}`;
    }

    return prompt;
  }

  /**
   * Build prompt for metadata generation
   */
  buildMetadataPrompt(markdown, documentTitle) {
    return `For the following document, generate:
1. A concise study plan title (5-10 words)
2. A brief description (1-2 sentences)
3. 3-5 learning objectives

Document: ${documentTitle || 'Untitled'}

Content:
${markdown.substring(0, 2000)}

Format response as JSON:
{
  "title": "...",
  "description": "...",
  "objectives": ["...", "...", "..."]
}`;
  }

  /**
   * Build evaluation prompt for Feynman Technique
   */
  buildEvaluationPrompt(originalContent, userExplanation) {
    return `Original content:
${originalContent}

User's explanation:
${userExplanation}

Evaluate the user's explanation. Provide:
1. Overall quality score (1-10)
2. What they understood well
3. Knowledge gaps or misconceptions
4. Suggestions for improvement

Format as JSON:
{
  "score": 7,
  "strengths": ["..."],
  "gaps": ["..."],
  "suggestions": ["..."]
}`;
  }

  /**
   * Parse study items from LLM response
   */
  parseStudyItems(response, studyType) {
    const items = [];

    if (studyType === 'spaced-repetition') {
      const qaPairs = response.split(/Q:\s*/i).filter(s => s.trim());

      qaPairs.forEach((pair, index) => {
        const [question, answer] = pair.split(/A:\s*/i).map(s => s.trim());
        if (question && answer) {
          items.push({
            id: `item-${index + 1}`,
            type: 'Flashcard',
            title: question.substring(0, 50),
            content: { question, answer },
            difficulty: 'Medium',
            nextReview: new Date().toISOString(),
            interval: 1,
            repetitions: 0,
            easeFactor: 2.5
          });
        }
      });
    } else if (studyType === 'active-recall') {
      const questions = response.split(/\d+\.\s+/).filter(s => s.trim());

      questions.forEach((q, index) => {
        items.push({
          id: `item-${index + 1}`,
          type: 'Question',
          title: q.substring(0, 50),
          content: q,
          difficulty: index % 3 === 0 ? 'Easy' : index % 3 === 1 ? 'Medium' : 'Hard'
        });
      });
    }

    return items;
  }

  /**
   * Parse metadata from response
   */
  parseMetadata(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn('Failed to parse metadata JSON:', e);
    }

    // Fallback parsing
    return {
      title: 'Study Plan',
      description: 'Generated study plan',
      objectives: []
    };
  }

  /**
   * Parse evaluation from response
   */
  parseEvaluation(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn('Failed to parse evaluation JSON:', e);
    }

    return {
      score: 5,
      strengths: [],
      gaps: [],
      suggestions: []
    };
  }

  /**
   * Parse learning objectives from response
   */
  parseLearningObjectives(response) {
    return response
      .split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 0);
  }

  /**
   * Get cache key
   */
  getCacheKey(markdown, studyType) {
    const hash = this.simpleHash(markdown);
    return `${studyType}-${hash}`;
  }

  /**
   * Simple hash function for cache keys
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Delay utility for retry logic
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.requestCache.clear();
  }

  /**
   * Test API connection
   */
  async testConnection() {
    try {
      const response = await this.callLLM('Say "OK" if you receive this message.');
      return response.includes('OK');
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }
}

module.exports = AIClient;
