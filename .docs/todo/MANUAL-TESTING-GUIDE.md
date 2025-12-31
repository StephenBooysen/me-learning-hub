# Manual Testing Guide: Chrome Extension

**Date:** December 30, 2025
**Purpose:** Step-by-step guide for manual testing of the Me Learning Hub Chrome extension

---

## ✅ Pre-Testing Checklist

- [ ] Electron app is running (`cd electron && npm start`)
- [ ] Chrome browser is installed (latest version)
- [ ] Extension files are in `/extension` directory
- [ ] Test projects created in Electron app
- [ ] Internet connection available
- [ ] Chrome DevTools ready (F12)

---

## 🔧 Loading the Extension in Chrome

### Step 1: Open Chrome Extensions Page
```
1. Open Chrome browser
2. Press Ctrl+Shift+M to open a new window (optional)
3. Type in address bar: chrome://extensions/
4. Press Enter
```

### Step 2: Enable Developer Mode
```
1. Toggle "Developer mode" switch in top-right corner
2. It should turn blue/active
```

### Step 3: Load Unpacked Extension
```
1. Click "Load unpacked" button (top-left)
2. Navigate to: /home/stephen/Code/stephenbooysen/me-learning-hub/extension
3. Click "Select Folder"
4. Extension should appear in the list with ID and permissions
```

### Step 4: Pin Extension
```
1. Click extension icon in top-right of Chrome
2. Click pin icon to pin the extension
3. Extension popup should appear in toolbar
```

### Step 5: Verify Extension Loaded
```
1. Go to chrome://extensions/
2. Look for "Me Learning Hub" extension
3. Should show status: "Enabled"
4. Should show file path: /home/stephen/.../extension
```

---

## 🧪 Manual Test Scenarios

### TEST 1: Verify Extension Loads Correctly

**Steps:**
1. Click the extension icon in toolbar
2. Popup should appear
3. You should see two main sections:
   - "Capture Content" with two buttons
   - "Your Projects" list below

**Expected Results:**
- Popup loads without errors
- No blank/white screen
- Buttons are clickable
- Layout looks clean and organized

**Verify:**
- Open Chrome DevTools (F12)
- Check Console tab - should have NO red errors
- Should see: "Me Learning Hub popup script loaded"

---

### TEST 2: Test Content Capture - Full Page

**Steps:**
1. Navigate to any article URL, for example:
   - https://en.wikipedia.org/wiki/Machine_learning
   - https://www.medium.com/...
   - https://dev.to/...

2. Click extension icon in toolbar
3. Click "📄 Capture Full Page" button
4. Wait 1-2 seconds for popup to process

**Expected Results:**
- Popup should switch to "Preview Content" view
- Should see:
  - Title field with article title
  - Source URL (read-only)
  - Metadata section showing:
    - Word count (number)
    - Reading time (X min)
    - Source domain (example.com)
  - Content preview showing markdown
  - Project dropdown
  - Tags field
  - "Automatically generate study plan" checkbox (checked)
  - "Save to Project" and "Cancel" buttons

**Common Issues:**
- If preview is empty: check page structure, might be dynamically loaded
- If word count is 0: page content not extracting properly

---

### TEST 3: Test Document Save

**Steps:**
1. Follow TEST 2 to get to preview screen
2. Verify metadata displays correctly
3. Select a project from dropdown
4. Modify title if desired
5. Add tags if desired (e.g., "test, tutorial")
6. Ensure "Automatically generate study plan" is CHECKED
7. Click "Save to Project" button
8. Wait 1-3 seconds...

**Expected Results:**
- Should see loading overlay with spinner
- "Processing content..." message appears
- After 1-3 seconds, overlay disappears
- Should see success message: "Success! Document saved to '[Title]'"
- After 2 seconds, returns to "Capture Content" view

**Verify in Electron:**
1. Switch to Electron app window
2. Go to the project you saved to
3. Should see new document with:
   - Title matching what you entered
   - Content preview
   - Study plan with items listed
   - Correct tag count

---

### TEST 4: Test Duplicate Detection

**Steps:**
1. Navigate to article URL: https://example.com/unique-test-page
2. Click extension icon
3. Click "Capture Full Page"
4. Wait for preview to load
5. Select a project
6. Click "Save to Project"
7. Wait for success message
8. **Do NOT close the tab**
9. Click extension icon again
10. Click "Capture Full Page" again
11. Wait for preview to load

**Expected Results on Second Capture:**
- Should see **DUPLICATE WARNING** dialog
- Warning should show:
  - ⚠️ Icon
  - "Document Already Imported" heading
  - Message about duplicate from URL
  - "Cancel" button
  - "Import Anyway" button (blue)

**Test Cancel Button:**
1. In duplicate warning, click "Cancel"
2. Should return to "Capture Content" view

**Test Import Anyway:**
1. Repeat TEST 4 Steps 1-11
2. At duplicate warning, click "Import Anyway"
3. Document should save with new ID
4. Both documents should appear in Electron

---

### TEST 5: Test Without Auto-Generate Plan

**Steps:**
1. Capture any page
2. In preview, **UNCHECK** "Automatically generate study plan"
3. Select project
4. Click "Save to Project"
5. Wait for completion

**Expected Results:**
- Document saves successfully
- Success message appears
- In Electron app:
  - Document should appear
  - **No study plan** should be created

---

### TEST 6: Test Selection Capture

**Steps:**
1. Navigate to any page with text
2. Select some text on the page (highlight with mouse)
3. Right-click on selected text
4. Should see context menu with two options:
   - "Capture page to Me Learning Hub"
   - "Capture selection to Me Learning Hub"
5. Click "Capture selection to Me Learning Hub"

**Expected Results:**
- Popup appears
- Preview shows **only** the selected text
- Metadata shows smaller word count
- Can save normally

---

### TEST 7: Test Project List

**Steps:**
1. Create 2-3 projects in Electron app first
2. Open extension popup (don't capture yet)
3. Look at "Your Projects" section at bottom

**Expected Results:**
- Should see list of 3 most recent projects
- Each shows:
  - Project name
  - Number of documents in it (e.g., "2 documents")
- Clicking a project starts capture flow

---

### TEST 8: Test Settings

**Steps:**
1. Click extension icon
2. Look for ⚙️ settings button (top-right)
3. Click settings button
4. Should see settings page with options:
   - "Auto-save captured content" checkbox
   - "Copy captured markdown to clipboard" checkbox
   - "Show context menu options" checkbox
   - "Include images in captures" checkbox
   - "Preserve links in markdown" checkbox
   - "Default Project" dropdown
5. Try toggling some settings
6. Click back arrow to return to main view

**Expected Results:**
- Settings load without errors
- Checkboxes toggle smoothly
- Settings persist on next popup open
- Back arrow returns to capture view

---

### TEST 9: Test Error Conditions

**Error 1: No Project Selected**
1. Capture content
2. Don't select a project from dropdown
3. Click "Save to Project"
4. Should see error message: "Please select a project"

**Error 2: No Title**
1. Capture content
2. Clear the title field completely
3. Click "Save to Project"
4. Should see error message: "Please enter a title"

**Error 3: Electron App Not Running**
1. Kill Electron app (Ctrl+C in terminal)
2. Try to capture and save content
3. Should see timeout error
4. Restart Electron app
5. Try again - should work

---

### TEST 10: Test Responsiveness & Performance

**Steps:**
1. Capture multiple pages in quick succession (5+ pages)
2. Save each to project
3. Monitor:
   - UI responsiveness
   - No lag or freezing
   - All documents save successfully
4. Check Chrome DevTools Memory usage (F12 → Memory)

**Expected Results:**
- All captures process quickly
- No memory leaks
- UI remains responsive
- All documents appear in Electron

---

## 🐛 Debug Tips

### Check Browser Console
```
1. Press F12 to open Chrome DevTools
2. Click "Console" tab
3. Look for any red errors
4. Check network requests in "Network" tab
```

### Check Extension Logs
```
1. Go to chrome://extensions/
2. Find "Me Learning Hub"
3. Click "Service Worker" link
4. View extension background logs
```

### Check Electron App
```
1. Look at Electron window
2. Open Electron DevTools (F12)
3. Check main process logs
4. Verify documents saved to: ~/.me-learning-hub/projects/
```

### Common Issues & Fixes

**Issue: Popup appears blank/white**
- Solution: Hard refresh Chrome (Ctrl+Shift+R)
- Solution: Reload extension in chrome://extensions/

**Issue: Content not extracting**
- Solution: Some sites block content extraction
- Solution: Try different URL/website
- Solution: Check if page loads normally first

**Issue: Documents not appearing in Electron**
- Solution: Make sure project exists in Electron
- Solution: Refresh Electron window (Ctrl+R)
- Solution: Check ~/.me-learning-hub/projects/ folder

**Issue: "Health check failed" error**
- Solution: Make sure Electron is running
- Solution: Verify port 47823 is available
- Solution: Check Electron logs for HTTP bridge errors

**Issue: Study plans not generating**
- Solution: Make sure "auto-generate" checkbox is CHECKED
- Solution: Verify Electron app has StudyPlanGenerator available
- Solution: Check Electron logs for errors

---

## 📊 Success Criteria Checklist

### Functionality
- [ ] Extension loads without errors
- [ ] Content capture works on multiple websites
- [ ] Preview displays metadata correctly
- [ ] Document saves to Electron app
- [ ] Study plans generate successfully
- [ ] Duplicate detection works
- [ ] Selection capture works
- [ ] Error messages appear appropriately

### UI/UX
- [ ] Popup appears cleanly
- [ ] Loading spinner animates smoothly
- [ ] Buttons are responsive
- [ ] Text is readable
- [ ] Forms are usable
- [ ] Navigation between views is smooth

### Performance
- [ ] Capture completes in < 2 seconds
- [ ] Save completes in < 3 seconds
- [ ] No memory leaks after 10+ operations
- [ ] Responsive to user input

### Error Handling
- [ ] Missing fields show clear errors
- [ ] Network errors are handled gracefully
- [ ] Can recover from errors
- [ ] Retry mechanisms work

---

## 📝 Test Report Template

Create a test report after manual testing:

```
TEST EXECUTION REPORT
====================

Date: [Date]
Tester: [Name]
Chrome Version: [Version]

Test Results:
TEST 1: Extension Loading        [PASS/FAIL]
TEST 2: Full Page Capture        [PASS/FAIL]
TEST 3: Document Save            [PASS/FAIL]
TEST 4: Duplicate Detection      [PASS/FAIL]
TEST 5: Without Auto-Generate    [PASS/FAIL]
TEST 6: Selection Capture        [PASS/FAIL]
TEST 7: Project List             [PASS/FAIL]
TEST 8: Settings                 [PASS/FAIL]
TEST 9: Error Conditions         [PASS/FAIL]
TEST 10: Performance             [PASS/FAIL]

Issues Found:
1. [Issue 1]
2. [Issue 2]

Notes:
[Any observations or feedback]

Overall Status: [PASS/FAIL]
```

---

## 🚀 Next Steps After Testing

**If All Tests Pass:**
1. Document results
2. Test on different websites
3. Test on different Chrome versions (if available)
4. Prepare for Chrome Store submission

**If Issues Found:**
1. Document issues with screenshots
2. Create bug reports
3. Fix issues
4. Re-test affected areas

---

## 📞 Support

**Debugging Resources:**
- Chrome Extension Documentation: https://developer.chrome.com/docs/extensions/
- Electron Documentation: https://www.electronjs.org/docs
- Extension Error Logs: DevTools console (F12)

**Common Questions:**
- Q: Can I test on mobile?
  A: Chrome extension only works on desktop Chrome/Chromium

- Q: Will it work on Firefox?
  A: Not yet - would need Firefox WebExtensions adaptation

- Q: Can I submit to Chrome Web Store?
  A: Yes, after completing testing and review

---

**Happy Testing! 🎉**

Remember to document any issues found and provide feedback for improvements.
