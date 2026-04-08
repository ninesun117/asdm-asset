# API Mocking for E2E Tests

Using API mocking to create isolated, deterministic end-to-end tests.

## Why API Mocking

Benefits of mocking APIs in E2E tests:

1. **Isolation**: Tests don't depend on real backend services
2. **Determinism**: Test results are stable and repeatable
3. **Speed**: No waiting for real API responses
4. **Scenario Coverage**: Easily simulate edge cases
5. **Independence**: Tests can run offline

## Basic Route Mocking

### Using page.route

```typescript
test.beforeEach(async ({ page }) => {
  await page.route('/api/login', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ 
        message: 'Login successful',
        token: 'mock-token-123'
      }),
    });
  });
  
  await page.goto('/login');
});
```

### Mocking POST Requests

```typescript
await page.route('/api/users', (route) => {
  const request = route.request();
  
  if (request.method() === 'POST') {
    const body = request.postDataJSON();
    
    route.fulfill({
      status: 201,
      body: JSON.stringify({
        id: 1,
        name: body.name,
        email: body.email,
        created: new Date().toISOString()
      }),
    });
  }
});
```

## Conditional Responses

### Based on Request Body

```typescript
await page.route('/api/login', (route) => {
  const body = route.request().postDataJSON();
  
  if (body.username === 'validUser' && body.password === 'validPass') {
    route.fulfill({
      status: 200,
      body: JSON.stringify({ 
        message: 'Login successful',
        user: { id: 1, name: 'Valid User' }
      }),
    });
  } else {
    route.fulfill({
      status: 401,
      body: JSON.stringify({ error: 'Invalid credentials' }),
    });
  }
});
```

### Based on Query Parameters

```typescript
await page.route('/api/products**', (route) => {
  const url = new URL(route.request().url());
  const category = url.searchParams.get('category');
  
  if (category === 'electronics') {
    route.fulfill({
      status: 200,
      body: JSON.stringify([
        { id: 1, name: 'Laptop', price: 999 },
        { id: 2, name: 'Phone', price: 699 }
      ]),
    });
  } else {
    route.fulfill({
      status: 200,
      body: JSON.stringify([]),
    });
  }
});
```

### Based on Request Headers

```typescript
await page.route('/api/protected**', (route) => {
  const authHeader = route.request().headers()['authorization'];
  
  if (authHeader === 'Bearer valid-token') {
    route.fulfill({
      status: 200,
      body: JSON.stringify({ data: 'protected content' }),
    });
  } else {
    route.fulfill({
      status: 403,
      body: JSON.stringify({ error: 'Unauthorized' }),
    });
  }
});
```

## Advanced Mocking Patterns

### Simulating Delays

```typescript
await page.route('/api/slow-endpoint', async (route) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  route.fulfill({
    status: 200,
    body: JSON.stringify({ data: 'delayed response' }),
  });
});
```

### Simulating Error Responses

```typescript
// Simulate server error
await page.route('/api/error', (route) => {
  route.fulfill({
    status: 500,
    body: JSON.stringify({ error: 'Internal Server Error' }),
  });
});

// Simulate network error
await page.route('/api/network-error', (route) => {
  route.abort('failed');
});

// Simulate timeout
await page.route('/api/timeout', (route) => {
  route.abort('timedout');
});
```

### Dynamic Response Data

```typescript
let userIdCounter = 1;

await page.route('/api/users', (route) => {
  const body = route.request().postDataJSON();
  
  const newUser = {
    id: userIdCounter++,
    name: body.name,
    email: body.email,
    created: new Date().toISOString()
  };
  
  route.fulfill({
    status: 201,
    body: JSON.stringify(newUser),
  });
});
```

## Complete Example: Login Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock login API
    await page.route('/api/login', (route) => {
      const body = route.request().postDataJSON();
      
      if (body.username === 'validUser' && body.password === 'validPass') {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ 
            message: 'Login successful',
            token: 'mock-jwt-token',
            user: { id: 1, name: 'Valid User', role: 'admin' }
          }),
        });
      } else {
        route.fulfill({
          status: 401,
          body: JSON.stringify({ error: 'Invalid credentials' }),
        });
      }
    });

    // Mock user profile API
    await page.route('/api/user/profile', (route) => {
      const authHeader = route.request().headers()['authorization'];
      
      if (authHeader?.includes('mock-jwt-token')) {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ 
            id: 1, 
            name: 'Valid User', 
            email: 'valid@example.com' 
          }),
        });
      } else {
        route.fulfill({
          status: 401,
          body: JSON.stringify({ error: 'Unauthorized' }),
        });
      }
    });

    await page.goto('/login');
  });

  test('should allow user to log in with valid credentials', async ({ page }) => {
    await page.locator('[data-testid="username"]').fill('validUser');
    await page.locator('[data-testid="password"]').fill('validPass');
    await page.locator('[data-testid="submit"]').click();

    await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="welcome-message"]')).toHaveText(
      /Welcome, Valid User/
    );
  });

  test('should show an error message for invalid credentials', async ({ page }) => {
    await page.locator('[data-testid="username"]').fill('invalidUser');
    await page.locator('[data-testid="password"]').fill('wrongPass');
    await page.locator('[data-testid="submit"]').click();

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toHaveText(
      'Invalid credentials'
    );
  });

  test('should disable submit button while loading', async ({ page }) => {
    // Mock slow response
    await page.route('/api/login', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      route.fulfill({
        status: 200,
        body: JSON.stringify({ message: 'Login successful' }),
      });
    });

    await page.locator('[data-testid="username"]').fill('user');
    await page.locator('[data-testid="password"]').fill('pass');
    await page.locator('[data-testid="submit"]').click();

    // Button should be disabled
    await expect(page.locator('[data-testid="submit"]')).toBeDisabled();
    
    // Wait for loading to complete
    await expect(page.locator('[data-testid="submit"]')).toBeEnabled();
  });
});
```

## Mocking Strategies

### Global Mocking

Set up at the top of test file:

```typescript
// Apply to all tests
test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext();
  await context.route('**/api/**', (route) => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({ mocked: true }),
    });
  });
});
```

### Selective Mocking

Only mock specific requests:

```typescript
// Mock specific request, others go to real API
await page.route('/api/config', (route) => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({ featureFlag: true }),
  });
});

// Other API calls will use real network
```

### Passing Through Real Requests

```typescript
await page.route('/api/**', (route) => {
  // Pass through real requests under certain conditions
  if (route.request().url().includes('/api/health')) {
    route.continue();
  } else {
    route.fulfill({ status: 200, body: '{}' });
  }
});
```

## Best Practices

### 1. Centralize Mock Data

```typescript
// test-fixtures.ts
export const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com'
};

export const mockProducts = [
  { id: 1, name: 'Product 1', price: 100 },
  { id: 2, name: 'Product 2', price: 200 }
];
```

### 2. Use Fixtures for Reusable Mocks

```typescript
// fixtures.ts
import { test as base } from '@playwright/test';

export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    await page.route('/api/auth', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ authenticated: true }),
      });
    });
    await use(page);
  },
});
```

### 3. Verify Requests

```typescript
test('should send correct payload', async ({ page }) => {
  let requestBody: any;
  
  await page.route('/api/login', (route) => {
    requestBody = route.request().postDataJSON();
    route.fulfill({ status: 200, body: '{}' });
  });

  await page.locator('[data-testid="submit"]').click();

  expect(requestBody).toEqual({
    username: 'user',
    password: 'pass'
  });
});
```
