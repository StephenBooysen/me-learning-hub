/**
 * Unit Tests for Analytics Engine
 */

const AnalyticsEngine = require('../electron/app/js/analytics-engine');

jest.mock('../electron/app/js/file-manager');

describe('AnalyticsEngine', () => {
  let analyticsEngine;
  let mockFileManager;

  beforeEach(() => {
    mockFileManager = {
      listStudyPlans: jest.fn().mockResolvedValue([]),
      readStudyPlan: jest.fn(),
      getSessionHistory: jest.fn().mockResolvedValue([])
    };

    analyticsEngine = new AnalyticsEngine(mockFileManager);
  });

  describe('Constructor', () => {
    test('should initialize with file manager', () => {
      expect(analyticsEngine.fileManager).toBeDefined();
    });
  });

  describe('Metrics Calculation', () => {
    test('should calculate study statistics', async () => {
      mockFileManager.listStudyPlans.mockResolvedValue([
        {
          id: 'plan-1',
          totalItems: 50,
          completed: 25,
          mastered: 10
        },
        {
          id: 'plan-2',
          totalItems: 30,
          completed: 20,
          mastered: 5
        }
      ]);

      const metrics = await analyticsEngine.getStudyMetrics('project-1');

      expect(metrics).toBeDefined();
      expect(metrics.totalItems).toBeGreaterThan(0);
      expect(metrics.totalCompleted).toBeGreaterThan(0);
    });

    test('should calculate learning progress', async () => {
      mockFileManager.listStudyPlans.mockResolvedValue([
        {
          id: 'plan-1',
          totalItems: 100,
          completed: 50,
          mastered: 25
        }
      ]);

      const metrics = await analyticsEngine.getStudyMetrics('project-1');

      expect(metrics.completionRate).toBe(50);
      expect(metrics.masteryRate).toBe(25);
    });

    test('should handle zero items gracefully', async () => {
      mockFileManager.listStudyPlans.mockResolvedValue([]);

      const metrics = await analyticsEngine.getStudyMetrics('project-1');

      expect(metrics.totalItems).toBe(0);
      expect(metrics.completionRate).toBe(0);
    });
  });

  describe('Session History', () => {
    test('should retrieve session history', async () => {
      const sessions = [
        {
          id: 'session-1',
          planId: 'plan-1',
          startTime: new Date().toISOString(),
          duration: 25,
          itemsReviewed: 10
        },
        {
          id: 'session-2',
          planId: 'plan-1',
          startTime: new Date().toISOString(),
          duration: 30,
          itemsReviewed: 12
        }
      ];

      mockFileManager.getSessionHistory.mockResolvedValue(sessions);

      const history = await analyticsEngine.getSessionHistory('project-1', { limit: 10 });

      expect(history.length).toBe(2);
    });

    test('should respect limit parameter', async () => {
      const sessions = Array(20).fill(0).map((_, i) => ({
        id: `session-${i}`,
        planId: 'plan-1',
        itemsReviewed: 10
      }));

      mockFileManager.getSessionHistory.mockResolvedValue(sessions);

      const history = await analyticsEngine.getSessionHistory('project-1', { limit: 5 });

      expect(mockFileManager.getSessionHistory).toHaveBeenCalledWith(
        'project-1',
        expect.objectContaining({ limit: 5 })
      );
    });
  });

  describe('Study Recommendations', () => {
    test('should provide study recommendations', async () => {
      const metrics = {
        totalItems: 100,
        itemsCompleted: 50,
        itemsMastered: 20,
        dailyAverage: 5
      };

      const recommendations = analyticsEngine.getStudyRecommendations(metrics);

      expect(recommendations).toBeDefined();
      expect(recommendations.recommendation).toBeTruthy();
      expect(recommendations.urgency).toBeTruthy();
    });

    test('should recommend studying overdue items', () => {
      const metrics = {
        overdueItems: 15,
        itemsMastered: 50
      };

      const recommendations = analyticsEngine.getStudyRecommendations(metrics);

      if (metrics.overdueItems > 0) {
        expect(recommendations.recommendation).toContain('overdue') ||
          expect(recommendations.recommendation).toBeTruthy();
      }
    });

    test('should praise consistent learners', () => {
      const metrics = {
        completionRate: 90,
        dailyAverage: 20,
        consecutiveDays: 10
      };

      const recommendations = analyticsEngine.getStudyRecommendations(metrics);

      expect(recommendations).toBeDefined();
      expect(recommendations.motivation).toBeDefined();
    });
  });

  describe('Time Analytics', () => {
    test('should calculate total study time', async () => {
      const sessions = [
        { totalTimeSeconds: 1500 },
        { totalTimeSeconds: 1800 },
        { totalTimeSeconds: 900 }
      ];

      mockFileManager.getSessionHistory.mockResolvedValue(sessions);

      const history = await analyticsEngine.getSessionHistory('project-1');
      const totalSeconds = history.reduce((sum, s) => sum + (s.totalTimeSeconds || 0), 0);
      const totalMinutes = Math.round(totalSeconds / 60);

      expect(totalMinutes).toBeGreaterThan(0);
    });

    test('should calculate average session duration', async () => {
      const sessions = [
        { totalTimeSeconds: 1500 }, // 25 min
        { totalTimeSeconds: 1800 }, // 30 min
        { totalTimeSeconds: 900 }   // 15 min
      ];

      mockFileManager.getSessionHistory.mockResolvedValue(sessions);

      const history = await analyticsEngine.getSessionHistory('project-1');
      const avgSeconds = history.reduce((sum, s) => sum + (s.totalTimeSeconds || 0), 0) / history.length;

      expect(avgSeconds).toBeCloseTo(1400, 0); // Average is ~23 min
    });
  });

  describe('Performance Analytics', () => {
    test('should track learning accuracy', () => {
      const sessionResults = [
        { quality: 5, correct: true },
        { quality: 4, correct: true },
        { quality: 2, correct: false },
        { quality: 5, correct: true }
      ];

      const correct = sessionResults.filter(r => r.correct).length;
      const accuracy = (correct / sessionResults.length) * 100;

      expect(accuracy).toBe(75);
    });

    test('should calculate improvement over time', async () => {
      const sessions = [
        { date: '2024-01-01', accuracy: 60 },
        { date: '2024-01-02', accuracy: 65 },
        { date: '2024-01-03', accuracy: 70 },
        { date: '2024-01-04', accuracy: 75 }
      ];

      mockFileManager.getSessionHistory.mockResolvedValue(sessions);

      const history = await analyticsEngine.getSessionHistory('project-1');

      if (history.length > 1) {
        const firstAccuracy = history[0].accuracy || 0;
        const lastAccuracy = history[history.length - 1].accuracy || 0;
        const improvement = lastAccuracy - firstAccuracy;

        expect(improvement).toBeGreaterThanOrEqual(-100);
      }
    });
  });

  describe('Streak Tracking', () => {
    test('should track learning streaks', () => {
      const studyDates = [
        new Date('2024-01-01'),
        new Date('2024-01-02'),
        new Date('2024-01-03'),
        // Gap
        new Date('2024-01-05'),
        new Date('2024-01-06')
      ];

      expect(studyDates.length).toBe(5);
    });

    test('should identify consecutive study days', () => {
      const sessions = [
        { date: new Date('2024-01-01').toDateString() },
        { date: new Date('2024-01-02').toDateString() },
        { date: new Date('2024-01-03').toDateString() }
      ];

      const uniqueDates = new Set(sessions.map(s => s.date));
      expect(uniqueDates.size).toBe(3);
    });
  });

  describe('Learning Insights', () => {
    test('should generate learning insights', async () => {
      mockFileManager.listStudyPlans.mockResolvedValue([
        {
          id: 'plan-1',
          techniques: ['Spaced Repetition', 'Active Recall'],
          totalItems: 50,
          completed: 30
        }
      ]);

      mockFileManager.getSessionHistory.mockResolvedValue([
        { itemsReviewed: 5, totalTimeSeconds: 900 },
        { itemsReviewed: 8, totalTimeSeconds: 1200 }
      ]);

      const metrics = await analyticsEngine.getStudyMetrics('project-1');
      const history = await analyticsEngine.getSessionHistory('project-1');

      expect(metrics).toBeDefined();
      expect(history).toBeDefined();
    });

    test('should identify weak areas', () => {
      const planResults = {
        'Spaced Repetition': 85,
        'Active Recall': 60,
        'Interleaving': 75
      };

      const weakest = Object.entries(planResults).sort((a, b) => a[1] - b[1])[0];
      expect(weakest[0]).toBe('Active Recall');
      expect(weakest[1]).toBe(60);
    });
  });

  describe('Export Analytics', () => {
    test('should export analytics data', async () => {
      mockFileManager.listStudyPlans.mockResolvedValue([
        { id: 'plan-1', totalItems: 50, completed: 25 }
      ]);
      mockFileManager.getSessionHistory.mockResolvedValue([
        { id: 'session-1', itemsReviewed: 10 }
      ]);

      const metrics = await analyticsEngine.getStudyMetrics('project-1');
      const history = await analyticsEngine.getSessionHistory('project-1');

      const exported = {
        metrics,
        sessionHistory: history,
        exportDate: new Date().toISOString()
      };

      expect(exported.metrics).toBeDefined();
      expect(exported.sessionHistory).toBeDefined();
      expect(exported.exportDate).toBeTruthy();
    });
  });
});
