import test, { expect } from "@playwright/test";

function cssPath(element: Element): string {
  if (!(element instanceof Element)) return '';
  const path = [];
  while (element.nodeType === Node.ELEMENT_NODE) {
    let selector = element.nodeName.toLowerCase();
    if (element.id) {
      selector += '#' + element.id;
      path.unshift(selector);
      break;
    } else {
      let sibling = element;
      let nth = 1;
      while (sibling.previousElementSibling) {
        sibling = sibling.previousElementSibling;
        if (sibling.nodeName.toLowerCase() === selector) nth++;
      }
      if (nth !== 1) selector += `:nth-of-type(${nth})`;
    }
    path.unshift(selector);
    element = element.parentElement!;
  }
  return path.join(' > ');
}

test.beforeEach(async ({ page }) => {
  const baseUrl = process.env.CI ? "http://localhost:4173" : "http://localhost:5173";
  await page.goto(baseUrl + "/");
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

  test.fixme("should cycle through the images when clicking on the image carousel", async ({ page }) => {
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
    // Wait for the animation to complete and z-index changes to take effect
    await page.waitForFunction(
      ([firstImageSelector, secondImageSelector]) => {
        const firstImg = document.querySelector(firstImageSelector);
        const secondImg = document.querySelector(secondImageSelector);
        if (!firstImg || !secondImg) return false;
        const firstStyle = window.getComputedStyle(firstImg);
        const secondStyle = window.getComputedStyle(secondImg);
        return firstStyle.zIndex === '0' && secondStyle.zIndex === '2';
      },
      [await firstImage.evaluate(el => cssPath(el)), await secondImage.evaluate(el => cssPath(el))]
    );

    const firstImageZIndexAfterClick = await firstImage.evaluate((el) => getComputedStyle(el).zIndex);
    const secondImageZIndexAfterClick = await secondImage.evaluate((el) => getComputedStyle(el).zIndex);

    expect(firstImageZIndexAfterClick).toBe("0");
    expect(secondImageZIndexAfterClick).toBe("2");
  });

  test.fixme("display the sidebar when clicking on the menu button", async ({ page }) => {
    const menuButton = page.locator("[aria-label='Open Menu']");
    const sidebar = page.getByTestId("sidebar");

    await expect(sidebar).not.toBeVisible();
    await menuButton.click();
    await expect(sidebar).toBeVisible();
  });

  test("opening the sidebar should shift the page content", async ({ page }) => {
    const menuButton = page.locator("[aria-label='Open Menu']");
    const sidebar = page.getByTestId("sidebar");
    const pageContent = page.getByTestId("home-content");

    const initiaBox = await pageContent.boundingBox();
    const initialWidth = initiaBox?.width || 0;

    await menuButton.click();
    await expect(sidebar).toBeVisible();
    // Wait for any animations to complete
    await page.waitForFunction(() => {
      const element = document.querySelector('[data-testid="home-content"]');
      if (!element) return false;
      const style = window.getComputedStyle(element);
      return !style.transition || style.transition === 'none' || !style.transitionDuration || style.transitionDuration === '0s';
    });

    const sidebarBox = await sidebar.boundingBox();
    const sidebarWidth = sidebarBox?.width || 0;

    const adjustedWidth = initialWidth - sidebarWidth;
    const pageContentBox = await pageContent.boundingBox();
    const pageContentWidth = pageContentBox?.width || 0;

    // Allow for some flexibility in width calculations due to browser differences
    expect(Math.abs(pageContentWidth - adjustedWidth)).toBeLessThan(300); // 300px tolerance
  });
});
