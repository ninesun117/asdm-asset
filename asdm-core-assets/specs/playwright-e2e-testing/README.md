# Playwright E2E Testing Specs

End-to-end UI testing specifications using Playwright and TypeScript for web applications.

## Overview

This spec defines standards and best practices for end-to-end UI testing with Playwright. Covers test structure, selector strategies, API mocking, and user flow testing.

## Spec File Index

| File | Description |
|------|-------------|
| [e2e-testing-basics.md](./e2e-testing-basics.md) | E2E testing fundamentals and best practices |
| [test-structure.md](./test-structure.md) | Test organization and naming conventions |
| [selector-strategy.md](./selector-strategy.md) | Selector strategies and waiting mechanisms |
| [api-mocking-e2e.md](./api-mocking-e2e.md) | API mocking and dependency isolation |
| [user-flow-testing.md](./user-flow-testing.md) | User flow testing patterns |

## Core Principles

1. **Focus on Critical User Flows**: Test login, checkout, registration, and other core features
2. **Use Semantic Selectors**: Prefer data-testid or semantic selectors over CSS/XPath
3. **Isolate Tests**: Use API mocking to create deterministic tests
4. **Keep Tests Focused**: Limit each test file to 3-5 focused tests

## TypeScript Auto-Detection

Before creating tests, check if the project uses TypeScript:

- `tsconfig.json` file exists
- `.ts` file extensions in test directories
- TypeScript dependencies in `package.json`

Adjust file extensions and syntax based on this detection.

## Usage

Reference this spec in AI assistant context:

```
Use playwright-e2e-testing spec to create end-to-end tests
```

## Related Specs

- [playwright-accessibility-testing](../playwright-accessibility-testing/) - Accessibility testing
- [playwright-integration-testing](../playwright-integration-testing/) - Integration testing
