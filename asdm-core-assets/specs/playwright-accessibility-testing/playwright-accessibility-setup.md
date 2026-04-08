# Playwright Accessibility Setup

Installing and configuring Playwright for accessibility testing with TypeScript.

## Prerequisites

- Node.js 18+ installed
- TypeScript project setup
- Package manager (npm, yarn, or pnpm)

## Installation

### Install Playwright
```bash
npm init playwright@latest
```

Or add to existing project:
```bash
npm install -D @playwright/test
npx playwright install
```

### Install axe-core for Playwright
```bash
npm install -D @axe-core/playwright
```

## Project Structure

```
project/
├── tests/
│   ├── accessibility/
│   │   ├── login.spec.ts
│   │   ├── dashboard.spec.ts
│   │   └── common-components.spec.ts
│   └── e2e/
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

## Configuration

### playwright.config.ts
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020", "DOM"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "types": ["node", "@playwright/test"]
  },
  "include": ["tests/**/*"],
  "exclude": ["node_modules"]
}
```

## Test File Structure

### Basic Test Template
```typescript
// tests/accessibility/example.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should pass accessibility audit', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
```

### Custom Axe Configuration
```typescript
// tests/helpers/accessibility.ts
import AxeBuilder from '@axe-core/playwright';
import { Page } from '@playwright/test';

export async function checkAccessibility(page: Page, options?: {
  include?: string[];
  exclude?: string[];
  disableRules?: string[];
}) {
  const builder = new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);
  
  if (options?.include) {
    builder.include(options.include);
  }
  
  if (options?.exclude) {
    builder.exclude(options.exclude);
  }
  
  if (options?.disableRules) {
    builder.disableRules(options.disableRules);
  }
  
  return builder.analyze();
}
```

## Running Tests

### Run All Tests
```bash
npx playwright test
```

### Run Specific File
```bash
npx playwright test tests/accessibility/login.spec.ts
```

### Run with UI Mode
```bash
npx playwright test --ui
```

### Generate Report
```bash
npx playwright show-report
```

## CI/CD Integration

### GitHub Actions
```yaml
# .github/workflows/accessibility.yml
name: Accessibility Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Run accessibility tests
        run: npx playwright test --project=chromium
      
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

## Custom Fixtures

### Accessibility Fixture
```typescript
// tests/fixtures/accessibility.ts
import { test as base } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

type AccessibilityFixture = {
  checkA11y: () => Promise<void>;
};

export const test = base.extend<AccessibilityFixture>({
  checkA11y: async ({ page }, use) => {
    await use(async () => {
      const results = await new AxeBuilder({ page }).analyze();
      if (results.violations.length > 0) {
        console.log('Accessibility violations:', results.violations);
      }
      expect(results.violations).toEqual([]);
    });
  },
});

// Usage
test('page should be accessible', async ({ page, checkA11y }) => {
  await page.goto('/login');
  await checkA11y();
});
```

## Best Practices Summary

1. ✅ Use TypeScript for type safety
2. ✅ Configure multiple browsers
3. ✅ Set up CI/CD integration
4. ✅ Create reusable test helpers
5. ✅ Use custom fixtures for common patterns
6. ✅ Generate and archive reports
7. ✅ Run tests on pull requests
8. ✅ Test in different viewport sizes
