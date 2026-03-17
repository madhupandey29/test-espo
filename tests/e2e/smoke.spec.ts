import { expect, test } from '@playwright/test';
import {
  capabilityNavigationItems,
  primaryNavigation,
} from '../../src/data/menu-data.js';

const smokeTimeout = 45_000;
const desktopNavigationLabels = primaryNavigation.map((item) => item.title);
const capabilityLabels = capabilityNavigationItems.map((item) => item.title);

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test.describe.configure({ timeout: 90_000 });

test.describe('Public smoke coverage', () => {
  test('@smoke homepage renders key entry points', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveTitle(/Cotton|Denim|Woven|Fabric/i);
    await expect(page.getByRole('link', { name: 'Company Logo' })).toBeVisible({ timeout: smokeTimeout });
    await expect(page.getByRole('link', { name: /^Fabric$/ }).first()).toBeVisible({ timeout: smokeTimeout });

    for (const label of desktopNavigationLabels) {
      await expect(
        page.getByRole('link', {
          name: new RegExp(`^${escapeRegExp(label)}$`, 'i'),
        }).first()
      ).toBeVisible({ timeout: smokeTimeout });
    }
  });

  test('@smoke fabric listing shows products', async ({ page }) => {
    await page.goto('/fabric', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(/\/fabric/);
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: /Premium Fabric Collection/i,
      })
    ).toBeVisible({ timeout: smokeTimeout });
    await expect(page.getByText(/Showing \d+ of \d+ products/i)).toBeVisible({ timeout: smokeTimeout });
    await expect(page.getByRole('link', { name: /^View / }).first()).toBeVisible({ timeout: smokeTimeout });
  });

  test('@smoke visitor can open a slug-based product detail page from the fabric listing', async ({
    page,
  }) => {
    await page.goto('/fabric', { waitUntil: 'domcontentloaded' });

    const firstProductLink = page.getByRole('link', { name: /^View / }).first();
    await expect(firstProductLink).toBeVisible({ timeout: smokeTimeout });
    const expectedPath = await firstProductLink.getAttribute('href');

    expect(expectedPath).toMatch(/^\/fabric\/.+/);

    await firstProductLink.click();
    await expect(page).toHaveURL(new RegExp(`${escapeRegExp(expectedPath!)}$`), {
      timeout: smokeTimeout,
    });

    await expect(page.getByText(/Home/i).first()).toBeVisible({ timeout: smokeTimeout });
    await expect(page.getByText(/Fabric/i).first()).toBeVisible({ timeout: smokeTimeout });
  });

  test('@smoke mobile drawer reuses shared navigation labels and capability links', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Open menu' }).click();

    const drawer = page.locator('.offcanvas__area');
    await expect(drawer).toHaveClass(/offcanvas-opened/, { timeout: smokeTimeout });

    for (const label of desktopNavigationLabels) {
      if (label === 'Capabilities') {
        await expect(drawer.getByRole('button', { name: /^Capabilities$/ })).toBeVisible({
          timeout: smokeTimeout,
        });
        continue;
      }

      await expect(
        drawer.getByRole('link', {
          name: new RegExp(`^${escapeRegExp(label)}$`, 'i'),
        })
      ).toBeVisible({ timeout: smokeTimeout });
    }

    const capabilitiesToggle = drawer.getByRole('button', { name: /^Capabilities$/ });
    await capabilitiesToggle.click();
    await expect(capabilitiesToggle).toHaveAttribute('aria-expanded', 'true');

    for (const label of capabilityLabels) {
      await expect(
        drawer.getByRole('link', {
          name: new RegExp(`^${escapeRegExp(label)}$`, 'i'),
        })
      ).toBeVisible({ timeout: smokeTimeout });
    }

    await drawer.getByRole('link', { name: /^Contact$/ }).click();
    await expect(page).toHaveURL(/\/contact/, { timeout: smokeTimeout });
    await expect(page.locator('.offcanvas__area')).toHaveCount(0);
  });
});