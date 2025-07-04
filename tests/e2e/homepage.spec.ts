import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("has correct title and logo", async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Builders/i);

    // Check logo is visible
    const logo = page.locator('img[alt="Our Missing Middle Logo"]');
    await expect(logo).toBeVisible();
  });

  test("navigation menu works", async ({ page }) => {
    // Click hamburger menu
    const menuButton = page
      .locator("[data-radix-collection-item] button")
      .first();
    await menuButton.click();

    // Check menu items are visible
    await expect(page.locator("text=My Builds & Remixes")).toBeVisible();
    await expect(page.locator("text=My Likes")).toBeVisible();
    await expect(
      page.locator("text=Manage Community Organizations"),
    ).toBeVisible();
  });

  test("map is visible and interactive", async ({ page }) => {
    // Wait for map container to be visible
    const mapContainer = page.locator(".leaflet-container");
    await expect(mapContainer).toBeVisible();

    // Check map has loaded
    await expect(mapContainer.locator(".leaflet-tile-container")).toBeVisible();

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
