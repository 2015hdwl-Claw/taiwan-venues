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
      timeout: 30000
    });

    console.log(`✅ 頁面載入成功`);

    // 等待動態內容載入
    await page.waitForTimeout(5000);

    // 提取照片
    const photos = await page.evaluate(() => {
      const photos = [];

      // 提取所有照片
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (img.src && !img.src.includes('logo') && !img.src.includes('icon') && !img.src.includes('loading')) {
          // 過濾掉太小的圖片
          if (img.width > 100 && img.height > 100) {
            photos.push(img.src);
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
      photos: photos.slice(0, 20), // 只取前 20 張
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
  console.log('🚀 爬蟲統一渡假村照片！\n');

  const venues = [
    {
      name: '統一渡假村-墾丁',
      url: 'https://www.kenting-resort.com'
    },
    {
      name: '台北統一大飯店',
      url: 'https://www.tongyi-hotel.com'
    }
  ];

  const results = [];

  for (const venue of venues) {
    const result = await crawlVenuePhotos(venue.url, venue.name);
    results.push(result);
  }

  // 保存結果
  fs.writeFileSync('uni-resort-photos.json', JSON.stringify(results, null, 2));
  console.log('✅ 已保存到 uni-resort-photos.json\n');

  // 更新主資料庫
  const mainData = JSON.parse(fs.readFileSync('sample-data.json', 'utf8'));

  results.forEach(result => {
    if (result.photos && result.photos.length > 0) {
      // 過濾掉 loading 和 icon 圖片
      const validPhotos = result.photos.filter(photo =>
        !photo.includes('loading') && !photo.includes('icon') && !photo.includes('logo')
      );

      // 找到對應的場地
      mainData.forEach(venue => {
        if (venue.name.includes(result.venueName.split('-')[0])) {
          venue.images = {
            main: validPhotos[0] || venue.images?.main || '',
            gallery: validPhotos.length > 0 ? validPhotos : (venue.images?.gallery || [])
          };

          console.log(`✅ 更新: ${venue.name} ${venue.roomName || ''}`);
          console.log(`   照片數量: ${validPhotos.length} 張\n`);
        }
      });
    }
  });

  // 保存更新後的主資料庫
  fs.writeFileSync('sample-data.json', JSON.stringify(mainData, null, 2));
  console.log('✅ 已更新 sample-data.json\n');

  console.log('🎉 所有爬蟲任務完成！');
}

main().catch(console.error);
