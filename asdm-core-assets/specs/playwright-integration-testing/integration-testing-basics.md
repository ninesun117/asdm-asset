# Integration Testing Basics

Fundamentals of integration testing with Playwright.

## What is Integration Testing?

Integration testing verifies that different parts of an application work together correctly. It focuses on:
- Component interactions
- API and UI integration
- Data flow between modules
- State management across components

## Testing Pyramid

```
        ┌─────────┐
        │   E2E   │  Few, slow, expensive
        ├─────────┤
        │Integration│  Some, moderate speed
        ├─────────┤
        │  Unit   │  Many, fast, cheap
        └─────────┘
```

## Integration vs Other Tests

### Unit Tests
- Test individual functions/components
- Fast execution
- No external dependencies
- Limited scope

### Integration Tests
- Test component interactions
- Moderate execution time
- Some mocked dependencies
- Broader scope

### E2E Tests
- Test complete user flows
- Slow execution
- Real dependencies
- Full application scope

## When to Use Integration Tests

### Good Candidates
1. **API Integration**: UI responses to API calls
2. **Form Submissions**: Multi-field forms with validation
3. **State Transitions**: Application state changes
4. **Component Communication**: Parent-child interactions
5. **Authentication Flows**: Login/logout processes
6. **Shopping Carts**: Add/remove/update operations

### Not Good Candidates
1. **Pure Functions**: Use unit tests instead
2. **Static Content**: No integration needed
3. **Complete User Journeys**: Use E2E tests

## Test Organization

### Directory Structure
```
tests/
├── integration/
│   ├── auth/
│   │   ├── login.spec.ts
│   │   └── register.spec.ts
│   ├── cart/
│   │   ├── add-to-cart.spec.ts
│   │   └── checkout.spec.ts
│   └── user/
│       └── profile.spec.ts
├── e2e/
│   └── critical-flows/
└── unit/
    └── components/
```

### File Naming
```
{feature}-{action}.spec.ts

Examples:
- login-flow.spec.ts
- cart-checkout.spec.ts
- user-registration.spec.ts
```

## Test Structure

### AAA Pattern
```typescript
test('should update user profile', async ({ page }) => {
  // Arrange - Setup
  await page.route('**/api/user', route => 
    route.fulfill({ status: 200, body: JSON.stringify({ name: 'John' }) })
  );
  await page.goto('/profile');

  // Act - Perform actions
  await page.fill('[name="name"]', 'John Doe');
  await page.click('button[type="submit"]');

  // Assert - Verify results
  await expect(page.locator('.success-message')).toBeVisible();
});
```

### Given-When-Then Pattern
```typescript
test('should add item to cart', async ({ page }) => {
  // Given - Initial state
  await page.goto('/products');
  const initialCount = await page.locator('.cart-count').textContent();

  // When - Action performed
  await page.click('[data-testid="add-to-cart"]');

  // Then - Expected outcome
  const newCount = await page.locator('.cart-count').textContent();
  expect(parseInt(newCount || '0')).toBeGreaterThan(parseInt(initialCount || '0'));
});
```

## Test Data Management

### Fixtures
```typescript
// fixtures/user.ts
import { test as base } from '@playwright/test';

type UserFixtures = {
  authenticatedPage: Page;
  mockUser: User;
};

export const test = base.extend<UserFixtures>({
  mockUser: {
    id: '1',
    email: 'test@example.com',
    name: 'Test User'
  },
  
  authenticatedPage: async ({ page, mockUser }, use) => {
    // Setup authentication
    await page.route('**/api/auth/me', route =>
      route.fulfill({ status: 200, body: JSON.stringify(mockUser) })
    );
    await page.goto('/');
    await use(page);
  }
});
```

### Test Data Builders
```typescript
// builders/user.builder.ts
interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

export function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    ...overrides
  };
}

// Usage
const adminUser = buildUser({ role: 'admin', email: 'admin@example.com' });
```

## Mocking Strategies

### API Mocking
```typescript
// Mock all API calls
test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', route => route.continue());
});

// Mock specific endpoints
await page.route('**/api/users', async route => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{ id: '1', name: 'John' }])
  });
});
```

### Response Delays
```typescript
// Simulate slow API
await page.route('**/api/data', async route => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  await route.fulfill({
    status: 200,
    body: JSON.stringify({ data: 'slow' })
  });
});
```

## Assertions

### State Assertions
```typescript
// Verify UI state
await expect(page.locator('.loading')).toBeVisible();
await expect(page.locator('.error')).not.toBeVisible();

// Verify data state
const items = await page.locator('.item').count();
expect(items).toBe(5);

// Verify storage state
const token = await page.evaluate(() => localStorage.getItem('token'));
expect(token).toBeTruthy();
```

### Network Assertions
```typescript
// Verify API was called
const requestPromise = page.waitForRequest('**/api/users');

await page.click('button[data-testid="load-users"]');

const request = await requestPromise;
expect(request.method()).toBe('GET');
```

## Best Practices Summary

1. ✅ Focus on component interactions
2. ✅ Use meaningful test descriptions
3. ✅ Mock external dependencies
4. ✅ Test both happy and error paths
5. ✅ Keep tests independent
6. ✅ Use fixtures for common setup
7. ✅ Verify state changes
8. ✅ Clean up after tests
9. ✅ Use semantic selectors
10. ✅ Document complex test scenarios
