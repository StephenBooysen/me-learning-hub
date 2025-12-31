/**
 * Unit Tests for Session Manager
 */

const SessionManager = require('../electron/app/js/session-manager');
const SpacedRepetition = require('../electron/app/js/learning-modes/spaced-repetition');

jest.mock('../electron/app/js/file-manager');

describe('SessionManager', () => {
  let sessionManager;
  let mockFileManager;
  let mockAiClient;
  let spacedRepetition;

  beforeEach(() => {
    mockFileManager = {
      readStudyPlan: jest.fn(),
      saveStudyPlan: jest.fn()
    };
    mockAiClient = {};
    spacedRepetition = new SpacedRepetition();

    sessionManager = new SessionManager(mockFileManager, spacedRepetition, mockAiClient);
  });

  describe('Constructor', () => {
    test('should initialize with required dependencies', () => {
      expect(sessionManager.fileManager).toBeDefined();
      expect(sessionManager.spacedRepetition).toBeDefined();
      expect(sessionManager.aiClient).toBeDefined();
      expect(sessionManager.sessions).toBeInstanceOf(Map);
    });
  });

  describe('Session Management', () => {
    test('should create new session with valid plan', async () => {
      const mockPlanContent = `---
title: Test Plan
---
## Items
- Item 1: Question about topic
- Item 2: Another question`;

      mockFileManager.readStudyPlan.mockResolvedValue({
        content: mockPlanContent
      });

      const session = await sessionManager.startSession('project-1', 'plan-1');

      expect(session.id).toBeTruthy();
      expect(session.projectId).toBe('project-1');
      expect(session.planId).toBe('plan-1');
    });

    test('should throw error if plan reading fails', async () => {
      mockFileManager.readStudyPlan.mockRejectedValue(
        new Error('File not found')
      );

      await expect(
        sessionManager.startSession('project-1', 'plan-1')
      ).rejects.toThrow();
    });

    test('should filter by technique if specified', async () => {
      mockFileManager.readStudyPlan.mockResolvedValue({
        content: '---\ntitle: Plan\n---\n## Items'
      });

      // Mock _selectItems method
      sessionManager._selectItems = jest.fn().mockReturnValue([
        { id: 'item-1', technique: 'Active Recall' }
      ]);

      await sessionManager.startSession('project-1', 'plan-1', {
        technique: 'Active Recall'
      });

      expect(sessionManager._selectItems).toHaveBeenCalled();
    });

    test('should limit session items to max', async () => {
      mockFileManager.readStudyPlan.mockResolvedValue({
        content: '---\ntitle: Plan\n---\n## Items'
      });

      // Create many items
      const manyItems = Array(50).fill(0).map((_, i) => ({
        id: `item-${i}`,
        question: `Question ${i}`,
        nextReviewDate: new Date().toISOString()
      }));

      sessionManager._selectItems = jest.fn().mockReturnValue(manyItems);
      sessionManager.spacedRepetition.getItemsDueForReview = jest.fn()
        .mockReturnValue(manyItems);

      const session = await sessionManager.startSession('project-1', 'plan-1', {
        maxItems: 10
      });

      expect(session.items.length).toBeLessThanOrEqual(10);
    });

    test('should store session in memory', async () => {
      mockFileManager.readStudyPlan.mockResolvedValue({
        content: '---\ntitle: Plan\n---'
      });
      sessionManager._selectItems = jest.fn().mockReturnValue([]);

      const session = await sessionManager.startSession('project-1', 'plan-1');

      expect(sessionManager.sessions.has(session.id)).toBe(true);
    });
  });

  describe('Session Retrieval', () => {
    test('should get active session by ID', async () => {
      mockFileManager.readStudyPlan.mockResolvedValue({
        content: '---\ntitle: Plan\n---'
      });
      sessionManager._selectItems = jest.fn().mockReturnValue([]);

      const created = await sessionManager.startSession('project-1', 'plan-1');
      const retrieved = sessionManager.getSession(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
    });

    test('should return undefined for non-existent session', () => {
      const session = sessionManager.getSession('non-existent-id');
      expect(session).toBeUndefined();
    });
  });

  describe('Item Navigation', () => {
    let sessionId;

    beforeEach(async () => {
      mockFileManager.readStudyPlan.mockResolvedValue({
        content: '---\ntitle: Plan\n---'
      });
      sessionManager._selectItems = jest.fn().mockReturnValue([
        { id: 'item-1', question: 'Q1' },
        { id: 'item-2', question: 'Q2' },
        { id: 'item-3', question: 'Q3' }
      ]);

      const session = await sessionManager.startSession('project-1', 'plan-1');
      sessionId = session.id;
    });

    test('should get current item', () => {
      const item = sessionManager.getCurrentItem(sessionId);
      expect(item).toBeDefined();
      expect(item.id).toBe('item-1');
    });

    test('should move to next item', () => {
      sessionManager.nextItem(sessionId);
      const item = sessionManager.getCurrentItem(sessionId);
      expect(item.id).toBe('item-2');
    });

    test('should move to previous item', () => {
      sessionManager.nextItem(sessionId);
      sessionManager.previousItem(sessionId);
      const item = sessionManager.getCurrentItem(sessionId);
      expect(item.id).toBe('item-1');
    });
  });

  describe('Response Recording', () => {
    let sessionId;

    beforeEach(async () => {
      mockFileManager.readStudyPlan.mockResolvedValue({
        content: '---\ntitle: Plan\n---'
      });
      sessionManager._selectItems = jest.fn().mockReturnValue([
        { id: 'item-1', question: 'Q1', interval: 0, repetitions: 0, easeFactor: 2.5 },
        { id: 'item-2', question: 'Q2' }
      ]);

      const session = await sessionManager.startSession('project-1', 'plan-1');
      sessionId = session.id;
    });

    test('should record response to item', () => {
      const result = sessionManager.recordResponse(sessionId, 5, 30, 4);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    test('should calculate next review after response', () => {
      const currentItem = sessionManager.getCurrentItem(sessionId);
      sessionManager.recordResponse(sessionId, 5, 30);

      const session = sessionManager.getSession(sessionId);
      const result = session.results.itemResults[0];

      expect(result.quality).toBe(5);
      expect(result.nextReviewDate).toBeTruthy();
    });

    test('should track session statistics', () => {
      sessionManager.recordResponse(sessionId, 5, 30);
      sessionManager.recordResponse(sessionId, 4, 25);

      const session = sessionManager.getSession(sessionId);
      expect(session.results.itemsReviewed).toBe(2);
    });
  });

  describe('Session Completion', () => {
    let sessionId;

    beforeEach(async () => {
      mockFileManager.readStudyPlan.mockResolvedValue({
        content: '---\ntitle: Plan\n---'
      });
      sessionManager._selectItems = jest.fn().mockReturnValue([
        { id: 'item-1', question: 'Q1' }
      ]);

      const session = await sessionManager.startSession('project-1', 'plan-1');
      sessionId = session.id;
    });

    test('should end session and return summary', async () => {
      sessionManager.recordResponse(sessionId, 5, 30);

      const summary = await sessionManager.endSession(sessionId);

      expect(summary).toBeDefined();
      expect(summary.totalItems).toBe(1);
      expect(summary.itemsReviewed).toBe(1);
      expect(summary.totalTimeSeconds).toBeGreaterThan(0);
    });

    test('should remove session from memory after completion', async () => {
      sessionManager.recordResponse(sessionId, 5, 30);
      await sessionManager.endSession(sessionId);

      expect(sessionManager.getSession(sessionId)).toBeUndefined();
    });

    test('should throw error when ending non-existent session', async () => {
      await expect(
        sessionManager.endSession('non-existent-id')
      ).rejects.toThrow();
    });
  });

  describe('Session Pause/Resume', () => {
    let sessionId;

    beforeEach(async () => {
      mockFileManager.readStudyPlan.mockResolvedValue({
        content: '---\ntitle: Plan\n---'
      });
      sessionManager._selectItems = jest.fn().mockReturnValue([
        { id: 'item-1', question: 'Q1' }
      ]);

      const session = await sessionManager.startSession('project-1', 'plan-1');
      sessionId = session.id;
    });

    test('should pause session', () => {
      sessionManager.pauseSession(sessionId);
      const session = sessionManager.getSession(sessionId);

      expect(session.pausedAt).toBeTruthy();
    });

    test('should resume session', () => {
      sessionManager.pauseSession(sessionId);
      sessionManager.resumeSession(sessionId);
      const session = sessionManager.getSession(sessionId);

      expect(session.pausedAt).toBeNull();
    });
  });
});
