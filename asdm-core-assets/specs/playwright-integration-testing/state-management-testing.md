# State Management Testing

Testing application state with Playwright integration tests.

## State Management Types

### Client-Side State
- Component state (useState, useReducer)
- Context state
- Redux/store state
- URL state (query parameters)

### Server State
- API data
- Cache state
- Optimistic updates

### Persistent State
- Local storage
- Session storage
- Cookies
- IndexedDB

## Component State Testing

### useState Testing
```typescript
test('should manage local component state', async ({ page }) => {
  await page.goto('/counter');

  // Initial state
  await expect(page.locator('.count')).toContainText('0');

  // Increment updates state
  await page.click('.increment');
  await expect(page.locator('.count')).toContainText('1');

  // Multiple increments
  await page.click('.increment');
  await page.click('.increment');
  await expect(page.locator('.count')).toContainText('3');

  // Reset state
  await page.click('.reset');
  await expect(page.locator('.count')).toContainText('0');
});
```

### Form State Testing
```typescript
test('should track form dirty state', async ({ page }) => {
  await page.goto('/profile');

  // Initial state - not dirty
  await expect(page.locator('.save-button')).toBeDisabled();

  // Change field - dirty
  await page.fill('[name="name"]', 'New Name');
  await expect(page.locator('.save-button')).toBeEnabled();

  // Revert - not dirty
  await page.fill('[name="name"]', 'Original Name');
  await expect(page.locator('.save-button')).toBeDisabled();
});
```

## Context State Testing

### Theme Context
```typescript
test('should persist theme preference', async ({ page }) => {
  await page.goto('/');

  // Set dark theme
  await page.click('.theme-toggle');
  await expect(page.locator('html')).toHaveClass(/dark/);

  // Verify in storage
  const theme = await page.evaluate(() => localStorage.getItem('theme'));
  expect(theme).toBe('dark');

  // Reload - state persists
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/dark/);
});
```

### Auth Context
```typescript
test('should maintain auth state across navigation', async ({ page }) => {
  await page.route('**/api/auth/me', async route => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ id: '1', name: 'John Doe' })
    });
  });

  await page.goto('/');

  // Authenticated state
  await expect(page.locator('.user-menu')).toBeVisible();

  // Navigate to different page
  await page.click('a[href="/profile"]');
  await expect(page.locator('.user-menu')).toBeVisible();

  // Navigate back
  await page.goBack();
  await expect(page.locator('.user-menu')).toBeVisible();
});
```

## Redux/Store State Testing

### Initial State
```typescript
test('should initialize store with correct state', async ({ page }) => {
  await page.route('**/api/todos', async route => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify([
        { id: '1', text: 'Task 1', completed: false }
      ])
    });
  });

  await page.goto('/todos');

  // Check store state
  const todos = await page.evaluate(() => {
    return (window as any).__REDUX_STATE__?.todos;
  });

  expect(todos).toHaveLength(1);
  expect(todos[0].text).toBe('Task 1');
});
```

### State Updates
```typescript
test('should update store state on action', async ({ page }) => {
  await page.route('**/api/todos', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        body: JSON.stringify([])
      });
    } else if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        body: JSON.stringify({ id: '1', ...body })
      });
    }
  });

  await page.goto('/todos');

  // Dispatch action
  await page.fill('[name="todo"]', 'New task');
  await page.click('.add-todo');

  // Verify state update
  const todos = await page.evaluate(() => {
    return (window as any).__REDUX_STATE__?.todos;
  });

  expect(todos).toHaveLength(1);
  expect(todos[0].text).toBe('New task');
});
```

## Local Storage Testing

### Read/Write Operations
```typescript
test('should persist data in local storage', async ({ page }) => {
  await page.goto('/settings');

  // Set preference
  await page.check('[name="notifications"]');
  await page.click('.save-settings');

  // Verify storage
  const settings = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem('settings') || '{}');
  });

  expect(settings.notifications).toBe(true);

  // Reload and verify persistence
  await page.reload();
  await expect(page.locator('[name="notifications"]')).toBeChecked();
});
```

### Storage Events
```typescript
test('should sync state across tabs', async ({ page, context }) => {
  await page.goto('/cart');

  // Add item in first tab
  await page.click('.add-to-cart');
  const cartId = await page.evaluate(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '{}');
    return cart.id;
  });

  // Open second tab
  const page2 = await context.newPage();
  await page2.goto('/cart');

  // Verify sync
  const cartId2 = await page2.evaluate(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '{}');
    return cart.id;
  });

  expect(cartId2).toBe(cartId);
});
```

### Clear Storage
```typescript
test('should clear storage on logout', async ({ page }) => {
  // Setup authenticated state
  await page.route('**/api/auth/me', async route => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ id: '1' })
    });
  });

  await page.goto('/dashboard');

  // Set some data
  await page.evaluate(() => {
    localStorage.setItem('userData', JSON.stringify({ name: 'John' }));
    localStorage.setItem('token', 'abc123');
  });

  // Logout
  await page.route('**/api/auth/logout', async route => {
    await route.fulfill({ status: 200 });
  });
  await page.click('.logout-button');

  // Verify storage cleared
  const token = await page.evaluate(() => localStorage.getItem('token'));
  const userData = await page.evaluate(() => localStorage.getItem('userData'));

  expect(token).toBeNull();
  expect(userData).toBeNull();
});
```

## Session Storage Testing

### Tab-Scoped Data
```typescript
test('should store temporary data in session storage', async ({ page }) => {
  await page.goto('/wizard');

  // Complete step 1
  await page.fill('[name="name"]', 'John');
  await page.click('.next');

  // Verify session storage
  const formData = await page.evaluate(() => {
    return JSON.parse(sessionStorage.getItem('wizard-form') || '{}');
  });

  expect(formData.name).toBe('John');

  // Complete step 2
  await page.fill('[name="email"]', 'john@example.com');
  await page.click('.next');

  // Verify session storage updated
  const updatedForm = await page.evaluate(() => {
    return JSON.parse(sessionStorage.getItem('wizard-form') || '{}');
  });

  expect(updatedForm.email).toBe('john@example.com');
  expect(updatedForm.name).toBe('John');
});
```

## Cookie Testing

### Set Cookies
```typescript
test('should set and read cookies', async ({ page, context }) => {
  await page.route('**/api/auth/login', async route => {
    await route.fulfill({
      status: 200,
      headers: {
        'Set-Cookie': 'session=abc123; Path=/; HttpOnly'
      }
    });
  });

  await page.goto('/login');
  await page.click('.login-button');

  // Verify cookie
  const cookies = await context.cookies();
  const sessionCookie = cookies.find(c => c.name === 'session');

  expect(sessionCookie).toBeDefined();
  expect(sessionCookie?.value).toBe('abc123');
});
```

### Cookie-Based Authentication
```typescript
test('should maintain session with cookies', async ({ page, context }) => {
  // Set auth cookie
  await context.addCookies([{
    name: 'session',
    value: 'valid-session-token',
    domain: 'localhost',
    path: '/'
  }]);

  await page.route('**/api/auth/me', async route => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ id: '1', name: 'John' })
    });
  });

  await page.goto('/dashboard');

  // Authenticated based on cookie
  await expect(page.locator('.user-name')).toBeVisible();
});
```

## URL State Testing

### Query Parameters
```typescript
test('should sync state with URL parameters', async ({ page }) => {
  await page.goto('/search');

  // Perform search
  await page.fill('[name="q"]', 'laptop');
  await page.click('.search-button');

  // URL updates
  await expect(page).toHaveURL(/q=laptop/);

  // Direct navigation with params
  await page.goto('/search?q=phone&sort=price');
  await expect(page.locator('[name="q"]')).toHaveValue('phone');
  await expect(page.locator('[name="sort"]')).toHaveValue('price');
});
```

### URL-Based Pagination
```typescript
test('should update URL on pagination', async ({ page }) => {
  await page.route('**/api/products*', async route => {
    const url = new URL(route.request().url());
    const page = parseInt(url.searchParams.get('page') || '1');
    
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        items: [{ id: page.toString(), name: `Product ${page}` }],
        page,
        totalPages: 5
      })
    });
  });

  await page.goto('/products');

  // Initial page
  await expect(page).toHaveURL(/page=1/);

  // Go to next page
  await page.click('.next-page');
  await expect(page).toHaveURL(/page=2/);

  // Verify back button
  await page.goBack();
  await expect(page).toHaveURL(/page=1/);
});
```

## State Transition Testing

### Loading States
```typescript
test('should show loading state during API call', async ({ page }) => {
  await page.route('**/api/data', async route => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ data: 'loaded' })
    });
  });

  await page.goto('/');

  // Click triggers API
  await page.click('.load-data');

  // Loading state
  await expect(page.locator('.loading-spinner')).toBeVisible();

  // Data loaded
  await expect(page.locator('.content')).toBeVisible({ timeout: 2000 });
  await expect(page.locator('.loading-spinner')).not.toBeVisible();
});
```

### Error State Transitions
```typescript
test('should transition to error state on failure', async ({ page }) => {
  await page.route('**/api/data', async route => {
    await route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'Server error' })
    });
  });

  await page.goto('/');
  await page.click('.load-data');

  // Error state
  await expect(page.locator('.error-message')).toBeVisible();
  await expect(page.locator('.retry-button')).toBeVisible();

  // Retry
  await page.route('**/api/data', async route => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ data: 'success' })
    });
  });

  await page.click('.retry-button');
  await expect(page.locator('.content')).toBeVisible();
});
```

## Best Practices Summary

1. ✅ Test state initialization
2. ✅ Verify state transitions
3. ✅ Test persistence (storage)
4. ✅ Check state synchronization
5. ✅ Test loading and error states
6. ✅ Verify URL state sync
7. ✅ Test cross-tab state
8. ✅ Check state cleanup
9. ✅ Test cookie-based state
10. ✅ Verify state rollback
