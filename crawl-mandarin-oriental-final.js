const { chromium } = require('playwright');

async function extractRealImageUrls() {
  console.log('🚀 啟動圖片提取器...');
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
    mainHero: null,
    meetingRoomPhotos: [],
    allPhotoUrls: []
  };
  
  try {
    // 1. 啟用網絡監聽
    console.log('📡 設置網絡監聽...');
    const imageRequests = [];
    page.on('response', response => {
      const url = response.url();
      if (url.includes('ffycdn.net') && (url.includes('.jpg') || url.includes('.png') || url.includes('.webp'))) {
        imageRequests.push({
          url: url,
          status: response.status()
        });
      }
    });
    
    // 2. 訪問頁面
    console.log('📱 訪問官網...');
    await page.goto('https://www.mandarinoriental.com/zh-hk/taipei/songshan/meet', {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    
    // 3. 緩慢滾動頁面，觸發所有延遲加載的圖片
    console.log('📜 滾動頁面以觸發圖片加載...');
    await autoScrollSlowly(page);
    
    // 4. 等待所有圖片加載
    await page.waitForTimeout(5000);
    
    // 5. 提取所有已加載的圖片 URL
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
            // 提取最高解析度的 URL
            const urls = srcset.split(',').map(s => s.trim().split(' ')[0]);
            const img = picture.querySelector('img');
            images.push({
              url: urls[urls.length - 1], // 最高解析度
              allUrls: urls,
              alt: img ? img.alt : '',
              type: 'picture'
            });
          }
        });
        
        // 也檢查 background-image
        const bgImage = window.getComputedStyle(picture).backgroundImage;
        if (bgImage && bgImage !== 'none') {
          const match = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
          if (match && match[1] && !match[1].includes('data:image')) {
            const img = picture.querySelector('img');
            images.push({
              url: match[1].split('?')[0], // 移除查詢參數
              fullUrl: match[1],
              alt: img ? img.alt : '',
              type: 'background'
            });
          }
        }
      });
      
      // 查找所有已加載的 img 元素
      const imgs = Array.from(document.querySelectorAll('img'));
      imgs.forEach(img => {
        if (img.src && !img.src.includes('data:image') && !img.src.includes('.svg')) {
          images.push({
            url: img.src,
            alt: img.alt,
            width: img.naturalWidth,
            height: img.naturalHeight,
            type: 'img'
          });
        }
      });
      
      return images;
    });
    
    console.log(`✅ 找到 ${loadedImages.length} 張圖片`);
    
    // 6. 從網絡請求中提取圖片 URL
    console.log(`📡 網絡監聽捕獲 ${imageRequests.length} 個圖片請求`);
    
    // 7. 合併並去重
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
    
    result.allPhotoUrls = Array.from(allUrls).filter(url => 
      url.includes('ffycdn.net') && 
      (url.includes('.jpg') || url.includes('.png') || url.includes('.webp'))
    );
    
    // 8. 識別會議室照片
    result.meetingRoomPhotos = loadedImages.filter(img => {
      const text = img.alt || '';
      return text.includes('會議') || 
             text.includes('宴會') || 
             text.includes('文華') ||
             text.includes('佈置') ||
             text.includes('侍應') ||
             text.includes('接待區');
    });
    
    // 9. 識別主 hero 圖片
    const heroImages = loadedImages.filter(img => img.type === 'background');
    if (heroImages.length > 0) {
      result.mainHero = heroImages[0];
    }
    
    // 10. 打印結果
    console.log('\n📊 結果摘要:');
    console.log(`   主 Hero 圖片: ${result.mainHero ? '✅' : '❌'}`);
    console.log(`   會議室照片: ${result.meetingRoomPhotos.length} 張`);
    console.log(`   所有圖片 URL: ${result.allPhotoUrls.length} 個`);
    
    console.log('\n📸 所有圖片 URL:');
    result.allPhotoUrls.forEach((url, i) => {
      console.log(`${i + 1}. ${url}`);
    });
    
    console.log('\n🎯 會議室照片:');
    result.meetingRoomPhotos.forEach((img, i) => {
      console.log(`${i + 1}. ${img.url}`);
      console.log(`   Alt: ${img.alt}`);
      console.log(`   Type: ${img.type}`);
    });
    
    // 11. 保存結果
    const fs = require('fs');
    const outputPath = '/root/.openclaw/workspace/taiwan-venues/mandarin-oriental-final-photos.json';
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`\n💾 結果已保存到: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ 提取失敗:', error.message);
    console.error(error.stack);
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
      const distance = 50; // 較小的滾動距離
      const delay = 100; // 滾動之間的延遲
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          // 滾動回頂部，再次觸發加載
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

extractRealImageUrls();
