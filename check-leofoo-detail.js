const { chromium } = require('playwright');

async function checkVenue() {
  console.log('=== 台北六福客棧詳細檢查 ===\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // 1. 開啟官網首頁
    console.log('1. 檢查官網首頁...');
    await page.goto('https://www.leofoo.com.tw', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);
    
    // 搜尋會議室相關連結
    const links = await page.evaluate(() => {
      const allLinks = Array.from(document.querySelectorAll('a'));
      return allLinks
        .filter(a => a.href && (
          a.href.includes('meeting') || 
          a.href.includes('conference') || 
          a.href.includes('venue') ||
          a.href.includes('banquet') ||
          a.textContent.includes('會議') ||
          a.textContent.includes('宴會')
        ))
        .map(a => ({
          text: a.textContent.trim(),
          href: a.href
        }))
        .slice(0, 10);
    });
    
    console.log('找到會議室相關連結:', links.length, '個');
    links.forEach((link, i) => {
      console.log(`  ${i+1}. ${link.text} → ${link.href}`);
    });
    
    // 2. 嘗試開啟會議室頁面
    if (links.length > 0) {
      console.log('\n2. 開啟會議室頁面...');
      const meetingUrl = links[0].href;
      console.log('連結:', meetingUrl);
      
      await page.goto(meetingUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(2000);
      
      // 檢查會議室資訊
      const meetingInfo = await page.evaluate(() => {
        const text = document.body.innerText;
        
        // 尋找價格
        const priceMatch = text.match(/(\d{1,3}(,\d{3})*)\s*元/);
        
        // 尋找人數
        const capacityMatch = text.match(/(\d+)\s*(人|位|桌)/);
        
        // 尋找會議室名稱
        const roomNames = [];
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4'));
        headings.forEach(h => {
          if (h.textContent.includes('廳') || h.textContent.includes('室')) {
            roomNames.push(h.textContent.trim());
          }
        });
        
        // 尋找照片
        const photos = Array.from(document.querySelectorAll('img'))
          .filter(img => img.src && img.width > 100)
          .map(img => img.src)
          .slice(0, 5);
        
        return {
          roomNames,
          price: priceMatch ? priceMatch[0] : null,
          capacity: capacityMatch ? capacityMatch[0] : null,
          photos,
          pageTitle: document.title
        };
      });
      
      console.log('\n會議室資訊：');
      console.log('  頁面標題:', meetingInfo.pageTitle);
      console.log('  會議室名稱:', meetingInfo.roomNames.join(', ') || '未找到');
      console.log('  價格:', meetingInfo.price || '未找到');
      console.log('  容納人數:', meetingInfo.capacity || '未找到');
      console.log('  照片:', meetingInfo.photos.length, '張');
      if (meetingInfo.photos.length > 0) {
        meetingInfo.photos.forEach((p, i) => {
          console.log(`    ${i+1}. ${p.slice(0, 80)}...`);
        });
      }
    }
    
  } catch (err) {
    console.log('錯誤:', err.message);
  }
  
  await browser.close();
  console.log('\n檢查完成');
}

checkVenue();
