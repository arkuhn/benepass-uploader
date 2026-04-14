const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    args: ['--remote-debugging-port=9222'],
  });
  const page = await browser.newPage();
  await page.goto('https://app.getbenepass.com/expenses/create');
  console.log('Browser open. Log in to Benepass, then run:');
  console.log('  yarn submit <path/to/bills>');
  await new Promise(() => {}); // keep alive
})();
