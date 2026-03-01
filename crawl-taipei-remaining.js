const { chromium } = require('playwright');
const fs = require('fs');

// 讀取待處理清單
const needPhotos = JSON.parse(fs.readFileSync('taipei-need-photos.json', 'utf8'));

console.log('=== 台北市剩餘場地抓取 ===');
console.log('待處理:', needPhotos.length, '個\n');

// 去重（同名場地只處理一次）
const unique = [];
const seen = new Set();
needPhotos.forEach(v => {
  const key = v.name.split('(')[0].trim();
  if (!seen.has(key)) {
    seen.add(key);
    unique.push(v);
  }
});

console.log('去重後:', unique.length, '個\n');

async function scrapeVenue(browser, venue) {
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  const page = await context.newPage();
  
  try {
    await page.goto(venue.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(3000);
    
    const images = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs
        .filter(img => img.src && img.width > 100 && img.height > 100)
        .map(img => img.src)
        .filter(src => 
          src.startsWith('http') &&
          !src.includes('logo') && 
          !src.includes('icon') &&
          !src.includes('avatar')
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
  const browser = await chromium.launch({ headless: true });
  const results = [];
  
  // 分批處理（每批 10 個）
  const batchSize = 10;
  
  for (let i = 0; i < unique.length; i += batchSize) {
    const batch = unique.slice(i, i + batchSize);
    
    console.log(`=== 批次 ${Math.floor(i/batchSize) + 1} (${i+1}-${Math.min(i+batchSize, unique.length)}) ===`);
    
    for (let j = 0; j < batch.length; j++) {
      const venue = batch[j];
      process.stdout.write(`[${j + 1}/${batch.length}] ${venue.name}... `);
      
      const result = await scrapeVenue(browser, venue);
      results.push(result);
      
      if (result.status === 'success' && result.photos.length > 0) {
        console.log(`✅ ${result.photos.length} 張`);
      } else if (result.status === 'success') {
        console.log('⚠️ 0 張');
      } else {
        console.log(`❌ ${result.error.slice(0, 30)}`);
      }
      
      // 間隔避免被封
      await new Promise(r => setTimeout(r, 1000));
    }
    
    console.log('');
  }
  
  await browser.close();
  
  // 儲存結果
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  fs.writeFileSync(`taipei-remaining-results-${timestamp}.json`, JSON.stringify(results, null, 2));
  
  // 更新資料庫
  const data = JSON.parse(fs.readFileSync('venues-all-cities.json', 'utf8'));
  
  let updated = 0;
  results.forEach(r => {
    if (r.status === 'success' && r.photos.length > 0) {
      data.forEach(v => {
        if (v.name.includes(r.name.split('(')[0]) || r.name.includes(v.name.split('(')[0])) {
          v.images = {
            main: r.photos[0],
            gallery: r.photos,
            source: r.url
          };
          updated++;
        }
      });
    }
  });
  
  fs.writeFileSync('venues-all-cities.json', JSON.stringify(data, null, 2));
  
  const success = results.filter(r => r.status === 'success' && r.photos.length > 0).length;
  console.log(`=== 完成 ===`);
  console.log(`成功: ${success}/${unique.length}`);
  console.log(`更新資料庫: ${updated} 筆`);
}

main();
