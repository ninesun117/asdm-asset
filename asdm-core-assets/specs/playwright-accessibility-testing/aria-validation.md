# ARIA Validation

Testing ARIA roles and attributes with Playwright.

## ARIA Fundamentals

### What is ARIA?
Accessible Rich Internet Applications (ARIA) provides:
- Additional semantics for custom components
- Role definitions for widgets
- State and property attributes
- Live region announcements

### ARIA Rules
1. Don't use ARIA if native HTML can do it
2. Don't change native semantics unless necessary
3. All interactive elements must be keyboard accessible
4. Don't use role="presentation" on focusable elements
5. All interactive elements need accessible names

## Role Testing

### Common Roles
```typescript
test('verify ARIA roles are correct', async ({ page }) => {
  await page.goto('/');
  
  // Button roles
  const buttons = await page.locator('button, [role="button"]').all();
  for (const button of buttons) {
    const role = await button.getAttribute('role');
    expect(role === 'button' || !role).toBeTruthy();
  }
  
  // Link roles
  const links = await page.locator('a[href], [role="link"]').all();
  for (const link of links) {
    const role = await link.getAttribute('role');
    expect(role === 'link' || !role).toBeTruthy();
  }
  
  // Navigation roles
  const navs = await page.locator('nav, [role="navigation"]').all();
  for (const nav of navs) {
    const role = await nav.getAttribute('role');
    expect(role === 'navigation' || !role).toBeTruthy();
  }
});
```

### Landmark Roles
```typescript
test('page should have proper landmarks', async ({ page }) => {
  await page.goto('/');
  
  // Should have main landmark
  const main = page.locator('main, [role="main"]');
  await expect(main).toHaveCount(1);
  
  // Should have navigation landmark
  const nav = page.locator('nav, [role="navigation"]');
  expect(await nav.count()).toBeGreaterThanOrEqual(1);
  
  // Optional: banner and contentinfo
  const header = page.locator('header, [role="banner"]');
  const footer = page.locator('footer, [role="contentinfo"]');
  
  // If header/footer exist outside main, they should have implicit roles
  if (await header.count() > 0) {
    const isInMain = await header.evaluate((el, main) => {
      return main?.contains(el);
    }, await main.elementHandle());
    // Banner should be outside main
  }
});
```

### Widget Roles
```typescript
test('verify widget roles', async ({ page }) => {
  await page.goto('/widgets');
  
  // Dialog
  const dialogs = await page.locator('[role="dialog"]').all();
  for (const dialog of dialogs) {
    // Dialog should have accessible name
    const label = await dialog.getAttribute('aria-label');
    const labelledby = await dialog.getAttribute('aria-labelledby');
    expect(label || labelledby).toBeTruthy();
  }
  
  // Tab list
  const tablists = await page.locator('[role="tablist"]').all();
  for (const tablist of tablists) {
    // Tab list should contain tabs
    const tabs = await tablist.locator('[role="tab"]').count();
    expect(tabs).toBeGreaterThan(0);
  }
});
```

## Accessible Name Testing

### Button Names
```typescript
test('all buttons should have accessible names', async ({ page }) => {
  await page.goto('/');
  
  const buttons = await page.locator('button, [role="button"]').all();
  
  for (const button of buttons) {
    const name = await button.evaluate(el => {
      // Check various name sources
      const text = el.textContent?.trim();
      const ariaLabel = el.getAttribute('aria-label');
      const ariaLabelledby = el.getAttribute('aria-labelledby');
      
      if (ariaLabelledby) {
        const labelElement = document.getElementById(ariaLabelledby);
        return labelElement?.textContent?.trim();
      }
      
      return text || ariaLabel;
    });
    
    expect(name?.length).toBeGreaterThan(0);
  }
});
```

### Link Names
```typescript
test('all links should have accessible names', async ({ page }) => {
  await page.goto('/');
  
  const links = await page.locator('a[href]').all();
  
  for (const link of links) {
    const name = await link.evaluate(el => {
      const text = el.textContent?.trim();
      const ariaLabel = el.getAttribute('aria-label');
      const ariaLabelledby = el.getAttribute('aria-labelledby');
      const title = el.getAttribute('title');
      
      if (ariaLabelledby) {
        const labelElement = document.getElementById(ariaLabelledby);
        return labelElement?.textContent?.trim();
      }
      
      return text || ariaLabel || title;
    });
    
    expect(name?.length).toBeGreaterThan(0);
  }
});
```

### Form Labels
```typescript
test('form fields should have accessible labels', async ({ page }) => {
  await page.goto('/form');
  
  const inputs = await page.locator('input:not([type="hidden"]), select, textarea').all();
  
  for (const input of inputs) {
    const hasLabel = await input.evaluate(el => {
      const id = el.id;
      const ariaLabel = el.getAttribute('aria-label');
      const ariaLabelledby = el.getAttribute('aria-labelledby');
      
      // Check for associated label
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (label) return true;
      }
      
      // Check for aria-label
      if (ariaLabel) return true;
      
      // Check for aria-labelledby
      if (ariaLabelledby) {
        const labelElement = document.getElementById(ariaLabelledby);
        if (labelElement) return true;
      }
      
      // Check for wrapping label
      const parent = el.closest('label');
      if (parent) return true;
      
      return false;
    });
    
    expect(hasLabel).toBeTruthy();
  }
});
```

## State and Property Testing

### aria-expanded
```typescript
test('aria-expanded should reflect actual state', async ({ page }) => {
  await page.goto('/');
  
  const expandableTriggers = await page.locator('[aria-expanded]').all();
  
  for (const trigger of expandableTriggers) {
    const expanded = await trigger.getAttribute('aria-expanded');
    const controlsId = await trigger.getAttribute('aria-controls');
    
    if (controlsId) {
      const controlled = page.locator(`#${controlsId}`);
      const isHidden = await controlled.evaluate(el => {
        return el.getAttribute('aria-hidden') === 'true' ||
               el.hasAttribute('hidden') ||
               getComputedStyle(el).display === 'none';
      });
      
      // If expanded is true, controlled element should be visible
      if (expanded === 'true') {
        expect(isHidden).toBeFalsy();
      }
    }
  }
});
```

### aria-selected
```typescript
test('aria-selected should work in tab panels', async ({ page }) => {
  await page.goto('/tabs');
  
  const tabs = await page.locator('[role="tab"]').all();
  
  // Exactly one tab should be selected
  const selectedTabs = [];
  for (const tab of tabs) {
    const selected = await tab.getAttribute('aria-selected');
    if (selected === 'true') {
      selectedTabs.push(tab);
    }
  }
  
  expect(selectedTabs.length).toBe(1);
});
```

### aria-checked
```typescript
test('checkboxes should have correct aria-checked', async ({ page }) => {
  await page.goto('/form');
  
  const checkboxes = await page.locator('[role="checkbox"]').all();
  
  for (const checkbox of checkboxes) {
    const checked = await checkbox.getAttribute('aria-checked');
    
    // Should be 'true', 'false', or 'mixed'
    expect(['true', 'false', 'mixed']).toContain(checked);
  }
});
```

### aria-hidden
```typescript
test('aria-hidden elements should not be focusable', async ({ page }) => {
  await page.goto('/');
  
  const hiddenElements = await page.locator('[aria-hidden="true"]').all();
  
  for (const element of hiddenElements) {
    const focusableContent = await element.evaluate(el => {
      const focusable = el.querySelectorAll(
        'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      return focusable.length;
    });
    
    expect(focusableContent).toBe(0);
  }
});
```

## Live Regions

### aria-live
```typescript
test('live regions should announce changes', async ({ page }) => {
  await page.goto('/notifications');
  
  // Check for live region
  const liveRegion = page.locator('[aria-live]');
  await expect(liveRegion).toBeVisible();
  
  const politeness = await liveRegion.getAttribute('aria-live');
  expect(['polite', 'assertive', 'off']).toContain(politeness);
  
  // Test notification appears
  await page.click('[data-testid="trigger-notification"]');
  
  // Live region should have content
  await expect(liveRegion).not.toBeEmpty();
});
```

### aria-atomic
```typescript
test('aria-atomic should be set correctly', async ({ page }) => {
  await page.goto('/notifications');
  
  const atomicRegions = await page.locator('[aria-atomic]').all();
  
  for (const region of atomicRegions) {
    const atomic = await region.getAttribute('aria-atomic');
    expect(['true', 'false']).toContain(atomic);
  }
});
```

## Common ARIA Mistakes

### Using ARIA when HTML is better
```typescript
test('should use native HTML when possible', async ({ page }) => {
  await page.goto('/');
  
  // Buttons should be <button> elements
  const divButtons = await page.locator('div[role="button"]').count();
  expect(divButtons).toBe(0);
  
  // Links should be <a> elements
  const divLinks = await page.locator('div[role="link"]').count();
  expect(divLinks).toBe(0);
  
  // Checkboxes should use <input type="checkbox"> or proper role
  const spanCheckboxes = await page.locator('span[role="checkbox"]').count();
  // Allow custom checkboxes if they're done correctly
});
```

### Duplicate IDs
```typescript
test('aria-labelledby should reference valid unique IDs', async ({ page }) => {
  await page.goto('/');
  
  const labelledElements = await page.locator('[aria-labelledby]').all();
  
  for (const element of labelledElements) {
    const ids = await element.getAttribute('aria-labelledby');
    
    if (ids) {
      for (const id of ids.split(' ')) {
        const referenced = page.locator(`#${id}`);
        const count = await referenced.count();
        expect(count).toBe(1);  // Should exist and be unique
      }
    }
  }
});
```

## Screen Reader Compatibility

### Basic Compatibility Check
```typescript
test('page should be screen reader compatible', async ({ page }) => {
  await page.goto('/');
  
  // Check heading hierarchy
  const h1s = await page.locator('h1').count();
  expect(h1s).toBeGreaterThanOrEqual(1);
  
  // Check for skip link
  const skipLink = page.locator('a[href^="#"]');
  expect(await skipLink.count()).toBeGreaterThan(0);
  
  // Check images have alt text
  const images = await page.locator('img').all();
  for (const img of images) {
    const alt = await img.getAttribute('alt');
    const role = await img.getAttribute('role');
    expect(alt !== null || role === 'presentation').toBeTruthy();
  }
});
```

## Best Practices Summary

1. ✅ Prefer native HTML over ARIA
2. ✅ All interactive elements need accessible names
3. ✅ Use proper landmark roles
4. ✅ Test aria-expanded reflects actual state
5. ✅ Verify aria-hidden elements aren't focusable
6. ✅ Ensure live regions announce correctly
7. ✅ Check all referenced IDs exist
8. ✅ Test with actual screen readers
