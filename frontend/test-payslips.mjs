import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Navigate to the pay slips page
    console.log('Navigating to http://localhost:3001/hr-management/my-payslips...');
    await page.goto('http://localhost:3001/hr-management/my-payslips', { 
      waitUntil: 'load',
      timeout: 10000
    });
    
    // Wait for table to be visible
    await page.waitForSelector('table', { timeout: 5000 });
    
    // Take a screenshot
    await page.screenshot({ path: '/tmp/payslips-table.png' });
    console.log('✅ Screenshot saved to /tmp/payslips-table.png');
    
    // Check for Download button
    const downloadButtons = await page.locator('button:has-text("Download")').all();
    console.log(`✅ Found ${downloadButtons.length} Download buttons in the page`);
    
    // Get visible action buttons in the table
    const viewButtons = await page.locator('button:has-text("View")').all();
    console.log(`✅ Found ${viewButtons.length} View buttons in the table`);
    
    // Check if they're in the same row
    if (downloadButtons.length > 0 && viewButtons.length > 0) {
      console.log('✅ Both View and Download buttons are present');
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
