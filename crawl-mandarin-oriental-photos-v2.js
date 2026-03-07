const { chromium } = require('playwright');

async function crawlMandarinOrientalPhotosV2() {
  console.log('🚀 啟動瀏覽器...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  const photos = {
    mainPage: [],
    grandBallroom: [],
    mandarinBallroom: [],
    orientalRooms: [],
    allHighRes: []
  };
  
  try {
    // 1. 訪問主頁面
    console.log('📱 訪問官網主頁...');
    await page.goto('https://www.mandarinoriental.com/zh-hk/taipei/songshan/meet', {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    
    // 滾動頁面以觸發延遲加載
    console.log('📜 滾動頁面...');
    await autoScroll(page);
    
    // 2. 提取所有高解析度圖片 URL
    console.log('🔍 提取高解析度圖片...');
    const images = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.map(img => {
        // 優先使用 srcset 中的高解析度圖片
        let src = img.srcset ? img.srcset.split(',').pop().trim().split(' ')[0] : null;
        if (!src || src.includes('data:image')) {
          src = img.src;
        }
        // 檢查 data-src
        if (!src || src.includes('data:image')) {
          src = img.getAttribute('data-src');
        }
        // 檢查 data-lazy-src
        if (!src || src.includes('data:image')) {
          src = img.getAttribute('data-lazy-src');
        }
        // 檢查 background-image
        if (!src || src.includes('data:image')) {
          const bgImage = window.getComputedStyle(img).backgroundImage;
          if (bgImage && bgImage !== 'none') {
            const match = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
            if (match) src = match[1];
          }
        }
        
        return {
          src: src && !src.includes('data:image') ? src : null,
          alt: img.alt,
          width: img.naturalWidth,
          height: img.naturalHeight,
          className: img.className
        };
      }).filter(img => img.src && img.src.includes('http'));
    });
    
    console.log(`✅ 找到 ${images.length} 張高解析度圖片`);
    photos.mainPage = images;
    
    // 3. 查找並訪問各個會議室的詳細頁面
    const roomPages = [
      {
        name: 'Grand Ballroom',
        url: 'https://www.mandarinoriental.com/en/taipei/songshan/meet/grand-ballroom'
      },
      {
        name: 'Mandarin Ballroom',
        url: 'https://www.mandarinoriental.com/en/taipei/songshan/meet/mandarin-ballroom'
      },
      {
        name: 'Oriental Rooms',
        url: 'https://www.mandarinoriental.com/en/taipei/songshan/meet/oriental-rooms'
      }
    ];
    
    for (const room of roomPages) {
      try {
        console.log(`\n📄 訪問 ${room.name}...`);
        await page.goto(room.url, {
          waitUntil: 'networkidle',
          timeout: 30000
        });
        
        await autoScroll(page);
        await page.waitForTimeout(2000);
        
        const roomImages = await page.evaluate(() => {
          const imgs = Array.from(document.querySelectorAll('img'));
          return imgs.map(img => {
            let src = img.srcset ? img.srcset.split(',').pop().trim().split(' ')[0] : null;
            if (!src || src.includes('data:image')) {
              src = img.src;
            }
            if (!src || src.includes('data:image')) {
              src = img.getAttribute('data-src');
            }
            
            return {
              src: src && !src.includes('data:image') ? src : null,
              alt: img.alt,
              width: img.naturalWidth,
              height: img.naturalHeight
            };
          }).filter(img => img.src && img.src.includes('http'));
        });
        
        console.log(`   ✅ 找到 ${roomImages.length} 張圖片`);
        photos[room.name === 'Grand Ballroom' ? 'grandBallroom' : 
               room.name === 'Mandarin Ballroom' ? 'mandarinBallroom' : 'orientalRooms'] = roomImages;
        
      } catch (error) {
        console.log(`   ❌ 訪問失敗: ${error.message}`);
      }
    }
    
    // 4. 提取所有唯一的高解析度圖片
    const allImages = [
      ...photos.mainPage,
      ...photos.grandBallroom,
      ...photos.mandarinBallroom,
      ...photos.orientalRooms
    ];
    
    const uniqueImages = [...new Set(allImages.map(img => img.src))];
    photos.allHighRes = uniqueImages.map(src => {
      const img = allImages.find(i => i.src === src);
      return {
        src: src,
        alt: img.alt,
        width: img.width,
        height: img.height
      };
    });
    
    console.log(`\n📊 總計找到 ${photos.allHighRes.length} 張唯一的高解析度圖片`);
    
    // 5. 截圖
    console.log('\n📸 保存截圖...');
    await page.goto('https://www.mandarinoriental.com/zh-hk/taipei/songshan/meet', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.screenshot({
      path: '/root/.openclaw/workspace/taiwan-venues/mandarin-oriental-meetings-v2.png',
      fullPage: true
    });
    console.log('   ✅ 截圖已保存');
    
  } catch (error) {
    console.error('❌ 爬取失敗:', error.message);
  } finally {
    await browser.close();
  }
  
  // 6. 保存結果
  const fs = require('fs');
  const outputPath = '/root/.openclaw/workspace/taiwan-venues/mandarin-oriental-photos-v2.json';
  fs.writeFileSync(outputPath, JSON.stringify(photos, null, 2));
  console.log(`\n💾 結果已保存到: ${outputPath}`);
  
  // 7. 打印摘要
  console.log('\n📋 照片摘要:');
  console.log(`   主頁面: ${photos.mainPage.length} 張`);
  console.log(`   大宴會廳: ${photos.grandBallroom.length} 張`);
  console.log(`   文華廳: ${photos.mandarinBallroom.length} 張`);
  console.log(`   東方廳: ${photos.orientalRooms.length} 張`);
  console.log(`   總計: ${photos.allHighRes.length} 張唯一圖片`);
  
  return photos;
}

// 自動滾動頁面
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

crawlMandarinOrientalPhotosV2();
