# Test Structure

Test organization and naming conventions for Playwright tests.

## Basic Structure

### Test File Template

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup code
  });

  test('should do something specific', async ({ page }) => {
    // Test code
  });

  test.afterEach(async ({ page }) => {
    // Cleanup code (if needed)
  });
});
```

### Test Describe Blocks

Use `test.describe` to organize related tests:

```typescript
test.describe('Login Page', () => {
  test.describe('Form Validation', () => {
    test('should show error for empty username', async ({ page }) => {});
    test('should show error for empty password', async ({ page }) => {});
  });

  test.describe('Authentication Flow', () => {
    test('should redirect on successful login', async ({ page }) => {});
    test('should show error for invalid credentials', async ({ page }) => {});
  });
});
```

## Naming Conventions

### Test Naming Pattern

Use the "should + action + condition" pattern:

```typescript
// ✅ Recommended pattern
test('should allow user to log in with valid credentials', async ({ page }) => {});
test('should display error message when password is incorrect', async ({ page }) => {});
test('should redirect to dashboard after successful login', async ({ page }) => {});

// ❌ Avoid
test('test login', async ({ page }) => {});
test('it works', async ({ page }) => {});
```

### Describe Block Naming

Use page or feature names:

```typescript
// ✅ Good naming
test.describe('Shopping Cart', () => {});
test.describe('User Profile Settings', () => {});
test.describe('Payment Checkout Flow', () => {});

// ❌ Bad naming
test.describe('Tests', () => {});
test.describe('Cart1', () => {});
```

## Setup and Teardown

### beforeEach Setup

```typescript
test.beforeEach(async ({ page }) => {
  // Navigate to page
  await page.goto('/login');
  
  // Setup API mocking
  await page.route('/api/auth', (route) => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({ authenticated: true }),
    });
  });
});
```

### Conditional Setup

```typescript
test.describe('Authenticated User', () => {
  test.beforeEach(async ({ page }) => {
    // Simulate logged-in state
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('token', 'test-token');
    });
    await page.reload();
  });

  test('should access protected content', async ({ page }) => {});
});
```

### afterEach Cleanup

```typescript
test.afterEach(async ({ page }) => {
  // Clean up test data
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
});
```

## Test Hook Order

```typescript
test.describe('Example Suite', () => {
  test.beforeAll(async () => {
    console.log('1. beforeAll - runs once before all tests');
  });

  test.beforeEach(async ({ page }) => {
    console.log('2. beforeEach - runs before each test');
  });

  test('first test', async ({ page }) => {
    console.log('3. test - test execution');
  });

  test('second test', async ({ page }) => {
    console.log('3. test - test execution');
  });

  test.afterEach(async ({ page }) => {
    console.log('4. afterEach - runs after each test');
  });

  test.afterAll(async () => {
    console.log('5. afterAll - runs once after all tests');
  });
});
```

## Test Grouping Strategies

### Group by Feature

```typescript
// tests/auth/login.spec.ts
test.describe('Login Page', () => {});

// tests/auth/register.spec.ts  
test.describe('Registration Page', () => {});

// tests/auth/password-reset.spec.ts
test.describe('Password Reset', () => {});
```

### Group by User Type

```typescript
test.describe('Admin User', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
  });
  
  test('should access admin dashboard', async ({ page }) => {});
});

test.describe('Regular User', () => {
  test.beforeEach(async ({ page }) => {
    // Login as regular user
  });
  
  test('should not access admin dashboard', async ({ page }) => {});
});
```

## Parameterized Tests

### Using Loops

```typescript
const credentials = [
  { username: 'admin', password: 'admin123', expected: 'success' },
  { username: 'user', password: 'user123', expected: 'success' },
  { username: 'invalid', password: 'wrong', expected: 'error' },
];

for (const cred of credentials) {
  test(`login with ${cred.username} should ${cred.expected}`, async ({ page }) => {
    await page.locator('[data-testid="username"]').fill(cred.username);
    await page.locator('[data-testid="password"]').fill(cred.password);
    await page.locator('[data-testid="submit"]').click();
    
    if (cred.expected === 'success') {
      await expect(page).toHaveURL('/dashboard');
    } else {
      await expect(page.locator('[data-testid="error"]')).toBeVisible();
    }
  });
}
```

## Test Tags

### Using Tags to Categorize Tests

```typescript
test('critical login flow @smoke @critical', async ({ page }) => {});

test.describe('Shopping Cart @regression', () => {
  test('add item to cart', async ({ page }) => {});
  test('remove item from cart', async ({ page }) => {});
});
```

### Running Specific Tagged Tests

```bash
# Run only smoke tests
npx playwright test --grep "@smoke"

# Exclude regression tests
npx playwright test --grep-invert "@regression"
```
