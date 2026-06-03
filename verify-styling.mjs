import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3000/hr-management/leave-requests', {
      waitUntil: 'networkidle',
      timeout: 10000
    });
    
    // Take a screenshot of the page
    await page.screenshot({ path: '/tmp/leave-balance-screenshot.png', fullPage: true });
    
    // Check if the cards have the correct styling
    const cards = await page.locator('div.bg-white.border-\\[\\#7c3aed\\].text-black').count();
    console.log(`Found ${cards} cards with new styling`);
    
    // Get the leave balance section
    const section = await page.locator('text=My Leave Balance').first();
    if (section) {
      console.log('Leave balance section found');
      const sectionBox = await section.boundingBox();
      console.log(`Section location: ${JSON.stringify(sectionBox)}`);
    }
    
    console.log('Screenshot saved to /tmp/leave-balance-screenshot.png');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
