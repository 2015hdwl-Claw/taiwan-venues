const puppeteer = require('puppeteer');
const fs = require('fs');

// 第四批重要場地 - 使用已知可訪問的官網
const VENUES = [
  { name: '台北君悅酒店', url: 'https://www.hyatt.com/grand-hyatt-taipei' },
  { name: 'W飯店台北', url: 'https://www.marriott.com/hotels/travel/tpeal-w-taipei/' },
  { name: '台北君品酒店', url: 'https://www.palaisdechine.com/' },
  { name: '台北喜來登大飯店', url: 'https://www.marriott.com/hotels/travel/tpesi-sheraton-grand-taipei-hotel/' },
  { name: '台北國賓大飯店', url: 'https://www.ambassadorhotel.com.tw/' },
  { name: '台北老爺大酒店', url: 'https://www.royal-taipei.com/' },
  { name: '台北西華飯店', url: 'https://www.sherwood.com.tw/' },
  { name: '台北威斯汀六福皇宮', url: 'https://www.marriott.com/hotels/travel/tpewe-the-westin-taipei/' },
  { name: '兄弟大飯店', url: 'https://www.brotherhotel.com.tw/' },
  { name: '台中日月千禧酒店', url: 'https://www.millennium-hotels.com/' },
  { name: '林酒店', url: 'https://www.the1.com.tw/' },
  { name: '台中市世貿中心', url: 'https://www.wtctx.org.tw/' },
  { name: '義大皇家酒店', url: 'https://www.eda-royal.com/' },
  { name: '基隆長榮桂冠酒店', url: 'https://www.evergreen-hotels.com/' },
  { name: '新板希爾頓酒店', url: 'https://www.hilton.com/' },
  { name: '典華旗艦店', url: 'https://www.dianhua.com.tw/' },
  { name: '尊爵天際大飯店', url: 'https://www.skyline.com.tw/' },
  { name: '大億麗緻酒店', url: 'https://www.landis.com.tw/' },
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchVenuePhotos(browser, venue) {
  const page = await browser.newPage();
  const photos = [];
  
  try {
    console.log(`\n📍 ${venue.name}`);
    console.log(`   URL: ${venue.url}`);
    
    page.setDefaultTimeout(30000);
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setBypassCSP(true);
    
    // 設定 User-Agent 避免被封鎖
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const response = await page.goto(venue.url, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    console.log(`   HTTP ${response.status()}`);
    
    if (response.status() !== 200) {
      console.log(`   ⚠️  跳過（HTTP ${response.status()}）`);
      return photos;
    }
    
    await sleep(3000);
    
    // 滾動頁面
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight - window.innerHeight || totalHeight > 3000) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
    
    await sleep(2000);
    
    // 獲取圖片 - 加強過濾確保一致性
    const images = await page.evaluate((venueName) => {
      const imgs = Array.from(document.querySelectorAll('img'));
      const bgImages = Array.from(document.querySelectorAll('[style*="background-image"]'));
      
      const allImages = [];
      
      imgs.forEach(img => {
        const src = img.src || img.dataset.src || img.dataset.background;
        const alt = img.alt || '';
        if (src && src.startsWith('http')) {
          allImages.push({
            src: src,
            alt: alt,
            width: img.naturalWidth || img.width || 0,
            height: img.naturalHeight || img.height || 0
          });
        }
      });
      
      bgImages.forEach(el => {
        const style = window.getComputedStyle(el);
        const bgImage = style.backgroundImage;
        if (bgImage && bgImage !== 'none') {
          const match = bgImage.match(/url\(['"]?(.*?)['"]?\)/);
          if (match && match[1]) {
            allImages.push({
              src: match[1],
              alt: '',
              width: 800,
              height: 600
            });
          }
        }
      });
      
      return allImages
        .filter(img => img.width > 300 || img.height > 200) // 提高最小尺寸
        .filter(img => {
          const src = img.src.toLowerCase();
          const alt = img.alt.toLowerCase();
          
          // 過濾掉明顯無關的圖片
          if (src.includes('logo') || src.includes('icon') || src.includes('avatar')) return false;
          if (src.includes('award') || src.includes('device') || src.includes('michelin')) return false;
          if (src.includes('sheraton.png') || src.includes('devices.png')) return false;
          if (src.includes('data:image')) return false;
          
          // 優先選擇包含場地相關關鍵字的圖片
          const keywords = ['room', 'suite', 'lobby', 'banquet', 'meeting', 'hall', 'venue', 'hotel', 'ballroom'];
          const hasKeyword = keywords.some(k => src.includes(k) || alt.includes(k));
          
          return true;
        });
    }, venue.name);
    
    console.log(`   ✅ 找到 ${images.length} 張有效圖片`);
    
    // 優先選擇包含場地關鍵字的圖片
    const venueKeywords = ['room', 'suite', 'lobby', 'banquet', 'meeting', 'hall', 'venue', 'hotel', 'ballroom'];
    const keywordImages = images.filter(img => {
      const src = img.src.toLowerCase();
      const alt = img.alt.toLowerCase();
      return venueKeywords.some(k => src.includes(k) || alt.includes(k));
    });
    
    const sortedImages = (keywordImages.length > 0 ? keywordImages : images)
      .sort((a, b) => (b.width * b.height) - (a.width * a.height))
      .slice(0, 3);
    
    if (sortedImages.length > 0) {
      photos.push({
        name: venue.name,
        url: venue.url,
        images: sortedImages.map(img => img.src)
      });
      console.log(`   📸 最佳圖片: ${sortedImages[0].src.substring(0, 80)}...`);
    }
    
  } catch (error) {
    console.log(`   ❌ 錯誤: ${error.message}`);
  } finally {
    await page.close();
  }
  
  return photos;
}

async function main() {
  console.log('🚀 啟動瀏覽器...');
  const browser = await puppeteer.launch({
    headless: 'new',
    ignoreHTTPSErrors: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });
  
  const allPhotos = [];
  
  for (const venue of VENUES) {
    const photos = await fetchVenuePhotos(browser, venue);
    allPhotos.push(...photos);
    await sleep(3000); // 增加間隔避免被封鎖
  }
  
  await browser.close();
  
  // 合併舊資料
  let existingPhotos = [];
  if (fs.existsSync('venue-photos-crawled.json')) {
    existingPhotos = JSON.parse(fs.readFileSync('venue-photos-crawled.json', 'utf-8'));
  }
  
  // 去重
  const existingNames = new Set(existingPhotos.map(v => v.name));
  const newPhotos = allPhotos.filter(v => !existingNames.has(v.name));
  
  const combined = [...existingPhotos, ...newPhotos];
  fs.writeFileSync('venue-photos-crawled.json', JSON.stringify(combined, null, 2));
  
  console.log(`\n✅ 新增 ${newPhotos.length} 個，總共 ${combined.length} 個場地`);
}

main().catch(console.error);
