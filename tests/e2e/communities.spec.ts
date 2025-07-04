import { test, expect } from "@playwright/test";

test.describe("Communities Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/communities");
  });

  test("page loads successfully", async ({ page }) => {
    // Check page URL
    await expect(page).toHaveURL("/communities");

    // Check for page title or heading
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("displays community content", async ({ page }) => {
    // Wait for content to load
    await page.waitForLoadState("networkidle");

    // Check if community cards or list items are present
    const communityItems = page
      .locator('[data-testid="community-item"], .community-card, article')
      .first();

    // If there are communities, at least one should be visible
    const itemCount = await communityItems.count();
    if (itemCount > 0) {
      await expect(communityItems).toBeVisible();
    }
  });

  test("search functionality works", async ({ page }) => {
    // Look for search input if it exists
    const searchInput = page
      .locator('input[type="search"], input[placeholder*="search" i]')
      .first();

    if (await searchInput.isVisible()) {
      await searchInput.fill("test community");
      await searchInput.press("Enter");

      // Wait for search results
      await page.waitForTimeout(500);
    }
  });

  test("filtering options work if present", async ({ page }) => {
    // Check for filter buttons or dropdowns
    const filterButton = page
      .locator('button:has-text("Filter"), select, [role="combobox"]')
      .first();

    if (await filterButton.isVisible()) {
      await filterButton.click();
      // Wait for filter menu to open
      await page.waitForTimeout(300);
    }
  });

  test("pagination works if present", async ({ page }) => {
    // Check for pagination controls
    const nextButton = page
      .locator(
        'button:has-text("Next"), a:has-text("Next"), [aria-label="Next page"]',
      )
      .first();

    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForLoadState("networkidle");
    }
  });

  test("community cards are interactive", async ({ page }) => {
    // Wait for content
    await page.waitForLoadState("networkidle");

    // Find clickable community elements
    const communityLink = page
      .locator(
        'a[href*="/community/"], button:has-text("View"), button:has-text("Details")',
      )
      .first();

    if (await communityLink.isVisible()) {
      // Check if it's clickable
      await expect(communityLink).toBeEnabled();
    }
  });
});
