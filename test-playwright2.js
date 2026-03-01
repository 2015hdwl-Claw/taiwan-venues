const { chromium } = require('playwright');

async function testScrape() {
  console.log('=== Playwright 測試 2 ===\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  const page = await context.newPage();
  
  // 測試晶華酒店
  const url = 'https://www.regenttaipei.com';
  console.log('測試場地: 台北晶華酒店');
  console.log('官網:', url);
  
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('✅ 頁面載入成功');
    
    // 滾動頁面觸發載入
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    
    // 抓取圖片
    const images = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs
        .filter(img => img.src && img.naturalWidth > 50)
        .map(img => img.src)
        .filter(src => !src.includes('logo') && !src.includes('icon'))
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
