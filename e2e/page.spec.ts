import { expect, type Page, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:3003/react-pdf-elegant-highlighter/");
});

async function waitForHighlights(page: Page) {
  await page.waitForSelector(".Highlight .Highlight__part");
}

test("page loads", async ({ page }) => {
  await expect(page).toHaveTitle("react-pdf-elegant-highlighter");
});

test("should display highlights", async ({ page }) => {
  await waitForHighlights(page);
});

test("should display hover tips over highlights", async ({ page }) => {
  await waitForHighlights(page);
  await page.hover(".Highlight .Highlight__part");
  await page.waitForSelector("#PdfHighlighter__tip-container");
  const popup = page.locator(".Highlight__popupBody");
  await expect(popup.getByText("Flow or TypeScript?")).toBeVisible();
  await expect(popup.locator(".Highlight__popupEmoji")).toHaveText("🔥");
});
