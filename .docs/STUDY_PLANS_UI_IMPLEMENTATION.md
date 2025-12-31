# Study Plans UI Implementation Guide

## Overview
This document outlines how to enhance the Study Plans page to support all four learning techniques with clear UI/UX patterns.

---

## Current Study Plans Page

### Layout
```
┌─────────────────────────────────────────────────────────────────┐
│  Study Plans                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ 📚 JavaScript    │  │ 📚 React Basics  │  │ 📚 Python 101│  │
│  │ Fundamentals     │  │                  │  │               │  │
│  │                  │  │ React Hooks      │  │ Fundamentals │  │
│  │ Spaced Rep.      │  │ Memoization      │  │ Beginners    │  │
│  │ Active Recall    │  │ Performance      │  │              │  │
│  │                  │  │                  │  │              │  │
│  │ 8/24 completed   │  │ 12/20 completed  │  │ 5/15 done    │  │
│  │ [██████░░░░░]33% │  │ [████████░░]60%  │  │ [███░░░░░░]33%│ │
│  │                  │  │                  │  │              │  │
│  │ ▶ Start Session  │  │ ▶ Start Session  │  │ ▶ Start      │  │
│  │ 👁 View Details  │  │ 👁 View Details  │  │ 👁 Details   │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Current Features
- ✅ Plan title with icon
- ✅ Learning techniques listed
- ✅ Completion progress bar
- ✅ Item count
- ✅ Start Session button
- ✅ View Details button

---

## Enhanced Study Plans Page

### Feature: Technique Selector Modal

When user clicks "Start Session", show a modal to choose technique:

```
┌─────────────────────────────────────────────────────────┐
│  Choose Learning Technique                          [×] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Select how you want to study today:                   │
│                                                         │
│  ⦿ 🔄 Spaced Repetition (Recommended)                  │
│    Review items based on your forgetting curve         │
│    ✓ Optimized for long-term retention                │
│    ✓ Adaptive scheduling                              │
│    📊 7 items due today                                │
│                                                         │
│  ○ ❓ Active Recall                                     │
│    Test yourself with questions                        │
│    ✓ Strengthen understanding                          │
│    ✓ Find knowledge gaps                               │
│    📊 12 questions available                           │
│                                                         │
│  ○ 🔀 Interleaving                                     │
│    Mix different topics and difficulties               │
│    ✓ Improve pattern recognition                       │
│    ✓ Better transfer to new problems                   │
│    📊 24 items (shuffled topics)                        │
│                                                         │
│  ○ 💭 Feynman Technique                                │
│    Explain concepts in simple terms                    │
│    ✓ Deepen conceptual understanding                   │
│    ✓ Identify knowledge gaps                           │
│    📊 8 explanation items                              │
│                                                         │
│  ○ 🎯 Mixed (All Techniques)                           │
│    Combine all methods for mastery                     │
│    ✓ Most comprehensive learning                       │
│    ✓ Longest sessions                                  │
│    📊 All items in mixed strategy                       │
│                                                         │
├─────────────────────────────────────────────────────────┤
│              [Start Session]  [Cancel]                  │
└─────────────────────────────────────────────────────────┘
```

### Feature: Session Configuration

After technique selection, show configuration options:

```
┌─────────────────────────────────────────────────────────┐
│  Session Settings - Spaced Repetition               [×] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Learning Technique                                     │
│  └─ 🔄 Spaced Repetition                               │
│                                                         │
│  Session Length                                         │
│  ├─ □ Quick      (10 minutes)                          │
│  ├─ ⦿ Standard   (30 minutes)  ← Selected              │
│  └─ □ Deep Dive  (60 minutes)                          │
│                                                         │
│  Difficulty Level                                       │
│  ├─ □ Easy only                                        │
│  ├─ □ Medium only                                      │
│  ├─ ⦿ Mixed      ← Selected                            │
│  └─ □ Hard only                                        │
│                                                         │
│  Focus Area                                             │
│  ├─ ⦿ All topics                                       │
│  ├─ □ Weak areas (struggling with)                     │
│  └─ □ New material (recently learned)                  │
│                                                         │
│  Advanced Options                                       │
│  ├─ ☑ Show explanations after each item                │
│  ├─ ☑ Include spaced review schedule                   │
│  └─ □ Enable speech-to-text answers                    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│         [Start Session Now]  [Cancel]                   │
│                                                         │
│  💡 Tip: Standard sessions (30 min) are most effective  │
│      for consistent daily learning                      │
└─────────────────────────────────────────────────────────┘
```

### Feature: Session Type Indicators

Show what each technique session includes:

```
🔄 SPACED REPETITION SESSION
├─ Items due: 7 questions
├─ Topics: JavaScript, Promises, Async/Await
├─ Duration: ~30 minutes
├─ Type: Flashcards & Q&A
├─ Scheduling: Based on forgetting curve
└─ Goal: Long-term retention

❓ ACTIVE RECALL SESSION
├─ Questions: 12 items
├─ Topics: All covered topics
├─ Duration: ~25 minutes
├─ Type: Questions (short & long form)
├─ Feedback: Immediate after each answer
└─ Goal: Test & strengthen understanding

🔀 INTERLEAVING SESSION
├─ Items: 24 mixed-order items
├─ Topics: JavaScript, Python, React, Redux
├─ Duration: ~40 minutes
├─ Type: Random mix of types/difficulty
├─ Sequence: Designed for pattern learning
└─ Goal: Better transfer to new problems

💭 FEYNMAN TECHNIQUE SESSION
├─ Prompts: 8 explanation items
├─ Topics: Key concepts
├─ Duration: ~35 minutes
├─ Type: Free-form explanations
├─ Feedback: Clarity & completeness scoring
└─ Goal: Deep conceptual understanding

🎯 MIXED SESSION
├─ Items: 30+ varied items
├─ Topics: All topics
├─ Duration: ~60 minutes
├─ Type: Spaced Rep → Active Recall → Feynman → Interleave
├─ Structure: Combines all techniques
└─ Goal: Comprehensive mastery
```

---

## Study Session View Enhancement

### Current Session Display
```
┌──────────────────────────────────────────────────────┐
│  Study Session - JavaScript Fundamentals         3/7 │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Question: What is a closure?                        │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │                                                │  │
│  │  [Thinking about closures...]                  │  │
│  │                                                │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  [Reveal Answer]  [Next]                             │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Enhanced Session Display with Technique Metadata

```
┌──────────────────────────────────────────────────────┐
│  🔄 Spaced Repetition - JavaScript Fundamentals 3/7 │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Technique Info:                                     │
│  ├─ Type: Flashcard (Active Recall)                 │
│  ├─ Difficulty: Medium                               │
│  ├─ Last reviewed: 5 days ago                        │
│  ├─ Next review: 10 days from today                  │
│  ├─ Success rate: 85%                                │
│  └─ Confidence: Rate your answer below               │
│                                                      │
│  Question: What is a closure?                        │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │                                                │  │
│  │  [Thinking about closures...]                  │  │
│  │                                                │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  How confident are you?                              │
│  [1] [2] [3] [4] [5] (5 = very confident)            │
│                                                      │
│  [Reveal Answer]  [Skip] [Mark as hard]              │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## Dashboard: Technique Insights

### Add Technique Summary to Progress View

```
┌──────────────────────────────────────────────────────┐
│  Learning Techniques Performance                     │
├──────────────────────────────────────────────────────┤
│                                                      │
│  🔄 Spaced Repetition                                │
│    Last session: Today, 12:30 PM                     │
│    Items due: 7                                      │
│    Success rate: 82%                                 │
│    Progress: ████████░░ 80% mastered                 │
│    Streak: 12 days 🔥                                │
│                                                      │
│  ❓ Active Recall                                    │
│    Last session: Yesterday                           │
│    Questions answered: 45                            │
│    Success rate: 76%                                 │
│    Progress: ███████░░░ 70% mastered                 │
│    Weak areas: Closures, Promises                    │
│                                                      │
│  🔀 Interleaving                                     │
│    Last session: 3 days ago                          │
│    Mix ratio: 3 topics/session                       │
│    Success rate: 68%                                 │
│    Transfer ability: Improving ↗                     │
│                                                      │
│  💭 Feynman Technique                                │
│    Last session: 5 days ago                          │
│    Explanations given: 12                            │
│    Clarity score: 7.2/10                             │
│    Concepts mastered: Variables, Functions           │
│                                                      │
├──────────────────────────────────────────────────────┤
│  Recommendation: Use more Feynman for concepts       │
│  you struggle to explain.                            │
└──────────────────────────────────────────────────────┘
```

---

## Implementation Priority

### Phase 1: Technique Selection Modal (High Priority)
**What to implement:**
- Modal that appears when clicking "Start Session"
- Five technique options with descriptions
- Show count of available items for each
- Display key benefits of each technique

**Files to modify:**
- `electron/app/index.html` - Add modal template
- `electron/app/css/styles.css` - Modal styling
- `electron/app/js/renderer.js` - Modal logic and session start

**Estimated effort:** 2-3 hours

### Phase 2: Session Configuration (Medium Priority)
**What to implement:**
- Session length options (Quick, Standard, Deep)
- Difficulty filters
- Focus area selection
- Advanced options toggle

**Files to modify:**
- `electron/app/js/session-manager.js` - Handle options
- `electron/app/js/renderer.js` - Configuration UI

**Estimated effort:** 2-3 hours

### Phase 3: Enhanced Session Display (Medium Priority)
**What to implement:**
- Show technique metadata during session
- Display confidence/difficulty rating
- Show next review date (for spaced rep)
- Enhanced feedback system

**Files to modify:**
- `electron/app/index.html` - Session view template
- `electron/app/js/renderer.js` - Session rendering

**Estimated effort:** 3-4 hours

### Phase 4: Technique Dashboard (Lower Priority)
**What to implement:**
- Technique performance metrics
- Success rates by technique
- Recommendations based on weak areas
- Learning streak visualization

**Files to modify:**
- `electron/app/js/renderer.js` - Progress view
- `electron/app/css/styles.css` - Metric styling

**Estimated effort:** 3-4 hours

---

## Code Example: Technique Selector Modal

### HTML Template
```html
<div id="modal-technique-selector" class="modal">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Choose Learning Technique</h5>
        <button type="button" class="modal-close" data-modal="modal-technique-selector">
          <i class="bi bi-x"></i>
        </button>
      </div>

      <div class="modal-body">
        <p class="text-muted mb-4">Select how you want to study today:</p>

        <div class="technique-options">
          <!-- Spaced Repetition -->
          <label class="technique-option">
            <input type="radio" name="technique" value="Spaced Repetition" checked>
            <div class="technique-card">
              <div class="technique-header">
                <i class="bi bi-arrow-repeat"></i>
                <h6>Spaced Repetition</h6>
                <span class="badge badge-primary">Recommended</span>
              </div>
              <p class="text-muted small">Review items based on your forgetting curve</p>
              <ul class="feature-list small">
                <li><i class="bi bi-check"></i> Optimized for long-term retention</li>
                <li><i class="bi bi-check"></i> Adaptive scheduling</li>
              </ul>
              <div class="technique-stats">
                <span class="stat"><i class="bi bi-list-check"></i> 7 items due</span>
              </div>
            </div>
          </label>

          <!-- Active Recall -->
          <label class="technique-option">
            <input type="radio" name="technique" value="Active Recall">
            <div class="technique-card">
              <div class="technique-header">
                <i class="bi bi-question-circle"></i>
                <h6>Active Recall</h6>
              </div>
              <p class="text-muted small">Test yourself with questions</p>
              <ul class="feature-list small">
                <li><i class="bi bi-check"></i> Strengthen understanding</li>
                <li><i class="bi bi-check"></i> Find knowledge gaps</li>
              </ul>
              <div class="technique-stats">
                <span class="stat"><i class="bi bi-question-circle"></i> 12 questions</span>
              </div>
            </div>
          </label>

          <!-- More options... -->
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-modal="modal-technique-selector">
          Cancel
        </button>
        <button type="button" class="btn btn-primary" id="btn-start-technique-session">
          Start Session
        </button>
      </div>
    </div>
  </div>
</div>
```

### CSS Styling
```css
.technique-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.technique-option {
  cursor: pointer;
}

.technique-option input[type="radio"] {
  display: none;
}

.technique-card {
  padding: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  background: white;
}

.technique-option input[type="radio"]:checked + .technique-card {
  border-color: #0d6efd;
  background-color: #f0f7ff;
  box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.15);
}

.technique-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.technique-header i {
  font-size: 1.3rem;
  color: #0d6efd;
}

.technique-header h6 {
  flex: 1;
  margin: 0;
  font-weight: 600;
}

.badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

.feature-list {
  list-style: none;
  padding: 0.5rem 0;
  margin: 0.5rem 0;
}

.feature-list li {
  padding: 0.25rem 0;
  color: #6c757d;
}

.feature-list i {
  color: #28a745;
  margin-right: 0.5rem;
}

.technique-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: #6c757d;
  padding-top: 0.5rem;
  border-top: 1px solid #e9ecef;
  margin-top: 0.5rem;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}
```

### JavaScript Logic
```javascript
function showTechniqueSelectorModal(planId) {
  const modal = document.getElementById('modal-technique-selector');
  const startBtn = document.getElementById('btn-start-technique-session');

  // Store plan ID for later use
  modal.dataset.planId = planId;

  // Show modal
  openModal('modal-technique-selector');

  // Handle start session
  startBtn.onclick = async () => {
    const selectedTechnique = document.querySelector(
      'input[name="technique"]:checked'
    ).value;

    closeModal('modal-technique-selector');
    await startStudySession(currentProject.id, planId, {
      technique: selectedTechnique
    });
  };
}

// Update start session button
document.querySelectorAll('.btn-start-session').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const planId = btn.dataset.planId;
    showTechniqueSelectorModal(planId);
  });
});
```

---

## Summary

The enhanced Study Plans page will:
1. ✅ Allow users to choose their learning technique
2. ✅ Customize session parameters
3. ✅ Show technique-specific insights
4. ✅ Track performance by technique
5. ✅ Provide recommendations

This creates a powerful, flexible study planning experience that leverages all four scientifically-proven learning techniques!
