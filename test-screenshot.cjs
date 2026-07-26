const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  await page.goto('http://localhost:3000');
  await new Promise(r => setTimeout(r, 2000));
  const html = await page.content();
  console.log('HTML Length:', html.length);
  if (html.length < 1000) {
    console.log(html);
  }
  const rootHtml = await page.$eval('#root', el => el.innerHTML).catch(() => 'NO ROOT');
  console.log('ROOT HTML:', rootHtml);
  await browser.close();
})();
