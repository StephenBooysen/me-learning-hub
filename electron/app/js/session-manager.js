/**
 * Session Manager Module
 * Manages study sessions across all learning techniques
 * Handles session lifecycle, item navigation, response recording, and statistics
 */

const { generateUUID, formatISO8601 } = require('./utils');
const path = require('path');
const fs = require('fs').promises;

class SessionManager {
  constructor(fileManager, spacedRepetition, aiClient) {
    this.fileManager = fileManager;
    this.spacedRepetition = spacedRepetition;
    this.aiClient = aiClient;
    this.sessions = new Map(); // In-memory session storage
  }

  /**
   * Start a new study session
   * @param {string} projectId - Project ID
   * @param {string} planId - Study plan ID
   * @param {object} options - Session options (technique, duration)
   * @returns {object} Session object with items
   */
  async startSession(projectId, planId, options = {}) {
    try {
      // Read the study plan
      const planData = await this.fileManager.readStudyPlan(projectId, planId);
      const plan = this._parseStudyPlan(planData.content);

      // Generate session ID
      const sessionId = generateUUID();
      const now = new Date();

      // Select items based on options
      let items = this._selectItems(plan.items, options.technique);

      // Filter for due items if spaced repetition
      if (options.technique === 'Spaced Repetition' || !options.technique) {
        items = this.spacedRepetition.getItemsDueForReview(items);
      }

      // Limit session to reasonable size
      const maxItems = options.maxItems || 25;
      items = items.slice(0, maxItems);

      // Create session object
      const session = {
        id: sessionId,
        projectId: projectId,
        planId: planId,
        planTitle: plan.title,
        technique: options.technique || 'Spaced Repetition',
        startTime: now,
        pausedAt: null,
        items: items,
        currentIndex: 0,
        results: {
          itemsReviewed: 0,
          correctCount: 0,
          totalTime: 0,
          averageQuality: 0,
          itemResults: []
        }
      };

      // Store in memory
      this.sessions.set(sessionId, session);

      // Return session without file operations
      return {
        id: sessionId,
        projectId: projectId,
        planId: planId,
        planTitle: plan.title,
        technique: session.technique,
        startTime: formatISO8601(now),
        items: items,
        currentIndex: 0,
        itemCount: items.length
      };
    } catch (error) {
      console.error('Error starting session:', error);
      throw error;
    }
  }

  /**
   * Get current session
   */
  async getCurrentSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return {
      id: session.id,
      projectId: session.projectId,
      planId: session.planId,
      planTitle: session.planTitle,
      technique: session.technique,
      items: session.items,
      currentIndex: session.currentIndex,
      itemCount: session.items.length,
      itemsReviewed: session.results.itemsReviewed
    };
  }

  /**
   * Get current item
   */
  async getCurrentItem(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return session.items[session.currentIndex];
  }

  /**
   * Navigate to next item
   */
  async nextItem(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (session.currentIndex < session.items.length - 1) {
      session.currentIndex++;
    }

    return session.items[session.currentIndex];
  }

  /**
   * Navigate to previous item
   */
  async previousItem(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (session.currentIndex > 0) {
      session.currentIndex--;
    }

    return session.items[session.currentIndex];
  }

  /**
   * Record item response and update SM-2 metadata
   * @param {string} sessionId - Session ID
   * @param {string} itemId - Item ID
   * @param {object} response - Response object {quality, timeSpent, confidence}
   */
  async recordItemResponse(sessionId, itemId, response = {}) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const item = session.items.find(i => i.id === itemId);
    if (!item) {
      throw new Error(`Item ${itemId} not found in session`);
    }

    const quality = response.quality || 0;
    const timeSpent = response.timeSpent || 0;
    const confidence = response.confidence || 3;

    // Record the review
    const updatedItem = this.spacedRepetition.recordReview(
      item,
      quality,
      timeSpent,
      confidence
    );

    // Update item in session
    const itemIndex = session.items.findIndex(i => i.id === itemId);
    session.items[itemIndex] = updatedItem;

    // Update results
    session.results.itemsReviewed++;
    if (quality >= 3) {
      session.results.correctCount++;
    }
    session.results.totalTime += timeSpent;

    // Track individual result
    session.results.itemResults.push({
      itemId: itemId,
      quality: quality,
      timeSpent: timeSpent,
      timestamp: formatISO8601()
    });

    return {
      ...updatedItem,
      sessionStats: this._calculateSessionStats(session)
    };
  }

  /**
   * Pause session (saves state)
   */
  async pauseSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.pausedAt = new Date();
    return {
      sessionId: sessionId,
      paused: true,
      timestamp: formatISO8601(session.pausedAt)
    };
  }

  /**
   * Resume session
   */
  async resumeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.pausedAt = null;
    return {
      sessionId: sessionId,
      paused: false,
      timestamp: formatISO8601()
    };
  }

  /**
   * Complete session and save results
   */
  async completeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Calculate final statistics
    const stats = this._calculateSessionStats(session);

    // Save session file
    await this._saveSessionFile(session);

    // Update study plan metadata
    await this._updatePlanMetadata(session);

    // Clear from memory
    this.sessions.delete(sessionId);

    return stats;
  }

  /**
   * Get session statistics
   */
  async getSessionStats(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return this._calculateSessionStats(session);
  }

  /**
   * Calculate session statistics
   * @private
   */
  _calculateSessionStats(session) {
    const itemsReviewed = session.results.itemsReviewed;
    const correctCount = session.results.correctCount;
    const totalTime = session.results.totalTime;
    const totalItems = session.items.length;

    let averageQuality = 0;
    let completionRate = 0;

    if (itemsReviewed > 0) {
      completionRate = Math.round((itemsReviewed / totalItems) * 100);
      const qualitySum = session.results.itemResults.reduce(
        (sum, r) => sum + r.quality,
        0
      );
      averageQuality = (qualitySum / itemsReviewed) * (5 / 5); // Normalize to 5-point scale
    }

    // Generate motivational message
    let message = 'Great work! Keep up the consistent practice.';
    if (completionRate === 100) {
      message = 'Perfect! You completed all items in this session!';
    } else if (averageQuality >= 4) {
      message = 'Excellent performance! You\'re mastering this material!';
    } else if (averageQuality >= 3) {
      message = 'Good job! Consistency is the key to learning.';
    } else if (completionRate > 0) {
      message = 'You\'re making progress! Keep practicing regularly.';
    }

    return {
      sessionId: session.id,
      itemsReviewed: itemsReviewed,
      totalItems: totalItems,
      completionRate: completionRate,
      correctCount: correctCount,
      totalTime: totalTime,
      averageQuality: parseFloat(averageQuality.toFixed(1)),
      message: message,
      technique: session.technique,
      completedAt: formatISO8601()
    };
  }

  /**
   * Select items based on learning technique
   * @private
   */
  _selectItems(items, technique) {
    if (!items || items.length === 0) {
      return [];
    }

    switch (technique) {
      case 'Spaced Repetition':
        // Due items handled separately via getItemsDueForReview
        return items;

      case 'Active Recall':
        // Filter for question-type items
        return items.filter(i => i.type === 'Question' || i.type === 'Mixed');

      case 'Interleaving':
        // Shuffle items to mix topics/difficulties
        return this._shuffleItems(items);

      case 'Feynman Technique':
        // Filter for explanation-type items
        return items.filter(i => i.type === 'Explanation');

      default:
        return items;
    }
  }

  /**
   * Shuffle items for interleaving
   * @private
   */
  _shuffleItems(items) {
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Parse study plan markdown
   * @private
   */
  _parseStudyPlan(content) {
    try {
      // Extract frontmatter
      const match = content.match(/^---\n([\s\S]*?)\n---/);
      const metadata = {};

      if (match) {
        const frontmatter = match[1];
        frontmatter.split('\n').forEach(line => {
          const [key, ...valueParts] = line.split(':');
          if (key && valueParts.length > 0) {
            metadata[key.trim()] = valueParts.join(':').trim();
          }
        });
      }

      // Parse items from markdown
      const items = [];
      const itemPattern =
        /### Item \d+: (.+?)\n([\s\S]*?)(?=###|$)/g;

      let itemMatch;
      let itemIndex = 1;
      while ((itemMatch = itemPattern.exec(content)) !== null) {
        const itemTitle = itemMatch[1];
        const itemContent = itemMatch[2];

        const item = {
          id: `item-${itemIndex}`,
          title: itemTitle,
          type: this._extractField(itemContent, 'Type') || 'Flashcard',
          difficulty: this._extractField(itemContent, 'Difficulty') || 'Medium',
          technique: this._extractField(itemContent, 'Technique') || 'Spaced Repetition',
          content: this._extractContent(itemContent),
          interval: parseInt(this._extractField(itemContent, 'Interval')) || 0,
          repetitions: parseInt(this._extractField(itemContent, 'Repetitions')) || 0,
          easeFactor: parseFloat(this._extractField(itemContent, 'Ease Factor')) || 2.5,
          nextReviewDate: this._extractField(itemContent, 'Next Review'),
          reviews: []
        };

        items.push(item);
        itemIndex++;
      }

      return {
        title: metadata.title || 'Untitled Study Plan',
        description: metadata.description || '',
        techniques: (metadata.techniques || '').split(',').map(t => t.trim()),
        totalItems: items.length,
        items: items
      };
    } catch (error) {
      console.error('Error parsing study plan:', error);
      throw error;
    }
  }

  /**
   * Extract field value from item content
   * @private
   */
  _extractField(content, fieldName) {
    const pattern = new RegExp(`- \\*\\*${fieldName}\\*\\*: (.+?)(?=\n|$)`);
    const match = content.match(pattern);
    return match ? match[1].trim() : null;
  }

  /**
   * Extract content from item section
   * @private
   */
  _extractContent(content) {
    // Find content between metadata and end
    const lines = content.split('\n');
    const contentStart = lines.findIndex(
      line => !line.startsWith('- **') && line.trim().length > 0
    );

    if (contentStart === -1) {
      return '';
    }

    return lines.slice(contentStart).join('\n').trim();
  }

  /**
   * Save session results to file
   * @private
   */
  async _saveSessionFile(session) {
    try {
      const progressDir = path.join(
        this.fileManager.dataDir,
        'projects',
        session.projectId,
        'progress'
      );

      // Ensure directory exists
      await fs.mkdir(progressDir, { recursive: true });

      const sessionFile = path.join(progressDir, `session-${session.id}.md`);
      const stats = this._calculateSessionStats(session);

      // Create markdown content
      const markdown = `---
id: ${session.id}
plan-id: ${session.planId}
technique: ${session.technique}
start-time: ${formatISO8601(session.startTime)}
items-reviewed: ${stats.itemsReviewed}
correct-count: ${stats.correctCount}
completion-rate: ${stats.completionRate}
average-quality: ${stats.averageQuality}
---

# Study Session - ${new Date(session.startTime).toLocaleDateString()}

## Summary
- **Technique**: ${session.technique}
- **Items Reviewed**: ${stats.itemsReviewed}/${stats.totalItems}
- **Time Spent**: ${Math.floor(stats.totalTime / 60)} minutes
- **Completion**: ${stats.completionRate}%
- **Average Quality**: ${stats.averageQuality}/5

## Item Results

| # | Item | Quality | Time (s) |
|---|------|---------|----------|
${session.results.itemResults
  .map(
    (r, idx) =>
      `| ${idx + 1} | Item ${r.itemId.split('-')[1]} | ${r.quality}/5 | ${r.timeSpent} |`
  )
  .join('\n')}

## Session Message

${stats.message}

---
*Session completed at ${formatISO8601()}*
`;

      await fs.writeFile(sessionFile, markdown, 'utf-8');
      console.log(`Session saved to ${sessionFile}`);
    } catch (error) {
      console.error('Error saving session file:', error);
      throw error;
    }
  }

  /**
   * Update study plan metadata with completion stats
   * @private
   */
  async _updatePlanMetadata(session) {
    try {
      // Read current plan
      const content = await this.fileManager.readStudyPlan(
        session.projectId,
        session.planId
      );

      // Update completed count in frontmatter
      const completedIncrease = session.results.itemsReviewed;
      const updatedContent = content.replace(
        /completed: (\d+)/,
        (match, p1) => `completed: ${parseInt(p1) + completedIncrease}`
      );

      // Save updated plan (without overwriting structure)
      await this.fileManager.saveStudyPlan(
        session.projectId,
        session.planId,
        updatedContent,
        {}
      );
    } catch (error) {
      console.error('Error updating plan metadata:', error);
      // Don't throw - this is non-critical
    }
  }

  /**
   * Export session data
   */
  async exportSessionData(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return {
      id: session.id,
      projectId: session.projectId,
      planId: session.planId,
      technique: session.technique,
      startTime: session.startTime,
      items: session.items,
      results: session.results
    };
  }

  /**
   * Clear all sessions
   */
  clearSessions() {
    this.sessions.clear();
  }
}

module.exports = SessionManager;
