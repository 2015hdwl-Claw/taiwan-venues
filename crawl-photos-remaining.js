const { chromium } = require('playwright');
const fs = require('fs');

async function crawlVenuePhotos(url, venueName) {
  console.log(`\n🔍 爬蟲照片: ${venueName}`);
  console.log(`   URL: ${url}\n`);

  const browser = await chromium.launch({
    headless: true
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  try {
    // 訪問網站
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });

    console.log(`✅ 頁面載入成功`);

    // 等待動態內容載入
    await page.waitForTimeout(3000);

    // 提取照片
    const photos = await page.evaluate(() => {
      const photos = [];

      // 提取所有照片
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (img.src && !img.src.includes('logo') && !img.src.includes('icon') && !img.src.includes('loading')) {
          // 過濾掉太小的圖片
          if (img.width > 100 && img.height > 100) {
            photos.push({
              url: img.src,
              alt: img.alt || ''
            });
          }
        }
      });

      return photos;
    });

    await browser.close();

    console.log(`✅ 找到 ${photos.length} 張照片\n`);

    return {
      venueName,
      url,
      photos: photos.slice(0, 10), // 只取前 10 張
      crawledAt: new Date().toISOString()
    };

  } catch (error) {
    await browser.close();
    console.log(`❌ 爬蟲失敗: ${error.message}\n`);
    return {
      venueName,
      url,
      error: error.message,
      photos: [],
      crawledAt: new Date().toISOString()
    };
  }
}

async function main() {
  console.log('🚀 批次爬蟲剩餘場地照片！\n');

  // 讀取剩餘場地
  const venuesNeedingPhotos = JSON.parse(fs.readFileSync('venues-needing-photos-remaining.json', 'utf8'));

  console.log(`📊 需要補充照片的場地: ${venuesNeedingPhotos.length} 個\n`);

  const results = [];

  for (const venue of venuesNeedingPhotos) {
    const result = await crawlVenuePhotos(venue.url, `${venue.name} ${venue.roomName || ''}`);
    results.push(result);

    // 保存中間結果
    fs.writeFileSync('photo-crawl-results-remaining.json', JSON.stringify(results, null, 2));

    // 每完成 5 個發送一次進度報告
    if (results.length % 5 === 0) {
      const message = `📊 照片爬蟲進度\n\n` +
        `✅ 已完成: ${results.length}/${venuesNeedingPhotos.length}\n` +
        `成功: ${results.filter(r => r.photos.length > 0).length}\n` +
        `失敗: ${results.filter(r => r.error).length}`;

      console.log(`\n📱 進度報告: ${message}\n`);
    }
  }

  // 保存總結果
  fs.writeFileSync('photo-crawl-results-remaining-final.json', JSON.stringify(results, null, 2));
  console.log('✅ 總結果已保存: photo-crawl-results-remaining-final.json\n');

  console.log('🎉 所有照片爬蟲任務完成！');
}

main().catch(console.error);
