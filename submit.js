const { chromium } = require('playwright');
const path = require('path');

const BILLS_DIR = process.argv[2]
  ? path.resolve(process.argv[2].replace(/^~/, process.env.HOME))
  : (() => { console.error('Usage: node submit.js <path/to/bills>'); process.exit(1); })();

const START_INDEX = parseInt(process.argv[3] || '0');

const { benefitPlan, sessions: SESSIONS } = require('./sessions.json');

if (!benefitPlan) throw new Error('sessions.json missing "benefitPlan"');
for (const s of SESSIONS) {
  if (!s.date || !s.amount || !s.provider || !s.pdf)
    throw new Error(`Session missing required fields: ${JSON.stringify(s)}`);
}
const EXPENSE_URL = 'https://app.getbenepass.com/expenses/create';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// Returns the date string used as aria-label on calendar gridcells, e.g. "Mon Jan 05 2026"
function dateAriaLabel(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d).toDateString();
}

async function pickDate(page, isoDate) {
  const [y, m] = isoDate.split('-').map(Number);

  await page.getByRole('button', { name: /MM DD, YYYY/i }).click();
  await page.waitForTimeout(500);

  for (let i = 0; i < 24; i++) {
    const [currentMonth, currentYear] = await page.evaluate(() => {
      const btns = document.querySelectorAll('[role=dialog] button[role=combobox]');
      return [btns[0]?.textContent.trim(), parseInt(btns[1]?.textContent.trim())];
    });

    const currentMonthNum = MONTH_NAMES.indexOf(currentMonth) + 1;
    if (currentYear === y && currentMonthNum === m) break;

    const targetTotal = y * 12 + (m - 1);
    const currentTotal = currentYear * 12 + (currentMonthNum - 1);

    if (currentTotal > targetTotal) {
      await page.getByRole('button', { name: 'Previous month' }).click();
    } else {
      await page.getByRole('button', { name: 'Next month' }).click();
    }
    await page.waitForTimeout(300);
  }

  await page.getByRole('gridcell', { name: dateAriaLabel(isoDate) }).click();
  await page.waitForTimeout(300);
}

async function submitClaim(page, session, index, total) {
  const pdfPath = path.join(BILLS_DIR, session.pdf);
  console.log(`\n[${index + 1}/${total}] ${session.date} — $${session.amount.toFixed(2)}`);

  await page.goto(EXPENSE_URL, { waitUntil: 'networkidle' });

  // Select benefit plan
  await page.getByRole('button', { name: 'Select benefit' }).click();
  await page.getByText(benefitPlan).click();
  await page.waitForTimeout(500);

  // Amount
  await page.locator('input[placeholder="321"]').fill(session.amount.toFixed(2));

  // Merchant (provider)
  await page.locator('input[placeholder="The retailer or service provider\'s name"]').fill(session.provider);

  // Service date
  await pickDate(page, session.date);

  // Upload receipt
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByText('Or click here to browse your computer.').click(),
  ]);
  await fileChooser.setFiles(pdfPath);
  await page.waitForTimeout(1500);

  await page.screenshot({ path: path.join(__dirname, 'last-claim.png') });
  console.log('  Form filled, receipt attached.');

  await page.getByRole('button', { name: 'Submit reimbursement' }).click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(__dirname, 'last-claim.png') });
  console.log('  Submitted.');
}

async function main() {
  console.log(`Connecting to browser...`);
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  for (let i = START_INDEX; i < SESSIONS.length; i++) {
    await submitClaim(page, SESSIONS[i], i, SESSIONS.length);
  }

  console.log('\nDone. Browser stays open for review.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
