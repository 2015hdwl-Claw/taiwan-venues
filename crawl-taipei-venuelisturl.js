const { chromium } = require('playwright');
const fs = require('fs');

// 台北市需要補充 venueListUrl 的場地
const data = JSON.parse(fs.readFileSync('venues-all-cities.json', 'utf8'));
const toProcess = data.filter(v => 
  v.city === '台北市' && 
  v.status === '上架' && 
  !v.venueListUrl
);

console.log('=== 台北市 venueListUrl 補充 ===');
console.log('待處理場地數:', toProcess.length);

// 按場地分組（同一官網只處理一次）
const venueGroups = {};
toProcess.forEach(v => {
  const key = v.url || v.name;
  if (!venueGroups[key]) {
    venueGroups[key] = {
      url: v.url,
      name: v.name,
      ids: []
    };
  }
  venueGroups[key].ids.push(v.id);
});

const uniqueVenues = Object.values(venueGroups);
console.log('唯一官網數:', uniqueVenues.length);

async function crawlVenue(browser, venue) {
  const page = await browser.newPage();
  const result = {
    url: venue.url,
    name: venue.name,
    ids: venue.ids,
    venueListUrl: null,
    venueMainImageUrl: null,
    rooms: [],
    error: null
  };
  
  console.log(`\n[${venue.ids[0]}] ${venue.name}`);
  console.log('URL:', venue.url);
  
  try {
    await page.goto(venue.url, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(3000);
    
    const title = await page.title();
    
    // 尋找會議室相關連結
    const meetingKeywords = ['會議', '宴會', '場地', '租借', '活動', '空間', '設施',
                             'meeting', 'conference', 'venue', 'banquet', 'event', 'space', 'room'];
    
    const links = await page.evaluate((keywords) => {
      const results = [];
      document.querySelectorAll('a').forEach(a => {
        const text = (a.textContent || '').toLowerCase();
        const href = a.href || '';
        if (keywords.some(k => text.includes(k) || href.includes(k))) {
          results.push({
            text: (a.textContent || '').trim().slice(0, 80),
            href
          });
        }
      });
      return results.filter(l => l.href && l.href.startsWith('http')).slice(0, 15);
    }, meetingKeywords);
    
    // 優先尋找特定模式的會議室頁面
    const roomPagePatterns = [
      '/venue/room-info/',
      '/venue/conference',
      '/page/room',
      '/meeting',
      '/venue',
      '/space',
      '/conference',
      '/banquet'
    ];
    
    let foundRoomPage = null;
    for (const pattern of roomPagePatterns) {
      const match = links.find(l => l.href.toLowerCase().includes(pattern));
      if (match) {
        foundRoomPage = match;
        break;
      }
    }
    
    if (!foundRoomPage && links.length > 0) {
      foundRoomPage = links[0];
    }
    
    if (foundRoomPage) {
      console.log('  會議室頁面:', foundRoomPage.href);
      result.venueListUrl = foundRoomPage.href;
      
      // 開啟會議室頁面
      await page.goto(foundRoomPage.href, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000);
      
      // 尋找場地主照片
      const images = await page.evaluate(() => {
        const results = [];
        document.querySelectorAll('img').forEach(img => {
          if (img.src && img.width > 300 && img.height > 200) {
            results.push({
              src: img.src,
              width: img.width,
              height: img.height
            });
          }
        });
        return results.slice(0, 5);
      });
      
      if (images.length > 0) {
        result.venueMainImageUrl = images[0].src;
        console.log('  場地照片:', images[0].src.slice(0, 60) + '...');
      }
      
      // 尋找會議室清單
      const rooms = await page.evaluate(() => {
        const results = [];
        const seen = new Set();
        
        // 尋找表格
        document.querySelectorAll('table tr').forEach(tr => {
          const cells = tr.querySelectorAll('td, th');
          if (cells.length >= 2) {
            const name = (cells[0].textContent || '').trim();
            if (name.length > 2 && name.length < 50 && !seen.has(name)) {
              // 過濾導航元素
              const excludeKeywords = ['展會活動', '站內搜尋', '與我聯繫', '360°環景圖', '首頁', '下載', 'EN', '服務'];
              if (!excludeKeywords.some(k => name.includes(k))) {
                seen.add(name);
                results.push({ name });
              }
            }
          }
        });
        
        // 尋找包含「人」的容納人數
        document.querySelectorAll('*').forEach(el => {
          const text = (el.textContent || '').trim();
          if (text.match(/^\d+人$/) && text.length < 10) {
            // 往上找會議室名稱
            let parent = el.parentElement;
            for (let i = 0; i < 3 && parent; i++) {
              const parentText = (parent.textContent || '').trim();
              const lines = parentText.split('\n').filter(l => l.trim().length > 2 && l.trim().length < 50);
              for (const line of lines) {
                const trimmed = line.trim();
                if ((trimmed.includes('廳') || trimmed.includes('室') || trimmed.includes('會議')) 
                    && !seen.has(trimmed)) {
                  seen.add(trimmed);
                  results.push({ name: trimmed });
                }
              }
              parent = parent.parentElement;
            }
          }
        });
        
        return results.slice(0, 10);
      });
      
      if (rooms.length > 0) {
        console.log('  會議室:', rooms.map(r => r.name).join(', '));
        result.rooms = rooms;
      }
    } else {
      console.log('  ⚠️ 找不到會議室頁面');
      result.error = '找不到會議室頁面';
    }
    
  } catch (e) {
    console.log('  ❌ 錯誤:', e.message.slice(0, 60));
    result.error = e.message;
  }
  
  await page.close();
  return result;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  
  // 處理前 20 個場地
  const batch = uniqueVenues.slice(0, 20);
  
  for (const venue of batch) {
    const result = await crawlVenue(browser, venue);
    results.push(result);
    
    // 更新資料庫
    if (result.venueListUrl) {
      data.forEach(v => {
        if (result.ids.includes(v.id)) {
          v.venueListUrl = result.venueListUrl;
          if (result.venueMainImageUrl) {
            v.venueMainImageUrl = result.venueMainImageUrl;
          }
          v.lastVerified = new Date().toISOString();
        }
      });
    }
    
    // 間隔
    await new Promise(r => setTimeout(r, 1500));
  }
  
  await browser.close();
  
  // 統計
  console.log('\n=== 統計 ===');
  console.log('處理場地數:', results.length);
  console.log('找到 venueListUrl:', results.filter(r => r.venueListUrl).length);
  console.log('找到 venueMainImageUrl:', results.filter(r => r.venueMainImageUrl).length);
  
  // 儲存
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  fs.writeFileSync(`taipei-venuelisturl-batch-${timestamp}.json`, JSON.stringify(results, null, 2));
  fs.writeFileSync('venues-all-cities.json', JSON.stringify(data, null, 2));
  console.log('\n資料已儲存');
}

main();
