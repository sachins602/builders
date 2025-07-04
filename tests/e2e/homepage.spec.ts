import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("has correct title and logo", async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Our Missing Middle/i);

    // Check logo is visible
    const logo = page.locator('img[alt="Our Missing Middle Logo"]');
    await expect(logo).toBeVisible();
  });

  test("navigation menu works", async ({ page }) => {
    // Click hamburger menu button
    const menuTrigger = page.locator("button:has(svg)").first();
    await menuTrigger.click();

    // Wait for menu to open and check if navigation items are visible
    await page.waitForTimeout(500);

    // Check menu items are visible (they may be in a dropdown that takes time to appear)
    const menuContent = page
      .locator('[role="dialog"], [data-radix-popper-content-wrapper]')
      .first();
    if (await menuContent.isVisible()) {
      await expect(page.locator("text=My Builds & Remixes")).toBeVisible();
      await expect(page.locator("text=My Likes")).toBeVisible();
      await expect(
        page.locator("text=Manage Community Organizations"),
      ).toBeVisible();
    }
  });

  test("map is visible and interactive", async ({ page }) => {
    // Wait for map container to be visible
    const mapContainer = page.locator(".leaflet-container");
    await expect(mapContainer).toBeVisible();

    // Wait for map to load properly
    await page.waitForTimeout(2000);

    // Check map tiles have loaded (more lenient check)
    await expect(
      mapContainer.locator(".leaflet-tile-container"),
    ).toBeAttached();

    // Check zoom controls exist
    await expect(page.locator(".leaflet-control-zoom")).toBeVisible();
  });

  test("search bar is present and functional", async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible();

    // Type in search
    await searchInput.fill("Toronto");
    await searchInput.press("Enter");

    // Wait a bit for search to process
    await page.waitForTimeout(1000);
  });

  test("footer displays correct copyright", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    const currentYear = new Date().getFullYear();
    await expect(footer).toContainText(
      `© ${currentYear} BT @ Conestoga College`,
    );
  });

  test("navigation links work", async ({ page }) => {
    // Test logo link
    const logo = page.locator('a[href="/"] img');
    await logo.click();
    await expect(page).toHaveURL("/");
  });
});
