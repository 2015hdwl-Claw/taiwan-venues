const { chromium } = require('playwright');

// 測試多個飯店
const venues = [
  { name: '台北寒舍艾美酒店', url: 'https://www.lemeridien-taipei.com/meetings/' },
  { name: '台北香格里拉遠東', url: 'https://www.shangri-la.com/taipei/fareasternplaza/events/' },
  { name: '台北晶華酒店', url: 'https://www.regenttaipei.com/meetings-and-events' }
];

async function testVenue(venue) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`測試: ${venue.name}`);
  console.log(`URL: ${venue.url}`);
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  const networkImages = [];
  
  try {
    page.on('response', response => {
      const url = response.url();
      if (url.match(/\.(jpg|png|webp)/i) && !url.includes('data:image')) {
        networkImages.push(url);
      }
    });
    
    console.log('📱 訪問頁面...');
    await page.goto(venue.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // 滾動
    console.log('📜 滾動頁面...');
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(2000);
    
    // 提取圖片
    const domImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.filter(img => img.src && !img.src.includes('data:image') && !img.src.includes('.svg'))
                 .map(img => ({ src: img.src, alt: img.alt || '' }));
    });
    
    // 提取背景圖片
    const bgImages = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('[style*="background-image"]'));
      return elements.map(el => {
        const bg = window.getComputedStyle(el).backgroundImage;
        const match = bg.match(/url\(['"]?([^'"]+)['"]?\)/);
        return match ? match[1] : null;
      }).filter(url => url && !url.includes('data:image'));
    });
    
    // 合併
    const allImages = [...new Set([...networkImages, ...domImages.map(i => i.src), ...bgImages])];
    
    console.log(`✅ 網絡請求圖片: ${networkImages.length}`);
    console.log(`✅ DOM 圖片: ${domImages.length}`);
    console.log(`✅ 背景圖片: ${bgImages.length}`);
    console.log(`✅ 總計不重複: ${allImages.length}`);
    
    if (allImages.length > 0) {
      console.log('\n前 5 張圖片:');
      allImages.slice(0, 5).forEach((url, i) => {
        console.log(`  ${i+1}. ${url.substring(0, 80)}...`);
      });
    }
    
    return { venue: venue.name, count: allImages.length, images: allImages };
    
  } catch (error) {
    console.log(`❌ 錯誤: ${error.message}`);
    return { venue: venue.name, error: error.message };
  } finally {
    await browser.close();
  }
}

(async () => {
  console.log('🚀 開始測試多個飯店的爬蟲...');
  
  const results = [];
  for (const venue of venues) {
    const result = await testVenue(venue);
    results.push(result);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 測試結果摘要:');
  console.log('='.repeat(60));
  
  results.forEach(r => {
    if (r.error) {
      console.log(`❌ ${r.venue}: 錯誤 - ${r.error}`);
    } else {
      console.log(`✅ ${r.venue}: ${r.count} 張圖片`);
    }
  });
  
  // 保存結果
  const fs = require('fs');
  fs.writeFileSync('/root/.openclaw/workspace/taiwan-venues/crawl-test-results.json', JSON.stringify(results, null, 2));
  console.log('\n💾 結果已保存到 crawl-test-results.json');
})();
