# WCAG Compliance Testing

Testing for WCAG 2.1 AA compliance with Playwright.

## WCAG 2.1 AA Requirements

### Perceivable

#### 1.1 Text Alternatives
```typescript
test('images should have alt text', async ({ page }) => {
  await page.goto('/');
  
  const images = await page.locator('img').all();
  
  for (const img of images) {
    const alt = await img.getAttribute('alt');
    const role = await img.getAttribute('role');
    
    // Image must have alt or be decorative
    expect(alt !== null || role === 'presentation').toBeTruthy();
  }
});
```

#### 1.4 Distinguishable

**Color Contrast (1.4.3)**
```typescript
import AxeBuilder from '@axe-core/playwright';

test('color contrast should meet AA standards', async ({ page }) => {
  await page.goto('/');
  
  const results = await new AxeBuilder({ page })
    .withRules(['color-contrast'])
    .analyze();
  
  expect(results.violations).toEqual([]);
});
```

**Text Resize (1.4.4)**
```typescript
test('text should be resizable to 200%', async ({ page }) => {
  await page.goto('/');
  await page.setViewportSize({ width: 1280, height: 800 });
  
  // Zoom to 200%
  await page.evaluate(() => {
    document.body.style.zoom = '2';
  });
  
  // Check content is still visible and functional
  const content = await page.locator('main').textContent();
  expect(content).toBeTruthy();
});
```

### Operable

#### 2.1 Keyboard Accessible
```typescript
test('all interactive elements should be keyboard accessible', async ({ page }) => {
  await page.goto('/');
  
  // Get all interactive elements
  const interactiveElements = await page.locator(
    'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ).all();
  
  for (const element of interactiveElements) {
    // Tab to element
    await page.keyboard.press('Tab');
    
    // Check if element is focused
    const isFocused = await element.evaluate(el => el === document.activeElement);
    expect(isFocused).toBeTruthy();
  }
});
```

#### 2.4 Navigable

**Bypass Blocks (2.4.1)**
```typescript
test('should have skip navigation link', async ({ page }) => {
  await page.goto('/');
  
  // Check for skip link
  const skipLink = page.locator('a[href="#main-content"], a[href="#main"]');
  await expect(skipLink).toBeVisible();
  
  // Test skip link functionality
  await skipLink.focus();
  await page.keyboard.press('Enter');
  
  // Main content should be focused
  const main = page.locator('#main-content, #main, main');
  await expect(main).toBeFocused();
});
```

**Page Titled (2.4.2)**
```typescript
test('page should have descriptive title', async ({ page }) => {
  await page.goto('/');
  
  const title = await page.title();
  expect(title.length).toBeGreaterThan(0);
  expect(title).not.toBe('Untitled');
});
```

**Focus Order (2.4.3)**
```typescript
test('focus order should be logical', async ({ page }) => {
  await page.goto('/form');
  
  const expectedOrder = [
    '#name',
    '#email',
    '#message',
    'button[type="submit"]'
  ];
  
  for (const selector of expectedOrder) {
    await page.keyboard.press('Tab');
    await expect(page.locator(selector)).toBeFocused();
  }
});
```

**Link Purpose (2.4.4)**
```typescript
test('links should have descriptive text', async ({ page }) => {
  await page.goto('/');
  
  const links = await page.locator('a').all();
  
  for (const link of links) {
    const text = await link.textContent();
    const ariaLabel = await link.getAttribute('aria-label');
    const title = await link.getAttribute('title');
    
    const linkText = text || ariaLabel || title;
    
    // Avoid generic link text
    const genericTexts = ['click here', 'read more', 'more', 'here'];
    expect(genericTexts).not.toContain(linkText?.toLowerCase());
  }
});
```

### Understandable

#### 3.1 Readable

**Page Language (3.1.1)**
```typescript
test('page should have lang attribute', async ({ page }) => {
  await page.goto('/');
  
  const lang = await page.locator('html').getAttribute('lang');
  expect(lang).toBeTruthy();
  expect(lang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/);
});
```

#### 3.2 Predictable

**On Focus (3.2.1)**
```typescript
test('focus should not trigger unexpected context changes', async ({ page }) => {
  await page.goto('/form');
  
  const initialUrl = page.url();
  
  // Tab through all elements
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Tab');
    
    // Should not navigate away
    expect(page.url()).toBe(initialUrl);
  }
});
```

#### 3.3 Input Assistance

**Error Identification (3.3.1)**
```typescript
test('form errors should be clearly identified', async ({ page }) => {
  await page.goto('/form');
  
  // Submit empty form
  await page.click('button[type="submit"]');
  
  // Check for error messages
  const errorMessages = await page.locator('[role="alert"], .error, [aria-invalid="true"]').all();
  
  for (const error of errorMessages) {
    await expect(error).toBeVisible();
    
    // Error should have accessible name
    const text = await error.textContent();
    expect(text?.length).toBeGreaterThan(0);
  }
});
```

**Labels or Instructions (3.3.2)**
```typescript
test('form fields should have labels', async ({ page }) => {
  await page.goto('/form');
  
  const inputs = await page.locator('input:not([type="hidden"]), select, textarea').all();
  
  for (const input of inputs) {
    const id = await input.getAttribute('id');
    const ariaLabel = await input.getAttribute('aria-label');
    const ariaLabelledby = await input.getAttribute('aria-labelledby');
    
    if (id) {
      // Check for associated label
      const label = page.locator(`label[for="${id}"]`);
      const hasLabel = await label.count() > 0;
      
      expect(hasLabel || ariaLabel || ariaLabelledby).toBeTruthy();
    } else {
      expect(ariaLabel || ariaLabelledby).toBeTruthy();
    }
  }
});
```

### Robust

#### 4.1 Compatible

**Parsing (4.1.1)**
```typescript
test('HTML should be valid', async ({ page }) => {
  await page.goto('/');
  
  const html = await page.content();
  
  // Check for duplicate IDs
  const ids = await page.evaluate(() => {
    const elements = document.querySelectorAll('[id]');
    return Array.from(elements).map(el => el.id);
  });
  
  const uniqueIds = new Set(ids);
  expect(ids.length).toBe(uniqueIds.size);
});
```

**Name, Role, Value (4.1.2)**
```typescript
test('custom components should have proper ARIA', async ({ page }) => {
  await page.goto('/');
  
  // Check custom buttons
  const customButtons = await page.locator('[role="button"]:not(button)').all();
  
  for (const button of customButtons) {
    const name = await button.evaluate(el => {
      return el.getAttribute('aria-label') ||
             el.getAttribute('aria-labelledby') ||
             el.textContent;
    });
    
    expect(name?.trim().length).toBeGreaterThan(0);
  }
});
```

## Comprehensive WCAG Test

```typescript
test('full WCAG 2.1 AA compliance', async ({ page }) => {
  await page.goto('/');
  
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  
  // Log detailed violations
  if (results.violations.length > 0) {
    console.log('\n❌ WCAG Violations Found:\n');
    
    results.violations.forEach(violation => {
      console.log(`${violation.impact}: ${violation.id}`);
      console.log(`  ${violation.description}`);
      console.log(`  ${violation.helpUrl}`);
      console.log(`  Affected elements: ${violation.nodes.length}`);
    });
  }
  
  expect(results.violations).toEqual([]);
});
```

## Best Practices Summary

1. ✅ Test all WCAG 2.1 AA success criteria
2. ✅ Use axe-core for automated testing
3. ✅ Manual test keyboard navigation
4. ✅ Verify focus management
5. ✅ Check color contrast
6. ✅ Validate form accessibility
7. ✅ Test error handling
8. ✅ Verify ARIA implementation
