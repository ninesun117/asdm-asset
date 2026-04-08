# Selector Strategy

Best practices for selector strategies and waiting mechanisms.

## Selector Priority

### Recommended Selector Types

From highest to lowest priority:

1. **data-testid attribute** - Most recommended
2. **Semantic selectors** - getByRole, getByText, getByLabel
3. **CSS selectors** - Use only when necessary
4. **XPath selectors** - Avoid when possible

### data-testid Selectors

```typescript
// ✅ Recommended: Use data-testid
await page.locator('[data-testid="submit-button"]').click();
await page.locator('[data-testid="username-input"]').fill('user');

// Add data-testid in components
// <button data-testid="submit-button">Submit</button>
```

### Semantic Selectors

```typescript
// ✅ Recommended: Use semantic selectors
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByLabel('Username').fill('user');
await page.getByPlaceholder('Enter your email').fill('test@example.com');
await page.getByText('Welcome back').click();

// Chained semantic selectors
await page.getByRole('form').getByRole('button', { name: 'Login' }).click();
```

### Avoid Fragile Selectors

```typescript
// ❌ Avoid: CSS class selectors (styles may change)
await page.locator('.btn-primary').click();
await page.locator('.auth-form__submit').click();

// ❌ Avoid: ID selectors (may be dynamically generated)
await page.locator('#btn-123').click();

// ❌ Avoid: XPath (hard to maintain)
await page.locator('//div[@class="form"]/button[1]').click();

// ❌ Avoid: Deeply nested CSS
await page.locator('.container > .row > .col > .form > button').click();
```

## Playwright Auto-Waiting

### Built-in Auto-Waiting

Playwright automatically waits for elements to be actionable:

```typescript
// ✅ Playwright auto-waits for element to be clickable
await page.locator('[data-testid="submit"]').click();

// ✅ Playwright auto-waits for element to be visible
await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
```

### Avoid Explicit Waits

```typescript
// ❌ Avoid: Using waitForTimeout
await page.waitForTimeout(2000);

// ❌ Avoid: Unnecessary waitFor
await page.waitForSelector('[data-testid="button"]');
await page.locator('[data-testid="button"]').click();

// ✅ Recommended: Direct action, let Playwright auto-wait
await page.locator('[data-testid="button"]').click();
```

### When to Use Explicit Waits

```typescript
// ✅ Appropriate scenarios: Wait for specific conditions
await page.waitForURL('/dashboard');
await page.waitForResponse(resp => resp.url().includes('/api/data'));
await page.waitForLoadState('networkidle');

// ✅ Wait for element state changes
await expect(page.locator('[data-testid="loading"]')).not.toBeVisible();
await expect(page.locator('[data-testid="content"]')).toBeVisible();
```

## Advanced Selector Patterns

### Combining Selectors

```typescript
// Find within a specific container
const form = page.locator('[data-testid="login-form"]');
await form.locator('[data-testid="username"]').fill('user');
await form.locator('[data-testid="password"]').fill('pass');

// Chained selectors
await page
  .locator('[data-testid="user-list"]')
  .locator('[data-testid="user-item"]')
  .first()
  .click();
```

### Filtering Selectors

```typescript
// Filter with has-text
await page.locator('[data-testid="product-item"]', { hasText: 'iPhone' }).click();

// Filter with has for child elements
await page.locator('[data-testid="product-card"]', {
  has: page.locator('[data-testid="in-stock-badge"]')
}).click();

// Combined filtering
await page.locator('[data-testid="product-item"]', {
  hasText: 'Available',
  has: page.locator('[data-testid="add-to-cart"]')
}).click();
```

### Relative Locators

```typescript
// To the right of element
await page.locator('[data-testid="label"]:right-of([data-testid="icon"])').click();

// To the left of element
await page.locator('[data-testid="button"]:left-of([data-testid="text"])').click();

// Above element
await page.locator('[data-testid="input"]:above([data-testid="label"])').fill('text');

// Below element
await page.locator('[data-testid="input"]:below([data-testid="label"])').fill('text');

// Near element
await page.locator('[data-testid="button"]:near([data-testid="label"])').click();
```

## Selector Best Practices

### 1. Naming Convention

```typescript
// Recommended data-testid naming format
'[data-testid="submit-button"]'      // action-element
'[data-testid="user-email-input"]'   // content-element
'[data-testid="error-message"]'      // content description
'[data-testid="nav-menu"]'           // area description
```

### 2. Locating Unique Elements

```typescript
// ✅ Ensure selector returns unique element
const submitButton = page.getByTestId('submit-button'); // Unique
await submitButton.click();

// ❌ May return multiple elements
const buttons = page.getByRole('button'); // Potentially multiple
await buttons.first().click(); // Need to specify first()
```

### 3. Use Page Object Model

```typescript
// LoginPage.ts
class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByTestId('username-input');
    this.passwordInput = page.getByTestId('password-input');
    this.submitButton = page.getByTestId('submit-button');
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

## Assertion Selectors

### Web-First Assertions

```typescript
// ✅ Use expect assertions
await expect(page.locator('[data-testid="message"]')).toBeVisible();
await expect(page.locator('[data-testid="count"]')).toHaveText('5');
await expect(page.locator('[data-testid="checkbox"]')).toBeChecked();

// ✅ Negation assertions
await expect(page.locator('[data-testid="error"]')).not.toBeVisible();
```

### Available Assertion Types

```typescript
// Visibility
await expect(locator).toBeVisible();
await expect(locator).toBeHidden();
await expect(locator).not.toBeVisible();

// Text content
await expect(locator).toHaveText('Exact text');
await expect(locator).toHaveText(/regex pattern/);
await expect(locator).toContainText('partial text');

// Value
await expect(locator).toHaveValue('input value');
await expect(locator).toBeEmpty();

// State
await expect(locator).toBeEnabled();
await expect(locator).toBeDisabled();
await expect(locator).toBeChecked();
await expect(locator).toBeFocused();

// Count
await expect(page.locator('[data-testid="item"]')).toHaveCount(3);

// Attributes
await expect(locator).toHaveAttribute('href', '/dashboard');
await expect(locator).toHaveClass(/active/);

// CSS
await expect(locator).toHaveCSS('color', 'rgb(255, 0, 0)');
```
