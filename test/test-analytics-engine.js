/**
 * Unit Tests for Analytics Engine Module
 * Tests the dashboard metrics calculation and analytics generation
 */

const AnalyticsEngine = require('../electron/app/js/analytics-engine');
const FileManager = require('../electron/app/js/file-manager');
const SpacedRepetition = require('../electron/app/js/learning-modes/spaced-repetition');
const path = require('path');
const fsSync = require('fs');
const os = require('os');

describe('Analytics Engine Module', () => {
  let analytics;
  let fileManager;
  let spacedRepetition;
  let tempDir;

  beforeEach(async () => {
    // Setup
    tempDir = path.join(os.tmpdir(), `analytics-test-${Date.now()}`);
    fsSync.mkdirSync(tempDir, { recursive: true });

    fileManager = new FileManager(tempDir);
    spacedRepetition = new SpacedRepetition();
    analytics = new AnalyticsEngine(fileManager, spacedRepetition);
  });

  afterEach(async () => {
    // Cleanup
    try {
      const removeDir = (dir) => {
        if (fsSync.existsSync(dir)) {
          fsSync.readdirSync(dir).forEach(file => {
            const filePath = path.join(dir, file);
            if (fsSync.statSync(filePath).isDirectory()) {
              removeDir(filePath);
            } else {
              fsSync.unlinkSync(filePath);
            }
          });
          fsSync.rmdirSync(dir);
        }
      };
      removeDir(tempDir);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('calculateDashboardMetrics', () => {
    test('should calculate metrics for project with no data', async () => {
      const project = await fileManager.createProject('Test Project');

      const metrics = await analytics.calculateDashboardMetrics(project.id);

      expect(metrics).toBeDefined();
      expect(metrics.itemsMastered).toBe(0);
      expect(metrics.totalItems).toBe(0);
      expect(metrics.currentStreak).toBe(0);
      expect(metrics.completionProgress).toBe(0);
    });

    test('should return required metric fields', async () => {
      const project = await fileManager.createProject('Test Project');

      const metrics = await analytics.calculateDashboardMetrics(project.id);

      expect(metrics).toHaveProperty('itemsMastered');
      expect(metrics).toHaveProperty('currentStreak');
      expect(metrics).toHaveProperty('itemsDueToday');
      expect(metrics).toHaveProperty('itemsDueTomorrow');
      expect(metrics).toHaveProperty('itemsDueWeek');
      expect(metrics).toHaveProperty('studyTimeThisWeek');
      expect(metrics).toHaveProperty('averageQuality');
      expect(metrics).toHaveProperty('completionProgress');
      expect(metrics).toHaveProperty('totalItems');
    });

    test('should handle project with documents', async () => {
      const project = await fileManager.createProject('Test Project');

      await fileManager.saveMarkdownFile(
        project.id,
        'doc1',
        '# Test Document\n\nContent here',
        { title: 'Test Doc', sourceUrl: 'https://example.com' }
      );

      const metrics = await analytics.calculateDashboardMetrics(project.id);

      expect(metrics).toBeDefined();
      expect(typeof metrics.itemsMastered).toBe('number');
      expect(typeof metrics.completionProgress).toBe('number');
    });

    test('should calculate valid completion progress', async () => {
      const project = await fileManager.createProject('Test Project');

      const metrics = await analytics.calculateDashboardMetrics(project.id);

      expect(metrics.completionProgress).toBeGreaterThanOrEqual(0);
      expect(metrics.completionProgress).toBeLessThanOrEqual(100);
    });
  });

  describe('aggregateSessionHistory', () => {
    test('should return empty array for project with no sessions', async () => {
      const project = await fileManager.createProject('Test Project');

      const history = await analytics.aggregateSessionHistory(project.id);

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(0);
    });

    test('should accept options parameter', async () => {
      const project = await fileManager.createProject('Test Project');

      const history = await analytics.aggregateSessionHistory(project.id, {
        technique: 'flashcards',
        sort: 'date',
        limit: 10
      });

      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('generateRecommendations', () => {
    test('should generate recommendations from metrics', async () => {
      const metrics = {
        itemsMastered: 10,
        totalItems: 30,
        itemsDueToday: 5,
        itemsDueWeek: 15,
        currentStreak: 3,
        averageQuality: 4.2
      };

      const project = await fileManager.createProject('Test Project');

      const recommendations = await analytics.generateRecommendations(project.id, metrics);

      expect(Array.isArray(recommendations)).toBe(true);
    });

    test('should return prioritized recommendations', async () => {
      const metrics = {
        itemsMastered: 5,
        totalItems: 50,
        itemsDueToday: 20,
        itemsDueWeek: 30,
        currentStreak: 1,
        averageQuality: 3.0
      };

      const project = await fileManager.createProject('Test Project');

      const recommendations = await analytics.generateRecommendations(project.id, metrics);

      if (recommendations.length > 1) {
        expect(recommendations[0].priority).toBeDefined();
      }
    });
  });

  describe('Analytics Integration', () => {
    test('should provide complete analytics workflow', async () => {
      // Create project
      const project = await fileManager.createProject('Learning Project');

      // Save documents
      await fileManager.saveMarkdownFile(
        project.id,
        'doc1',
        '# Study Material\n\nContent for learning',
        { title: 'Material 1' }
      );

      // Calculate metrics
      const metrics = await analytics.calculateDashboardMetrics(project.id);
      expect(metrics).toBeDefined();

      // Get history
      const history = await analytics.aggregateSessionHistory(project.id);
      expect(Array.isArray(history)).toBe(true);

      // Generate recommendations
      const recommendations = await analytics.generateRecommendations(project.id, metrics);
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });
});
