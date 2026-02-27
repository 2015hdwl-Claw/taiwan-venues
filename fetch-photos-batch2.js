const puppeteer = require('puppeteer');
const fs = require('fs');

// 更多重要場地列表
const VENUES = [
  { name: '台北老爺大酒店', url: 'https://www.royal-taipei.com/' },
  { name: '台北亞都麗緻', url: 'https://www.landis.com.tw/' },
  { name: '六福萬怡酒店', url: 'https://www.marriott.com/hotels/travel/tpect-courtyard-taipei/' },
  { name: '台北萬豪酒店', url: 'https://www.marriott.com/hotels/travel/tpejt-taipei-marriott-hotel/' },
  { name: '台北美福大飯店', url: 'https://www.grandmayfull.com/' },
  { name: '宜蘭礁溪老爺酒店', url: 'https://www.reefsilks.com.tw/' },
  { name: '台東知本老爺酒店', url: 'https://www.hotelroyal.com.tw/taitung/' },
  { name: '台中全國大飯店', url: 'https://www.nationwide.com.tw/' },
  { name: '台中大億麗緻酒店', url: 'https://www.landis-taichung.com/' },
  { name: '高雄翰品酒店', url: 'https://www.chateaudechine.com/kaohsiung/' },
  { name: '高雄福華大飯店', url: 'https://kaohsiung.howard-hotels.com.tw/' },
  { name: '台南老爺行旅', url: 'https://www.hotelroyal.com.tw/tainan/' },
  { name: '桃園喜來登', url: 'https://www.sheraton.com/taoyuan/' },
  { name: '新竹喜來登', url: 'https://www.sheraton.com/hsinchu/' },
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchVenuePhotos(browser, venue) {
  const page = await browser.newPage();
  const photos = [];
  
  try {
    console.log(`\n📍 正在爬取: ${venue.name}`);
    console.log(`   URL: ${venue.url}`);
    
    page.setDefaultTimeout(45000);
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setBypassCSP(true);
    
    const response = await page.goto(venue.url, { 
      waitUntil: 'domcontentloaded',
      timeout: 45000 
    });
    
    console.log(`   HTTP ${response.status()}`);
    
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
          if (totalHeight >= scrollHeight - window.innerHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
    
    await sleep(2000);
    
    // 獲取所有圖片 URL
    const images = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      const bgImages = Array.from(document.querySelectorAll('[style*="background-image"]'));
      
      const allImages = [];
      
      imgs.forEach(img => {
        const src = img.src || img.dataset.src || img.dataset.background;
        if (src && src.startsWith('http')) {
          allImages.push({
            src: src,
            alt: img.alt || '',
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
        .filter(img => img.width > 200 || img.height > 200)
        .filter(img => !img.src.includes('logo') && 
                      !img.src.includes('icon') && 
                      !img.src.includes('avatar') &&
                      !img.src.includes('data:image'));
    });
    
    console.log(`   ✅ 找到 ${images.length} 張圖片`);
    
    const sortedImages = images
      .sort((a, b) => (b.width * b.height) - (a.width * a.height))
      .slice(0, 5);
    
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
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--ignore-certificate-errors',
      '--disable-web-security'
    ]
  });
  
  const allPhotos = [];
  
  for (const venue of VENUES) {
    const photos = await fetchVenuePhotos(browser, venue);
    allPhotos.push(...photos);
    await sleep(2000);
  }
  
  await browser.close();
  
  // 合併舊資料
  let existingPhotos = [];
  if (fs.existsSync('venue-photos-crawled.json')) {
    existingPhotos = JSON.parse(fs.readFileSync('venue-photos-crawled.json', 'utf-8'));
  }
  
  const combined = [...existingPhotos, ...allPhotos];
  fs.writeFileSync('venue-photos-crawled.json', JSON.stringify(combined, null, 2));
  
  console.log(`\n✅ 完成！新增 ${allPhotos.length} 個場地，總共 ${combined.length} 個場地的照片`);
}

main().catch(console.error);
