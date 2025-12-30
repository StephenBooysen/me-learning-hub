/**
 * Study Plan Generator
 * Base class for generating study plans from markdown documents
 */

const { generateUUID, formatISO8601, createFrontmatter, createStudyPlanMetadata } = require('./utils');

class StudyPlanGenerator {
  constructor(fileManager, aiClient) {
    this.fileManager = fileManager;
    this.aiClient = aiClient;
    this.techniques = ['Spaced Repetition', 'Active Recall', 'Interleaving', 'Feynman Technique'];
  }

  /**
   * Generate study plan from document
   */
  async generatePlan(projectId, documentId, options = {}) {
    const {
      techniques = ['Spaced Repetition'],
      intensity = 'medium',
      sessionDuration = 25,
      documentContent = null,
      documentTitle = 'Study Material'
    } = options;

    try {
      // Read document if not provided
      let content = documentContent;
      if (!content) {
        const doc = await this.fileManager.readMarkdownFile(projectId, documentId);
        content = doc.content;
      }

      // Validate content
      if (!content || content.trim().length === 0) {
        throw new Error('Document content is empty');
      }

      // Generate study plan
      const planId = generateUUID();
      const metadata = await this.generateMetadata(content, documentTitle);

      // Generate items for each technique
      const allItems = [];
      for (const technique of techniques) {
        const items = await this.generateTechniqueItems(content, technique);
        allItems.push(...items);
      }

      // Create study plan file
      const planContent = this.createPlanMarkdown(
        metadata,
        allItems,
        techniques,
        intensity,
        sessionDuration
      );

      // Save to file
      const result = await this.fileManager.saveStudyPlan(
        projectId,
        planId,
        planContent,
        {
          title: metadata.title,
          sourceDocuments: [documentId],
          techniques: techniques,
          intensity: intensity,
          status: 'active'
        }
      );

      return {
        id: planId,
        title: metadata.title,
        description: metadata.description,
        itemCount: allItems.length,
        techniques: techniques,
        path: result.path
      };
    } catch (error) {
      console.error('Error generating study plan:', error);
      throw error;
    }
  }

  /**
   * Generate metadata for study plan
   */
  async generateMetadata(markdown, documentTitle) {
    try {
      if (this.aiClient) {
        return await this.aiClient.generatePlanMetadata(markdown, documentTitle);
      }
    } catch (error) {
      console.warn('Failed to generate metadata with AI, using defaults:', error.message);
    }

    // Fallback to basic extraction
    return {
      title: `Study Plan: ${documentTitle}`,
      description: 'A structured study plan to master the content',
      objectives: ['Understand key concepts', 'Practice application', 'Build retention']
    };
  }

  /**
   * Generate study items for a specific technique
   */
  async generateTechniqueItems(markdown, technique) {
    try {
      if (this.aiClient) {
        const items = await this.aiClient.generateStudyItems(markdown, this.mapTechnique(technique));
        return items.map(item => ({
          ...item,
          technique: technique
        }));
      }
    } catch (error) {
      console.warn(`Failed to generate items for ${technique}:`, error.message);
    }

    // Fallback: generate basic items
    return this.generateFallbackItems(markdown, technique);
  }

  /**
   * Map technique name to AI model parameter
   */
  mapTechnique(technique) {
    const map = {
      'Spaced Repetition': 'spaced-repetition',
      'Active Recall': 'active-recall',
      'Interleaving': 'interleaving',
      'Feynman Technique': 'feynman'
    };
    return map[technique] || 'spaced-repetition';
  }

  /**
   * Generate fallback items when AI is unavailable
   */
  generateFallbackItems(markdown, technique) {
    const items = [];
    const sections = markdown.split(/\n#+\s+/).filter(s => s.trim());

    sections.forEach((section, index) => {
      const title = section.split('\n')[0].substring(0, 50);
      const content = section.substring(title.length).trim();

      items.push({
        id: `item-${index + 1}`,
        type: this.getTechniqueItemType(technique),
        title: title || `Item ${index + 1}`,
        content: content.substring(0, 500) || 'Content from document',
        difficulty: index % 3 === 0 ? 'Easy' : index % 3 === 1 ? 'Medium' : 'Hard',
        nextReview: technique === 'Spaced Repetition' ? formatISO8601() : undefined,
        interval: technique === 'Spaced Repetition' ? 1 : undefined,
        repetitions: technique === 'Spaced Repetition' ? 0 : undefined,
        easeFactor: technique === 'Spaced Repetition' ? 2.5 : undefined
      });
    });

    return items;
  }

  /**
   * Get item type for technique
   */
  getTechniqueItemType(technique) {
    const typeMap = {
      'Spaced Repetition': 'Flashcard',
      'Active Recall': 'Question',
      'Interleaving': 'Mixed',
      'Feynman Technique': 'Explanation'
    };
    return typeMap[technique] || 'Question';
  }

  /**
   * Create markdown content for study plan
   */
  createPlanMarkdown(metadata, items, techniques, intensity, sessionDuration) {
    const planMetadata = {
      'title': metadata.title,
      'created': formatISO8601(),
      'modified': formatISO8601(),
      'techniques': techniques.join(', '),
      'intensity': intensity,
      'session-duration': String(sessionDuration),
      'total-items': String(items.length),
      'completed': '0',
      'mastered': '0'
    };

    let markdown = createFrontmatter(planMetadata);
    markdown += `# ${metadata.title}\n\n`;

    if (metadata.description) {
      markdown += `${metadata.description}\n\n`;
    }

    // Learning objectives
    if (metadata.objectives && metadata.objectives.length > 0) {
      markdown += '## Learning Objectives\n\n';
      metadata.objectives.forEach((obj, i) => {
        markdown += `${i + 1}. ${obj}\n`;
      });
      markdown += '\n';
    }

    // Study configuration
    markdown += '## Study Configuration\n\n';
    markdown += `- **Intensity**: ${intensity}\n`;
    markdown += `- **Session Duration**: ${sessionDuration} minutes\n`;
    markdown += `- **Techniques**: ${techniques.join(', ')}\n`;
    markdown += `- **Total Items**: ${items.length}\n\n`;

    // Study items
    markdown += '## Study Items\n\n';
    items.forEach((item, index) => {
      markdown += `### Item ${index + 1}: ${item.title}\n`;
      markdown += `- **ID**: ${item.id}\n`;
      markdown += `- **Type**: ${item.type}\n`;
      markdown += `- **Difficulty**: ${item.difficulty}\n`;
      markdown += `- **Technique**: ${item.technique || 'General'}\n`;

      if (item.technique === 'Spaced Repetition') {
        markdown += `- **Next Review**: ${item.nextReview || formatISO8601()}\n`;
        markdown += `- **Interval**: ${item.interval || 1} days\n`;
        markdown += `- **Repetitions**: ${item.repetitions || 0}\n`;
        markdown += `- **Ease Factor**: ${item.easeFactor || 2.5}\n`;
      }

      markdown += `\n**Content**:\n\n${item.content}\n\n`;
      markdown += '---\n\n';
    });

    // Progress section
    markdown += '## Progress Summary\n\n';
    markdown += '- **Completed**: 0\n';
    markdown += '- **Mastered**: 0\n';
    markdown += '- **In Progress**: 0\n';
    markdown += '- **Current Streak**: 0 days\n';

    return markdown;
  }

  /**
   * Get available techniques
   */
  getAvailableTechniques() {
    return this.techniques;
  }

  /**
   * Validate technique
   */
  isValidTechnique(technique) {
    return this.techniques.includes(technique);
  }

  /**
   * Get default options for technique
   */
  getTechniqueDefaults(technique) {
    const defaults = {
      'Spaced Repetition': {
        intensity: 'medium',
        sessionDuration: 25,
        reviewFrequency: 'adaptive'
      },
      'Active Recall': {
        intensity: 'high',
        sessionDuration: 20,
        revealDelay: 3000
      },
      'Interleaving': {
        intensity: 'high',
        sessionDuration: 30,
        mixRatio: 0.5
      },
      'Feynman Technique': {
        intensity: 'medium',
        sessionDuration: 25,
        feedbackMode: 'detailed'
      }
    };

    return defaults[technique] || defaults['Spaced Repetition'];
  }
}

module.exports = StudyPlanGenerator;
