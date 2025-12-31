/**
 * Unit Tests for Spaced Repetition Module
 */

const SpacedRepetition = require('../electron/app/js/learning-modes/spaced-repetition');

describe('Spaced Repetition Module', () => {
  let sr;

  beforeEach(() => {
    sr = new SpacedRepetition();
  });

  describe('calculateNextReview', () => {
    test('should throw error for invalid quality', () => {
      expect(() => {
        sr.calculateNextReview(-1, 0, 0, 2.5);
      }).toThrow('Quality must be an integer between 0 and 5');

      expect(() => {
        sr.calculateNextReview(6, 0, 0, 2.5);
      }).toThrow('Quality must be an integer between 0 and 5');

      expect(() => {
        sr.calculateNextReview(2.5, 0, 0, 2.5);
      }).toThrow('Quality must be an integer between 0 and 5');
    });

    test('should reset interval to 1 for low quality responses', () => {
      const result = sr.calculateNextReview(2, 5, 10, 2.5);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(0);
    });

    test('should set interval to 1 for first correct response', () => {
      const result = sr.calculateNextReview(3, 0, 0, 2.5);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
    });

    test('should set interval to 3 for second correct response', () => {
      const result = sr.calculateNextReview(4, 1, 1, 2.5);
      expect(result.interval).toBe(3);
      expect(result.repetitions).toBe(2);
    });

    test('should calculate interval using ease factor for subsequent reviews', () => {
      const result = sr.calculateNextReview(5, 2, 3, 2.5);
      expect(result.interval).toBe(Math.round(3 * 2.5));
      expect(result.repetitions).toBe(3);
    });

    test('should update ease factor for correct responses', () => {
      const result = sr.calculateNextReview(5, 0, 0, 2.5);
      expect(result.easeFactor).toBeGreaterThan(2.5);
    });

    test('should decrease ease factor for difficult responses', () => {
      const result = sr.calculateNextReview(2, 5, 10, 2.5);
      expect(result.easeFactor).toBeLessThan(2.5);
    });

    test('should maintain minimum ease factor', () => {
      const result = sr.calculateNextReview(0, 10, 30, 1.3);
      expect(result.easeFactor).toBeGreaterThanOrEqual(sr.minEaseFactor);
    });

    test('should include nextReviewDate in result', () => {
      const result = sr.calculateNextReview(4, 0, 0, 2.5);
      expect(result).toHaveProperty('nextReviewDate');
      expect(result.nextReviewDate).toMatch(/^\d{4}-\d{2}-\d{2}/);
    });

    test('should round ease factor to 2 decimal places', () => {
      const result = sr.calculateNextReview(3, 0, 0, 2.5);
      const decimalPlaces = (result.easeFactor.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });
  });

  describe('calculateNextReviewDate', () => {
    test('should return a valid ISO date', () => {
      const result = sr.calculateNextReviewDate(1);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}/);
    });

    test('should calculate correct date offset', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const result = sr.calculateNextReviewDate(1);
      const resultDate = new Date(result);

      expect(resultDate.getDate()).toBe(tomorrow.getDate());
    });

    test('should handle zero days interval', () => {
      const today = new Date();
      const result = sr.calculateNextReviewDate(0);
      const resultDate = new Date(result);
      expect(resultDate.getDate()).toBe(today.getDate());
    });

    test('should handle large day intervals', () => {
      const result = sr.calculateNextReviewDate(365);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}/);
    });
  });

  describe('getQualityDescription', () => {
    test('should return correct descriptions for each quality level', () => {
      expect(sr.getQualityDescription(0)).toBe('Complete blackout, correct answer unknown');
      expect(sr.getQualityDescription(1)).toBe('Incorrect response, correct answer seems easy');
      expect(sr.getQualityDescription(2)).toBe('Incorrect response, correct answer remembered');
      expect(sr.getQualityDescription(3)).toBe('Correct response with serious difficulty');
      expect(sr.getQualityDescription(4)).toBe('Correct response after some hesitation');
      expect(sr.getQualityDescription(5)).toBe('Perfect response');
    });

    test('should return empty string for invalid quality', () => {
      expect(sr.getQualityDescription(6)).toBe('');
      expect(sr.getQualityDescription(-1)).toBe('');
    });
  });

  describe('initializeItem', () => {
    test('should create item with correct initial values', () => {
      const item = sr.initializeItem('item1');
      expect(item.id).toBe('item1');
      expect(item.interval).toBe(0);
      expect(item.repetitions).toBe(0);
      expect(item.easeFactor).toBe(sr.initialEaseFactor);
      expect(item.lastReviewedDate).toBeNull();
      expect(item.reviews).toEqual([]);
    });

    test('should set nextReviewDate to today', () => {
      const item = sr.initializeItem('item1');
      expect(item.nextReviewDate).toBeDefined();
      expect(item.nextReviewDate).toMatch(/^\d{4}-\d{2}-\d{2}/);
    });

    test('should create unique items', () => {
      const item1 = sr.initializeItem('item1');
      const item2 = sr.initializeItem('item2');
      expect(item1.id).not.toBe(item2.id);
    });
  });

  describe('getItemsDueForReview', () => {
    test('should return items with nextReviewDate in the past', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const items = [
        { id: '1', nextReviewDate: pastDate.toISOString() },
        { id: '2', nextReviewDate: new Date().toISOString() }
      ];

      const result = sr.getItemsDueForReview(items);
      expect(result.length).toBeGreaterThan(0);
      expect(result.some(item => item.id === '1')).toBe(true);
    });

    test('should return items without nextReviewDate', () => {
      const items = [
        { id: '1', nextReviewDate: null },
        { id: '2', nextReviewDate: new Date().toISOString() }
      ];

      const result = sr.getItemsDueForReview(items);
      expect(result.some(item => item.id === '1')).toBe(true);
    });

    test('should not return items with future review dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const items = [
        { id: '1', nextReviewDate: futureDate.toISOString() }
      ];

      const result = sr.getItemsDueForReview(items);
      expect(result.length).toBe(0);
    });

    test('should handle empty array', () => {
      const result = sr.getItemsDueForReview([]);
      expect(result).toEqual([]);
    });
  });

  describe('getItemsDueInDays', () => {
    test('should return items due in next N days', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const items = [
        { id: '1', nextReviewDate: tomorrow.toISOString() }
      ];

      const result = sr.getItemsDueInDays(items, 7);
      expect(result.length).toBeGreaterThan(0);
    });

    test('should not include items due before now', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const items = [
        { id: '1', nextReviewDate: yesterday.toISOString() }
      ];

      const result = sr.getItemsDueInDays(items, 7);
      expect(result.length).toBe(0);
    });

    test('should not include items due after N days', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const items = [
        { id: '1', nextReviewDate: futureDate.toISOString() }
      ];

      const result = sr.getItemsDueInDays(items, 7);
      expect(result.length).toBe(0);
    });

    test('should use default of 7 days', () => {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 5);

      const items = [
        { id: '1', nextReviewDate: nextWeek.toISOString() }
      ];

      const result = sr.getItemsDueInDays(items);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('recordReview', () => {
    test('should update item with review result', () => {
      const item = sr.initializeItem('item1');
      const reviewed = sr.recordReview(item, 5, 60, 5);

      expect(reviewed.id).toBe('item1');
      expect(reviewed.lastReviewedDate).toBeDefined();
      expect(reviewed.reviews.length).toBe(1);
    });

    test('should calculate next review date', () => {
      const item = sr.initializeItem('item1');
      const reviewed = sr.recordReview(item, 4, 60);

      expect(reviewed.nextReviewDate).toBeDefined();
      expect(reviewed.nextReviewDate).toMatch(/^\d{4}-\d{2}-\d{2}/);
    });

    test('should record review details', () => {
      const item = sr.initializeItem('item1');
      const reviewed = sr.recordReview(item, 3, 45, 4);

      const review = reviewed.reviews[0];
      expect(review.quality).toBe(3);
      expect(review.timeSpent).toBe(45);
      expect(review.confidence).toBe(4);
      expect(review.timestamp).toBeDefined();
    });

    test('should use default confidence if not provided', () => {
      const item = sr.initializeItem('item1');
      const reviewed = sr.recordReview(item, 4, 60);

      const review = reviewed.reviews[0];
      expect(review.confidence).toBe(3);
    });

    test('should accumulate multiple reviews', () => {
      let item = sr.initializeItem('item1');
      item = sr.recordReview(item, 4, 60);
      item = sr.recordReview(item, 3, 45);

      expect(item.reviews.length).toBe(2);
    });

    test('should maintain original item id', () => {
      const item = sr.initializeItem('test-id-123');
      const reviewed = sr.recordReview(item, 5, 60);
      expect(reviewed.id).toBe('test-id-123');
    });
  });

  describe('calculateItemStats', () => {
    test('should return zero stats for unreviewed item', () => {
      const item = sr.initializeItem('item1');
      const stats = sr.calculateItemStats(item);

      expect(stats.totalReviews).toBe(0);
      expect(stats.correctReviews).toBe(0);
      expect(stats.accuracy).toBe(0);
    });

    test('should calculate correct review count', () => {
      let item = sr.initializeItem('item1');
      item = sr.recordReview(item, 4, 60);
      item = sr.recordReview(item, 3, 45);
      item = sr.recordReview(item, 5, 50);

      const stats = sr.calculateItemStats(item);
      expect(stats.totalReviews).toBe(3);
    });

    test('should count correct reviews (quality >= 3)', () => {
      let item = sr.initializeItem('item1');
      item = sr.recordReview(item, 2, 60); // incorrect
      item = sr.recordReview(item, 4, 45); // correct
      item = sr.recordReview(item, 3, 50); // correct

      const stats = sr.calculateItemStats(item);
      expect(stats.correctReviews).toBe(2);
    });

    test('should calculate accuracy percentage', () => {
      let item = sr.initializeItem('item1');
      item = sr.recordReview(item, 5, 60);
      item = sr.recordReview(item, 5, 45);
      item = sr.recordReview(item, 5, 50);

      const stats = sr.calculateItemStats(item);
      expect(stats.accuracy).toBe(100);
    });

    test('should calculate average confidence', () => {
      let item = sr.initializeItem('item1');
      item = sr.recordReview(item, 4, 60, 5);
      item = sr.recordReview(item, 3, 45, 3);
      item = sr.recordReview(item, 5, 50, 4);

      const stats = sr.calculateItemStats(item);
      expect(stats.averageConfidence).toBe(4);
    });

    test('should calculate average time per review', () => {
      let item = sr.initializeItem('item1');
      item = sr.recordReview(item, 4, 60);
      item = sr.recordReview(item, 3, 30);
      item = sr.recordReview(item, 5, 50);

      const stats = sr.calculateItemStats(item);
      expect(stats.averageTimePerReview).toBeCloseTo(46.67, 0);
    });
  });

  describe('SM-2 Algorithm Integration', () => {
    test('should implement complete SM-2 workflow', () => {
      // Create item
      let item = sr.initializeItem('test-item');
      expect(item.repetitions).toBe(0);
      expect(item.interval).toBe(0);

      // First review - correct
      item = sr.recordReview(item, 4, 60);
      expect(item.repetitions).toBe(1);
      expect(item.interval).toBe(1);

      // Second review - correct
      item = sr.recordReview(item, 4, 45);
      expect(item.repetitions).toBe(2);
      expect(item.interval).toBe(3);

      // Third review - correct
      item = sr.recordReview(item, 5, 50);
      expect(item.repetitions).toBe(3);
      expect(item.interval).toBeGreaterThan(3);
    });

    test('should handle review progress with varying quality', () => {
      let item = sr.initializeItem('test-item');

      // Perfect review
      item = sr.recordReview(item, 5, 60);
      const stats1 = sr.calculateItemStats(item);
      const accuracy1 = stats1.accuracy;

      // One incorrect review
      item = sr.recordReview(item, 2, 60);
      const stats2 = sr.calculateItemStats(item);
      const accuracy2 = stats2.accuracy;

      expect(accuracy2).toBeLessThan(accuracy1);
    });
  });
});
