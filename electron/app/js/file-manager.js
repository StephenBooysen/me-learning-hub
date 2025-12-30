const fs = require('fs').promises;
const path = require('path');
const fsSync = require('fs');
const { generateUUID, formatISO8601, createFrontmatter, parseFrontmatter, sanitizeFilename } = require('./utils');

class FileManager {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.projectsDir = path.join(dataDir, 'projects');
    this.initializeDirectories();
  }

  /**
   * Initialize required directories
   */
  initializeDirectories() {
    if (!fsSync.existsSync(this.dataDir)) {
      fsSync.mkdirSync(this.dataDir, { recursive: true });
    }
    if (!fsSync.existsSync(this.projectsDir)) {
      fsSync.mkdirSync(this.projectsDir, { recursive: true });
    }
  }

  /**
   * Get project path
   */
  getProjectPath(projectId) {
    return path.join(this.projectsDir, projectId);
  }

  /**
   * Create a new project
   */
  async createProject(projectName, description = '') {
    const projectId = generateUUID();
    const projectPath = this.getProjectPath(projectId);

    try {
      // Create project directory structure
      await fs.mkdir(projectPath, { recursive: true });
      await fs.mkdir(path.join(projectPath, 'sources'), { recursive: true });
      await fs.mkdir(path.join(projectPath, 'study-plans'), { recursive: true });
      await fs.mkdir(path.join(projectPath, 'progress'), { recursive: true });

      // Create metadata file
      const metadata = {
        'id': projectId,
        'title': projectName,
        'description': description,
        'created': formatISO8601(),
        'modified': formatISO8601(),
        'documents': '0',
        'study-plans': '0',
        'sessions': '0'
      };

      const metadataPath = path.join(projectPath, 'metadata.md');
      const frontmatter = createFrontmatter(metadata);
      const content = frontmatter + `# ${projectName}\n\n${description || 'No description provided.'}`;

      await fs.writeFile(metadataPath, content, 'utf-8');

      return {
        id: projectId,
        name: projectName,
        description: description,
        created: metadata.created,
        path: projectPath
      };
    } catch (error) {
      throw new Error(`Failed to create project: ${error.message}`);
    }
  }

  /**
   * List all projects
   */
  async listProjects() {
    try {
      const entries = await fs.readdir(this.projectsDir, { withFileTypes: true });
      const projects = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const projectPath = path.join(this.projectsDir, entry.name);
          const metadataPath = path.join(projectPath, 'metadata.md');

          try {
            const content = await fs.readFile(metadataPath, 'utf-8');
            const { metadata } = parseFrontmatter(content);

            projects.push({
              id: metadata.id || entry.name,
              name: metadata.title || entry.name,
              description: metadata.description || '',
              created: metadata.created,
              modified: metadata.modified,
              documents: parseInt(metadata.documents) || 0,
              studyPlans: parseInt(metadata['study-plans']) || 0,
              sessions: parseInt(metadata.sessions) || 0
            });
          } catch (error) {
            console.warn(`Failed to read project ${entry.name}:`, error);
          }
        }
      }

      return projects.sort((a, b) => new Date(b.created) - new Date(a.created));
    } catch (error) {
      throw new Error(`Failed to list projects: ${error.message}`);
    }
  }

  /**
   * Get project details
   */
  async getProject(projectId) {
    try {
      const projectPath = this.getProjectPath(projectId);
      const metadataPath = path.join(projectPath, 'metadata.md');
      const content = await fs.readFile(metadataPath, 'utf-8');
      const { metadata } = parseFrontmatter(content);

      return {
        id: projectId,
        name: metadata.title,
        description: metadata.description,
        created: metadata.created,
        modified: metadata.modified,
        documents: parseInt(metadata.documents) || 0,
        studyPlans: parseInt(metadata['study-plans']) || 0,
        path: projectPath
      };
    } catch (error) {
      throw new Error(`Failed to get project: ${error.message}`);
    }
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId) {
    try {
      const projectPath = this.getProjectPath(projectId);
      await fs.rm(projectPath, { recursive: true, force: true });
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete project: ${error.message}`);
    }
  }

  /**
   * Rename a project
   */
  async renameProject(projectId, newName) {
    try {
      const projectPath = this.getProjectPath(projectId);
      const metadataPath = path.join(projectPath, 'metadata.md');
      const content = await fs.readFile(metadataPath, 'utf-8');
      const { metadata, content: bodyContent } = parseFrontmatter(content);

      metadata.title = newName;
      metadata.modified = formatISO8601();

      const frontmatter = createFrontmatter(metadata);
      const newContent = frontmatter + `# ${newName}\n\n${metadata.description || 'No description provided.'}`;

      await fs.writeFile(metadataPath, newContent, 'utf-8');

      return { success: true, name: newName };
    } catch (error) {
      throw new Error(`Failed to rename project: ${error.message}`);
    }
  }

  /**
   * List documents in a project
   */
  async listDocuments(projectId) {
    try {
      const projectPath = this.getProjectPath(projectId);
      const sourcesDir = path.join(projectPath, 'sources');

      if (!fsSync.existsSync(sourcesDir)) {
        return [];
      }

      const entries = await fs.readdir(sourcesDir, { withFileTypes: true });
      const documents = [];

      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'manifest.md') {
          const docPath = path.join(sourcesDir, entry.name);
          const content = await fs.readFile(docPath, 'utf-8');
          const { metadata } = parseFrontmatter(content);

          documents.push({
            id: metadata.id || entry.name.replace('.md', ''),
            title: metadata.title || entry.name.replace('.md', ''),
            sourceUrl: metadata['source-url'] || '',
            captured: metadata.captured,
            modified: metadata.modified,
            tags: (metadata.tags || '').split(',').filter(t => t.trim()),
            fileName: entry.name
          });
        }
      }

      return documents.sort((a, b) => new Date(b.captured) - new Date(a.captured));
    } catch (error) {
      throw new Error(`Failed to list documents: ${error.message}`);
    }
  }

  /**
   * Save a markdown document
   */
  async saveMarkdownFile(projectId, docId, content, metadata = {}) {
    try {
      const projectPath = this.getProjectPath(projectId);
      const sourcesDir = path.join(projectPath, 'sources');

      await fs.mkdir(sourcesDir, { recursive: true });

      const docMetadata = {
        id: docId,
        title: metadata.title || 'Untitled Document',
        'source-url': metadata.sourceUrl || '',
        captured: metadata.captured || formatISO8601(),
        modified: formatISO8601(),
        tags: (metadata.tags || []).join(', ')
      };

      const fileName = `${docId}.md`;
      const filePath = path.join(sourcesDir, fileName);
      const frontmatter = createFrontmatter(docMetadata);
      const fullContent = frontmatter + content;

      await fs.writeFile(filePath, fullContent, 'utf-8');

      return {
        id: docId,
        title: docMetadata.title,
        fileName: fileName,
        path: filePath
      };
    } catch (error) {
      throw new Error(`Failed to save document: ${error.message}`);
    }
  }

  /**
   * Read a markdown document
   */
  async readMarkdownFile(projectId, docId) {
    try {
      const projectPath = this.getProjectPath(projectId);
      const filePath = path.join(projectPath, 'sources', `${docId}.md`);

      const content = await fs.readFile(filePath, 'utf-8');
      const { metadata, content: bodyContent } = parseFrontmatter(content);

      return {
        id: docId,
        metadata: metadata,
        content: bodyContent
      };
    } catch (error) {
      throw new Error(`Failed to read document: ${error.message}`);
    }
  }

  /**
   * Delete a markdown document
   */
  async deleteMarkdownFile(projectId, docId) {
    try {
      const projectPath = this.getProjectPath(projectId);
      const filePath = path.join(projectPath, 'sources', `${docId}.md`);

      await fs.rm(filePath, { force: true });
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }

  /**
   * List study plans in a project
   */
  async listStudyPlans(projectId) {
    try {
      const projectPath = this.getProjectPath(projectId);
      const plansDir = path.join(projectPath, 'study-plans');

      if (!fsSync.existsSync(plansDir)) {
        return [];
      }

      const entries = await fs.readdir(plansDir, { withFileTypes: true });
      const plans = [];

      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'index.md') {
          const planPath = path.join(plansDir, entry.name);
          const content = await fs.readFile(planPath, 'utf-8');
          const { metadata } = parseFrontmatter(content);

          plans.push({
            id: metadata.id || entry.name.replace('.md', ''),
            title: metadata.title || entry.name.replace('.md', ''),
            created: metadata.created,
            modified: metadata.modified,
            status: metadata.status || 'active',
            techniques: (metadata.techniques || '').split(',').filter(t => t.trim()),
            totalItems: parseInt(metadata['total-items']) || 0,
            completed: parseInt(metadata.completed) || 0,
            mastered: parseInt(metadata.mastered) || 0,
            fileName: entry.name
          });
        }
      }

      return plans.sort((a, b) => new Date(b.created) - new Date(a.created));
    } catch (error) {
      throw new Error(`Failed to list study plans: ${error.message}`);
    }
  }

  /**
   * Save a study plan
   */
  async saveStudyPlan(projectId, planId, content, metadata = {}) {
    try {
      const projectPath = this.getProjectPath(projectId);
      const plansDir = path.join(projectPath, 'study-plans');

      await fs.mkdir(plansDir, { recursive: true });

      const planMetadata = {
        id: planId,
        title: metadata.title || 'Untitled Study Plan',
        'source-documents': metadata.sourceDocuments?.join(', ') || '',
        created: metadata.created || formatISO8601(),
        modified: formatISO8601(),
        techniques: (metadata.techniques || []).join(', '),
        status: metadata.status || 'active',
        intensity: metadata.intensity || 'medium',
        'total-items': String(metadata.totalItems || 0),
        completed: String(metadata.completed || 0),
        mastered: String(metadata.mastered || 0)
      };

      const fileName = `${planId}.md`;
      const filePath = path.join(plansDir, fileName);
      const frontmatter = createFrontmatter(planMetadata);
      const fullContent = frontmatter + content;

      await fs.writeFile(filePath, fullContent, 'utf-8');

      return {
        id: planId,
        title: planMetadata.title,
        fileName: fileName,
        path: filePath
      };
    } catch (error) {
      throw new Error(`Failed to save study plan: ${error.message}`);
    }
  }

  /**
   * Read a study plan
   */
  async readStudyPlan(projectId, planId) {
    try {
      const projectPath = this.getProjectPath(projectId);
      const filePath = path.join(projectPath, 'study-plans', `${planId}.md`);

      const content = await fs.readFile(filePath, 'utf-8');
      const { metadata, content: bodyContent } = parseFrontmatter(content);

      return {
        id: planId,
        metadata: metadata,
        content: bodyContent
      };
    } catch (error) {
      throw new Error(`Failed to read study plan: ${error.message}`);
    }
  }

  /**
   * Delete a study plan
   */
  async deleteStudyPlan(projectId, planId) {
    try {
      const projectPath = this.getProjectPath(projectId);
      const filePath = path.join(projectPath, 'study-plans', `${planId}.md`);

      await fs.rm(filePath, { force: true });
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete study plan: ${error.message}`);
    }
  }
}

module.exports = FileManager;
