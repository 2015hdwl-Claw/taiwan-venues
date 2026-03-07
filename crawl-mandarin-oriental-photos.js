const { chromium } = require('playwright');

async function crawlMandarinOrientalPhotos() {
  console.log('🚀 啟動瀏覽器...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  const photos = {
    mainRooms: {},
    allPhotos: [],
    roomDetails: []
  };
  
  try {
    // 1. 訪問主頁面
    console.log('📱 訪問官網主頁...');
    await page.goto('https://www.mandarinoriental.com/zh-hk/taipei/songshan/meet', {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    
    // 2. 提取所有圖片 URL
    console.log('🔍 提取圖片 URL...');
    const images = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.map(img => ({
        src: img.src,
        alt: img.alt,
        className: img.className,
        parent: img.parentElement?.className || ''
      })).filter(img => img.src && !img.src.includes('logo') && !img.src.includes('icon'));
    });
    
    console.log(`✅ 找到 ${images.length} 張圖片`);
    photos.allPhotos = images;
    
    // 3. 查找會議室相關的鏈接
    console.log('🔗 查找會議室頁面...');
    const meetingLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links
        .filter(link => {
          const href = link.href || '';
          const text = link.textContent || '';
          return href.includes('meet') || 
                 href.includes('event') || 
                 href.includes('venue') ||
                 text.includes('宴會廳') ||
                 text.includes('文華廳') ||
                 text.includes('東方廳');
        })
        .map(link => ({
          href: link.href,
          text: link.textContent.trim()
        }));
    });
    
    console.log(`✅ 找到 ${meetingLinks.length} 個相關鏈接`);
    
    // 4. 訪問各個會議室頁面
    for (const link of meetingLinks) {
      try {
        console.log(`\n📄 訪問: ${link.text || link.href}`);
        await page.goto(link.href, {
          waitUntil: 'networkidle',
          timeout: 30000
        });
        
        await page.waitForTimeout(2000);
        
        const roomImages = await page.evaluate(() => {
          const imgs = Array.from(document.querySelectorAll('img'));
          return imgs.map(img => ({
            src: img.src,
            alt: img.alt,
            className: img.className
          })).filter(img => img.src && img.src.includes('http'));
        });
        
        photos.roomDetails.push({
          room: link.text || link.href,
          url: link.href,
          images: roomImages
        });
        
        console.log(`   ✅ 找到 ${roomImages.length} 張圖片`);
      } catch (error) {
        console.log(`   ❌ 訪問失敗: ${error.message}`);
      }
    }
    
    // 5. 特別查找大宴會廳、文華廳、東方廳的頁面
    const specificRooms = [
      'https://www.mandarinoriental.com/zh-hk/taipei/songshan/meet/grand-ballroom',
      'https://www.mandarinoriental.com/zh-hk/taipei/songshan/meet/mandarin-ballroom',
      'https://www.mandarinoriental.com/zh-hk/taipei/songshan/meet/oriental-rooms'
    ];
    
    for (const roomUrl of specificRooms) {
      try {
        console.log(`\n📄 訪問特定會議室: ${roomUrl}`);
        await page.goto(roomUrl, {
          waitUntil: 'networkidle',
          timeout: 30000
        });
        
        await page.waitForTimeout(2000);
        
        const roomName = await page.evaluate(() => {
          const h1 = document.querySelector('h1');
          return h1 ? h1.textContent.trim() : 'Unknown';
        });
        
        const heroImage = await page.evaluate(() => {
          const heroImg = document.querySelector('.hero-image img, .banner img, .full-width-image img');
          return heroImg ? heroImg.src : null;
        });
        
        const allRoomImages = await page.evaluate(() => {
          const imgs = Array.from(document.querySelectorAll('img'));
          return imgs.map(img => ({
            src: img.src,
            alt: img.alt,
            className: img.className
          })).filter(img => img.src && img.src.includes('http'));
        });
        
        photos.mainRooms[roomName] = {
          url: roomUrl,
          heroImage: heroImage,
          allImages: allRoomImages
        };
        
        console.log(`   ✅ ${roomName}: ${allRoomImages.length} 張圖片`);
        if (heroImage) {
          console.log(`   📸 主圖: ${heroImage}`);
        }
      } catch (error) {
        console.log(`   ❌ 訪問失敗: ${error.message}`);
      }
    }
    
    // 6. 截圖保存當前頁面
    console.log('\n📸 保存截圖...');
    await page.goto('https://www.mandarinoriental.com/zh-hk/taipei/songshan/meet', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.screenshot({
      path: '/root/.openclaw/workspace/taiwan-venues/mandarin-oriental-meetings.png',
      fullPage: true
    });
    console.log('   ✅ 截圖已保存');
    
  } catch (error) {
    console.error('❌ 爬取失敗:', error.message);
  } finally {
    await browser.close();
  }
  
  // 7. 保存結果
  const fs = require('fs');
  const outputPath = '/root/.openclaw/workspace/taiwan-venues/mandarin-oriental-photos.json';
  fs.writeFileSync(outputPath, JSON.stringify(photos, null, 2));
  console.log(`\n💾 結果已保存到: ${outputPath}`);
  
  return photos;
}

crawlMandarinOrientalPhotos();
