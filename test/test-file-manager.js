/**
 * Unit Tests for File Manager Module
 */

const FileManager = require('../electron/app/js/file-manager');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const os = require('os');

describe('File Manager Module', () => {
  let fileManager;
  let tempDir;

  beforeEach(async () => {
    // Create temporary directory for testing
    tempDir = path.join(os.tmpdir(), `test-${Date.now()}`);
    fsSync.mkdirSync(tempDir, { recursive: true });
    fileManager = new FileManager(tempDir);
  });

  afterEach(async () => {
    // Clean up temp directory
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

  describe('initialization', () => {
    test('should create necessary directories on initialization', () => {
      expect(fsSync.existsSync(fileManager.dataDir)).toBe(true);
      expect(fsSync.existsSync(fileManager.projectsDir)).toBe(true);
    });

    test('should set correct data directory', () => {
      expect(fileManager.dataDir).toBe(tempDir);
    });

    test('should set correct projects directory', () => {
      expect(fileManager.projectsDir).toBe(path.join(tempDir, 'projects'));
    });
  });

  describe('createProject', () => {
    test('should create a new project with all required directories', async () => {
      const project = await fileManager.createProject('Test Project', 'Test Description');

      expect(project.id).toBeDefined();
      expect(project.id.length).toBe(36); // UUID length
      expect(project.name).toBe('Test Project');
      expect(project.description).toBe('Test Description');

      // Verify directories exist
      const projectPath = fileManager.getProjectPath(project.id);
      expect(fsSync.existsSync(projectPath)).toBe(true);
      expect(fsSync.existsSync(path.join(projectPath, 'sources'))).toBe(true);
      expect(fsSync.existsSync(path.join(projectPath, 'study-plans'))).toBe(true);
      expect(fsSync.existsSync(path.join(projectPath, 'progress'))).toBe(true);
    });

    test('should create metadata file', async () => {
      const project = await fileManager.createProject('Test Project');
      const metadataPath = path.join(fileManager.getProjectPath(project.id), 'metadata.md');

      expect(fsSync.existsSync(metadataPath)).toBe(true);
      const content = fsSync.readFileSync(metadataPath, 'utf-8');
      expect(content).toContain('Test Project');
    });

    test('should handle project without description', async () => {
      const project = await fileManager.createProject('Test Project');
      expect(project.description).toBe('');
    });

    test('should generate unique project IDs', async () => {
      const project1 = await fileManager.createProject('Project 1');
      const project2 = await fileManager.createProject('Project 2');

      expect(project1.id).not.toBe(project2.id);
    });
  });

  describe('getProjectPath', () => {
    test('should return correct project path', () => {
      const projectId = 'test-project-123';
      const expectedPath = path.join(fileManager.projectsDir, projectId);

      expect(fileManager.getProjectPath(projectId)).toBe(expectedPath);
    });
  });

  describe('listProjects', () => {
    test('should return empty array for no projects', async () => {
      const projects = await fileManager.listProjects();
      expect(Array.isArray(projects)).toBe(true);
      expect(projects.length).toBe(0);
    });

    test('should list created projects', async () => {
      await fileManager.createProject('Project 1');
      await fileManager.createProject('Project 2');

      const projects = await fileManager.listProjects();
      expect(projects.length).toBe(2);
    });

    test('should include project metadata', async () => {
      const created = await fileManager.createProject('Test Project', 'Test Desc');
      const projects = await fileManager.listProjects();

      const project = projects.find(p => p.id === created.id);
      expect(project).toBeDefined();
      expect(project.name).toBe('Test Project');
      expect(project.description).toBe('Test Desc');
    });
  });

  describe('getProject', () => {
    test('should retrieve project by ID', async () => {
      const created = await fileManager.createProject('Test Project', 'Description');
      const retrieved = await fileManager.getProject(created.id);

      expect(retrieved.id).toBe(created.id);
      expect(retrieved.name).toBe('Test Project');
    });

    test('should throw error for non-existent project', async () => {
      await expect(fileManager.getProject('non-existent-id')).rejects.toThrow();
    });
  });

  describe('renameProject', () => {
    test('should rename project', async () => {
      const project = await fileManager.createProject('Original Name', 'Description');

      await fileManager.renameProject(project.id, 'Updated Name');

      const updated = await fileManager.getProject(project.id);
      expect(updated.name).toBe('Updated Name');
    });

    test('should preserve other metadata', async () => {
      const project = await fileManager.createProject('Test', 'Desc');
      const originalId = project.id;

      await fileManager.renameProject(project.id, 'New Name');

      const updated = await fileManager.getProject(project.id);
      expect(updated.id).toBe(originalId);
      expect(updated.description).toBe('Desc');
    });
  });

  describe('saveMarkdownFile', () => {
    test('should save markdown file to project', async () => {
      const project = await fileManager.createProject('Test');
      const docId = 'test-doc';
      const content = '# Test\n\nContent here';
      const metadata = { title: 'Test Doc', source: 'https://example.com' };

      const result = await fileManager.saveMarkdownFile(project.id, docId, content, metadata);

      expect(result.id).toBe(docId);
      expect(result.title).toBe('Test Doc');
    });

    test('should create file at correct location', async () => {
      const project = await fileManager.createProject('Test');
      const docId = 'test-doc';

      await fileManager.saveMarkdownFile(project.id, docId, 'Content');

      const sourcesDir = path.join(fileManager.getProjectPath(project.id), 'sources');
      const files = fsSync.readdirSync(sourcesDir);
      expect(files.length).toBeGreaterThan(0);
    });

    test('should store metadata in frontmatter', async () => {
      const project = await fileManager.createProject('Test');
      const metadata = { title: 'My Doc', tags: ['test', 'example'] };

      await fileManager.saveMarkdownFile(project.id, 'doc1', 'Content', metadata);

      const documents = await fileManager.listDocuments(project.id);
      const doc = documents.find(d => d.title === 'My Doc');
      expect(doc).toBeDefined();
      expect(doc.title).toBe('My Doc');
    });
  });

  describe('listDocuments', () => {
    test('should return empty array for project with no documents', async () => {
      const project = await fileManager.createProject('Test');
      const documents = await fileManager.listDocuments(project.id);

      expect(Array.isArray(documents)).toBe(true);
      expect(documents.length).toBe(0);
    });

    test('should list saved documents', async () => {
      const project = await fileManager.createProject('Test');

      await fileManager.saveMarkdownFile(project.id, 'doc1', 'Content 1');
      await fileManager.saveMarkdownFile(project.id, 'doc2', 'Content 2');

      const documents = await fileManager.listDocuments(project.id);
      expect(documents.length).toBeGreaterThanOrEqual(2);
    });

    test('should include document metadata', async () => {
      const project = await fileManager.createProject('Test');
      await fileManager.saveMarkdownFile(project.id, 'doc1', 'Content', {
        title: 'Test Doc',
        tags: ['learning', 'important']
      });

      const documents = await fileManager.listDocuments(project.id);
      const doc = documents.find(d => d.title === 'Test Doc');
      expect(doc).toBeDefined();
      expect(Array.isArray(doc.tags)).toBe(true);
      expect(doc.tags.length).toBeGreaterThan(0);
    });
  });

  describe('readMarkdownFile', () => {
    test('should retrieve document content and metadata', async () => {
      const project = await fileManager.createProject('Test');
      const content = '# Heading\n\nParagraph';
      const metadata = { title: 'Test Doc' };

      await fileManager.saveMarkdownFile(project.id, 'doc1', content, metadata);
      const doc = await fileManager.readMarkdownFile(project.id, 'doc1');

      expect(doc.metadata.title).toBe('Test Doc');
      expect(doc.content).toContain('Heading');
      expect(doc.content).toContain('Paragraph');
    });

    test('should throw error for non-existent document', async () => {
      const project = await fileManager.createProject('Test');
      await expect(fileManager.readMarkdownFile(project.id, 'non-existent')).rejects.toThrow();
    });
  });

  describe('deleteMarkdownFile', () => {
    test('should delete document file', async () => {
      const project = await fileManager.createProject('Test');
      await fileManager.saveMarkdownFile(project.id, 'doc1', 'Content');

      let documents = await fileManager.listDocuments(project.id);
      expect(documents.length).toBeGreaterThan(0);

      await fileManager.deleteMarkdownFile(project.id, 'doc1');

      documents = await fileManager.listDocuments(project.id);
      expect(documents.length).toBe(0);
    });
  });

  describe('deleteProject', () => {
    test('should delete project directory', async () => {
      const project = await fileManager.createProject('Test Project');
      const projectPath = fileManager.getProjectPath(project.id);

      expect(fsSync.existsSync(projectPath)).toBe(true);

      await fileManager.deleteProject(project.id);

      expect(fsSync.existsSync(projectPath)).toBe(false);
    });

    test('should remove project from list', async () => {
      const project = await fileManager.createProject('Test');
      await fileManager.deleteProject(project.id);

      const projects = await fileManager.listProjects();
      expect(projects.find(p => p.id === project.id)).toBeUndefined();
    });
  });

  describe('error handling', () => {
    test('should throw error on invalid project ID format', async () => {
      await expect(fileManager.getProject('')).rejects.toThrow();
    });

    test('should handle corrupted metadata files gracefully', async () => {
      const project = await fileManager.createProject('Test');
      const metadataPath = path.join(fileManager.getProjectPath(project.id), 'metadata.md');

      // Corrupt the metadata file
      fsSync.writeFileSync(metadataPath, 'invalid content');

      // Should handle gracefully
      const projects = await fileManager.listProjects();
      expect(Array.isArray(projects)).toBe(true);
    });
  });
});
