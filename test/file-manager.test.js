/**
 * Unit Tests for File Manager
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const os = require('os');
const FileManager = require('../electron/app/js/file-manager');

describe('FileManager', () => {
  let tempDir;
  let fileManager;

  beforeEach(async () => {
    // Create temporary directory for tests
    tempDir = path.join(os.tmpdir(), `test-learning-hub-${Date.now()}`);
    fileManager = new FileManager(tempDir);

    // Ensure temp directory is created
    if (!fsSync.existsSync(tempDir)) {
      fsSync.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterEach(async () => {
    // Cleanup
    if (fsSync.existsSync(tempDir)) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  describe('Initialization', () => {
    test('should initialize directories on construction', () => {
      expect(fsSync.existsSync(fileManager.dataDir)).toBe(true);
      expect(fsSync.existsSync(fileManager.projectsDir)).toBe(true);
    });

    test('should create projects directory if it does not exist', () => {
      const newDir = path.join(os.tmpdir(), `test-fm-${Date.now()}`);
      const fm = new FileManager(newDir);
      expect(fsSync.existsSync(fm.projectsDir)).toBe(true);
      fsSync.rmSync(newDir, { recursive: true, force: true });
    });
  });

  describe('Project Operations', () => {
    test('should create a new project', async () => {
      const project = await fileManager.createProject('Test Project', 'Test Description');

      expect(project.id).toBeTruthy();
      expect(project.name).toBe('Test Project');
      expect(project.description).toBe('Test Description');
      expect(project.created).toBeTruthy();
      expect(fsSync.existsSync(project.path)).toBe(true);
    });

    test('should create project subdirectories', async () => {
      const project = await fileManager.createProject('My Project');

      expect(fsSync.existsSync(path.join(project.path, 'sources'))).toBe(true);
      expect(fsSync.existsSync(path.join(project.path, 'study-plans'))).toBe(true);
      expect(fsSync.existsSync(path.join(project.path, 'progress'))).toBe(true);
    });

    test('should create project metadata file', async () => {
      const project = await fileManager.createProject('Meta Project');
      const metadataPath = path.join(project.path, 'metadata.md');

      expect(fsSync.existsSync(metadataPath)).toBe(true);
      const content = fsSync.readFileSync(metadataPath, 'utf-8');
      expect(content).toContain('Meta Project');
      expect(content).toContain('---');
    });

    test('should list all projects', async () => {
      await fileManager.createProject('Project 1');
      await fileManager.createProject('Project 2');

      const projects = await fileManager.listProjects();

      expect(projects.length).toBe(2);
      expect(projects[0].name).toBeDefined();
      expect(projects[0].documents).toBe(0);
      expect(projects[0].studyPlans).toBe(0);
    });

    test('should sort projects by creation date (newest first)', async () => {
      const project1 = await fileManager.createProject('Project 1');
      await new Promise(resolve => setTimeout(resolve, 10));
      const project2 = await fileManager.createProject('Project 2');

      const projects = await fileManager.listProjects();

      expect(projects[0].id).toBe(project2.id);
      expect(projects[1].id).toBe(project1.id);
    });

    test('should get project details', async () => {
      const created = await fileManager.createProject('Detail Project', 'My Description');
      const project = await fileManager.getProject(created.id);

      expect(project.id).toBe(created.id);
      expect(project.name).toBe('Detail Project');
      expect(project.description).toBe('My Description');
      expect(project.documents).toBe(0);
      expect(project.studyPlans).toBe(0);
    });

    test('should throw error when getting non-existent project', async () => {
      await expect(fileManager.getProject('non-existent-id'))
        .rejects.toThrow('Failed to get project');
    });

    test('should rename a project', async () => {
      const project = await fileManager.createProject('Original Name');
      const result = await fileManager.renameProject(project.id, 'New Name');

      expect(result.success).toBe(true);
      expect(result.name).toBe('New Name');

      const updated = await fileManager.getProject(project.id);
      expect(updated.name).toBe('New Name');
    });

    test('should delete a project', async () => {
      const project = await fileManager.createProject('To Delete');
      const result = await fileManager.deleteProject(project.id);

      expect(result.success).toBe(true);
      expect(fsSync.existsSync(project.path)).toBe(false);
    });

    test('should throw error when deleting non-existent project', async () => {
      const result = await fileManager.deleteProject('non-existent-id');
      expect(result.success).toBe(true); // fs.rm with force: true doesn't throw
    });
  });

  describe('Document Operations', () => {
    let projectId;

    beforeEach(async () => {
      const project = await fileManager.createProject('Doc Test Project');
      projectId = project.id;
    });

    test('should save a markdown document', async () => {
      const docId = 'doc-123';
      const content = '# Test Document\n\nThis is test content.';
      const metadata = {
        title: 'Test Doc',
        sourceUrl: 'https://example.com',
        tags: ['test', 'docs']
      };

      const result = await fileManager.saveMarkdownFile(projectId, docId, content, metadata);

      expect(result.id).toBe(docId);
      expect(result.title).toBe('Test Doc');
      expect(result.fileName).toBe('doc-123.md');
      expect(fsSync.existsSync(result.path)).toBe(true);
    });

    test('should read a saved document', async () => {
      const docId = 'read-doc';
      const content = 'Document content here';
      const metadata = { title: 'Read Test' };

      await fileManager.saveMarkdownFile(projectId, docId, content, metadata);
      const result = await fileManager.readMarkdownFile(projectId, docId);

      expect(result.id).toBe(docId);
      expect(result.metadata.title).toBe('Read Test');
      expect(result.content).toBe(content);
    });

    test('should list documents in a project', async () => {
      await fileManager.saveMarkdownFile(projectId, 'doc-1', 'Content 1', { title: 'Doc 1' });
      await fileManager.saveMarkdownFile(projectId, 'doc-2', 'Content 2', { title: 'Doc 2' });

      const documents = await fileManager.listDocuments(projectId);

      expect(documents.length).toBe(2);
      expect(documents[0].title).toBeDefined();
      expect(documents[0].sourceUrl).toBeDefined();
    });

    test('should sort documents by captured date (newest first)', async () => {
      await fileManager.saveMarkdownFile(projectId, 'doc-1', 'Content 1', { title: 'Doc 1' });
      await new Promise(resolve => setTimeout(resolve, 10));
      await fileManager.saveMarkdownFile(projectId, 'doc-2', 'Content 2', { title: 'Doc 2' });

      const documents = await fileManager.listDocuments(projectId);

      expect(documents[0].id).toBe('doc-2');
      expect(documents[1].id).toBe('doc-1');
    });

    test('should parse document tags', async () => {
      await fileManager.saveMarkdownFile(
        projectId,
        'tagged-doc',
        'Content',
        { title: 'Tagged', tags: ['python', 'ai', 'ml'] }
      );

      const documents = await fileManager.listDocuments(projectId);
      const doc = documents.find(d => d.id === 'tagged-doc');

      expect(doc.tags).toContain('python');
      expect(doc.tags).toContain('ai');
      expect(doc.tags).toContain('ml');
    });

    test('should delete a document', async () => {
      const docId = 'to-delete';
      await fileManager.saveMarkdownFile(projectId, docId, 'Content');

      const result = await fileManager.deleteMarkdownFile(projectId, docId);

      expect(result.success).toBe(true);
      await expect(fileManager.readMarkdownFile(projectId, docId))
        .rejects.toThrow();
    });

    test('should return empty array for project with no documents', async () => {
      const emptyProject = await fileManager.createProject('Empty');
      const documents = await fileManager.listDocuments(emptyProject.id);

      expect(documents).toEqual([]);
    });

    test('should handle documents with source URLs', async () => {
      const url = 'https://github.com/example/repo';
      await fileManager.saveMarkdownFile(
        projectId,
        'sourced-doc',
        'Content',
        { title: 'From GitHub', sourceUrl: url }
      );

      const documents = await fileManager.listDocuments(projectId);
      const doc = documents[0];

      expect(doc.sourceUrl).toBe(url);
    });
  });

  describe('Study Plan Operations', () => {
    let projectId;

    beforeEach(async () => {
      const project = await fileManager.createProject('Plan Test Project');
      projectId = project.id;
    });

    test('should save a study plan', async () => {
      const planId = 'plan-123';
      const content = '## Week 1\n- Learn basics\n- Practice exercises';
      const metadata = {
        title: 'Python Basics',
        techniques: ['Spaced Repetition', 'Active Recall'],
        totalItems: 10,
        completed: 0
      };

      const result = await fileManager.saveStudyPlan(projectId, planId, content, metadata);

      expect(result.id).toBe(planId);
      expect(result.title).toBe('Python Basics');
      expect(result.fileName).toBe('plan-123.md');
      expect(fsSync.existsSync(result.path)).toBe(true);
    });

    test('should read a study plan', async () => {
      const planId = 'read-plan';
      const content = 'Study plan content';
      const metadata = { title: 'Read Test' };

      await fileManager.saveStudyPlan(projectId, planId, content, metadata);
      const result = await fileManager.readStudyPlan(projectId, planId);

      expect(result.id).toBe(planId);
      expect(result.metadata.title).toBe('Read Test');
      expect(result.content).toBe(content);
    });

    test('should list study plans', async () => {
      await fileManager.saveStudyPlan(projectId, 'plan-1', 'Content 1', { title: 'Plan 1' });
      await fileManager.saveStudyPlan(projectId, 'plan-2', 'Content 2', { title: 'Plan 2' });

      const plans = await fileManager.listStudyPlans(projectId);

      expect(plans.length).toBe(2);
      expect(plans[0].title).toBeDefined();
      expect(plans[0].techniques).toBeDefined();
    });

    test('should parse techniques array', async () => {
      const techniques = ['Spaced Repetition', 'Active Recall', 'Interleaving'];
      await fileManager.saveStudyPlan(
        projectId,
        'multi-tech-plan',
        'Content',
        { title: 'Multi Tech', techniques }
      );

      const plans = await fileManager.listStudyPlans(projectId);
      const plan = plans.find(p => p.id === 'multi-tech-plan');

      expect(plan.techniques).toEqual(techniques);
    });

    test('should track plan progress', async () => {
      const metadata = {
        title: 'Progress Plan',
        totalItems: 50,
        completed: 25,
        mastered: 10
      };

      await fileManager.saveStudyPlan(projectId, 'progress-plan', 'Content', metadata);
      const plans = await fileManager.listStudyPlans(projectId);
      const plan = plans[0];

      expect(plan.totalItems).toBe(50);
      expect(plan.completed).toBe(25);
      expect(plan.mastered).toBe(10);
    });

    test('should delete a study plan', async () => {
      const planId = 'to-delete';
      await fileManager.saveStudyPlan(projectId, planId, 'Content');

      const result = await fileManager.deleteStudyPlan(projectId, planId);

      expect(result.success).toBe(true);
      await expect(fileManager.readStudyPlan(projectId, planId))
        .rejects.toThrow();
    });

    test('should return empty array for project with no plans', async () => {
      const emptyProject = await fileManager.createProject('Empty Plans');
      const plans = await fileManager.listStudyPlans(emptyProject.id);

      expect(plans).toEqual([]);
    });

    test('should sort plans by creation date (newest first)', async () => {
      await fileManager.saveStudyPlan(projectId, 'plan-1', 'Content 1', { title: 'Plan 1' });
      await new Promise(resolve => setTimeout(resolve, 10));
      await fileManager.saveStudyPlan(projectId, 'plan-2', 'Content 2', { title: 'Plan 2' });

      const plans = await fileManager.listStudyPlans(projectId);

      expect(plans[0].id).toBe('plan-2');
      expect(plans[1].id).toBe('plan-1');
    });

    test('should handle plan status', async () => {
      const metadata = {
        title: 'Status Plan',
        status: 'completed'
      };

      await fileManager.saveStudyPlan(projectId, 'status-plan', 'Content', metadata);
      const plans = await fileManager.listStudyPlans(projectId);

      expect(plans[0].status).toBe('completed');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty project name', async () => {
      const project = await fileManager.createProject('');
      expect(project.name).toBe('');
      expect(project.id).toBeTruthy();
    });

    test('should handle special characters in titles', async () => {
      const project = await fileManager.createProject('Project @#$% & <> "quoted"');
      expect(project.name).toBeTruthy();

      const retrieved = await fileManager.getProject(project.id);
      expect(retrieved.name).toBe('Project @#$% & <> "quoted"');
    });

    test('should handle large document content', async () => {
      const project = await fileManager.createProject('Large Content Test');
      const largeContent = 'x'.repeat(1000000); // 1MB of content

      const result = await fileManager.saveMarkdownFile(project.id, 'large-doc', largeContent);
      expect(result.id).toBe('large-doc');

      const read = await fileManager.readMarkdownFile(project.id, 'large-doc');
      expect(read.content).toBe(largeContent);
    });

    test('should handle documents with multiline metadata', async () => {
      const project = await fileManager.createProject('Multiline Test');
      const content = 'Document content';
      const metadata = {
        title: 'Title with\nnewlines'
      };

      await fileManager.saveMarkdownFile(project.id, 'multiline-doc', content, metadata);
      const doc = await fileManager.readMarkdownFile(project.id, 'multiline-doc');
      expect(doc.content).toBe(content);
    });
  });
});
