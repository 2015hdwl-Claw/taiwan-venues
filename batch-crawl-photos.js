const { chromium } = require('playwright');
const fs = require('fs');

async function crawlVenuePhotos(url, venueName) {
  const browser = await chromium.launch({
    headless: true
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  try {
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });

    await page.waitForTimeout(3000);

    const photos = await page.evaluate(() => {
      const photos = [];
      const images = document.querySelectorAll('img');

      images.forEach(img => {
        if (img.src && !img.src.includes('logo') && !img.src.includes('icon') && !img.src.includes('loading')) {
          if (img.width > 100 && img.height > 100) {
            photos.push(img.src);
          }
        }
      });

      return photos;
    });

    await browser.close();

    return {
      venueName,
      url,
      photos: photos.slice(0, 10),
      success: true
    };

  } catch (error) {
    await browser.close();
    return {
      venueName,
      url,
      error: error.message,
      photos: [],
      success: false
    };
  }
}

async function main() {
  console.log('🚀 批次爬蟲更新場地照片！\n');

  const venues = JSON.parse(fs.readFileSync('sample-data.json', 'utf8'));

  // 找出需要更新照片的場地
  const needsUpdate = venues.filter(v =>
    !v.images?.main ||
    v.images?.main?.includes('unsplash') ||
    v.images?.main?.includes('wikipedia') ||
    v.images?.main?.includes('upload.wikimedia')
  );

  console.log(`📊 需要更新的場地: ${needsUpdate.length} 個\n`);

  // 只處理前 50 個
  const toProcess = needsUpdate.slice(0, 50);
  console.log(`🎯 本次處理: ${toProcess.length} 個\n`);

  const results = [];

  for (const venue of toProcess) {
    const fullName = `${venue.name} ${venue.roomName || ''}`.trim();
    console.log(`🔍 爬蟲: ${fullName}`);
    console.log(`   URL: ${venue.url}`);

    const result = await crawlVenuePhotos(venue.url, fullName);
    results.push(result);

    if (result.success && result.photos.length > 0) {
      console.log(`   ✅ 成功: ${result.photos.length} 張照片\n`);
    } else {
      console.log(`   ❌ 失敗: ${result.error || '無照片'}\n`);
    }

    // 每完成 10 個保存一次
    if (results.length % 10 === 0) {
      fs.writeFileSync('batch-crawl-progress.json', JSON.stringify(results, null, 2));
    }
  }

  // 保存最終結果
  fs.writeFileSync('batch-crawl-results.json', JSON.stringify(results, null, 2));
  console.log('✅ 已保存到 batch-crawl-results.json\n');

  // 統計
  const success = results.filter(r => r.success && r.photos.length > 0).length;
  const failed = results.filter(r => !r.success || r.photos.length === 0).length;

  console.log('📊 統計:\n');
  console.log(`成功: ${success}/${toProcess.length}`);
  console.log(`失敗: ${failed}/${toProcess.length}\n`);

  console.log('🎉 批次爬蟲完成！');
}

main().catch(console.error);
