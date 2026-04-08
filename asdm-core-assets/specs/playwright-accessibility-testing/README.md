# Playwright Accessibility Testing Specs

This directory contains comprehensive guidelines and best practices for accessibility testing using Playwright with TypeScript and axe-core.

## Overview

These specs provide guidance for:
- Setting up Playwright for accessibility testing
- Integrating axe-core for automated accessibility scans
- Testing WCAG compliance
- Validating keyboard navigation
- Ensuring screen reader compatibility
- ARIA attribute validation

## Available Specifications

### 1. Accessibility Testing Basics
**File**: [accessibility-testing-basics.md](accessibility-testing-basics.md)

Covers:
- Accessibility testing fundamentals
- WCAG 2.1 AA standards overview
- Types of accessibility testing
- Testing strategies and approaches

### 2. Playwright Accessibility Setup
**File**: [playwright-accessibility-setup.md](playwright-accessibility-setup.md)

Covers:
- Installing and configuring Playwright
- Setting up accessibility testing environment
- TypeScript configuration
- Test runner setup

### 3. axe-core Integration
**File**: [axe-core-integration.md](axe-core-integration.md)

Covers:
- Installing axe-core with Playwright
- Configuring axe-core rules
- Running accessibility audits
- Interpreting violation reports

### 4. WCAG Compliance Testing
**File**: [wcag-compliance-testing.md](wcag-compliance-testing.md)

Covers:
- WCAG 2.1 AA compliance requirements
- Testing for common violations
- Color contrast testing
- Focus management testing

### 5. Keyboard Navigation Testing
**File**: [keyboard-navigation-testing.md](keyboard-navigation-testing.md)

Covers:
- Keyboard accessibility principles
- Tab order testing
- Focus indicators
- Keyboard traps detection

### 6. ARIA Validation
**File**: [aria-validation.md](aria-validation.md)

Covers:
- ARIA roles and attributes
- Screen reader compatibility
- ARIA best practices
- Common ARIA mistakes

## Quick Reference

### Basic Test Setup
```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('should pass accessibility audit', async ({ page }) => {
  await page.goto('/login');
  
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  
  expect(accessibilityScanResults.violations).toEqual([]);
});
```

### Keyboard Navigation Test
```typescript
test('should be keyboard accessible', async ({ page }) => {
  await page.goto('/login');
  
  // Tab to username field
  await page.keyboard.press('Tab');
  await expect(page.locator('#username')).toBeFocused();
  
  // Tab to password field
  await page.keyboard.press('Tab');
  await expect(page.locator('#password')).toBeFocused();
  
  // Tab to submit button
  await page.keyboard.press('Tab');
  await expect(page.locator('button[type="submit"]')).toBeFocused();
});
```

### WCAG Standards

**Perceivable**
- Text alternatives for non-text content
- Captions and alternatives for multimedia
- Content adaptable to different presentations
- Distinguishable content (color contrast, etc.)

**Operable**
- Keyboard accessible functionality
- Sufficient time for interactions
- No content that causes seizures
- Navigable structure

**Understandable**
- Readable and understandable text
- Predictable behavior
- Input assistance

**Robust**
- Compatible with assistive technologies
- Valid HTML markup

## Key Principles

1. **Test Early and Often**: Include accessibility tests in your CI/CD pipeline
2. **Automate What You Can**: Use axe-core for automated scanning
3. **Manual Testing Required**: Some accessibility issues require manual verification
4. **Test with Real Users**: Include users with disabilities in your testing
5. **Document Violations**: Track and prioritize accessibility issues

## Tech Stack

- **Test Framework**: Playwright
- **Language**: TypeScript
- **Accessibility Engine**: axe-core
- **Standards**: WCAG 2.1 AA

## Related Resources

- [Playwright Documentation](https://playwright.dev)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM](https://webaim.org)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

## Version

Current version: 1.0.0

Last updated: 2026-02-19
