# Keyboard Navigation Testing

Testing keyboard accessibility with Playwright.

## Keyboard Accessibility Principles

### Why Keyboard Testing Matters
- Many users navigate without a mouse
- Essential for motor disabilities
- Required for screen reader users
- WCAG 2.1 Level A requirement

### Key Requirements
1. All functionality accessible via keyboard
2. No keyboard traps
3. Visible focus indicators
4. Logical focus order

## Tab Order Testing

### Basic Tab Navigation
```typescript
test('tab order should follow visual order', async ({ page }) => {
  await page.goto('/form');
  
  // Expected tab order
  const expectedOrder = [
    '#first-name',
    '#last-name',
    '#email',
    '#phone',
    '#message',
    'button[type="submit"]',
    'a[href="/help"]'
  ];
  
  for (const selector of expectedOrder) {
    await page.keyboard.press('Tab');
    await expect(page.locator(selector)).toBeFocused();
  }
});
```

### Tab Index Verification
```typescript
test('should not have positive tabindex', async ({ page }) => {
  await page.goto('/');
  
  // Positive tabindex disrupts natural tab order
  const positiveTabindex = await page.locator('[tabindex]').evaluateAll(elements => {
    return elements
      .filter(el => parseInt(el.getAttribute('tabindex') || '0') > 0)
      .map(el => ({
        tag: el.tagName,
        tabindex: el.getAttribute('tabindex')
      }));
  });
  
  expect(positiveTabindex).toEqual([]);
});
```

### Skip Links
```typescript
test('should have working skip link', async ({ page }) => {
  await page.goto('/');
  
  // Tab to skip link
  await page.keyboard.press('Tab');
  
  const skipLink = page.locator('a[href="#main-content"]');
  await expect(skipLink).toBeFocused();
  
  // Activate skip link
  await page.keyboard.press('Enter');
  
  // Focus should move to main content
  await expect(page.locator('#main-content')).toBeFocused();
});
```

## Focus Indicators

### Visible Focus Test
```typescript
test('focus should be visible on all interactive elements', async ({ page }) => {
  await page.goto('/');
  
  const interactiveElements = await page.locator(
    'button:visible, a:visible, input:visible, select:visible, textarea:visible'
  ).all();
  
  for (const element of interactiveElements) {
    // Focus the element
    await element.focus();
    
    // Check for visible focus indicator
    const styles = await element.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        outline: computed.outline,
        outlineWidth: computed.outlineWidth,
        outlineStyle: computed.outlineStyle,
        boxShadow: computed.boxShadow,
        border: computed.border
      };
    });
    
    const hasVisibleFocus = 
      styles.outline !== 'none' ||
      styles.outlineWidth !== '0px' ||
      styles.boxShadow !== 'none' ||
      styles.outlineStyle !== 'none';
    
    expect(hasVisibleFocus).toBeTruthy();
  }
});
```

### Focus Trap Detection
```typescript
test('should not have keyboard traps', async ({ page }) => {
  await page.goto('/');
  
  const startUrl = page.url();
  const focusedElements = new Set<string>();
  
  // Tab through all focusable elements
  for (let i = 0; i < 100; i++) {  // Max 100 tabs
    await page.keyboard.press('Tab');
    
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className : '') : null;
    });
    
    if (focusedElement) {
      if (focusedElements.has(focusedElement)) {
        // We've looped back to the beginning
        break;
      }
      focusedElements.add(focusedElement);
    }
  }
  
  // Should have tabbed through multiple elements
  expect(focusedElements.size).toBeGreaterThan(0);
  
  // Should still be on the same page
  expect(page.url()).toBe(startUrl);
});
```

## Interactive Element Testing

### Button Accessibility
```typescript
test('buttons should be keyboard accessible', async ({ page }) => {
  await page.goto('/');
  
  const buttons = await page.locator('button').all();
  
  for (const button of buttons) {
    await button.focus();
    await expect(button).toBeFocused();
    
    // Test Enter and Space activation
    const isDisabled = await button.isDisabled();
    
    if (!isDisabled) {
      // Enter should activate
      await page.keyboard.press('Enter');
      
      // Or Space should activate
      await button.focus();
      await page.keyboard.press('Space');
    }
  }
});
```

### Link Accessibility
```typescript
test('links should be keyboard accessible', async ({ page }) => {
  await page.goto('/');
  
  const links = await page.locator('a[href]').all();
  
  for (const link of links) {
    await link.focus();
    await expect(link).toBeFocused();
    
    // Enter should activate link
    const href = await link.getAttribute('href');
    
    // Test activation (without navigating away)
    if (href?.startsWith('#')) {
      await page.keyboard.press('Enter');
    }
  }
});
```

### Form Controls
```typescript
test('form controls should be keyboard accessible', async ({ page }) => {
  await page.goto('/form');
  
  // Test text input
  await page.keyboard.press('Tab');
  await page.keyboard.type('Test input');
  
  // Test select
  await page.keyboard.press('Tab');
  await page.keyboard.press('ArrowDown');  // Open select
  await page.keyboard.press('Enter');      // Select option
  
  // Test checkbox
  await page.keyboard.press('Tab');
  await page.keyboard.press('Space');  // Toggle checkbox
  
  // Test radio buttons
  await page.keyboard.press('Tab');
  await page.keyboard.press('ArrowDown');  // Move between radios
});
```

## Modal Focus Management

### Focus Trap in Modals
```typescript
test('focus should be trapped in modal', async ({ page }) => {
  await page.goto('/modal-demo');
  
  // Open modal
  await page.click('[data-testid="open-modal"]');
  
  // Wait for modal
  const modal = page.locator('[role="dialog"]');
  await expect(modal).toBeVisible();
  
  // Focus should be in modal
  const focusInModal = await page.evaluate(() => {
    const modal = document.querySelector('[role="dialog"]');
    return modal?.contains(document.activeElement);
  });
  expect(focusInModal).toBeTruthy();
  
  // Tab should cycle within modal
  const focusedElements: string[] = [];
  
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });
    focusedElements.push(focused || '');
    
    // Focus should stay within modal
    const stillInModal = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]');
      return modal?.contains(document.activeElement);
    });
    expect(stillInModal).toBeTruthy();
  }
});
```

### Focus Return on Modal Close
```typescript
test('focus should return to trigger on modal close', async ({ page }) => {
  await page.goto('/modal-demo');
  
  // Focus trigger button
  const triggerButton = page.locator('[data-testid="open-modal"]');
  await triggerButton.focus();
  
  // Open modal
  await page.keyboard.press('Enter');
  await expect(page.locator('[role="dialog"]')).toBeVisible();
  
  // Close modal
  await page.keyboard.press('Escape');
  
  // Focus should return to trigger
  await expect(triggerButton).toBeFocused();
});
```

## Keyboard Shortcuts

### Accesskey Testing
```typescript
test('accesskeys should not conflict', async ({ page }) => {
  await page.goto('/');
  
  const accessKeys = await page.locator('[accesskey]').evaluateAll(elements => {
    return elements.map(el => ({
      key: el.getAttribute('accesskey'),
      element: el.tagName
    }));
  });
  
  // Check for duplicates
  const keys = accessKeys.map(item => item.key?.toLowerCase());
  const uniqueKeys = new Set(keys);
  
  expect(keys.length).toBe(uniqueKeys.size);
});
```

## Complex Components

### Dropdown Menu
```typescript
test('dropdown menu should be keyboard accessible', async ({ page }) => {
  await page.goto('/');
  
  // Open dropdown
  await page.click('[data-testid="dropdown-trigger"]');
  
  // Arrow keys should navigate items
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[role="menuitem"]').first()).toBeFocused();
  
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[role="menuitem"]').nth(1)).toBeFocused();
  
  // Escape should close menu
  await page.keyboard.press('Escape');
  await expect(page.locator('[role="menu"]')).not.toBeVisible();
});
```

### Tab Panel
```typescript
test('tab panel should be keyboard accessible', async ({ page }) => {
  await page.goto('/tabs');
  
  // Tab to tab list
  await page.keyboard.press('Tab');
  await expect(page.locator('[role="tablist"]')).toBeFocused();
  
  // Arrow keys should switch tabs
  await page.keyboard.press('ArrowRight');
  const tab2 = page.locator('[role="tab"]').nth(1);
  await expect(tab2).toHaveAttribute('aria-selected', 'true');
  
  // Enter/Space should activate tab
  await page.keyboard.press('Enter');
  const tabPanel = page.locator('[role="tabpanel"]').nth(1);
  await expect(tabPanel).toBeVisible();
});
```

## Best Practices Summary

1. ✅ Test tab order matches visual order
2. ✅ Verify focus indicators are visible
3. ✅ Ensure no keyboard traps exist
4. ✅ Test all interactive elements
5. ✅ Test focus management in modals
6. ✅ Verify focus return on close
7. ✅ Test keyboard shortcuts
8. ✅ Test complex components
