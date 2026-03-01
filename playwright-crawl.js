const { chromium } = require('playwright');
const fs = require('fs');

// 讀取失敗場地清單
const failed = JSON.parse(fs.readFileSync('failed-venues.json', 'utf8'));
const results = [];

async function scrapeVenue(browser, venue) {
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  const page = await context.newPage();
  
  try {
    await page.goto(venue.url, { 
      waitUntil: 'domcontentloaded', 
      timeout: 20000 
    });
    
    // 滾動觸發載入
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    
    // 抓取圖片
    const images = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs
        .filter(img => img.src && img.width > 100 && img.height > 100)
        .map(img => img.src)
        .filter(src => 
          src.startsWith('http') &&
          !src.includes('logo') && 
          !src.includes('icon') &&
          !src.includes('avatar') &&
          !src.includes('sprite')
        );
    });
    
    await context.close();
    
    return {
      name: venue.name,
      url: venue.url,
      photos: [...new Set(images)].slice(0, 5),
      status: 'success'
    };
    
  } catch (err) {
    await context.close();
    return {
      name: venue.name,
      url: venue.url,
      error: err.message,
      status: 'failed'
    };
  }
}

async function main() {
  console.log('=== Playwright 批次抓取 ===');
  console.log('失敗場地:', failed.length, '個\n');
  
  const browser = await chromium.launch({ headless: true });
  
  // 只處理前 20 個
  const batch = failed.slice(0, 20);
  
  for (let i = 0; i < batch.length; i++) {
    const venue = batch[i];
    process.stdout.write(`[${i + 1}/${batch.length}] ${venue.name}... `);
    
    const result = await scrapeVenue(browser, venue);
    results.push(result);
    
    if (result.status === 'success' && result.photos.length > 0) {
      console.log(`✅ ${result.photos.length} 張`);
    } else if (result.status === 'success') {
      console.log('⚠️ 0 張');
    } else {
      console.log(`❌ ${result.error.slice(0, 30)}`);
    }
  }
  
  await browser.close();
  
  // 儲存結果
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  fs.writeFileSync(`playwright-results-${timestamp}.json`, JSON.stringify(results, null, 2));
  
  const success = results.filter(r => r.status === 'success' && r.photos.length > 0).length;
  console.log(`\n完成: ${success}/${batch.length} 個成功（有照片）`);
}

main();
