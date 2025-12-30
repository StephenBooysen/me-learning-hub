# Data Models Documentation
## Me Learning Hub

This document defines the core data models used throughout the application. All data is stored as markdown files with YAML-style frontmatter for metadata.

---

## 1. Project

A project is the top-level container for learning materials and study plans.

### Structure
```
projects/
└── [project-id]/
    ├── metadata.md           # Project metadata
    ├── README.md             # Project overview (optional)
    ├── sources/              # Directory containing source documents
    │   ├── [doc-id].md
    │   └── manifest.md       # Index of documents
    ├── study-plans/          # Directory containing study plans
    │   ├── [plan-id].md
    │   └── index.md          # Index of plans
    └── progress/             # Directory containing study sessions
        ├── [session-id].md
        └── index.md          # Index of sessions
```

### Metadata (metadata.md)
```yaml
---
id: uuid-string
title: Project Name
description: Project description
created: ISO-8601-timestamp
modified: ISO-8601-timestamp
documents: number
study-plans: number
sessions: number
---

# Project Name

Project description or overview.
```

### TypeScript Definition
```typescript
interface Project {
  id: string;                  // UUID
  name: string;                // Project name
  description: string;         // Project description
  created: string;             // ISO 8601 timestamp
  modified: string;            // ISO 8601 timestamp
  documents: number;           // Count of documents
  studyPlans: number;         // Count of study plans
  sessions: number;            // Count of study sessions
  path: string;                // File system path
}
```

---

## 2. Document (Source Material)

A document represents captured web content in markdown format.

### Structure
Single markdown file in `projects/[project-id]/sources/[doc-id].md`

### Format
```yaml
---
id: uuid-string
title: Document Title
source-url: https://original-source.com
captured: ISO-8601-timestamp
modified: ISO-8601-timestamp
tags: tag1, tag2, tag3
---

# Document Title

[Markdown content from captured web page]

## Section 1
Content here...

## Section 2
Content here...
```

### TypeScript Definition
```typescript
interface Document {
  id: string;                  // UUID
  title: string;               // Document title
  sourceUrl: string;          // Original source URL
  captured: string;           // ISO 8601 capture timestamp
  modified: string;           // ISO 8601 modification timestamp
  tags: string[];             // Array of tag strings
  fileName: string;           // Markdown file name
  content: string;            // Markdown body content
}

interface DocumentMetadata {
  id: string;
  title: string;
  'source-url': string;
  captured: string;
  modified: string;
  tags: string;
}
```

---

## 3. Study Plan

A study plan is an organized set of learning items derived from source documents, using specific learning techniques.

### Structure
Single markdown file in `projects/[project-id]/study-plans/[plan-id].md`

### Format
```yaml
---
id: uuid-string
title: Study Plan Title
source-documents: doc-id-1, doc-id-2, doc-id-3
created: ISO-8601-timestamp
modified: ISO-8601-timestamp
techniques: Spaced Repetition, Active Recall, Interleaving
status: active|completed|paused
intensity: low|medium|high
total-items: number
completed: number
mastered: number
---

# Study Plan: Title

## Configuration
- Learning Intensity: [Low / Medium / High]
- Session Duration: [minutes]
- Review Frequency: [custom schedule]

## Study Items

### Item 1: [Title]
- **Type**: Flashcard / Question / Summary / Explanation
- **Difficulty**: Easy / Medium / Hard
- **Content**: [Item content]
- **Next Review**: [ISO-8601-timestamp]
- **Interval**: [days]
- **Repetitions**: [number]
- **Ease Factor**: [1.3-2.5]
- **Performance**: [avg-score]

### Item 2: [Title]
...

## Progress Summary
- **Total Items**: N
- **Completed**: N
- **Mastered**: N
- **Current Streak**: N days
- **Last Review**: [ISO-8601-timestamp]
```

### TypeScript Definition
```typescript
type StudyTechnique = 'Spaced Repetition' | 'Active Recall' | 'Interleaving' | 'Feynman Technique';
type StudyIntensity = 'low' | 'medium' | 'high';
type StudyStatus = 'active' | 'completed' | 'paused';
type StudyItemType = 'Flashcard' | 'Question' | 'Summary' | 'Explanation';
type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface StudyPlan {
  id: string;                      // UUID
  title: string;                   // Study plan title
  sourceDocuments: string[];       // IDs of source documents
  created: string;                 // ISO 8601 timestamp
  modified: string;                // ISO 8601 timestamp
  techniques: StudyTechnique[];   // Learning techniques used
  status: StudyStatus;             // Current status
  intensity: StudyIntensity;      // Learning intensity level
  totalItems: number;              // Total study items
  completed: number;               // Completed items
  mastered: number;                // Mastered items
  items: StudyItem[];             // Array of study items
}

interface StudyItem {
  id: string;                      // UUID or incremental
  type: StudyItemType;            // Type of study item
  title: string;                   // Item title
  content: string;                 // Item content
  difficulty: Difficulty;         // Difficulty level
  nextReview?: string;            // ISO 8601 timestamp for next review
  interval?: number;              // Days until next review (for spaced repetition)
  repetitions?: number;           // Number of times reviewed
  easeFactor?: number;            // SM-2 ease factor (1.3-2.5)
  performance?: number;           // Average performance score (0-100)
  createdAt: string;              // ISO 8601 timestamp
  lastReviewedAt?: string;        // ISO 8601 timestamp of last review
}

interface StudyPlanMetadata {
  id: string;
  title: string;
  'source-documents': string;
  created: string;
  modified: string;
  techniques: string;
  status: string;
  intensity: string;
  'total-items': string;
  completed: string;
  mastered: string;
}
```

---

## 4. Study Session

A study session records the result of a learning activity - the items reviewed and performance metrics.

### Structure
Single markdown file in `projects/[project-id]/progress/[session-id].md`

### Format
```yaml
---
id: uuid-string
plan-id: study-plan-uuid
timestamp: ISO-8601-timestamp
duration-minutes: number
items-reviewed: number
performance: number
technique: Spaced Repetition|Active Recall|Interleaving|Feynman Technique
---

# Study Session: [Date] [Time]

## Session Metadata
- **Plan**: [Plan Title]
- **Duration**: [minutes]
- **Items Reviewed**: [number]
- **Average Performance**: [0-100]
- **Technique**: [technique name]

## Session Log

### Review 1: [Item Title]
- **Result**: Correct / Incorrect / Partial / Good Understanding
- **Time Spent**: [seconds]
- **Confidence**: [1-5]
- **Notes**: User notes or feedback

### Review 2: [Item Title]
...

## Summary
- **Time**: MM:SS
- **Correct**: N / Total
- **Accuracy**: X%
- **Streak**: N items correct
```

### TypeScript Definition
```typescript
type SessionResult = 'Correct' | 'Incorrect' | 'Partial' | 'Good Understanding';

interface StudySession {
  id: string;                      // UUID
  planId: string;                  // Associated study plan ID
  timestamp: string;               // ISO 8601 timestamp
  durationMinutes: number;         // Session duration
  itemsReviewed: number;           // Number of items reviewed
  performance: number;             // Average performance (0-100)
  technique: StudyTechnique;      // Learning technique used
  reviews: SessionReview[];        // Array of individual reviews
}

interface SessionReview {
  itemId: string;                  // ID of reviewed item
  itemTitle: string;               // Item title
  result: SessionResult;           // Session result
  timeSpentSeconds: number;        // Time spent on item
  confidence: number;              // Confidence level (1-5)
  notes?: string;                  // Optional user notes
}

interface StudySessionMetadata {
  id: string;
  'plan-id': string;
  timestamp: string;
  'duration-minutes': string;
  'items-reviewed': string;
  performance: string;
  technique: string;
}
```

---

## 5. Progress Index

An optional index file tracking overall progress statistics.

### Structure
File: `projects/[project-id]/progress/index.md`

### Format
```yaml
---
total-sessions: number
total-items-reviewed: number
total-time-minutes: number
average-performance: number
current-streak: number
longest-streak: number
last-session: ISO-8601-timestamp
---

# Progress Summary

## Statistics
- **Total Sessions**: N
- **Items Reviewed**: N
- **Total Time**: X hours Y minutes
- **Average Performance**: Z%
- **Current Streak**: N days
- **Longest Streak**: N days

## Progress by Technique
- **Spaced Repetition**: N items mastered
- **Active Recall**: N items mastered
- **Interleaving**: N items mastered
- **Feynman Technique**: N items mastered

## Recent Activity
[List of recent sessions with dates and results]
```

---

## 6. Configuration

Application-level configuration stored in electron-store.

### TypeScript Definition
```typescript
interface AppConfig {
  dataDir: string;                // Path to data directory
  windowWidth: number;            // Window width
  windowHeight: number;           // Window height
  theme: 'light' | 'dark';       // UI theme
  autoSave: boolean;             // Auto-save documents
  defaultIntensity: StudyIntensity;  // Default study intensity
  defaultSessionDuration: number;    // Default session duration (minutes)
  apiProvider?: string;           // AI API provider
  apiModel?: string;             // AI model to use
}
```

---

## 7. Spaced Repetition SM-2 Algorithm Data

For items using Spaced Repetition technique, additional SM-2 algorithm data is stored.

### SM-2 Fields in StudyItem
```typescript
interface SM2Data {
  interval: number;               // Days until next review (starts at 1)
  repetitions: number;            // Number of successful repetitions
  easeFactor: number;             // Difficulty factor (1.3-2.5, default 2.5)
  nextReviewDate: string;         // ISO 8601 timestamp
}

// SM-2 Quality Response Scale: 0-5
// 5 = Perfect response
// 4 = Correct response after some hesitation
// 3 = Correct response after serious difficulty
// 2 = Incorrect response; correct answer remembered
// 1 = Incorrect response; correct answer seemed easy to remember
// 0 = Complete blackout, correct answer is unknown
```

### SM-2 Calculation
```javascript
// After review with quality score (0-5):
if (quality >= 3) {
  // Correct response
  if (repetitions === 0) {
    interval = 1;
  } else if (repetitions === 1) {
    interval = 3;
  } else {
    interval = Math.round(interval * easeFactor);
  }
  repetitions += 1;
} else {
  // Incorrect response
  repetitions = 0;
  interval = 1;
}

// Update ease factor
easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

// Set next review date
nextReviewDate = new Date(Date.now() + interval * 24 * 60 * 60 * 1000).toISOString();
```

---

## 8. Data Validation Rules

### Document
- `id`: Must be UUID format
- `title`: Required, max 200 characters
- `sourceUrl`: Optional, must be valid URL if provided
- `tags`: Array of strings, max 50 characters each
- Content: Markdown format

### Study Plan
- `id`: Must be UUID format
- `title`: Required, max 200 characters
- `techniques`: At least one technique required
- `status`: Must be one of: active, completed, paused
- `intensity`: Must be one of: low, medium, high
- `sourceDocuments`: At least one document ID required

### Study Session
- `planId`: Must be valid study plan UUID
- `durationMinutes`: Must be positive number
- `itemsReviewed`: Must match number of reviews
- `performance`: Must be 0-100

---

## 9. File Naming Conventions

- **Project ID**: UUID format (auto-generated)
- **Document ID**: UUID format (auto-generated)
- **Study Plan ID**: UUID format (auto-generated)
- **Session ID**: UUID format (auto-generated)
- **File names**: `[id].md` (lowercase UUID)

---

## 10. Markdown Frontmatter Format

All metadata files use YAML-style frontmatter with the following rules:

```
---
key1: value1
key2: value2
"key with colon": "value: with: colons"
---

[Document content in markdown]
```

### Parsing Rules
- Frontmatter must be delimited by `---` at start and end
- Keys and values separated by `: `
- Values with colons must be quoted
- Values are stripped of leading/trailing whitespace
- If no frontmatter found, metadata = {}, content = full text

---

## 11. Data Migration Path

When upgrading the application, use these migration strategies:

### v1.0 → v1.1 (Example)
- Add new optional fields with defaults
- Gracefully handle missing fields when reading
- Use migration scripts to bulk update if needed

### Backup Strategy
- Create timestamped backups before migrations
- Export data to JSON for portability
- Store backups in `projects/.backups/` directory

---

## Conclusion

This data model design prioritizes:
- **Portability**: Text-based, version control friendly
- **Simplicity**: Minimal nesting, flat file structure where possible
- **Extensibility**: Easy to add new fields to frontmatter
- **Human Readability**: Markdown format viewable in any editor
- **Performance**: Lazy loading of large documents
