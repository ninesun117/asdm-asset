# Playwright Integration Testing Specs

This directory contains comprehensive guidelines and best practices for integration testing using Playwright with TypeScript.

## Overview

These specs provide guidance for:
- Testing component interactions and integrations
- API mocking and route handling
- Critical user flow testing
- State management validation
- Cross-component testing strategies

## Available Specifications

### 1. Integration Testing Basics
**File**: [integration-testing-basics.md](integration-testing-basics.md)

Covers:
- Integration testing fundamentals
- When to use integration tests
- Integration vs unit vs E2E testing
- Test organization strategies

### 2. API Mocking with Playwright
**File**: [api-mocking-with-playwright.md](api-mocking-with-playwright.md)

Covers:
- Using page.route() for API mocking
- Request interception
- Response manipulation
- Mock data strategies

### 3. User Flow Testing
**File**: [user-flow-testing.md](user-flow-testing.md)

Covers:
- Identifying critical user flows
- Testing multi-step processes
- Form submission workflows
- Shopping cart scenarios

### 4. Component Interaction Testing
**File**: [component-interaction-testing.md](component-interaction-testing.md)

Covers:
- Testing component communication
- Event handling verification
- Props and state flow
- Cross-component data validation

### 5. State Management Testing
**File**: [state-management-testing.md](state-management-testing.md)

Covers:
- Testing state transitions
- Redux/Context integration testing
- Local storage testing
- Session state validation

## Quick Reference

### Basic Integration Test
```typescript
import { test, expect } from '@playwright/test';

test.describe('User Registration Flow', () => {
  test('should register user and redirect to dashboard', async ({ page }) => {
    // Mock registration API
    await page.route('**/api/auth/register', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: '1', email: 'test@example.com' },
          token: 'mock-token'
        })
      });
    });

    await page.goto('/register');
    
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Verify redirect and state
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('.user-email')).toContainText('test@example.com');
  });
});
```

### API Mocking Example
```typescript
test('should handle API errors gracefully', async ({ page }) => {
  // Mock error response
  await page.route('**/api/users', async route => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Server error' })
    });
  });

  await page.goto('/users');
  
  // Verify error handling
  await expect(page.locator('.error-message')).toBeVisible();
});
```

### State Verification
```typescript
test('should update cart state after adding item', async ({ page }) => {
  await page.goto('/products');
  
  // Initial state
  const initialCount = await page.locator('.cart-count').textContent();
  
  // Add item
  await page.click('[data-testid="add-to-cart"]');
  
  // Verify state update
  await expect(page.locator('.cart-count')).not.toHaveText(initialCount);
  
  // Verify in storage
  const cart = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem('cart') || '[]');
  });
  expect(cart.length).toBeGreaterThan(0);
});
```

## Key Principles

1. **Test Real Scenarios**: Focus on actual user workflows
2. **Mock External Dependencies**: Control API responses for reliable tests
3. **Validate State Changes**: Verify UI updates correctly
4. **Test Error Paths**: Don't just test happy paths
5. **Use Semantic Selectors**: Prefer role and text-based selectors

## Integration Test Types

### 1. API Integration
- Verify UI responds correctly to API data
- Test loading states
- Handle error responses

### 2. Component Integration
- Test data flow between components
- Verify event propagation
- Check shared state updates

### 3. Flow Integration
- Multi-step user journeys
- Form submissions
- Navigation flows

### 4. Storage Integration
- Local storage persistence
- Session management
- Cookie handling

## Tech Stack

- **Test Framework**: Playwright
- **Language**: TypeScript
- **API Mocking**: page.route()
- **State Validation**: DOM assertions

## Related Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright API Mocking](https://playwright.dev/docs/mock)
- [Testing Library](https://testing-library.com)

## Version

Current version: 1.0.0

Last updated: 2026-02-19
