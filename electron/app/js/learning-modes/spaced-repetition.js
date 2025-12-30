/**
 * Spaced Repetition Module
 * Implements SM-2 algorithm for intelligent review scheduling
 */

const { formatISO8601 } = require('../utils');

class SpacedRepetition {
  constructor() {
    // SM-2 algorithm constants
    this.minEaseFactor = 1.3;
    this.maxEaseFactor = 2.5;
    this.initialEaseFactor = 2.5;
  }

  /**
   * Calculate next review date using SM-2 algorithm
   * @param {number} quality - Quality of response (0-5)
   * @param {number} repetitions - Number of successful repetitions
   * @param {number} interval - Days until next review
   * @param {number} easeFactor - Difficulty factor
   * @returns {object} Updated SM-2 values
   */
  calculateNextReview(quality, repetitions, interval, easeFactor) {
    if (!Number.isInteger(quality) || quality < 0 || quality > 5) {
      throw new Error('Quality must be an integer between 0 and 5');
    }

    let newRepetitions = repetitions;
    let newInterval = interval;
    let newEaseFactor = easeFactor;

    // Correct response (quality >= 3)
    if (quality >= 3) {
      if (newRepetitions === 0) {
        newInterval = 1;
      } else if (newRepetitions === 1) {
        newInterval = 3;
      } else {
        newInterval = Math.round(interval * easeFactor);
      }
      newRepetitions += 1;
    } else {
      // Incorrect response
      newRepetitions = 0;
      newInterval = 1;
    }

    // Update ease factor
    newEaseFactor = Math.max(
      this.minEaseFactor,
      easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );

    // Round to reasonable precision
    newEaseFactor = Math.round(newEaseFactor * 100) / 100;

    return {
      repetitions: newRepetitions,
      interval: newInterval,
      easeFactor: newEaseFactor,
      nextReviewDate: this.calculateNextReviewDate(newInterval)
    };
  }

  /**
   * Calculate next review date from interval
   */
  calculateNextReviewDate(intervalDays) {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + intervalDays);
    return formatISO8601(nextDate);
  }

  /**
   * Get quality rating explanation
   */
  getQualityDescription(quality) {
    const descriptions = {
      0: 'Complete blackout, correct answer unknown',
      1: 'Incorrect response, correct answer seems easy',
      2: 'Incorrect response, correct answer remembered',
      3: 'Correct response with serious difficulty',
      4: 'Correct response after some hesitation',
      5: 'Perfect response'
    };
    return descriptions[quality] || '';
  }

  /**
   * Initialize SM-2 data for new item
   */
  initializeItem(itemId) {
    return {
      id: itemId,
      interval: 0,
      repetitions: 0,
      easeFactor: this.initialEaseFactor,
      nextReviewDate: formatISO8601(),
      lastReviewedDate: null,
      reviews: []
    };
  }

  /**
   * Get items due for review
   */
  getItemsDueForReview(items) {
    const now = new Date();
    return items.filter(item => {
      if (!item.nextReviewDate) return true;
      const dueDate = new Date(item.nextReviewDate);
      return dueDate <= now;
    });
  }

  /**
   * Get items due in next N days
   */
  getItemsDueInDays(items, days = 7) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return items.filter(item => {
      if (!item.nextReviewDate) return true;
      const dueDate = new Date(item.nextReviewDate);
      return dueDate >= now && dueDate <= futureDate;
    });
  }

  /**
   * Record review session
   */
  recordReview(item, quality, timeSpentSeconds, confidence) {
    const review = {
      timestamp: formatISO8601(),
      quality: quality,
      timeSpent: timeSpentSeconds,
      confidence: confidence || 3
    };

    // Update item
    const updated = this.calculateNextReview(
      quality,
      item.repetitions,
      item.interval,
      item.easeFactor
    );

    return {
      ...item,
      repetitions: updated.repetitions,
      interval: updated.interval,
      easeFactor: updated.easeFactor,
      nextReviewDate: updated.nextReviewDate,
      lastReviewedDate: formatISO8601(),
      reviews: [...(item.reviews || []), review]
    };
  }

  /**
   * Calculate statistics for item
   */
  calculateItemStats(item) {
    const reviews = item.reviews || [];

    if (reviews.length === 0) {
      return {
        totalReviews: 0,
        correctReviews: 0,
        accuracy: 0,
        averageConfidence: 0,
        averageTimePerReview: 0,
        daysLearning: 0
      };
    }

    const correctReviews = reviews.filter(r => r.quality >= 3).length;
    const accuracy = (correctReviews / reviews.length) * 100;
    const averageConfidence = reviews.reduce((sum, r) => sum + (r.confidence || 0), 0) / reviews.length;
    const totalTimeSeconds = reviews.reduce((sum, r) => sum + (r.timeSpent || 0), 0);
    const averageTimePerReview = totalTimeSeconds / reviews.length;

    let daysLearning = 0;
    if (reviews.length > 0) {
      const firstReview = new Date(reviews[0].timestamp);
      const now = new Date();
      daysLearning = Math.floor((now - firstReview) / (1000 * 60 * 60 * 24));
    }

    return {
      totalReviews: reviews.length,
      correctReviews: correctReviews,
      accuracy: Math.round(accuracy),
      averageConfidence: Math.round(averageConfidence * 10) / 10,
      averageTimePerReview: Math.round(averageTimePerReview),
      daysLearning: daysLearning
    };
  }

  /**
   * Get study session plan
   */
  getSessionPlan(items, sessionDurationMinutes = 25) {
    const itemsDue = this.getItemsDueForReview(items);

    if (itemsDue.length === 0) {
      return {
        itemCount: 0,
        estimatedTimeMinutes: 0,
        items: [],
        message: 'No items due for review'
      };
    }

    // Estimate 1-2 minutes per item
    const timePerItem = 1.5;
    let selectedItems = [];
    let totalTime = 0;

    // Sort by priority (least recently reviewed, higher ease factor = harder)
    const sortedItems = itemsDue.sort((a, b) => {
      const aLastReview = a.lastReviewedDate ? new Date(a.lastReviewedDate) : new Date(0);
      const bLastReview = b.lastReviewedDate ? new Date(b.lastReviewedDate) : new Date(0);
      return aLastReview - bLastReview;
    });

    // Select items to fit in session
    for (const item of sortedItems) {
      if (totalTime + timePerItem <= sessionDurationMinutes) {
        selectedItems.push(item);
        totalTime += timePerItem;
      } else {
        break;
      }
    }

    return {
      itemCount: selectedItems.length,
      estimatedTimeMinutes: Math.ceil(totalTime),
      items: selectedItems,
      totalAvailable: itemsDue.length
    };
  }

  /**
   * Calculate study statistics
   */
  calculateStudyStats(items) {
    const stats = {
      totalItems: items.length,
      itemsMastered: 0,
      itemsLearning: 0,
      itemsRelearning: 0,
      itemsDueToday: 0,
      itemsDueTomorrow: 0,
      averageEaseFactor: 0,
      averageInterval: 0,
      cumulativeReviewTime: 0
    };

    let totalEaseFactor = 0;
    let totalInterval = 0;
    let totalTimeSeconds = 0;
    let itemsWithEase = 0;

    for (const item of items) {
      const itemStats = this.calculateItemStats(item);

      // Categorize items
      if (item.repetitions >= 20 && item.easeFactor >= 2.0) {
        stats.itemsMastered++;
      } else if (item.repetitions > 0) {
        stats.itemsLearning++;
      } else if (itemStats.totalReviews > 0 && item.repetitions === 0) {
        stats.itemsRelearning++;
      }

      // Count due dates
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (item.nextReviewDate) {
        const dueDate = new Date(item.nextReviewDate);
        if (dueDate.toDateString() === now.toDateString()) {
          stats.itemsDueToday++;
        } else if (dueDate.toDateString() === tomorrow.toDateString()) {
          stats.itemsDueTomorrow++;
        }
      }

      // Calculate averages
      totalEaseFactor += item.easeFactor || this.initialEaseFactor;
      totalInterval += item.interval || 0;
      totalTimeSeconds += itemStats.averageTimePerReview * itemStats.totalReviews;
      itemsWithEase++;
    }

    if (itemsWithEase > 0) {
      stats.averageEaseFactor = Math.round((totalEaseFactor / itemsWithEase) * 100) / 100;
      stats.averageInterval = Math.round(totalInterval / itemsWithEase);
    }

    stats.cumulativeReviewTime = Math.round(totalTimeSeconds / 60); // Convert to minutes

    return stats;
  }

  /**
   * Get recommended study time
   */
  getRecommendedStudyTime(stats, preferredSessionDuration = 25) {
    let recommendation = '';
    let urgency = 'low';

    if (stats.itemsDueToday > 0) {
      recommendation = `You have ${stats.itemsDueToday} items due today. Review them to maintain your learning schedule.`;
      urgency = 'high';
    } else if (stats.itemsDueTomorrow > 0) {
      recommendation = `You have ${stats.itemsDueTomorrow} items due tomorrow. Consider reviewing today to stay ahead.`;
      urgency = 'medium';
    } else if (stats.itemsLearning > 0) {
      recommendation = `Great job! You're learning. Continue with ${Math.ceil(stats.itemsLearning / 5)} items per day.`;
      urgency = 'low';
    } else {
      recommendation = 'All caught up! Keep up the consistent practice.';
      urgency = 'low';
    }

    return {
      recommendation: recommendation,
      urgency: urgency,
      suggestedSessionDuration: preferredSessionDuration,
      optimalItemsPerSession: Math.max(5, Math.min(15, preferredSessionDuration / 2))
    };
  }

  /**
   * Export item data for backup/transfer
   */
  exportItem(item) {
    return {
      id: item.id,
      title: item.title,
      content: item.content,
      interval: item.interval,
      repetitions: item.repetitions,
      easeFactor: item.easeFactor,
      nextReviewDate: item.nextReviewDate,
      lastReviewedDate: item.lastReviewedDate,
      reviews: item.reviews || [],
      created: item.created,
      modified: item.modified
    };
  }

  /**
   * Import item data
   */
  importItem(itemData) {
    return {
      ...itemData,
      reviews: itemData.reviews || [],
      modified: formatISO8601()
    };
  }
}

module.exports = SpacedRepetition;
