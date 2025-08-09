# Test Suite Documentation

This project uses Vitest for unit tests and Playwright for end-to-end (e2e) tests.

## Running Tests

### Unit Tests

```bash
pnpm test:unit        # Run all unit tests
pnpm test:unit:ui     # Run tests with UI
pnpm test:unit:watch  # Run tests in watch mode
```

### E2E Tests

```bash
pnpm test:e2e         # Run all e2e tests
pnpm test:e2e:ui      # Run tests with Playwright UI
```

## Test Structure

### Unit Tests (Vitest)

Unit tests are co-located with their components in the same folder for better organization:

- `src/app/_components/footer/footer.test.tsx` - Tests for Footer component
- `src/app/_components/counter/Counter.test.tsx` - Example counter component test
- `src/app/_components/BuildChainComponent/BuildChainComponent.test.tsx` - Tests with mocked tRPC mutations

### E2E Tests (Playwright)

E2E tests are located in the `tests/e2e` directory:

- `tests/e2e/about.spec.ts` - Tests for about page
- `tests/e2e/homepage.spec.ts` - Tests for homepage (navigation, map, search)
- `tests/e2e/communities.spec.ts` - Tests for communities page
- `tests/e2e/create.spec.ts` - Tests for AI image generation page

## Test Patterns

### Mocking External APIs

All external API calls are mocked to ensure tests are reliable and don't depend on external services:

1. **tRPC Mocks**: See `BuildChainComponent.test.tsx` for examples of mocking tRPC mutations
2. **Test Utilities**: Helper functions in `src/test-utils/trpc-mocks.ts`

### Component Testing Best Practices

1. **Co-location**: Test files are placed in the same folder as the component
2. **Comprehensive Coverage**: Test all variants, states, and user interactions
3. **Accessibility**: Use semantic queries (getByRole, getByLabelText) when possible
4. **Mock External Dependencies**: Mock tRPC, external APIs, and complex utilities

### E2E Testing Best Practices

1. **Resilient Selectors**: Use multiple selector strategies for better test stability
2. **Conditional Assertions**: Check element visibility before interacting
3. **Network Idle**: Wait for network requests to complete when necessary
4. **No External API Calls**: Tests should work offline without external dependencies

## Writing New Tests

### Unit Test Template

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MyComponent } from "./MyComponent";

describe("MyComponent", () => {
  it("renders correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Expected Text")).toBeInTheDocument();
  });
});
```

### E2E Test Template

```typescript
import { test, expect } from "@playwright/test";

test.describe("Feature Name", () => {
  test("should do something", async ({ page }) => {
    await page.goto("/path");
    await expect(page.locator("selector")).toBeVisible();
  });
});
```

## Skipped Components

The following components were skipped due to complexity or external dependencies:

- Server components with authentication (header.tsx)
- Components requiring complex map interactions
- Components with heavy external API dependencies
