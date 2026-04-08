# API Mocking with Playwright

Comprehensive guide to mocking APIs with Playwright's page.route().

## Why Mock APIs?

- **Reliability**: No flaky external services
- **Speed**: Instant responses
- **Control**: Test specific scenarios
- **Isolation**: Test UI independently
- **Error Testing**: Simulate failures easily

## Basic Mocking

### Simple Response Mock
```typescript
import { test, expect } from '@playwright/test';

test('should display users from API', async ({ page }) => {
  // Mock API response
  await page.route('**/api/users', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 1, name: 'John Doe' },
        { id: 2, name: 'Jane Smith' }
      ])
    });
  });

  await page.goto('/users');
  
  await expect(page.locator('.user-name').first()).toContainText('John Doe');
});
```

### Mock with Status Codes
```typescript
test('should handle 404 error', async ({ page }) => {
  await page.route('**/api/users/*', async route => {
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'User not found' })
    });
  });

  await page.goto('/users/999');
  
  await expect(page.locator('.error-message')).toContainText('not found');
});
```

## Route Matching

### URL Patterns
```typescript
// Exact match
await page.route('https://api.example.com/users', handler);

// Wildcard match
await page.route('**/api/users', handler);

// Regex match
await page.route(/\/api\/users\/\d+/, handler);

// Glob pattern
await page.route('**/api/**/*.json', handler);
```

### Method Filtering
```typescript
// Only mock GET requests
await page.route('**/api/users', async route => {
  if (route.request().method() === 'GET') {
    await route.fulfill({ status: 200, body: '[]' });
  } else {
    await route.continue();
  }
});

// Mock specific methods
await page.route('**/api/users', async route => {
  const method = route.request().method();
  
  switch (method) {
    case 'GET':
      await route.fulfill({ status: 200, body: usersList });
      break;
    case 'POST':
      await route.fulfill({ status: 201, body: createdUser });
      break;
    default:
      await route.continue();
  }
});
```

## Request Interception

### Inspect Requests
```typescript
test('should send correct request data', async ({ page }) => {
  let requestBody: any;

  await page.route('**/api/users', async route => {
    requestBody = route.request().postDataJSON();
    await route.continue();
  });

  await page.goto('/users/new');
  await page.fill('[name="name"]', 'John Doe');
  await page.fill('[name="email"]', 'john@example.com');
  await page.click('button[type="submit"]');

  expect(requestBody).toEqual({
    name: 'John Doe',
    email: 'john@example.com'
  });
});
```

### Modify Requests
```typescript
await page.route('**/api/users', async route => {
  const request = route.request();
  
  // Modify headers
  const headers = {
    ...request.headers(),
    'Authorization': 'Bearer mock-token'
  };

  // Continue with modified request
  await route.continue({ headers });
});
```

### Modify Responses
```typescript
await page.route('**/api/users', async route => {
  const response = await route.fetch();
  const body = await response.json();
  
  // Modify response data
  body.users = body.users.map((user: any) => ({
    ...user,
    mocked: true
  }));

  await route.fulfill({
    status: response.status(),
    body: JSON.stringify(body)
  });
});
```

## Response Scenarios

### Success Responses
```typescript
test('should handle successful creation', async ({ page }) => {
  await page.route('**/api/users', async route => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '123',
          name: 'John Doe',
          created: true
        })
      });
    }
  });

  await page.goto('/users/new');
  await page.fill('[name="name"]', 'John Doe');
  await page.click('button[type="submit"]');

  await expect(page.locator('.success-message')).toBeVisible();
});
```

### Error Responses
```typescript
test('should handle server error', async ({ page }) => {
  await page.route('**/api/users', async route => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'Database connection failed'
      })
    });
  });

  await page.goto('/users');
  await expect(page.locator('.error-message')).toBeVisible();
});
```

### Network Errors
```typescript
test('should handle network failure', async ({ page }) => {
  await page.route('**/api/users', async route => {
    await route.abort('failed');
  });

  await page.goto('/users');
  await expect(page.locator('.network-error')).toBeVisible();
});
```

### Timeout Simulation
```typescript
test('should handle slow API', async ({ page }) => {
  await page.route('**/api/users', async route => {
    // Delay response by 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));
    await route.fulfill({
      status: 200,
      body: '[]'
    });
  });

  await page.goto('/users');
  
  // Check loading state appears
  await expect(page.locator('.loading')).toBeVisible();
  
  // Wait for content to load
  await expect(page.locator('.user-list')).toBeVisible({ timeout: 10000 });
});
```

## Mock Data Strategies

### Static Mock Data
```typescript
// mocks/users.ts
export const mockUsers = [
  { id: '1', name: 'John Doe', email: 'john@example.com' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
];

// test file
import { mockUsers } from '../mocks/users';

await page.route('**/api/users', async route => {
  await route.fulfill({
    status: 200,
    body: JSON.stringify(mockUsers)
  });
});
```

### Dynamic Mock Data
```typescript
// Generate data based on request
await page.route('**/api/users/*', async route => {
  const url = route.request().url();
  const id = url.split('/').pop();
  
  await route.fulfill({
    status: 200,
    body: JSON.stringify({
      id,
      name: `User ${id}`,
      email: `user${id}@example.com`
    })
  });
});
```

### Mock Data Builders
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

function createUser(overrides: Partial<User> = {}): User {
  return {
    id: Math.random().toString(36).substr(2, 9),
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    ...overrides
  };
}

test('should display admin badge', async ({ page }) => {
  const adminUser = createUser({ role: 'admin' });
  
  await page.route('**/api/users/me', async route => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify(adminUser)
    });
  });

  await page.goto('/dashboard');
  await expect(page.locator('.admin-badge')).toBeVisible();
});
```

## GraphQL Mocking

### Mock GraphQL Queries
```typescript
test('should handle GraphQL query', async ({ page }) => {
  await page.route('**/graphql', async route => {
    const request = route.request();
    const body = request.postDataJSON();
    
    if (body.query.includes('GetUsers')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            users: [
              { id: '1', name: 'John' },
              { id: '2', name: 'Jane' }
            ]
          }
        })
      });
    }
  });

  await page.goto('/users');
});
```

### Mock GraphQL Mutations
```typescript
await page.route('**/graphql', async route => {
  const body = route.request().postDataJSON();
  
  if (body.query.includes('CreateUser')) {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        data: {
          createUser: {
            id: '123',
            ...body.variables.input
          }
        }
      })
    });
  }
});
```

## Cleanup

### Remove Routes
```typescript
test('should handle real API after mock', async ({ page }) => {
  // Set up mock
  await page.route('**/api/users', mockHandler);
  
  // Use mock
  await page.goto('/users');
  
  // Remove mock
  await page.unroute('**/api/users', mockHandler);
  
  // Use real API
  await page.reload();
});
```

### Reset Between Tests
```typescript
test.afterEach(async ({ page }) => {
  // Unroute all handlers
  await page.unrouteAll();
});
```

## Best Practices Summary

1. ✅ Use descriptive route patterns
2. ✅ Mock both success and error cases
3. ✅ Use realistic mock data
4. ✅ Keep mocks close to tests
5. ✅ Clean up routes after tests
6. ✅ Test network conditions
7. ✅ Verify request payloads
8. ✅ Use fixtures for common mocks
