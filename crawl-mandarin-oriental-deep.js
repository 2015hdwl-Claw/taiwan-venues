const { chromium } = require('playwright');

async function deepCrawlMandarinOriental() {
  console.log('🚀 啟動深度爬蟲...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  const photos = {
    meetingRooms: [],
    allImageUrls: []
  };
  
  try {
    // 1. 訪問主頁面
    console.log('📱 訪問官網...');
    await page.goto('https://www.mandarinoriental.com/zh-hk/taipei/songshan/meet', {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    
    // 等待頁面完全加載
    await page.waitForTimeout(3000);
    
    // 2. 獲取頁面的完整 HTML
    console.log('🔍 分析頁面結構...');
    const html = await page.content();
    
    // 3. 使用正則表達式提取所有圖片 URL
    const imageUrlPatterns = [
      /https?:\/\/[^\s"'<>]+?\.(?:jpg|jpeg|png|webp|gif)/gi,
      /https?:\/\/media\.ffycdn\.net\/[^\s"'<>]+/gi,
      /https?:\/\/[^\s"'<>]+?ffycdn[^\s"'<>]+/gi
    ];
    
    const allUrls = new Set();
    for (const pattern of imageUrlPatterns) {
      const matches = html.match(pattern) || [];
      matches.forEach(url => allUrls.add(url));
    }
    
    photos.allImageUrls = Array.from(allUrls).filter(url => 
      !url.includes('logo') && 
      !url.includes('icon') &&
      !url.includes('.svg')
    );
    
    console.log(`✅ 找到 ${photos.allImageUrls.length} 個圖片 URL`);
    
    // 4. 提取所有圖片元素的完整信息
    console.log('📸 提取圖片元素...');
    const imageElements = await page.evaluate(() => {
      const allImages = [];
      
      // 查找所有圖片元素
      const imgs = Array.from(document.querySelectorAll('img'));
      imgs.forEach(img => {
        const info = {
          src: img.src,
          srcset: img.srcset,
          dataSrc: img.getAttribute('data-src'),
          dataSrcset: img.getAttribute('data-srcset'),
          dataLazy: img.getAttribute('data-lazy'),
          dataOriginal: img.getAttribute('data-original'),
          alt: img.alt,
          className: img.className,
          parent: img.parentElement?.className || '',
          width: img.naturalWidth,
          height: img.naturalHeight
        };
        
        // 提取所有可能的圖片 URL
        const urls = [];
        if (info.src && !info.src.includes('data:image')) urls.push(info.src);
        if (info.srcset) {
          info.srcset.split(',').forEach(s => {
            const url = s.trim().split(' ')[0];
            if (url && !url.includes('data:image')) urls.push(url);
          });
        }
        if (info.dataSrc && !info.dataSrc.includes('data:image')) urls.push(info.dataSrc);
        if (info.dataSrcset) {
          info.dataSrcset.split(',').forEach(s => {
            const url = s.trim().split(' ')[0];
            if (url && !url.includes('data:image')) urls.push(url);
          });
        }
        if (info.dataOriginal && !info.dataOriginal.includes('data:image')) urls.push(info.dataOriginal);
        
        info.urls = urls;
        allImages.push(info);
      });
      
      // 查找背景圖片
      const allElements = Array.from(document.querySelectorAll('*'));
      allElements.forEach(el => {
        const bgImage = window.getComputedStyle(el).backgroundImage;
        if (bgImage && bgImage !== 'none') {
          const match = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
          if (match && match[1] && !match[1].includes('data:image')) {
            allImages.push({
              src: match[1],
              type: 'background',
              className: el.className
            });
          }
        }
      });
      
      return allImages;
    });
    
    // 5. 過濾出會議室相關的照片
    console.log('🎯 識別會議室照片...');
    const meetingKeywords = [
      'meeting', 'conference', 'ballroom', 'event', 'venue',
      '會議', '宴會', '文華', '東方', '活動', '場地'
    ];
    
    const meetingImages = imageElements.filter(img => {
      const text = `${img.alt} ${img.className} ${img.parent}`.toLowerCase();
      return meetingKeywords.some(keyword => text.includes(keyword.toLowerCase()));
    });
    
    console.log(`✅ 找到 ${meetingImages.length} 張可能的會議室照片`);
    photos.meetingRooms = meetingImages;
    
    // 6. 打印所有找到的 URL
    console.log('\n📋 所有圖片 URL:');
    photos.allImageUrls.forEach((url, i) => {
      console.log(`${i + 1}. ${url}`);
    });
    
    // 7. 保存完整結果
    const fs = require('fs');
    const outputPath = '/root/.openclaw/workspace/taiwan-venues/mandarin-oriental-deep-analysis.json';
    fs.writeFileSync(outputPath, JSON.stringify(photos, null, 2));
    console.log(`\n💾 結果已保存到: ${outputPath}`);
    
    // 8. 保存 HTML 供參考
    const htmlPath = '/root/.openclaw/workspace/taiwan-venues/mandarin-oriental-page.html';
    fs.writeFileSync(htmlPath, html);
    console.log(`📄 HTML 已保存到: ${htmlPath}`);
    
  } catch (error) {
    console.error('❌ 爬取失敗:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
  
  return photos;
}

deepCrawlMandarinOriental();
