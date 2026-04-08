# axe-core Integration

Integrating axe-core with Playwright for automated accessibility testing.

## What is axe-core?

axe-core is an accessibility testing engine that:
- Detects WCAG violations automatically
- Provides detailed violation reports
- Works with testing frameworks
- Is maintained by Deque Systems

## Installation

```bash
npm install -D @axe-core/playwright
```

## Basic Usage

### Simple Accessibility Check
```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('should have no accessibility violations', async ({ page }) => {
  await page.goto('/dashboard');
  
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  
  expect(accessibilityScanResults.violations).toEqual([]);
});
```

## AxeBuilder Configuration

### Filter by Tags
```typescript
// Only test WCAG 2.1 AA rules
const results = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
  .analyze();
```

### Include/Exclude Elements
```typescript
// Test only specific elements
const results = await new AxeBuilder({ page })
  .include('#main-content')
  .analyze();

// Exclude specific elements
const results = await new AxeBuilder({ page })
  .exclude('#advertisement')
  .exclude('.third-party-widget')
  .analyze();
```

### Disable Specific Rules
```typescript
// Disable specific rules (use sparingly)
const results = await new AxeBuilder({ page })
  .disableRules(['color-contrast', 'image-alt'])
  .analyze();
```

### Run Specific Rules
```typescript
// Only run specific rules
const results = await new AxeBuilder({ page })
  .withRules(['color-contrast', 'image-alt', 'label'])
  .analyze();
```

## Understanding Results

### Violation Object Structure
```typescript
interface AxeResult {
  violations: Result[];
  passes: Result[];
  incomplete: Result[];
  inapplicable: Result[];
}

interface Result {
  id: string;                    // Rule ID
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  tags: string[];                // WCAG tags
  description: string;           // Rule description
  help: string;                  // Help text
  helpUrl: string;               // Link to documentation
  nodes: NodeResult[];           // Affected elements
}

interface NodeResult {
  html: string;                  // HTML of affected element
  target: string[];              // CSS selector
  failureSummary: string;        // What failed
  impact: string;
}
```

### Analyzing Violations
```typescript
test('detailed violation report', async ({ page }) => {
  await page.goto('/form');
  
  const results = await new AxeBuilder({ page }).analyze();
  
  results.violations.forEach(violation => {
    console.log(`\nRule: ${violation.id}`);
    console.log(`Impact: ${violation.impact}`);
    console.log(`Description: ${violation.description}`);
    console.log(`Help: ${violation.helpUrl}`);
    
    violation.nodes.forEach(node => {
      console.log(`  Element: ${node.target.join(', ')}`);
      console.log(`  HTML: ${node.html}`);
    });
  });
});
```

## Advanced Patterns

### Custom Reporter
```typescript
// tests/helpers/accessibility-reporter.ts
import { Result } from 'axe-core';

export function formatViolation(violation: Result): string {
  const elements = violation.nodes
    .map(node => `  - ${node.target.join(' > ')}`)
    .join('\n');
  
  return `
[${violation.impact?.toUpperCase()}] ${violation.id}
${violation.description}
Help: ${violation.helpUrl}
Elements:
${elements}
  `.trim();
}

export function logViolations(violations: Result[]): void {
  if (violations.length === 0) {
    console.log('✅ No accessibility violations found');
    return;
  }
  
  console.log(`\n❌ Found ${violations.length} accessibility violation(s):\n`);
  violations.forEach(formatViolation);
}
```

### Snapshot Testing
```typescript
test('accessibility snapshot', async ({ page }) => {
  await page.goto('/dashboard');
  
  const results = await new AxeBuilder({ page }).analyze();
  
  // Create snapshot of violations
  const violationIds = results.violations.map(v => v.id).sort();
  expect(violationIds).toMatchSnapshot('accessibility-violations.txt');
});
```

### Conditional Testing
```typescript
test('accessibility based on user state', async ({ page }) => {
  // Test logged-out state
  await page.goto('/');
  let results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  
  // Test logged-in state
  await login(page, 'user@example.com', 'password');
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

### Testing Dynamic Content
```typescript
test('accessibility after interaction', async ({ page }) => {
  await page.goto('/modal-demo');
  
  // Test initial state
  let results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  
  // Open modal and test again
  await page.click('[data-testid="open-modal"]');
  await page.waitForSelector('[role="dialog"]');
  
  results = await new AxeBuilder({ page })
    .include('[role="dialog"]')
    .analyze();
  expect(results.violations).toEqual([]);
});
```

## Common Rules Reference

### Critical Rules
- `color-contrast`: Sufficient color contrast
- `image-alt`: Images need alt text
- `label`: Form elements need labels
- `html-has-lang`: HTML needs lang attribute
- `document-title`: Document needs title

### Serious Rules
- `aria-allowed-attr`: Valid ARIA attributes
- `aria-hidden-body`: Don't hide body
- `aria-hidden-focus`: Hidden elements shouldn't be focusable
- `button-name`: Buttons need accessible names
- `link-name`: Links need accessible names

### Moderate Rules
- `landmark-one-main`: One main landmark
- `page-has-heading-one`: Page needs h1
- `region`: Content should be in regions

## Best Practices Summary

1. ✅ Run axe-core on every page
2. ✅ Filter by WCAG tags for compliance
3. ✅ Test different page states
4. ✅ Exclude third-party content
5. ✅ Create custom reporters for clarity
6. ✅ Track violations over time
7. ✅ Don't disable rules without reason
8. ✅ Combine with manual testing
