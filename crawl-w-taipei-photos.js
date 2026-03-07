const { chromium } = require('playwright');
const fs = require('fs');

// 配置：台北W飯店
const VENUE_NAME = '台北W飯店';
const VENUE_URL = 'https://www.marriott.com/hotels/travel/tpegi-w-taipei/';

async function extractVenuePhotos() {
  console.log(`🚀 啟動 ${VENUE_NAME} 圖片提取器...`);
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  const result = {
    venue: VENUE_NAME,
    url: VENUE_URL,
    crawlTime: new Date().toISOString(),
    mainPhoto: null,
    gallery: [],
    allPhotoUrls: []
  };
  
  try {
    // 1. 啟用網絡監聽
    console.log('📡 設置網絡監聽...');
    const imageRequests = [];
    page.on('response', response => {
      const url = response.url();
      const urlLower = url.toLowerCase();
      if ((urlLower.includes('.jpg') || urlLower.includes('.png') || urlLower.includes('.webp')) 
          && !urlLower.includes('data:image')) {
        imageRequests.push({
          url: url,
          status: response.status()
        });
      }
    });
    
    // 2. 訪問頁面
    console.log(`📱 訪問官網: ${VENUE_URL}`);
    await page.goto(VENUE_URL, {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    
    // 3. 等待頁面加載
    console.log('⏳ 等待頁面加載...');
    await page.waitForTimeout(5000);
    
    // 4. 緩慢滾動頁面，觸發所有延遲加載的圖片
    console.log('📜 滾動頁面以觸發圖片加載...');
    await autoScrollSlowly(page);
    
    // 5. 等待所有圖片加載
    await page.waitForTimeout(3000);
    
    // 6. 提取所有已加載的圖片 URL
    console.log('🔍 提取已加載的圖片...');
    const loadedImages = await page.evaluate(() => {
      const images = [];
      
      // 查找所有 picture 元素
      const pictures = Array.from(document.querySelectorAll('picture'));
      pictures.forEach(picture => {
        const sources = Array.from(picture.querySelectorAll('source'));
        sources.forEach(source => {
          const srcset = source.srcset;
          if (srcset && !srcset.includes('data:image')) {
            const urls = srcset.split(',').map(s => s.trim().split(' ')[0]);
            const img = picture.querySelector('img');
            images.push({
              url: urls[urls.length - 1],
              allUrls: urls,
              alt: img ? img.alt : '',
              type: 'picture'
            });
          }
        });
      });
      
      // 查找所有已加載的 img 元素
      const imgs = Array.from(document.querySelectorAll('img'));
      imgs.forEach(img => {
        if (img.src && !img.src.includes('data:image') && !img.src.includes('.svg')) {
          images.push({
            url: img.src,
            alt: img.alt || '',
            width: img.naturalWidth,
            height: img.naturalHeight,
            type: 'img'
          });
        }
      });
      
      // 查找背景圖片
      const allElements = Array.from(document.querySelectorAll('[style*="background-image"]'));
      allElements.forEach(el => {
        const bgImage = window.getComputedStyle(el).backgroundImage;
        if (bgImage && bgImage !== 'none') {
          const match = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
          if (match && match[1] && !match[1].includes('data:image')) {
            images.push({
              url: match[1].split('?')[0],
              fullUrl: match[1],
              type: 'background'
            });
          }
        }
      });
      
      return images;
    });
    
    console.log(`✅ 找到 ${loadedImages.length} 張圖片`);
    
    // 7. 從網絡請求中提取圖片 URL
    console.log(`📡 網絡監聽捕獲 ${imageRequests.length} 個圖片請求`);
    
    // 8. 合併並去重
    const allUrls = new Set();
    
    // 添加從 DOM 提取的 URL
    loadedImages.forEach(img => {
      if (img.url) allUrls.add(img.url.split('?')[0]);
      if (img.allUrls) img.allUrls.forEach(u => allUrls.add(u.split('?')[0]));
      if (img.fullUrl) allUrls.add(img.fullUrl.split('?')[0]);
    });
    
    // 添加從網絡請求捕獲的 URL
    imageRequests.forEach(req => {
      allUrls.add(req.url.split('?')[0]);
    });
    
    // 過濾有效的圖片 URL
    result.allPhotoUrls = Array.from(allUrls).filter(url => 
      (url.includes('.jpg') || url.includes('.png') || url.includes('.webp')) &&
      !url.includes('data:image') &&
      !url.includes('.svg') &&
      !url.includes('logo') &&
      !url.includes('icon') &&
      !url.includes('avatar')
    );
    
    // 9. 識別會議室照片（根據 alt 或關鍵字）
    const meetingKeywords = ['會議', '宴會', 'event', 'meeting', 'ballroom', 'conference', 'banquet', 'grand', '廳', '宴', 'room', 'suite'];
    const meetingPhotos = loadedImages.filter(img => {
      const text = (img.alt || '').toLowerCase();
      return meetingKeywords.some(kw => text.includes(kw));
    });
    
    // 10. 選擇主照片和相冊
    if (meetingPhotos.length > 0) {
      result.mainPhoto = meetingPhotos[0].url;
      result.gallery = meetingPhotos.slice(1, 11).map(img => img.url);
    } else if (result.allPhotoUrls.length > 0) {
      result.mainPhoto = result.allPhotoUrls[0];
      result.gallery = result.allPhotoUrls.slice(1, 11);
    }
    
    // 11. 打印結果
    console.log('\n📊 結果摘要:');
    console.log(`   主照片: ${result.mainPhoto ? '✅' : '❌'}`);
    console.log(`   相冊照片: ${result.gallery.length} 張`);
    console.log(`   所有圖片 URL: ${result.allPhotoUrls.length} 個`);
    
    if (result.allPhotoUrls.length > 0) {
      console.log('\n📸 所有圖片 URL (前 10 個):');
      result.allPhotoUrls.slice(0, 10).forEach((url, i) => {
        console.log(`${i + 1}. ${url}`);
      });
    }
    
    if (result.mainPhoto) {
      console.log(`\n🎯 主照片: ${result.mainPhoto}`);
    }
    
    // 12. 保存結果
    const outputPath = '/root/.openclaw/workspace/w_taipei_photos.json';
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`\n💾 結果已保存到: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ 提取失敗:', error.message);
    result.error = error.message;
  } finally {
    await browser.close();
  }
  
  return result;
}

// 緩慢滾動頁面
async function autoScrollSlowly(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const delay = 150;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          window.scrollTo(0, 0);
          setTimeout(() => {
            window.scrollTo(0, document.body.scrollHeight);
            setTimeout(resolve, 2000);
          }, 1000);
        }
      }, delay);
    });
  });
}

extractVenuePhotos();
