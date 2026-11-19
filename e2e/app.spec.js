// E2E: landing + alur contoh hasil + validasi URL.
// Berjalan terhadap `npm run serve` (dist/ + worker lokal). Tidak menyentuh
// leofame.com — jalur upstream asli diuji unit (worker test) + live
// pasca-deploy. POST /api/likes sungguhan dari VM/CI tidak diuji end-to-end
// karena butuh upstream; yang diuji: validasi inline + struk gagal rapi.
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText(/Kirim likes gratis/);
});

test('landing: navbar, hero, konsol, dan tautan GitHub hidup', async ({ page }) => {
  await expect(page).toHaveTitle(/TikTok Likes Tool/);
  await expect(page.locator('.brand-name')).toHaveText('TikTok Likes Tool');
  const gh = page.locator('.github-link');
  await expect(gh).toHaveAttribute('href', 'https://github.com/dezzorigin/tiktok-likes-tool');
  await expect(page.locator('#url')).toBeVisible();
  await expect(page.locator('#submitBtn')).toBeVisible();
  await expect(page.locator('#demoBtn')).toBeVisible();
  await expect(page.locator('#cara-pakai')).toBeVisible();
  await expect(page.locator('#fitur')).toBeVisible();
  await expect(page.locator('#faq')).toBeVisible();
  await expect(page.locator('footer')).toContainText('MIT');
});

test('contoh hasil: klik demo menampilkan struk berlabel contoh', async ({ page }) => {
  await page.locator('#demoBtn').click();
  await expect(page.locator('#receipt')).toBeVisible();
  await expect(page.locator('#receiptBadge')).toHaveText('contoh');
  await expect(page.locator('#receiptRows')).toContainText('25');
  await expect(page.locator('#receiptRows')).toContainText('Contoh: 25 likes terkirim');
  await expect(page.locator('.log')).toContainText('Contoh hasil dimuat');
});

test('validasi: tautan kosong dan non-TikTok ditolak inline', async ({ page }) => {
  await page.locator('#submitBtn').click();
  await expect(page.locator('#formError')).toBeVisible();
  await expect(page.locator('#formError')).toContainText('wajib diisi');

  await page.locator('#url').fill('https://www.youtube.com/watch?v=abc');
  await page.locator('#submitBtn').click();
  await expect(page.locator('#formError')).toContainText('URL video TikTok');
  await expect(page.locator('#receipt')).toBeHidden();
});

test('validasi: tautan TikTok menampilkan struk gagal rapi, bukan crash', async ({ page }) => {
  // URL TikTok valid secara format. Dari runner, upstream leofame mungkin
  // tidak terjangkau / menolak — yang penting UI menampilkan struk gagal
  // rapi dan halaman tetap hidup.
  await page.locator('#url').fill('https://www.tiktok.com/@tiktok/video/1234567890123456789');
  await page.locator('#submitBtn').click();
  await expect(page.locator('#receipt')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('#receiptBadge')).toHaveText(/terkirim|gagal/);
  await expect(page.locator('h1')).toBeVisible();
});

test('mobile: tanpa overflow horizontal', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'hanya proyek mobile');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page.locator('#url')).toBeVisible();
  await expect(page.locator('#submitBtn')).toBeVisible();
});
