/**
 * Content Cleaner
 * Uses Claude AI to clean, validate, and structure captured web content
 */

const ClaudeClient = require('./claude-client');

class ContentCleaner {
  constructor(claudeApiKey) {
    if (!claudeApiKey) {
      throw new Error('Claude API key is required for content cleaning');
    }
    this.claudeClient = new ClaudeClient(claudeApiKey);
  }

  /**
   * Clean and validate web content
   * Removes noise, improves structure, validates relevance
   */
  async cleanContent(rawContent, pageTitle = 'Untitled', pageUrl = '') {
    if (!rawContent || rawContent.trim().length === 0) {
      throw new Error('Content is required for cleaning');
    }

    console.log('[ContentCleaner] Starting content cleaning...');

    try {
      // Analyze and clean the content with Claude
      const cleanedResponse = await this.claudeClient.request('/v1/messages', 'POST', {
        model: this.claudeClient.model,
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: `You are a content extraction expert. Your task is to clean and structure the following raw web content.

Instructions:
1. Remove any promotional content, ads, or noise
2. Ensure all content is relevant and educational
3. Fix any formatting issues
4. Preserve the logical structure and hierarchy
5. Return ONLY the cleaned, valid content
6. Format as markdown with proper headings and structure

Raw Content:
${rawContent}

Return ONLY the cleaned markdown content, no explanations.`
          }
        ]
      });

      const cleanedContent = cleanedResponse.content[0].text;

      // Validate the cleaned content
      const validationResponse = await this.claudeClient.request('/v1/messages', 'POST', {
        model: this.claudeClient.model,
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: `Assess the quality of this content on a scale of 1-10, where:
- 1-3: Too short, incomplete, or mostly noise
- 4-6: Some useful content but needs work
- 7-8: Good quality educational content
- 9-10: Excellent, well-structured content

Content Length: ${cleanedContent.length} characters
Content: ${cleanedContent.substring(0, 500)}...

Respond with ONLY a number 1-10 and a brief reason (1 sentence). Format: "SCORE: X - reason"`
          }
        ]
      });

      const validationText = validationResponse.content[0].text;
      const scoreMatch = validationText.match(/SCORE:\s*(\d+)/);
      const qualityScore = scoreMatch ? parseInt(scoreMatch[1]) : 5;

      console.log(`[ContentCleaner] Quality score: ${qualityScore}/10`);

      return {
        success: true,
        cleaned: cleanedContent,
        qualityScore: qualityScore,
        isValid: qualityScore >= 5,
        validation: validationText,
        contentLength: cleanedContent.length,
        wordCount: cleanedContent.split(/\s+/).length
      };
    } catch (error) {
      throw new Error(`Failed to clean content: ${error.message}`);
    }
  }

  /**
   * Extract key topics from content
   */
  async extractTopics(content, numTopics = 5) {
    if (!content || content.trim().length === 0) {
      throw new Error('Content is required');
    }

    try {
      const response = await this.claudeClient.request('/v1/messages', 'POST', {
        model: this.claudeClient.model,
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: `Extract the ${numTopics} main topics/subjects covered in this content. Format as a simple list with one topic per line.

Content:
${content}`
          }
        ]
      });

      const topics = response.content[0].text
        .split('\n')
        .filter(line => line.trim())
        .slice(0, numTopics);

      return {
        success: true,
        topics: topics,
        count: topics.length
      };
    } catch (error) {
      throw new Error(`Failed to extract topics: ${error.message}`);
    }
  }

  /**
   * Suggest an appropriate title based on content
   */
  async suggestTitle(content, originalTitle = '') {
    if (!content || content.trim().length === 0) {
      throw new Error('Content is required');
    }

    try {
      const prompt = originalTitle
        ? `Improve this title to be more descriptive and SEO-friendly: "${originalTitle}"\n\nBased on this content:\n${content.substring(0, 1000)}`
        : `Suggest a clear, descriptive title for this content (maximum 10 words):\n${content.substring(0, 1000)}`;

      const response = await this.claudeClient.request('/v1/messages', 'POST', {
        model: this.claudeClient.model,
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const suggestedTitle = response.content[0].text
        .trim()
        .replace(/^["']|["']$/g, '') // Remove quotes
        .substring(0, 200); // Limit length

      return {
        success: true,
        title: suggestedTitle,
        original: originalTitle
      };
    } catch (error) {
      throw new Error(`Failed to suggest title: ${error.message}`);
    }
  }

  /**
   * Comprehensive content analysis
   */
  async analyzeContent(content, pageTitle = 'Untitled', pageUrl = '') {
    if (!content || content.trim().length === 0) {
      throw new Error('Content is required for analysis');
    }

    console.log('[ContentCleaner] Starting comprehensive analysis...');

    try {
      // Clean content
      console.log('[ContentCleaner] Cleaning content...');
      const cleanResult = await this.cleanContent(content, pageTitle, pageUrl);

      if (!cleanResult.isValid) {
        return {
          success: false,
          isValid: false,
          reason: 'Content quality score too low',
          qualityScore: cleanResult.qualityScore,
          contentLength: cleanResult.contentLength
        };
      }

      const cleanedContent = cleanResult.cleaned;

      // Extract topics
      console.log('[ContentCleaner] Extracting topics...');
      const topicsResult = await this.extractTopics(cleanedContent, 5);

      // Suggest improved title
      console.log('[ContentCleaner] Suggesting title...');
      const titleResult = await this.suggestTitle(cleanedContent, pageTitle);

      return {
        success: true,
        isValid: true,
        content: cleanedContent,
        title: titleResult.title,
        originalTitle: pageTitle,
        topics: topicsResult.topics,
        wordCount: cleanResult.wordCount,
        qualityScore: cleanResult.qualityScore,
        pageUrl: pageUrl,
        analyzedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('[ContentCleaner] Error during analysis:', error);
      throw new Error(`Failed to analyze content: ${error.message}`);
    }
  }
}

module.exports = ContentCleaner;
