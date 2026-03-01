const { chromium } = require('playwright');

async function testScrape() {
  console.log('=== Playwright 測試 3（簡單網站）===\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 測試 TICC（較穩定）
  const url = 'https://www.ticc.com.tw';
  console.log('測試場地: TICC');
  console.log('官網:', url);
  
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('✅ 頁面載入成功');
    
    await page.waitForTimeout(2000);
    
    const images = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs
        .filter(img => img.src && img.width > 50)
        .map(img => img.src)
        .filter(src => src.startsWith('http'))
        .slice(0, 5);
    });
    
    console.log('\n找到圖片:', images.length, '張');
    images.forEach((img, i) => {
      console.log(`${i + 1}. ${img}`);
    });
    
  } catch (err) {
    console.log('❌ 錯誤:', err.message);
  }
  
  await browser.close();
  console.log('\n測試完成');
}

testScrape();
