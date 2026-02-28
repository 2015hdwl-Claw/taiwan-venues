// 下一批場地照片抓取 - Batch 5
// 執行方式: node fetch-photos-batch5.js

const puppeteer = require('puppeteer');
const fs = require('fs');

// 待抓取的場地清單（修正過的正確網址）
const venues = [
  // === 需要重新抓取的場地（修正版） ===
  { name: '台北美福大飯店', url: 'https://www.grandmayfull.com/' },
  { name: '桃園喜來登', url: 'https://www.marriott.com/hotels/travel/tpesr-sheraton-taoyuan-hotel/' },
  { name: '新竹喜來登', url: 'https://www.marriott.com/hotels/travel/hsqsi-sheraton-hsinchu-hotel/' },
  
  // === 新場地（下一批） ===
  { name: '台北國際會議中心', url: 'https://www.ticc.com.tw' },
  { name: '華山1914文創園區', url: 'https://www.huashan1914.com' },
  { name: '台北君悅酒店', url: 'https://www.grandhyatttaipei.com' },
  { name: '台北晶華酒店', url: 'https://www.regenthotels.com/taipei' },
  { name: 'W飯店台北', url: 'https://www.marriott.com/hotels/travel/tpewi-w-taipei/' },
  { name: '台北君品酒店', url: 'https://www.palaisdechine.com' },
  { name: '台北喜來登大飯店', url: 'https://www.marriott.com/hotels/travel/tpesi-sheraton-grand-taipei-hotel/' },
  { name: '台北國賓大飯店', url: 'https://www.ambassadorhotel.com.tw/taipei/' },
  { name: '台北老爺大酒店', url: 'https://www.royal-taipei.com' },
  { name: '台北威斯汀六福皇宮', url: 'https://www.westin.com/taipei' },
  { name: '福容大飯店-淡水漁人碼頭', url: 'https://www.fullon-hotels.com.tw/fd/' },
  { name: '新板希爾頓酒店', url: 'https://www.hilton.com/zh-hant/hotels/tpebhhi-hilton-taipei-sinban/' },
  { name: '台中日月千禧酒店', url: 'https://www.millenniumhotels.com/taichung/' },
  { name: '林酒店', url: 'https://www.theforest.com.tw' },
  { name: '台中國家歌劇院', url: 'https://www.npac-ntt.org' },
  { name: '台南香格里拉遠東國際大飯店', url: 'https://www.shangri-la.com/tainan/' },
  { name: '大億麗緻酒店', url: 'https://www.landis-tainan.com' },
  { name: '台南奇美博物館', url: 'https://www.chimeimuseum.org' },
  { name: '高雄洲際酒店', url: 'https://www.ihg.com/intercontinental/hotels/tw/zh/kaohsiung/khhha/hoteldetail' },
  { name: '高雄展覽館', url: 'https://www.kecc.com.tw' },
  { name: '松山文創園區', url: 'https://www.songshanculturalpark.org' },
  { name: '三創生活園區', url: 'https://www.syntrend.com.tw' },
  { name: '台北萬豪酒店', url: 'https://www.marriott.com/hotels/travel/tpemc-taipei-marriott-hotel/' },
  { name: '維多麗亞酒店', url: 'https://www.victoria.com.tw' },
  { name: '台北花園大酒店', url: 'https://www.taipeigardenhotel.com.tw' },
  { name: '馥敦酒店', url: 'https://www.fullerton.com.tw' },
  { name: '豪景大酒店', url: 'https://www.royalview.com.tw' },
];

async function fetchVenuePhotos(browser, venue) {
  const page = await browser.newPage();
  const result = { name: venue.name, url: venue.url, images: [], error: null };
  
  try {
    console.log(`\n📍 ${venue.name}`);
    console.log(`   URL: ${venue.url}`);
    
    await page.goto(venue.url, { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    // 等待頁面載入
    await new Promise(r => setTimeout(r, 2000));
    
    // 抓取所有圖片
    const images = await page.evaluate(() => {
      const imgs = [];
      
      // 找所有圖片元素
      document.querySelectorAll('img').forEach(img => {
        const src = img.src || img.dataset.src || img.dataset.lazySrc;
        if (src && !src.includes('logo') && !src.includes('icon') && !src.includes('avatar')) {
          imgs.push({
            src: src,
            alt: img.alt || '',
            width: img.naturalWidth || img.width,
            height: img.naturalHeight || img.height
          });
        }
      });
      
      // 找背景圖片
      document.querySelectorAll('[style*="background"]').forEach(el => {
        const style = el.style.backgroundImage;
        const match = style.match(/url\(['"]?([^'"]+)['"]?\)/);
        if (match && match[1]) {
          imgs.push({
            src: match[1],
            alt: el.className || 'background',
            width: el.offsetWidth,
            height: el.offsetHeight
          });
        }
      });
      
      return imgs;
    });
    
    // 過濾並排序圖片
    const validImages = images
      .filter(img => {
        // 過濾掉太小或可疑的圖片
        if (img.width < 100 || img.height < 100) return false;
        if (img.src.includes('logo')) return false;
        if (img.src.includes('icon')) return false;
        if (img.src.includes('avatar')) return false;
        if (img.src.includes('data:image')) return false;
        if (img.src.endsWith('.svg')) return false;
        return true;
      })
      .sort((a, b) => (b.width * b.height) - (a.width * a.height))
      .slice(0, 5)
      .map(img => img.src);
    
    result.images = validImages;
    
    if (validImages.length > 0) {
      console.log(`   HTTP 200 ✅ 找到 ${validImages.length} 張有效圖片`);
    } else {
      console.log(`   ⚠️ 未找到有效圖片`);
    }
    
  } catch (error) {
    result.error = error.message;
    console.log(`   ❌ 錯誤: ${error.message}`);
  } finally {
    await page.close();
  }
  
  return result;
}

async function main() {
  console.log('=== 場地照片抓取 - Batch 5 ===');
  console.log(`待處理場地數: ${venues.length}`);
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const results = [];
  
  for (const venue of venues) {
    const result = await fetchVenuePhotos(browser, venue);
    results.push(result);
    
    // 避免過於頻繁請求
    await new Promise(r => setTimeout(r, 2000));
  }
  
  await browser.close();
  
  // 儲存結果
  const outputFile = 'venue-photos-batch5.json';
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  console.log(`\n✅ 完成！結果已儲存至 ${outputFile}`);
  
  // 統計
  const success = results.filter(r => r.images.length > 0).length;
  const failed = results.filter(r => r.error).length;
  console.log(`\n📊 統計:`);
  console.log(`   成功: ${success}/${venues.length}`);
  console.log(`   失敗: ${failed}/${venues.length}`);
}

main().catch(console.error);
