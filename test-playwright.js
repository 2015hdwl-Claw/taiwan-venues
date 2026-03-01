const { chromium } = require('playwright');

async function testScrape() {
  console.log('=== Playwright 測試 ===\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  const page = await context.newPage();
  
  // 測試台北君悅酒店
  const url = 'https://www.hyatt.com/zh-TW/hotel/taiwan/grand-hyatt-taipei/tpegh';
  console.log('測試場地: 台北君悅酒店');
  console.log('官網:', url);
  
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    console.log('✅ 頁面載入成功');
    
    // 等待圖片載入
    await page.waitForTimeout(3000);
    
    // 抓取圖片
    const images = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs
        .filter(img => img.src && img.width > 100 && img.height > 100)
        .map(img => ({
          src: img.src,
          alt: img.alt || '',
          width: img.width,
          height: img.height
        }))
        .slice(0, 10);
    });
    
    console.log('\n找到圖片:', images.length, '張');
    images.forEach((img, i) => {
      console.log(`${i + 1}. ${img.src.slice(0, 80)}...`);
    });
    
  } catch (err) {
    console.log('❌ 錯誤:', err.message);
  }
  
  await browser.close();
  console.log('\n測試完成');
}

testScrape();
