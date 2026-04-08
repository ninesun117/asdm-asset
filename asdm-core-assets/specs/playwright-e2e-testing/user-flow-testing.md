# User Flow Testing

Patterns and practices for testing user flows.

## Core User Flows

### Login Flow Testing

```typescript
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('/api/login', (route) => {
      const body = route.request().postDataJSON();
      if (body.username === 'validUser' && body.password === 'validPass') {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ 
            message: 'Login successful',
            token: 'mock-token'
          }),
        });
      } else {
        route.fulfill({
          status: 401,
          body: JSON.stringify({ error: 'Invalid credentials' }),
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
      /Welcome, validUser/
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

  test('should validate required fields', async ({ page }) => {
    await page.locator('[data-testid="submit"]').click();
    
    await expect(page.locator('[data-testid="username-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
  });
});
```

### Registration Flow Testing

```typescript
test.describe('Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('/api/register', (route) => {
      const body = route.request().postDataJSON();
      
      if (body.email && body.password && body.name) {
        route.fulfill({
          status: 201,
          body: JSON.stringify({ 
            id: 1,
            name: body.name,
            email: body.email 
          }),
        });
      } else {
        route.fulfill({
          status: 400,
          body: JSON.stringify({ error: 'Missing required fields' }),
        });
      }
    });
    await page.goto('/register');
  });

  test('should register a new user successfully', async ({ page }) => {
    await page.locator('[data-testid="name"]').fill('John Doe');
    await page.locator('[data-testid="email"]').fill('john@example.com');
    await page.locator('[data-testid="password"]').fill('SecurePass123!');
    await page.locator('[data-testid="confirm-password"]').fill('SecurePass123!');
    await page.locator('[data-testid="submit"]').click();

    await expect(page).toHaveURL('/welcome');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('should show error for mismatched passwords', async ({ page }) => {
    await page.locator('[data-testid="name"]').fill('John Doe');
    await page.locator('[data-testid="email"]').fill('john@example.com');
    await page.locator('[data-testid="password"]').fill('Password1');
    await page.locator('[data-testid="confirm-password"]').fill('Password2');
    await page.locator('[data-testid="submit"]').click();

    await expect(page.locator('[data-testid="password-mismatch-error"]')).toBeVisible();
  });

  test('should show error for existing email', async ({ page }) => {
    await page.route('/api/register', (route) => {
      route.fulfill({
        status: 409,
        body: JSON.stringify({ error: 'Email already exists' }),
      });
    });

    await page.locator('[data-testid="email"]').fill('existing@example.com');
    await page.locator('[data-testid="submit"]').click();

    await expect(page.locator('[data-testid="email-exists-error"]')).toBeVisible();
  });
});
```

### Checkout Flow Testing

```typescript
test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock cart
    await page.route('/api/cart', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          items: [
            { id: 1, name: 'Product 1', price: 29.99, quantity: 2 },
            { id: 2, name: 'Product 2', price: 49.99, quantity: 1 }
          ],
          total: 109.97
        }),
      });
    });

    // Mock payment
    await page.route('/api/payment', (route) => {
      const body = route.request().postDataJSON();
      
      if (body.cardNumber === '4111111111111111') {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ 
            success: true, 
            orderId: 'ORD-123',
            message: 'Payment processed'
          }),
        });
      } else {
        route.fulfill({
          status: 400,
          body: JSON.stringify({ error: 'Payment failed' }),
        });
      }
    });

    await page.goto('/checkout');
  });

  test('should complete checkout with valid payment', async ({ page }) => {
    // Verify cart display
    await expect(page.locator('[data-testid="cart-total"]')).toHaveText('$109.97');
    
    // Fill payment info
    await page.locator('[data-testid="card-number"]').fill('4111111111111111');
    await page.locator('[data-testid="expiry"]').fill('12/25');
    await page.locator('[data-testid="cvv"]').fill('123');
    await page.locator('[data-testid="submit-payment"]').click();

    // Verify order confirmation
    await expect(page).toHaveURL(/\/order-confirmation/);
    await expect(page.locator('[data-testid="order-id"]')).toHaveText('ORD-123');
  });

  test('should show error for declined payment', async ({ page }) => {
    await page.locator('[data-testid="card-number"]').fill('4000000000000002');
    await page.locator('[data-testid="expiry"]').fill('12/25');
    await page.locator('[data-testid="cvv"]').fill('123');
    await page.locator('[data-testid="submit-payment"]').click();

    await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();
  });

  test('should validate required payment fields', async ({ page }) => {
    await page.locator('[data-testid="submit-payment"]').click();

    await expect(page.locator('[data-testid="card-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="expiry-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="cvv-error"]')).toBeVisible();
  });
});
```

## Multi-Step Flow Testing

### Wizard Flow

```typescript
test.describe('Multi-step Wizard', () => {
  test('should complete full wizard flow', async ({ page }) => {
    await page.goto('/wizard');

    // Step 1: Personal info
    await page.locator('[data-testid="first-name"]').fill('John');
    await page.locator('[data-testid="last-name"]').fill('Doe');
    await page.locator('[data-testid="next-step"]').click();

    // Verify step 2
    await expect(page.locator('[data-testid="step-indicator"]')).toHaveText('Step 2 of 3');

    // Step 2: Address info
    await page.locator('[data-testid="address"]').fill('123 Main St');
    await page.locator('[data-testid="city"]').fill('New York');
    await page.locator('[data-testid="zip"]').fill('10001');
    await page.locator('[data-testid="next-step"]').click();

    // Verify step 3
    await expect(page.locator('[data-testid="step-indicator"]')).toHaveText('Step 3 of 3');

    // Step 3: Confirmation
    await expect(page.locator('[data-testid="summary-first-name"]')).toHaveText('John');
    await expect(page.locator('[data-testid="summary-city"]')).toHaveText('New York');
    await page.locator('[data-testid="submit"]').click();

    // Verify completion
    await expect(page).toHaveURL('/wizard/complete');
  });

  test('should allow navigation between steps', async ({ page }) => {
    await page.goto('/wizard');

    // Fill step 1
    await page.locator('[data-testid="first-name"]').fill('John');
    await page.locator('[data-testid="next-step"]').click();

    // Go back to step 1
    await page.locator('[data-testid="previous-step"]').click();
    await expect(page.locator('[data-testid="first-name"]')).toHaveValue('John');

    // Data should be preserved
  });
});
```

### Search and Filter Flow

```typescript
test.describe('Search and Filter Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('/api/products**', (route) => {
      const url = new URL(route.request().url());
      const search = url.searchParams.get('q');
      const category = url.searchParams.get('category');
      
      const products = [
        { id: 1, name: 'Laptop', category: 'electronics', price: 999 },
        { id: 2, name: 'Phone', category: 'electronics', price: 699 },
        { id: 3, name: 'Shirt', category: 'clothing', price: 29 }
      ];

      let filtered = products;
      if (search) {
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(search.toLowerCase())
        );
      }
      if (category) {
        filtered = filtered.filter(p => p.category === category);
      }

      route.fulfill({
        status: 200,
        body: JSON.stringify(filtered),
      });
    });
    
    await page.goto('/products');
  });

  test('should search and filter products', async ({ page }) => {
    // Search
    await page.locator('[data-testid="search-input"]').fill('Laptop');
    await page.locator('[data-testid="search-submit"]').click();

    await expect(page.locator('[data-testid="product-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="product-name"]').first()).toHaveText('Laptop');

    // Clear search, apply filter
    await page.locator('[data-testid="search-clear"]').click();
    await page.locator('[data-testid="category-filter"]').selectOption('electronics');

    await expect(page.locator('[data-testid="product-item"]')).toHaveCount(2);
  });

  test('should show empty state when no results', async ({ page }) => {
    await page.locator('[data-testid="search-input"]').fill('NonexistentProduct');
    await page.locator('[data-testid="search-submit"]').click();

    await expect(page.locator('[data-testid="no-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="no-results"]')).toHaveText(
      /No products found/
    );
  });
});
```

## State Management Testing

### Testing Application State Persistence

```typescript
test.describe('State Persistence', () => {
  test('should persist cart across page reloads', async ({ page }) => {
    // Add item to cart
    await page.goto('/products');
    await page.locator('[data-testid="add-to-cart"]').first().click();
    
    // Save cart state
    const cartBeforeReload = await page.locator('[data-testid="cart-count"]').textContent();

    // Reload page
    await page.reload();

    // Verify cart state preserved
    const cartAfterReload = await page.locator('[data-testid="cart-count"]').textContent();
    expect(cartAfterReload).toBe(cartBeforeReload);
  });

  test('should clear cart on logout', async ({ page }) => {
    // Login and add item
    await page.goto('/login');
    await page.locator('[data-testid="username"]').fill('user');
    await page.locator('[data-testid="password"]').fill('pass');
    await page.locator('[data-testid="submit"]').click();
    
    await page.goto('/products');
    await page.locator('[data-testid="add-to-cart"]').first().click();

    // Logout
    await page.locator('[data-testid="logout"]').click();

    // Verify cart cleared
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('0');
  });
});
```

## Best Practices

### 1. Test Complete User Journeys

```typescript
test('complete user journey: register -> login -> purchase', async ({ page }) => {
  // Register
  await page.goto('/register');
  await page.locator('[data-testid="email"]').fill('new@example.com');
  await page.locator('[data-testid="password"]').fill('password');
  await page.locator('[data-testid="submit"]').click();

  // Login
  await expect(page).toHaveURL('/login');
  await page.locator('[data-testid="email"]').fill('new@example.com');
  await page.locator('[data-testid="password"]').fill('password');
  await page.locator('[data-testid="submit"]').click();

  // Purchase
  await page.goto('/products');
  await page.locator('[data-testid="add-to-cart"]').first().click();
  await page.locator('[data-testid="checkout"]').click();
  
  // Complete checkout
  await expect(page).toHaveURL('/checkout');
});
```

### 2. Test Edge Cases

```typescript
test('should handle network timeout gracefully', async ({ page }) => {
  await page.route('/api/data', (route) => {
    route.abort('timedout');
  });

  await page.goto('/dashboard');
  
  await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  await expect(page.locator('[data-testid="retry-button"]')).toBeEnabled();
});
```

### 3. Use Page Objects for Organization

```typescript
class LoginPage {
  constructor(private page: Page) {}

  async login(username: string, password: string) {
    await this.page.locator('[data-testid="username"]').fill(username);
    await this.page.locator('[data-testid="password"]').fill(password);
    await this.page.locator('[data-testid="submit"]').click();
  }

  async expectError(message: string) {
    await expect(this.page.locator('[data-testid="error-message"]')).toHaveText(message);
  }
}

test('login page object example', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await page.goto('/login');
  
  await loginPage.login('user', 'wrongpass');
  await loginPage.expectError('Invalid credentials');
});
```
