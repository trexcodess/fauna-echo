import { test, expect } from '@playwright/test';

// Use a random email so the test creates a new user in your DB every time!
const randomEmail = `agent_${Date.now()}@faunaecho.com`;

test.describe('Fauna Echo - Full Agency Flow', () => {
  
  test('should sign up, find a bounty, and finalize identification', async ({ page }) => {
    // 1. Go to your local Next.js app
    await page.goto('http://localhost:3000');

    // --- STEP: AUTH ---
    // Switch to Sign Up
    await page.getByText('NEED ENROLLMENT? CLICK HERE').click();
    
    // Fill out the Auth form
    await page.getByPlaceholder('FULL NAME').fill('Test Agent Playwright');
    await page.getByPlaceholder('AGENT EMAIL').fill(randomEmail);
    await page.getByPlaceholder('PASSWORD').fill('SecurePassword123!');
    
    // Submit (This hits your real NestJS backend!)
    await page.getByRole('button', { name: 'INITIALIZE AGENT ID' }).click();

    // --- STEP: ONBOARDING ---
    // Wait for the onboarding screen to appear, then click through it
    await expect(page.locator('text=1 CALIBRATION')).toBeVisible();
    await page.getByRole('button', { name: 'NEXT CALIBRATION' }).click();
    await page.getByRole('button', { name: 'NEXT CALIBRATION' }).click();
    await page.getByRole('button', { name: 'NEXT CALIBRATION' }).click();
    await page.getByRole('button', { name: 'INITIALIZE MISSION CONTROL' }).click();

    // --- STEP: MISSION CONTROL ---
    // Ensure we are logged in and see our name
    await expect(page.locator('text=WELCOME AGENT, TEST AGENT PLAYWRIGHT')).toBeVisible();
    
    // Click Initialize Search (This triggers your /pets/bounties AI endpoint)
    await page.locator('text=INITIALIZE SEARCH').click();

    // --- STEP: PROCESSING & SEARCH GRID ---
    // It might take a few seconds for Nvidia to generate bounties, so we wait for the grid to load
    await expect(page.locator('text=GRID INTELLIGENCE BRIEF')).toBeVisible({ timeout: 15000 });
    
    // Click the first Sighting item in the Sighting Index feed
    await page.locator('.feed-item').first().click();

    // --- STEP: TACTICAL HUD ---
    // Ensure the HUD loaded
    await expect(page.getByText('TARGET:')).toBeVisible();
    
    // Fill in some fake forensic data
    await page.getByPlaceholder('RFID_CHIP_15_DIGITS').fill('123456789012345');
    await page.getByPlaceholder('PHYSICAL_ANOMALIES...').fill('Playwright test: Subject has a scarred left ear.');

    // Click Finalize (This triggers your /pets/analyze endpoint to save the pet to the DB!)
    await page.getByRole('button', { name: 'FINALIZE IDENTIFICATION' }).click();

    // --- STEP: DASHBOARD ---
    // Wait for the final forensic report to render!
    await expect(page.locator('text=VERIFIED IDENTITY')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=OFFICIAL IDENTIFICATION BRIEF:')).toBeVisible();
  });
});