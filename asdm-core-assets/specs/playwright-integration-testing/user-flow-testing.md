# User Flow Testing

Testing critical user flows with Playwright integration tests.

## What are User Flows?

User flows are sequences of actions that users perform to achieve a goal. Critical flows include:
- Authentication (login, registration, logout)
- Checkout (add to cart, payment, confirmation)
- Account management (profile update, password change)
- Search and filtering
- Data submission

## Identifying Critical Flows

### High-Value Flows
1. **Revenue-generating**: Checkout, subscription
2. **User acquisition**: Registration, onboarding
3. **User retention**: Login, password reset
4. **Core functionality**: Main app features

### Risk-Based Priority
- Complex multi-step processes
- Integration with external services
- Payment and financial operations
- Data modification flows

## Authentication Flows

### Registration Flow
```typescript
import { test, expect } from '@playwright/test';

test.describe('User Registration Flow', () => {
  test('should complete registration successfully', async ({ page }) => {
    // Mock email availability check
    await page.route('**/api/auth/check-email*', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ available: true })
      });
    });

    // Mock registration API
    await page.route('**/api/auth/register', async route => {
      await route.fulfill({
        status: 201,
        body: JSON.stringify({
          user: { id: '1', email: 'test@example.com' },
          token: 'mock-jwt-token'
        })
      });
    });

    // Mock welcome email
    await page.route('**/api/emails/welcome', async route => {
      await route.fulfill({ status: 200 });
    });

    await page.goto('/register');

    // Step 1: Fill form
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="confirmPassword"]', 'SecurePass123!');
    
    // Step 2: Submit
    await page.click('button[type="submit"]');
    
    // Step 3: Verify redirect to verification
    await expect(page).toHaveURL(/\/verify-email/);
    
    // Step 4: Verify state
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBe('mock-jwt-token');
  });

  test('should handle duplicate email', async ({ page }) => {
    await page.route('**/api/auth/check-email*', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ available: false })
      });
    });

    await page.goto('/register');
    await page.fill('[name="email"]', 'existing@example.com');
    await page.blur('[name="email"]');

    await expect(page.locator('.email-error')).toContainText('already registered');
  });
});
```

### Login Flow
```typescript
test.describe('Login Flow', () => {
  test('should login and redirect to dashboard', async ({ page }) => {
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: { id: '1', email: 'user@example.com', name: 'Test User' },
          token: 'mock-token'
        })
      });
    });

    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ id: '1', email: 'user@example.com', name: 'Test User' })
      });
    });

    await page.goto('/login');

    await page.fill('[name="email"]', 'user@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Verify redirect
    await expect(page).toHaveURL('/dashboard');
    
    // Verify user info displayed
    await expect(page.locator('.user-name')).toContainText('Test User');
  });

  test('should handle invalid credentials', async ({ page }) => {
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 401,
        body: JSON.stringify({ error: 'Invalid credentials' })
      });
    });

    await page.goto('/login');
    await page.fill('[name="email"]', 'user@example.com');
    await page.fill('[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Invalid credentials');
  });
});
```

### Logout Flow
```typescript
test('should logout and clear session', async ({ page }) => {
  // Setup authenticated state
  await page.route('**/api/auth/me', async route => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ id: '1', email: 'user@example.com' })
    });
  });

  await page.route('**/api/auth/logout', async route => {
    await route.fulfill({ status: 200 });
  });

  await page.goto('/dashboard');

  // Verify logged in
  await expect(page.locator('.user-menu')).toBeVisible();

  // Logout
  await page.click('.user-menu');
  await page.click('text=Logout');

  // Verify redirect to login
  await expect(page).toHaveURL('/login');

  // Verify session cleared
  const token = await page.evaluate(() => localStorage.getItem('token'));
  expect(token).toBeNull();
});
```

## Shopping Cart Flow

### Add to Cart
```typescript
test.describe('Add to Cart Flow', () => {
  test('should add item to cart and update count', async ({ page }) => {
    await page.route('**/api/products/1', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          id: '1',
          name: 'Product 1',
          price: 29.99,
          inStock: true
        })
      });
    });

    await page.route('**/api/cart', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ items: [], total: 0 })
        });
      } else if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            items: [{ productId: body.productId, quantity: 1 }],
            total: 29.99
          })
        });
      }
    });

    await page.goto('/products/1');
    
    const initialCount = await page.locator('.cart-count').textContent();
    
    await page.click('[data-testid="add-to-cart"]');
    
    await expect(page.locator('.cart-count')).not.toHaveText(initialCount || '0');
    await expect(page.locator('.notification')).toContainText('Added to cart');
  });
});
```

### Checkout Flow
```typescript
test.describe('Checkout Flow', () => {
  test('should complete checkout successfully', async ({ page }) => {
    // Mock cart
    await page.route('**/api/cart', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          items: [
            { productId: '1', name: 'Product 1', price: 29.99, quantity: 2 }
          ],
          total: 59.98
        })
      });
    });

    // Mock payment
    await page.route('**/api/payments', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          id: 'pay_123',
          status: 'succeeded',
          amount: 5998
        })
      });
    });

    // Mock order creation
    await page.route('**/api/orders', async route => {
      await route.fulfill({
        status: 201,
        body: JSON.stringify({
          id: 'ord_123',
          status: 'confirmed',
          total: 59.98
        })
      });
    });

    await page.goto('/checkout');

    // Fill shipping info
    await page.fill('[name="firstName"]', 'John');
    await page.fill('[name="lastName"]', 'Doe');
    await page.fill('[name="address"]', '123 Main St');
    await page.fill('[name="city"]', 'New York');
    await page.fill('[name="zip"]', '10001');

    // Fill payment info
    await page.fill('[name="cardNumber"]', '4242424242424242');
    await page.fill('[name="expiry"]', '12/25');
    await page.fill('[name="cvv"]', '123');

    // Submit
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page).toHaveURL(/\/order-confirmation/);
    await expect(page.locator('.order-id')).toContainText('ord_123');
  });
});
```

## Form Submission Flows

### Multi-Step Form
```typescript
test('should complete multi-step form', async ({ page }) => {
  await page.route('**/api/applications', async route => {
    await route.fulfill({
      status: 201,
      body: JSON.stringify({ id: 'app_123', status: 'submitted' })
    });
  });

  await page.goto('/apply');

  // Step 1: Personal Info
  await page.fill('[name="firstName"]', 'John');
  await page.fill('[name="lastName"]', 'Doe');
  await page.fill('[name="email"]', 'john@example.com');
  await page.click('text=Next');

  // Verify step 1 completed
  await expect(page.locator('.step-1')).toHaveClass(/completed/);

  // Step 2: Address
  await page.fill('[name="address"]', '123 Main St');
  await page.fill('[name="city"]', 'New York');
  await page.click('text=Next');

  // Step 3: Review
  await expect(page.locator('.summary-name')).toContainText('John Doe');
  await expect(page.locator('.summary-email')).toContainText('john@example.com');
  await page.click('text=Submit');

  // Verify submission
  await expect(page).toHaveURL(/\/application\/submitted/);
});
```

## Search and Filter Flows

### Search Flow
```typescript
test('should search and filter products', async ({ page }) => {
  await page.route('**/api/products/search*', async route => {
    const url = new URL(route.request().url());
    const query = url.searchParams.get('q');
    
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        results: [
          { id: '1', name: `${query} Product 1`, price: 10 },
          { id: '2', name: `${query} Product 2`, price: 20 }
        ],
        total: 2
      })
    });
  });

  await page.goto('/products');
  
  await page.fill('[data-testid="search-input"]', 'laptop');
  await page.press('[data-testid="search-input"]', 'Enter');

  await expect(page.locator('.product-item')).toHaveCount(2);
  await expect(page.locator('.product-name').first()).toContainText('laptop');
});
```

## Best Practices Summary

1. ✅ Test complete user journeys
2. ✅ Mock all external APIs
3. ✅ Verify state at each step
4. ✅ Test both success and failure paths
5. ✅ Use descriptive test names
6. ✅ Break long flows into smaller tests
7. ✅ Verify redirects and navigation
8. ✅ Check persistence (storage, cookies)
9. ✅ Test edge cases and validations
10. ✅ Use fixtures for common setup
