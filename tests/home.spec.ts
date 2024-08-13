import test, { expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:5173/");
});

test.describe("Home", () => {
  test("should change header title when scrolling down and revert when scrolling back up", async ({ page }) => {
    const headerTitle = page.getByTestId("header-title");

    await expect(headerTitle).toBeVisible();

    await page.evaluate(() => window.scrollTo(0, 100));
    await expect(headerTitle).not.toBeVisible();

    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(headerTitle).toBeVisible();
  });

  test("should cycle through the images when clicking on the image carousel", async ({ page }) => {
    const carousel = page.getByTestId("carousel");

    const firstImage = carousel.locator("img").first();
    await expect(firstImage).toBeVisible();

    const firstImageZIndex = await firstImage.evaluate((el) => getComputedStyle(el).zIndex);
    expect(firstImageZIndex).toBe("2");

    const secondImage = carousel.locator("img").nth(1);
    await expect(secondImage).toBeVisible();

    const secondImageZIndex = await secondImage.evaluate((el) => getComputedStyle(el).zIndex);
    expect(secondImageZIndex).toBe("1");

    await carousel.click();
    await page.waitForTimeout(500);

    const firstImageZIndexAfterClick = await firstImage.evaluate((el) => getComputedStyle(el).zIndex);
    const secondImageZIndexAfterClick = await secondImage.evaluate((el) => getComputedStyle(el).zIndex);

    expect(firstImageZIndexAfterClick).toBe("0");
    expect(secondImageZIndexAfterClick).toBe("2");
  });

  test("display the sidebar when clicking on the menu button", async ({ page }) => {
    const menuButton = page.locator("[aria-label='Open Menu']");
    const sidebar = page.getByTestId("sidebar");

    await expect(sidebar).not.toBeVisible();
    await menuButton.click();
    await expect(sidebar).toBeVisible();
  });

  test.fixme("opening the sidebar should shift the page content", async ({ page }) => {
    const menuButton = page.locator("[aria-label='Open Menu']");
    const sidebar = page.getByTestId("sidebar");
    const pageContent = page.getByTestId("home-content");

    const initiaBox = await pageContent.boundingBox();
    const initialWidth = initiaBox?.width || 0;

    await menuButton.click();

    const sidebarBox = await sidebar.boundingBox();
    const sidebarWidth = sidebarBox?.width || 0;

    const adjustedWidth = initialWidth - sidebarWidth;
    const pageContentBox = await pageContent.boundingBox();
    const pageContentWidth = pageContentBox?.width || 0;

    await page.waitForFunction((expectedWidth) => {
      return document.querySelector("[data-testid=home-content]")?.getBoundingClientRect().width === expectedWidth;
    }, adjustedWidth);
  });
});
