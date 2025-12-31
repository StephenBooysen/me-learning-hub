/**
 * Unit Tests for Spaced Repetition SM-2 Algorithm
 */

const SpacedRepetition = require('../electron/app/js/learning-modes/spaced-repetition');

describe('SpacedRepetition SM-2 Algorithm', () => {
  let sr;

  beforeEach(() => {
    sr = new SpacedRepetition();
  });

  describe('Constructor', () => {
    test('should initialize with correct SM-2 constants', () => {
      expect(sr.minEaseFactor).toBe(1.3);
      expect(sr.maxEaseFactor).toBe(2.5);
      expect(sr.initialEaseFactor).toBe(2.5);
    });
  });

  describe('calculateNextReview', () => {
    test('should validate quality parameter', () => {
      expect(() => sr.calculateNextReview(-1, 0, 0, 2.5))
        .toThrow('Quality must be an integer between 0 and 5');
      expect(() => sr.calculateNextReview(6, 0, 0, 2.5))
        .toThrow('Quality must be an integer between 0 and 5');
      expect(() => sr.calculateNextReview(2.5, 0, 0, 2.5))
        .toThrow('Quality must be an integer between 0 and 5');
    });

    test('should calculate first review interval (quality >= 3)', () => {
      const result = sr.calculateNextReview(5, 0, 0, 2.5);
      expect(result.repetitions).toBe(1);
      expect(result.interval).toBe(1); // First interval is 1 day
      expect(result.nextReviewDate).toBeTruthy();
    });

    test('should calculate second review interval', () => {
      const result = sr.calculateNextReview(5, 1, 1, 2.5);
      expect(result.repetitions).toBe(2);
      expect(result.interval).toBe(3); // Second interval is 3 days
    });

    test('should calculate subsequent review intervals', () => {
      let result = sr.calculateNextReview(5, 1, 1, 2.5);
      result = sr.calculateNextReview(5, result.repetitions, result.interval, result.easeFactor);
      expect(result.interval).toBe(Math.round(3 * 2.5)); // interval * easeFactor (rounded)
      expect(result.repetitions).toBe(3);
    });

    test('should reset on incorrect response (quality < 3)', () => {
      const result = sr.calculateNextReview(2, 5, 10, 2.4);
      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(1);
    });

    test('should increase ease factor on high quality responses', () => {
      const result = sr.calculateNextReview(5, 0, 0, 2.5);
      expect(result.easeFactor).toBeGreaterThan(2.5);
    });

    test('should decrease ease factor on low quality responses', () => {
      const initialEase = 2.5;
      const result = sr.calculateNextReview(3, 5, 10, initialEase);
      expect(result.easeFactor).toBeLessThan(initialEase);
    });

    test('should not decrease ease factor below minimum', () => {
      let ease = 1.3;
      let result = sr.calculateNextReview(0, 10, 10, ease);
      expect(result.easeFactor).toBeGreaterThanOrEqual(sr.minEaseFactor);
    });

    test('should round ease factor to 2 decimal places', () => {
      const result = sr.calculateNextReview(5, 0, 0, 2.5);
      const decimalPlaces = (result.easeFactor.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });

    test('should generate next review date', () => {
      const result = sr.calculateNextReview(5, 0, 0, 2.5);
      expect(result.nextReviewDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    test('should handle quality scores 0-5', () => {
      for (let quality = 0; quality <= 5; quality++) {
        expect(() => sr.calculateNextReview(quality, 0, 0, 2.5))
          .not.toThrow();
      }
    });
  });

  describe('calculateNextReviewDate', () => {
    test('should calculate correct date for 0 days', () => {
      const today = new Date();
      const result = sr.calculateNextReviewDate(0);
      const resultDate = new Date(result);
      expect(resultDate.toDateString()).toBe(today.toDateString());
    });

    test('should calculate correct date for future days', () => {
      const days = 5;
      const result = sr.calculateNextReviewDate(days);
      const resultDate = new Date(result);
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + days);
      expect(resultDate.toDateString()).toBe(expectedDate.toDateString());
    });

    test('should return ISO8601 formatted date', () => {
      const result = sr.calculateNextReviewDate(1);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('getQualityDescription', () => {
    test('should return correct descriptions for all quality levels', () => {
      expect(sr.getQualityDescription(0)).toBeTruthy();
      expect(sr.getQualityDescription(1)).toBeTruthy();
      expect(sr.getQualityDescription(2)).toBeTruthy();
      expect(sr.getQualityDescription(3)).toBeTruthy();
      expect(sr.getQualityDescription(4)).toBeTruthy();
      expect(sr.getQualityDescription(5)).toBeTruthy();
    });

    test('should return empty string for invalid quality', () => {
      expect(sr.getQualityDescription(6)).toBe('');
      expect(sr.getQualityDescription(-1)).toBe('');
    });

    test('should have different descriptions for each level', () => {
      const descriptions = [0, 1, 2, 3, 4, 5].map(q => sr.getQualityDescription(q));
      const uniqueDescriptions = new Set(descriptions);
      expect(uniqueDescriptions.size).toBe(6);
    });
  });

  describe('initializeItem', () => {
    test('should create initialized item', () => {
      const item = sr.initializeItem('item-123');
      expect(item.id).toBe('item-123');
      expect(item.interval).toBe(0);
      expect(item.repetitions).toBe(0);
      expect(item.easeFactor).toBe(sr.initialEaseFactor);
      expect(item.nextReviewDate).toBeTruthy();
      expect(item.lastReviewedDate).toBeNull();
      expect(item.reviews).toEqual([]);
    });

    test('should set next review to today', () => {
      const item = sr.initializeItem('item-1');
      const today = new Date();
      const reviewDate = new Date(item.nextReviewDate);
      expect(reviewDate.toDateString()).toBe(today.toDateString());
    });
  });

  describe('getItemsDueForReview', () => {
    test('should return items due today', () => {
      const now = new Date();
      const item = {
        id: 'item-1',
        nextReviewDate: now.toISOString()
      };
      const due = sr.getItemsDueForReview([item]);
      expect(due).toContain(item);
    });

    test('should return items overdue', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const item = {
        id: 'item-1',
        nextReviewDate: yesterday.toISOString()
      };
      const due = sr.getItemsDueForReview([item]);
      expect(due).toContain(item);
    });

    test('should not return future items', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const item = {
        id: 'item-1',
        nextReviewDate: tomorrow.toISOString()
      };
      const due = sr.getItemsDueForReview([item]);
      expect(due).not.toContain(item);
    });

    test('should return items with no review date', () => {
      const item = { id: 'item-1' };
      const due = sr.getItemsDueForReview([item]);
      expect(due).toContain(item);
    });

    test('should handle multiple items', () => {
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const items = [
        { id: 'item-1', nextReviewDate: now.toISOString() },
        { id: 'item-2', nextReviewDate: tomorrow.toISOString() },
        { id: 'item-3', nextReviewDate: now.toISOString() }
      ];

      const due = sr.getItemsDueForReview(items);
      expect(due.length).toBe(2);
    });
  });

  describe('getItemsDueInDays', () => {
    test('should return items due within specified days', () => {
      const in3Days = new Date();
      in3Days.setDate(in3Days.getDate() + 3);

      const item = {
        id: 'item-1',
        nextReviewDate: in3Days.toISOString()
      };

      const due = sr.getItemsDueInDays([item], 5);
      expect(due).toContain(item);
    });

    test('should not return items due beyond specified days', () => {
      const in10Days = new Date();
      in10Days.setDate(in10Days.getDate() + 10);

      const item = {
        id: 'item-1',
        nextReviewDate: in10Days.toISOString()
      };

      const due = sr.getItemsDueInDays([item], 5);
      expect(due).not.toContain(item);
    });

    test('should use default 7 days', () => {
      const in6Days = new Date();
      in6Days.setDate(in6Days.getDate() + 6);

      const item = {
        id: 'item-1',
        nextReviewDate: in6Days.toISOString()
      };

      const due = sr.getItemsDueInDays([item]);
      expect(due).toContain(item);
    });
  });

  describe('recordReview', () => {
    test('should record review and update item', () => {
      const item = sr.initializeItem('item-1');
      const updated = sr.recordReview(item, 5, 45, 4);

      expect(updated.id).toBe('item-1');
      expect(updated.repetitions).toBe(1);
      expect(updated.lastReviewedDate).toBeTruthy();
      expect(updated.reviews).toHaveLength(1);
    });

    test('should store review details', () => {
      const item = sr.initializeItem('item-1');
      const updated = sr.recordReview(item, 4, 30, 5);

      const review = updated.reviews[0];
      expect(review.quality).toBe(4);
      expect(review.timeSpent).toBe(30);
      expect(review.confidence).toBe(5);
      expect(review.timestamp).toBeTruthy();
    });

    test('should use default confidence if not provided', () => {
      const item = sr.initializeItem('item-1');
      const updated = sr.recordReview(item, 5, 45);

      expect(updated.reviews[0].confidence).toBe(3);
    });

    test('should accumulate reviews', () => {
      let item = sr.initializeItem('item-1');
      item = sr.recordReview(item, 5, 45, 4);
      item = sr.recordReview(item, 4, 40, 3);
      item = sr.recordReview(item, 3, 50, 4);

      expect(item.reviews).toHaveLength(3);
    });
  });

  describe('calculateItemStats', () => {
    test('should return zeros for new item', () => {
      const item = sr.initializeItem('item-1');
      const stats = sr.calculateItemStats(item);

      expect(stats.totalReviews).toBe(0);
      expect(stats.correctReviews).toBe(0);
      expect(stats.accuracy).toBe(0);
      expect(stats.averageConfidence).toBe(0);
      expect(stats.averageTimePerReview).toBe(0);
      expect(stats.daysLearning).toBe(0);
    });

    test('should calculate accuracy correctly', () => {
      let item = sr.initializeItem('item-1');
      item = sr.recordReview(item, 5, 45); // Correct
      item = sr.recordReview(item, 4, 40); // Correct
      item = sr.recordReview(item, 2, 50); // Incorrect

      const stats = sr.calculateItemStats(item);
      expect(stats.totalReviews).toBe(3);
      expect(stats.correctReviews).toBe(2);
      expect(stats.accuracy).toBeCloseTo(67, 0); // 2/3 * 100 = 66.67 -> rounds to 67
    });

    test('should calculate average confidence', () => {
      let item = sr.initializeItem('item-1');
      item = sr.recordReview(item, 5, 45, 5);
      item = sr.recordReview(item, 4, 40, 3);
      item = sr.recordReview(item, 3, 50, 1);

      const stats = sr.calculateItemStats(item);
      expect(stats.averageConfidence).toBe(3); // (5 + 3 + 1) / 3 = 3
    });

    test('should calculate average time per review', () => {
      let item = sr.initializeItem('item-1');
      item = sr.recordReview(item, 5, 60);
      item = sr.recordReview(item, 4, 40);

      const stats = sr.calculateItemStats(item);
      expect(stats.averageTimePerReview).toBe(50); // (60 + 40) / 2 = 50
    });

    test('should calculate days of learning', () => {
      let item = sr.initializeItem('item-1');
      // Manually set first review date to 5 days ago
      item.reviews.push({
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        quality: 5,
        timeSpent: 45
      });

      const stats = sr.calculateItemStats(item);
      expect(stats.daysLearning).toBe(5);
    });
  });

  describe('getSessionPlan', () => {
    test('should return empty plan if no items due', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const items = [{
        id: 'item-1',
        nextReviewDate: tomorrow.toISOString()
      }];

      const plan = sr.getSessionPlan(items);
      expect(plan.itemCount).toBe(0);
      expect(plan.items).toHaveLength(0);
      expect(plan.message).toBe('No items due for review');
    });

    test('should select items that fit in session', () => {
      const now = new Date();
      const items = [
        { id: 'item-1', nextReviewDate: now.toISOString() },
        { id: 'item-2', nextReviewDate: now.toISOString() },
        { id: 'item-3', nextReviewDate: now.toISOString() }
      ];

      const plan = sr.getSessionPlan(items, 25); // 25 min session
      expect(plan.itemCount).toBeGreaterThan(0);
      expect(plan.itemCount).toBeLessThanOrEqual(items.length);
    });

    test('should estimate session time', () => {
      const now = new Date();
      const items = Array(10).fill(0).map((_, i) => ({
        id: `item-${i}`,
        nextReviewDate: now.toISOString()
      }));

      const plan = sr.getSessionPlan(items, 30);
      expect(plan.estimatedTimeMinutes).toBeGreaterThan(0);
      expect(plan.estimatedTimeMinutes).toBeLessThanOrEqual(30);
    });

    test('should sort by last reviewed date', () => {
      const now = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const items = [
        { id: 'item-1', nextReviewDate: now.toISOString(), lastReviewedDate: now.toISOString() },
        { id: 'item-2', nextReviewDate: now.toISOString(), lastReviewedDate: yesterday.toISOString() }
      ];

      const plan = sr.getSessionPlan(items);
      if (plan.itemCount > 0) {
        expect(plan.items[0].id).toBe('item-2'); // Reviewed longer ago comes first
      }
    });
  });

  describe('calculateStudyStats', () => {
    test('should calculate stats for empty list', () => {
      const stats = sr.calculateStudyStats([]);
      expect(stats.totalItems).toBe(0);
      expect(stats.itemsMastered).toBe(0);
      expect(stats.itemsLearning).toBe(0);
    });

    test('should categorize mastered items', () => {
      const item = sr.initializeItem('item-1');
      item.repetitions = 20;
      item.easeFactor = 2.0;

      const stats = sr.calculateStudyStats([item]);
      expect(stats.itemsMastered).toBe(1);
    });

    test('should categorize learning items', () => {
      const item = sr.initializeItem('item-1');
      item.repetitions = 5;

      const stats = sr.calculateStudyStats([item]);
      expect(stats.itemsLearning).toBe(1);
    });

    test('should count items due today', () => {
      const now = new Date();
      const item = sr.initializeItem('item-1');
      item.nextReviewDate = now.toISOString();

      const stats = sr.calculateStudyStats([item]);
      expect(stats.itemsDueToday).toBe(1);
    });

    test('should calculate average ease factor', () => {
      const items = [
        { ...sr.initializeItem('item-1'), easeFactor: 2.0 },
        { ...sr.initializeItem('item-2'), easeFactor: 2.5 },
        { ...sr.initializeItem('item-3'), easeFactor: 1.8 }
      ];

      const stats = sr.calculateStudyStats(items);
      expect(stats.averageEaseFactor).toBeCloseTo(2.1, 1);
    });
  });

  describe('getRecommendedStudyTime', () => {
    test('should recommend high urgency if items due today', () => {
      const stats = {
        itemsDueToday: 5,
        itemsDueTomorrow: 0,
        itemsLearning: 10
      };

      const rec = sr.getRecommendedStudyTime(stats);
      expect(rec.urgency).toBe('high');
      expect(rec.recommendation).toContain('due today');
    });

    test('should recommend medium urgency if items due tomorrow', () => {
      const stats = {
        itemsDueToday: 0,
        itemsDueTomorrow: 3,
        itemsLearning: 10
      };

      const rec = sr.getRecommendedStudyTime(stats);
      expect(rec.urgency).toBe('medium');
      expect(rec.recommendation).toContain('due tomorrow');
    });

    test('should recommend low urgency if all caught up', () => {
      const stats = {
        itemsDueToday: 0,
        itemsDueTomorrow: 0,
        itemsLearning: 0
      };

      const rec = sr.getRecommendedStudyTime(stats);
      expect(rec.urgency).toBe('low');
    });

    test('should suggest session duration', () => {
      const stats = {
        itemsDueToday: 0,
        itemsDueTomorrow: 0,
        itemsLearning: 10
      };

      const rec = sr.getRecommendedStudyTime(stats, 30);
      expect(rec.suggestedSessionDuration).toBe(30);
    });
  });

  describe('exportItem', () => {
    test('should export item with all data', () => {
      let item = sr.initializeItem('item-1');
      item.title = 'Test Item';
      item.content = 'Item content';
      item = sr.recordReview(item, 5, 45);

      const exported = sr.exportItem(item);

      expect(exported.id).toBe('item-1');
      expect(exported.title).toBe('Test Item');
      expect(exported.content).toBe('Item content');
      expect(exported.reviews).toHaveLength(1);
    });
  });

  describe('importItem', () => {
    test('should import item and set modified date', () => {
      const itemData = {
        id: 'item-1',
        title: 'Imported Item',
        interval: 5,
        repetitions: 3
      };

      const imported = sr.importItem(itemData);

      expect(imported.id).toBe('item-1');
      expect(imported.title).toBe('Imported Item');
      expect(imported.modified).toBeTruthy();
      expect(imported.reviews).toEqual([]);
    });

    test('should preserve reviews during import', () => {
      const reviews = [
        { timestamp: new Date().toISOString(), quality: 5, timeSpent: 45 }
      ];

      const itemData = { id: 'item-1', reviews };
      const imported = sr.importItem(itemData);

      expect(imported.reviews).toEqual(reviews);
    });
  });
});
