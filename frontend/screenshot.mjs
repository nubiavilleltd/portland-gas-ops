import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage();

try {
  await page.goto('http://localhost:3000/hr-management/leave-requests', {
    waitUntil: 'networkidle',
    timeout: 10000
  });
  
  // Wait for the leave balance section to be visible
  await page.locator('text=My Leave Balance').first().waitFor({ timeout: 5000 });
  
  // Get the leave balance container and take a screenshot of just that area
  const section = await page.locator('div.mb-5').filter({ hasText: 'My Leave Balance' }).first();
  await section.screenshot({ path: '/tmp/leave-balance-cards.png' });
  
  console.log('✅ Screenshot saved to /tmp/leave-balance-cards.png');
  
  // Verify the styling by checking the actual HTML
  const cardHTML = await section.innerHTML();
  
  // Check for the new styling classes
  if (cardHTML.includes('bg-white') && cardHTML.includes('border-[#7c3aed]') && cardHTML.includes('text-black')) {
    console.log('✅ Cards have the correct styling classes: bg-white, border-[#7c3aed], text-black');
  } else {
    console.log('⚠️ Card styling may not be correct');
    console.log('HTML snippet:', cardHTML.substring(0, 300));
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await browser.close();
}
