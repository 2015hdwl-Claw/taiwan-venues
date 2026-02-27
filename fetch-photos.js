const puppeteer = require('puppeteer');
const fs = require('fs');

// 重要場地列表 - 使用正確的官網 URL
const VENUES = [
  { name: '台北晶華酒店', url: 'https://rph.com.tw/' },
  { name: '台北香格里拉', url: 'https://www.shangri-la.com/taipei/' },
  { name: '台北君品酒店', url: 'https://palaisdechine.com/' },
  { name: '寒舍艾美酒店', url: 'https://www.lemeridien-taipei.com/' },
  { name: '台北文華東方', url: 'https://www.mandarinoriental.com/taipei' },
  { name: '台南晶英酒店', url: 'https://www.silksplace.com/tainan/' },
  { name: '高雄漢來大飯店', url: 'https://www.hanshin.com.tw/' },
  { name: '台中林酒店', url: 'https://www.the1.com.tw/' },
  { name: '台中金典酒店', url: 'https://www.splendor-hotel.com/' },
  { name: '新竹煙波大飯店', url: 'https://www.lakeshore.com.tw/hsinchu/' },
  { name: '板橋凱撒大飯店', url: 'https://www.caesarpark.com.tw/banqiao/' },
  { name: '桃園諾富特', url: 'https://www.novotel.com/taoyuan-airport/' },
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
    
    // 設定超時和視窗大小
    page.setDefaultTimeout(60000);
    await page.setViewport({ width: 1920, height: 1080 });
    
    // 忽略 HTTPS 錯誤
    await page.setBypassCSP(true);
    
    // 訪問頁面
    const response = await page.goto(venue.url, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    console.log(`   HTTP ${response.status()}`);
    
    // 等待頁面載入
    await sleep(3000);
    
    // 滾動頁面以觸發 lazy load
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
      
      // 一般圖片
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
      
      // 背景圖片
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
    
    // 選擇最大的幾張圖片
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
    
    // 每個網站間隔一下
    await sleep(2000);
  }
  
  await browser.close();
  
  // 儲存結果
  fs.writeFileSync('venue-photos-crawled.json', JSON.stringify(allPhotos, null, 2));
  console.log(`\n✅ 完成！共找到 ${allPhotos.length} 個場地的照片`);
  console.log('📄 結果已儲存至 venue-photos-crawled.json');
}

main().catch(console.error);
