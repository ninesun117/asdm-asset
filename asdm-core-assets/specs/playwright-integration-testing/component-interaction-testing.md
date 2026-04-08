# Component Interaction Testing

Testing how components work together in Playwright.

## Why Test Component Interactions?

- Verify data flows correctly between components
- Ensure events propagate as expected
- Test shared state management
- Validate parent-child communication
- Check integration with context providers

## Parent-Child Communication

### Props Flow
```typescript
test('should pass data from parent to child', async ({ page }) => {
  await page.route('**/api/users/1', async route => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ id: '1', name: 'John Doe', email: 'john@example.com' })
    });
  });

  await page.goto('/users/1');

  // Parent passes user data to child components
  await expect(page.locator('.user-header .name')).toContainText('John Doe');
  await expect(page.locator('.user-profile .email')).toContainText('john@example.com');
  await expect(page.locator('.user-stats .name')).toContainText('John Doe');
});
```

### Event Callbacks
```typescript
test('should handle child component events', async ({ page }) => {
  await page.route('**/api/todos', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        body: JSON.stringify([
          { id: '1', text: 'Task 1', completed: false }
        ])
      });
    } else if (route.request().method() === 'DELETE') {
      await route.fulfill({ status: 200 });
    }
  });

  await page.goto('/todos');

  // Child component triggers delete
  await page.click('.todo-item .delete-button');

  // Parent updates list
  await expect(page.locator('.todo-item')).toHaveCount(0);
  await expect(page.locator('.empty-state')).toBeVisible();
});
```

## Form Component Integration

### Form with Validation
```typescript
test('should validate form fields and show errors', async ({ page }) => {
  await page.goto('/register');

  // Form has multiple components working together
  const emailInput = page.locator('[name="email"]');
  const passwordInput = page.locator('[name="password"]');
  const submitButton = page.locator('button[type="submit"]');

  // Invalid email triggers validation component
  await emailInput.fill('invalid-email');
  await emailInput.blur();
  await expect(page.locator('.email-error')).toContainText('valid email');

  // Password validation component
  await passwordInput.fill('short');
  await passwordInput.blur();
  await expect(page.locator('.password-error')).toContainText('at least 8 characters');

  // Submit button disabled when invalid
  await expect(submitButton).toBeDisabled();

  // Fix errors - components react
  await emailInput.fill('valid@example.com');
  await passwordInput.fill('validpassword123');

  await expect(page.locator('.email-error')).not.toBeVisible();
  await expect(page.locator('.password-error')).not.toBeVisible();
  await expect(submitButton).toBeEnabled();
});
```

### Multi-Field Dependencies
```typescript
test('should update dependent fields', async ({ page }) => {
  await page.route('**/api/countries', async route => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify([
        { code: 'US', name: 'United States' },
        { code: 'CA', name: 'Canada' }
      ])
    });
  });

  await page.route('**/api/countries/US/states', async route => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify([
        { code: 'NY', name: 'New York' },
        { code: 'CA', name: 'California' }
      ])
    });
  });

  await page.goto('/address-form');

  // Select country triggers state dropdown update
  await page.selectOption('[name="country"]', 'US');

  // State dropdown populates
  await expect(page.locator('[name="state"] option')).toHaveCount(3); // 2 + placeholder

  // State dropdown enabled
  await expect(page.locator('[name="state"]')).toBeEnabled();
});
```

## List and Detail Integration

### List Selection Updates Detail
```typescript
test('should update detail view when list item selected', async ({ page }) => {
  await page.route('**/api/products', async route => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify([
        { id: '1', name: 'Product 1', price: 10 },
        { id: '2', name: 'Product 2', price: 20 }
      ])
    });
  });

  await page.route('**/api/products/1', async route => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        id: '1',
        name: 'Product 1',
        price: 10,
        description: 'Detailed description'
      })
    });
  });

  await page.goto('/products');

  // Click list item
  await page.click('.product-list-item:first-child');

  // Detail panel updates
  await expect(page.locator('.detail-panel .name')).toContainText('Product 1');
  await expect(page.locator('.detail-panel .description')).toContainText('Detailed description');

  // List item shows selected state
  await expect(page.locator('.product-list-item:first-child')).toHaveClass(/selected/);
});
```

### Master-Detail Pattern
```typescript
test('should sync master and detail views', async ({ page }) => {
  await page.route('**/api/orders', async route => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify([
        { id: '1', status: 'pending', total: 100 },
        { id: '2', status: 'completed', total: 200 }
      ])
    });
  });

  await page.goto('/orders');

  // Select order
  await page.click('[data-testid="order-1"]');

  // Detail shows correct order
  await expect(page.locator('.order-detail .order-id')).toContainText('1');

  // Change status in detail
  await page.click('.status-button[data-status="processing"]');

  // List updates to reflect change
  await expect(page.locator('[data-testid="order-1"] .status')).toContainText('processing');
});
```

## Modal and Dialog Integration

### Modal Triggers and Closures
```typescript
test('should integrate modal with parent component', async ({ page }) => {
  await page.route('**/api/items', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        body: JSON.stringify([{ id: '1', name: 'Item 1' }])
      });
    } else if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        body: JSON.stringify({ id: '2', name: 'New Item' })
      });
    }
  });

  await page.goto('/items');

  // Open modal from parent
  await page.click('.add-item-button');

  // Modal appears
  await expect(page.locator('[role="dialog"]')).toBeVisible();

  // Submit form in modal
  await page.fill('[role="dialog"] [name="name"]', 'New Item');
  await page.click('[role="dialog"] button[type="submit"]');

  // Modal closes
  await expect(page.locator('[role="dialog"]')).not.toBeVisible();

  // Parent list updates
  await expect(page.locator('.item').last()).toContainText('New Item');
});
```

### Confirmation Dialogs
```typescript
test('should handle confirmation dialog', async ({ page }) => {
  await page.route('**/api/items/1', async route => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({ status: 200 });
    }
  });

  await page.goto('/items');

  // Trigger delete
  await page.click('.delete-button');

  // Confirmation dialog appears
  await expect(page.locator('[role="alertdialog"]')).toBeVisible();
  await expect(page.locator('[role="alertdialog"]')).toContainText('Are you sure?');

  // Confirm
  await page.click('button:has-text("Delete")');

  // Item removed from parent
  await expect(page.locator('.item')).toHaveCount(0);
});
```

## Context and Provider Integration

### Theme Provider
```typescript
test('should sync theme across components', async ({ page }) => {
  await page.goto('/');

  // Toggle theme
  await page.click('.theme-toggle');

  // All components update
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.locator('.header')).toHaveClass(/dark/);
  await expect(page.locator('.sidebar')).toHaveClass(/dark/);

  // Persist in storage
  const theme = await page.evaluate(() => localStorage.getItem('theme'));
  expect(theme).toBe('dark');
});
```

### Auth Context Integration
```typescript
test('should update UI based on auth state', async ({ page }) => {
  // Not authenticated
  await page.route('**/api/auth/me', async route => {
    await route.fulfill({ status: 401 });
  });

  await page.goto('/');

  // Shows login button
  await expect(page.locator('.login-button')).toBeVisible();
  await expect(page.locator('.user-menu')).not.toBeVisible();

  // Mock login
  await page.route('**/api/auth/me', async route => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ id: '1', name: 'John' })
    });
  });

  await page.goto('/');
  await page.waitForSelector('.user-menu');

  // All components react to auth state
  await expect(page.locator('.login-button')).not.toBeVisible();
  await expect(page.locator('.user-menu')).toBeVisible();
  await expect(page.locator('.greeting')).toContainText('John');
});
```

## Data Grid Integration

### Sorting and Filtering
```typescript
test('should update grid when filters change', async ({ page }) => {
  await page.route('**/api/products*', async route => {
    const url = new URL(route.request().url());
    const sort = url.searchParams.get('sort');
    const category = url.searchParams.get('category');

    let products = [
      { id: '1', name: 'A Product', category: 'electronics' },
      { id: '2', name: 'B Product', category: 'clothing' }
    ];

    if (category) {
      products = products.filter(p => p.category === category);
    }

    if (sort === 'name') {
      products.sort((a, b) => a.name.localeCompare(b.name));
    }

    await route.fulfill({
      status: 200,
      body: JSON.stringify(products)
    });
  });

  await page.goto('/products');

  // Apply filter
  await page.selectOption('[name="category"]', 'electronics');

  // Grid updates
  await expect(page.locator('.product-row')).toHaveCount(1);
  await expect(page.locator('.product-row')).toContainText('electronics');

  // Apply sort
  await page.click('[data-sort="name"]');

  // Grid reorders
  const names = await page.locator('.product-name').allTextContents();
  expect(names).toEqual(names.sort());
});
```

## Best Practices Summary

1. ✅ Test data flow between components
2. ✅ Verify event propagation
3. ✅ Test shared state updates
4. ✅ Check parent-child communication
5. ✅ Test modal integration
6. ✅ Verify context provider effects
7. ✅ Test form validation interactions
8. ✅ Check list-detail synchronization
9. ✅ Test dependent field updates
10. ✅ Verify UI consistency across components
