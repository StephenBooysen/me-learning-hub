# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**me-learning-hub** is a learning application that uses a Chrome extension to extract information and generate study plans using advanced study techniques.

### Current Status

This is an early-stage project with minimal setup. The package.json exists but the project lacks:
- Source code structure (no src/ directory yet)
- Build system (no bundler configured)
- Testing framework
- Linting/formatting tools
- TypeScript configuration

## Development Setup

### Installation

```bash
npm install
```

### Testing

Currently no test framework is configured. When setting up tests, use:

```bash
npm test
```

## Architecture Guidance

When building out this project, consider these architectural components:

1. **Chrome Extension** - The client-side component that extracts information from web pages
2. **Backend Service** - API to handle study plan generation and data storage
3. **Study Plan Generator** - Core logic implementing advanced study techniques (spaced repetition, active recall, interleaving, etc.)
4. **Database** - Persistence layer for study plans and learning progress

The project should maintain a clear separation between:
- Extension code (isolated in a dedicated directory)
- API/backend code (separate from extension)
- Shared utilities and types (if applicable)

## Key Implementation Notes

- Clarify whether this will be a monorepo (extension + backend together) or separate repositories
- Document the Chrome extension's manifest version and permissions required
- Define the data structure for study plans and learning progress
- Decide on technology stack for backend (Node.js, Python, etc.) before implementation
