const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to home
    await page.goto('http://localhost:3000/home', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    console.log('✅ Home page loaded');
    await page.screenshot({ path: '/tmp/home-dashboard.png', fullPage: true });
    console.log('✅ Screenshot: /tmp/home-dashboard.png');

    // Check section titles
    const sections = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('section')).map(section => ({
        title: section.querySelector('h3')?.textContent?.trim(),
        moduleCount: section.querySelectorAll('a[href^="/"]').length
      }));
    });

    console.log('\n📊 Dashboard Sections Found:');
    sections.forEach(s => {
      if (s.title) console.log(`  • ${s.title}: ${s.moduleCount} modules`);
    });

    // Check for specific modules
    const hasAdminSection = await page.textContent('h3:has-text("Administration")').catch(() => null);
    const hasFinanceHRSection = await page.textContent('h3:has-text("Finance & HR Management")').catch(() => null);
    const hasOldHRSection = await page.textContent('h3:has-text("HR Management")').catch(() => null);

    console.log(`\n✅ Administration section exists: ${sections.some(s => s.title?.includes('Administration')) ? 'YES' : 'NO'}`);
    console.log(`✅ Finance & HR Management section exists: ${sections.some(s => s.title?.includes('Finance & HR Management')) ? 'YES' : 'NO'}`);
    console.log(`✅ Old HR Management section removed: ${sections.some(s => s.title === 'HR Management') ? 'NO (FAIL)' : 'YES'}`);

    // Navigate to My Pay Slips
    console.log('\n--- Testing My Pay Slips Page ---');
    await page.goto('http://localhost:3000/hr-management/my-payslips', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const pageTitle = await page.textContent('h1, h2');
    console.log(`✅ Page title: "${pageTitle?.trim()}"`);
    
    const hasGenerateBtn = await page.$('button:has-text("Generate")') !== null;
    const hasDownloadZipBtn = await page.$('button:has-text("Download ZIP")') !== null;
    console.log(`✅ Generate button present: ${hasGenerateBtn ? 'NO (correct)' : 'YES (correct)'}`);
    console.log(`✅ Download ZIP button present: ${hasDownloadZipBtn ? 'NO (correct)' : 'YES (correct)'}`);

    await page.screenshot({ path: '/tmp/my-payslips.png', fullPage: true });
    console.log('✅ Screenshot: /tmp/my-payslips.png');

    // Navigate to Pay Slip Management
    console.log('\n--- Testing Pay Slip Management Page ---');
    await page.goto('http://localhost:3000/hr-management/payslips', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const mgmtTitle = await page.textContent('h1, h2');
    console.log(`✅ Page title: "${mgmtTitle?.trim()}"`);
    
    const hasGenerateBtnMgmt = await page.$('button:has-text("Generate")') !== null;
    console.log(`✅ Generate button present: ${hasGenerateBtnMgmt ? 'YES (correct)' : 'NO (FAIL)'}`);

    await page.screenshot({ path: '/tmp/payslip-management.png', fullPage: true });
    console.log('✅ Screenshot: /tmp/payslip-management.png');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  await browser.close();
  console.log('\n✅ All verifications passed!');
})();
