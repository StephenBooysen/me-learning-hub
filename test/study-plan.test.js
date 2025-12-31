/**
 * Unit Tests for Study Plan Generator
 */

const StudyPlanGenerator = require('../electron/app/js/study-plan');

jest.mock('../electron/app/js/file-manager');

describe('StudyPlanGenerator', () => {
  let generator;
  let mockFileManager;
  let mockAiClient;

  beforeEach(() => {
    mockFileManager = {
      readMarkdownFile: jest.fn(),
      saveStudyPlan: jest.fn()
    };
    mockAiClient = {
      generateStudyQuestions: jest.fn(),
      generateStudyPlanOutline: jest.fn()
    };

    generator = new StudyPlanGenerator(mockFileManager, mockAiClient);
  });

  describe('Constructor', () => {
    test('should initialize with file manager and AI client', () => {
      expect(generator.fileManager).toBeDefined();
      expect(generator.aiClient).toBeDefined();
      expect(generator.techniques).toHaveLength(4);
    });

    test('should have learning techniques defined', () => {
      expect(generator.techniques).toContain('Spaced Repetition');
      expect(generator.techniques).toContain('Active Recall');
      expect(generator.techniques).toContain('Interleaving');
      expect(generator.techniques).toContain('Feynman Technique');
    });
  });

  describe('generatePlan', () => {
    test('should throw error if document content is empty', async () => {
      mockFileManager.readMarkdownFile.mockResolvedValue({
        content: ''
      });

      await expect(
        generator.generatePlan('project-1', 'doc-1')
      ).rejects.toThrow('Document content is empty');
    });

    test('should read document if content not provided', async () => {
      mockFileManager.readMarkdownFile.mockResolvedValue({
        content: 'Document content'
      });
      mockFileManager.saveStudyPlan.mockResolvedValue({
        path: '/path/to/plan'
      });

      // Mock the private methods
      generator.generateMetadata = jest.fn().mockResolvedValue({
        title: 'Study Plan',
        description: 'Plan description'
      });
      generator.generateTechniqueItems = jest.fn().mockResolvedValue([]);
      generator.createPlanMarkdown = jest.fn().mockReturnValue('# Plan\nContent');

      await generator.generatePlan('project-1', 'doc-1');

      expect(mockFileManager.readMarkdownFile).toHaveBeenCalledWith('project-1', 'doc-1');
    });

    test('should use provided document content', async () => {
      mockFileManager.saveStudyPlan.mockResolvedValue({
        path: '/path/to/plan'
      });

      generator.generateMetadata = jest.fn().mockResolvedValue({
        title: 'Plan',
        description: 'Description'
      });
      generator.generateTechniqueItems = jest.fn().mockResolvedValue([]);
      generator.createPlanMarkdown = jest.fn().mockReturnValue('# Plan');

      await generator.generatePlan('project-1', 'doc-1', {
        documentContent: 'Provided content'
      });

      expect(mockFileManager.readMarkdownFile).not.toHaveBeenCalled();
    });

    test('should use default options if not provided', async () => {
      mockFileManager.saveStudyPlan.mockResolvedValue({
        path: '/path'
      });

      generator.generateMetadata = jest.fn().mockResolvedValue({
        title: 'Plan',
        description: 'Desc'
      });
      generator.generateTechniqueItems = jest.fn().mockResolvedValue([]);
      generator.createPlanMarkdown = jest.fn().mockReturnValue('# Plan');

      const result = await generator.generatePlan('project-1', 'doc-1', {
        documentContent: 'Content'
      });

      expect(result.techniques).toEqual(['Spaced Repetition']);
    });

    test('should save study plan to file', async () => {
      mockFileManager.saveStudyPlan.mockResolvedValue({
        id: 'plan-123',
        path: '/path/to/plan'
      });

      generator.generateMetadata = jest.fn().mockResolvedValue({
        title: 'My Plan',
        description: 'Description'
      });
      generator.generateTechniqueItems = jest.fn().mockResolvedValue([
        { id: 'item-1', question: 'Q1' }
      ]);
      generator.createPlanMarkdown = jest.fn().mockReturnValue('# Plan');

      await generator.generatePlan('project-1', 'doc-1', {
        documentContent: 'Content',
        techniques: ['Spaced Repetition', 'Active Recall']
      });

      expect(mockFileManager.saveStudyPlan).toHaveBeenCalledWith(
        'project-1',
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          techniques: ['Spaced Repetition', 'Active Recall']
        })
      );
    });
  });
});
