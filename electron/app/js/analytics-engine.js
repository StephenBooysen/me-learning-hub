/**
 * Analytics Engine Module
 * Provides data aggregation and analytics for the learning dashboard
 */

const fs = require('fs').promises;
const path = require('path');
const { parseFrontmatter, formatISO8601, formatDateShort } = require('./utils');

class AnalyticsEngine {
  constructor(fileManager, spacedRepetition) {
    this.fileManager = fileManager;
    this.spacedRepetition = spacedRepetition;
  }

  /**
   * Calculate dashboard metrics for a project
   * Returns 6 key metrics for the analytics dashboard
   */
  async calculateDashboardMetrics(projectId) {
    try {
      const projectPath = this.fileManager.getProjectPath(projectId);

      // Load all study plans to get items
      const studyPlans = await this._readStudyPlans(projectPath);
      let allItems = [];

      for (const plan of studyPlans) {
        allItems = allItems.concat(plan.items || []);
      }

      // Get study statistics
      const stats = this.spacedRepetition.calculateStudyStats(allItems);

      // Read session files for time and quality data
      const sessions = await this._readSessionFiles(projectPath);

      // Calculate metrics
      const metrics = {
        itemsMastered: stats.itemsMastered,
        currentStreak: await this._calculateStreak(sessions),
        itemsDueToday: stats.itemsDueToday,
        itemsDueTomorrow: stats.itemsDueTomorrow,
        itemsDueWeek: await this._getItemsDueWeek(allItems),
        studyTimeThisWeek: this._calculateWeeklyTime(sessions),
        averageQuality: this._calculateAverageQuality(sessions),
        completionProgress: allItems.length > 0
          ? Math.round((stats.itemsMastered / allItems.length) * 100)
          : 0,
        totalItems: allItems.length
      };

      return metrics;
    } catch (error) {
      console.error('Error calculating dashboard metrics:', error);
      throw error;
    }
  }

  /**
   * Aggregate session history with filtering and sorting
   */
  async aggregateSessionHistory(projectId, options = {}) {
    try {
      const projectPath = this.fileManager.getProjectPath(projectId);
      const sessionFiles = await this._readSessionFiles(projectPath);

      // Apply filters
      let filtered = sessionFiles;

      if (options.technique) {
        filtered = filtered.filter(s => s.technique === options.technique);
      }

      // Apply sorting
      const sortMethod = options.sort || 'date-desc';
      filtered = this._sortSessions(filtered, sortMethod);

      // Apply limit
      const limit = options.limit || 20;
      const limited = filtered.slice(0, limit);

      // Calculate trend for each session
      const withTrends = limited.map((session, index) => ({
        ...session,
        trend: this._calculateSessionTrend(limited, index)
      }));

      return withTrends;
    } catch (error) {
      console.error('Error aggregating session history:', error);
      throw error;
    }
  }

  /**
   * Generate prioritized study recommendations
   */
  async generateRecommendations(projectId, metrics) {
    try {
      const projectPath = this.fileManager.getProjectPath(projectId);
      const sessions = await this._readSessionFiles(projectPath);

      const recommendations = [];

      // 1. URGENT: Items due today
      if (metrics.itemsDueToday > 0) {
        recommendations.push({
          priority: 'urgent',
          type: 'due-items',
          icon: '📅',
          title: 'Items Due Today',
          message: `You have ${metrics.itemsDueToday} item${metrics.itemsDueToday > 1 ? 's' : ''} due today. Review them now to maintain your learning schedule.`,
          actionText: 'Start Study Session'
        });
      }

      // 2. HIGH: Quality declining
      if (sessions.length >= 3) {
        const recentQuality = this._getRecentAverageQuality(sessions, 3);
        const previousQuality = this._getRecentAverageQuality(sessions, 6, 3);

        if (previousQuality > 0 && (previousQuality - recentQuality) > 0.5) {
          recommendations.push({
            priority: 'high',
            type: 'quality-decline',
            icon: '📉',
            title: 'Performance Declining',
            message: 'Your performance has declined recently. Consider smaller, more focused study sessions.',
            actionText: 'View Session History'
          });
        }
      }

      // 3. MEDIUM: No recent sessions
      if (sessions.length > 0) {
        const lastSession = new Date(sessions[0].date);
        const daysSinceSession = Math.floor((Date.now() - lastSession) / (1000 * 60 * 60 * 24));

        if (daysSinceSession >= 2) {
          recommendations.push({
            priority: 'medium',
            type: 'consistency',
            icon: '⏰',
            title: 'Study Consistency',
            message: `You haven't studied in ${daysSinceSession} days. Consistency is key to learning. Get back on track!`,
            actionText: 'Start Study Session'
          });
        }
      }

      // 4. SUGGESTION: Technique diversity
      if (sessions.length >= 5) {
        const techniqueUsage = this._analyzeTechniqueUsage(sessions);
        const dominantTechnique = Object.entries(techniqueUsage).sort((a, b) => b[1] - a[1])[0];

        if (dominantTechnique && (dominantTechnique[1] / sessions.length) > 0.85) {
          const percentage = Math.round((dominantTechnique[1] / sessions.length) * 100);
          recommendations.push({
            priority: 'suggestion',
            type: 'variety',
            icon: '🔄',
            title: 'Diversify Learning Techniques',
            message: `You're using ${dominantTechnique[0]} ${percentage}% of the time. Mix in other techniques for better learning outcomes.`,
            actionText: 'Learn About Techniques'
          });
        }
      }

      // 5. ACHIEVEMENT: Streak milestones
      const streak = metrics.currentStreak || 0;
      if (streak > 0 && (streak === 3 || streak === 7 || streak === 14 || streak % 7 === 0)) {
        recommendations.push({
          priority: 'achievement',
          type: 'streak',
          icon: '🔥',
          title: 'Amazing Streak!',
          message: `Incredible! You've maintained a ${streak}-day study streak. Keep it up!`,
          actionText: 'Continue Studying'
        });
      }

      // 6. ACHIEVEMENT: Mastery milestone
      if (metrics.itemsMastered > 0 && metrics.totalItems > 0) {
        const masteryPercentage = metrics.completionProgress;
        if (masteryPercentage === 25 || masteryPercentage === 50 || masteryPercentage === 75 || masteryPercentage === 100) {
          recommendations.push({
            priority: 'achievement',
            type: 'mastery',
            icon: '🎯',
            title: `${masteryPercentage}% Items Mastered`,
            message: `Congratulations! You've mastered ${masteryPercentage}% of your learning items. Excellent progress!`,
            actionText: 'View Progress'
          });
        }
      }

      // Sort by priority
      const priorityOrder = { urgent: 0, high: 1, medium: 2, suggestion: 3, achievement: 4 };
      recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

      return recommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw error;
    }
  }

  /**
   * Read all study plan files from a project
   * @private
   */
  async _readStudyPlans(projectPath) {
    try {
      const plansDir = path.join(projectPath, 'study-plans');
      const files = await fs.readdir(plansDir);
      const plans = [];

      for (const file of files) {
        if (!file.endsWith('.md')) continue;

        try {
          const content = await fs.readFile(path.join(plansDir, file), 'utf-8');
          const { metadata, content: bodyContent } = parseFrontmatter(content);

          // Parse items from study plan
          const items = this._parseStudyItems(bodyContent);
          plans.push({
            id: metadata.id || file,
            title: metadata.title || file,
            items: items,
            technique: metadata.techniques || '',
            status: metadata.status || 'active'
          });
        } catch (error) {
          console.error(`Error reading study plan ${file}:`, error);
        }
      }

      return plans;
    } catch (error) {
      // Directory might not exist yet
      return [];
    }
  }

  /**
   * Parse study items from markdown content
   * @private
   */
  _parseStudyItems(content) {
    const items = [];

    // Look for flashcard or question patterns
    // Format: ### Question/Flashcard headers with content
    const itemRegex = /###\s+(?:Question|Flashcard|Explanation):\s*(.+?)(?=###|$)/gs;
    let match;

    while ((match = itemRegex.exec(content)) !== null) {
      items.push({
        id: `item-${Math.random().toString(36).substr(2, 9)}`,
        title: match[1].trim(),
        content: match[1].trim(),
        repetitions: 0,
        interval: 0,
        easeFactor: 2.5,
        nextReviewDate: formatISO8601(),
        reviews: []
      });
    }

    return items;
  }

  /**
   * Read all session files from a project
   * @private
   */
  async _readSessionFiles(projectPath) {
    try {
      const progressDir = path.join(projectPath, 'progress');
      const files = await fs.readdir(progressDir);
      const sessions = [];

      for (const file of files) {
        if (!file.startsWith('session-') || !file.endsWith('.md')) continue;

        try {
          const content = await fs.readFile(path.join(progressDir, file), 'utf-8');
          const session = this._parseSessionMetadata(content, file);
          if (session) {
            sessions.push(session);
          }
        } catch (error) {
          console.error(`Error reading session ${file}:`, error);
        }
      }

      return sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
      // Directory might not exist yet
      return [];
    }
  }

  /**
   * Parse session metadata and content
   * @private
   */
  _parseSessionMetadata(content, filename) {
    try {
      const { metadata } = parseFrontmatter(content);

      return {
        id: filename.replace('session-', '').replace('.md', ''),
        date: metadata['session-date'] || metadata.timestamp || new Date().toISOString(),
        technique: metadata.technique || metadata['learning-technique'] || 'Spaced Repetition',
        itemsReviewed: parseInt(metadata['items-reviewed'] || 0),
        quality: parseFloat(metadata['average-quality'] || 0),
        timeSpent: parseInt(metadata['duration-minutes'] || 0),
        completion: parseInt(metadata.completion || 0)
      };
    } catch (error) {
      console.error(`Error parsing session metadata:`, error);
      return null;
    }
  }

  /**
   * Calculate current study streak
   * @private
   */
  async _calculateStreak(sessions) {
    if (sessions.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sort sessions by date descending
    const sorted = sessions.sort((a, b) => new Date(b.date) - new Date(a.date));

    for (let i = 0; i < sorted.length; i++) {
      const sessionDate = new Date(sorted[i].date);
      sessionDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);

      if (sessionDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Get items due within a week
   * @private
   */
  async _getItemsDueWeek(items) {
    const now = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    let count = 0;
    for (const item of items) {
      if (item.nextReviewDate) {
        const dueDate = new Date(item.nextReviewDate);
        if (dueDate >= now && dueDate <= weekFromNow) {
          count++;
        }
      }
    }

    return count;
  }

  /**
   * Calculate study time for this week
   * @private
   */
  _calculateWeeklyTime(sessions) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return sessions
      .filter(s => new Date(s.date) >= oneWeekAgo)
      .reduce((total, s) => total + (s.timeSpent || 0), 0);
  }

  /**
   * Calculate average quality from sessions
   * @private
   */
  _calculateAverageQuality(sessions) {
    if (sessions.length === 0) return 0;

    const recentSessions = sessions.slice(0, 10);
    const sum = recentSessions.reduce((total, s) => total + (s.quality || 0), 0);
    const average = sum / recentSessions.length;

    return Math.round(average * 10) / 10;
  }

  /**
   * Get recent average quality for a range of sessions
   * @private
   */
  _getRecentAverageQuality(sessions, endIndex, startIndex = 0) {
    if (sessions.length === 0) return 0;

    const range = sessions.slice(startIndex, endIndex);
    if (range.length === 0) return 0;

    const sum = range.reduce((total, s) => total + (s.quality || 0), 0);
    return sum / range.length;
  }

  /**
   * Sort sessions by various criteria
   * @private
   */
  _sortSessions(sessions, sortMethod) {
    const copy = [...sessions];

    switch (sortMethod) {
      case 'date-asc':
        return copy.sort((a, b) => new Date(a.date) - new Date(b.date));
      case 'quality-desc':
        return copy.sort((a, b) => b.quality - a.quality);
      case 'quality-asc':
        return copy.sort((a, b) => a.quality - b.quality);
      case 'date-desc':
      default:
        return copy.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
  }

  /**
   * Calculate trend for a session compared to previous ones
   * @private
   */
  _calculateSessionTrend(sessions, currentIndex) {
    if (currentIndex === 0 || sessions.length < 2) return 'stable';

    const currentQuality = sessions[currentIndex].quality;
    const previousQuality = sessions[currentIndex + 1]?.quality || currentQuality;

    if (currentQuality > previousQuality + 0.3) {
      return 'improving';
    } else if (currentQuality < previousQuality - 0.3) {
      return 'declining';
    } else {
      return 'stable';
    }
  }

  /**
   * Analyze technique usage patterns
   * @private
   */
  _analyzeTechniqueUsage(sessions) {
    const usage = {};

    sessions.forEach(session => {
      const technique = session.technique || 'Unknown';
      usage[technique] = (usage[technique] || 0) + 1;
    });

    return usage;
  }
}

module.exports = AnalyticsEngine;
