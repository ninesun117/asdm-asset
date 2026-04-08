# E2E Testing Basics

Fundamental concepts and best practices for end-to-end UI testing.

## Testing Focus

### Critical User Flows

When generating tests, focus on these types of user flows:

- **Login Flow**: User authentication and session management
- **Checkout Flow**: E-commerce transaction processes
- **Registration Flow**: New user account creation
- **Core Business Flows**: Application's primary functional paths

### Test Validation Scope

Tests should validate:

1. **Navigation Paths**: User movement between pages
2. **State Updates**: Correct application state changes
3. **Error Handling**: Proper responses to exceptional conditions

## Input/Output Expectations

### Input

A description of a web application feature or user story:

```
User needs to be able to log into the system and view their dashboard
Login requires username and password validation
Display error message on login failure
```

### Output

A Playwright test file with 3-5 tests:

- Covering critical user flows
- Including success and error scenarios
- Using API mocking to isolate dependencies

## Best Practices

### 1. Descriptive Names

Use test names that clearly explain the behavior being tested:

```typescript
// ✅ Good naming
test('should allow user to log in with valid credentials', async ({ page }) => {});

// ❌ Bad naming
test('login test', async ({ page }) => {});
```

### 2. Proper Setup

Include setup in `test.beforeEach` blocks:

```typescript
test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    // test code
  });
});
```

### 3. Avoid Visual Testing

Don't test visual styles directly:

```typescript
// ❌ Avoid
await expect(page.locator('.button')).toHaveCSS('background-color', 'rgb(0, 123, 255)');

// ✅ Recommended: Test behavior and visibility
await expect(page.locator('[data-testid="submit-button"]')).toBeVisible();
await expect(page.locator('[data-testid="submit-button"]')).toBeEnabled();
```

### 4. Based on User Stories

Tests should be based on user stories or common flows:

```typescript
// User story: As a user, I want to log in and access my dashboard
test('should navigate to dashboard after successful login', async ({ page }) => {
  await page.locator('[data-testid="username"]').fill('user');
  await page.locator('[data-testid="password"]').fill('pass');
  await page.locator('[data-testid="submit"]').click();
  
  await expect(page).toHaveURL('/dashboard');
});
```

## Test File Organization

### File Naming

```
tests/
├── auth/
│   ├── login.spec.ts
│   ├── register.spec.ts
│   └── logout.spec.ts
├── cart/
│   ├── add-to-cart.spec.ts
│   └── checkout.spec.ts
└── user/
    └── profile.spec.ts
```

### Test Count Limit

Limit each test file to 3-5 focused tests:

```typescript
// ✅ Good practice: Focused test file
test.describe('Login Page', () => {
  test('should display login form', async ({ page }) => {});
  test('should allow successful login', async ({ page }) => {});
  test('should show error for invalid credentials', async ({ page }) => {});
  test('should disable submit button while loading', async ({ page }) => {});
});
```
