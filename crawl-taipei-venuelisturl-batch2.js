const { chromium } = require('playwright');
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('venues-all-cities.json', 'utf8'));
const toProcess = data.filter(v => 
  v.city === '台北市' && 
  v.status === '上架' && 
  !v.venueListUrl
);

console.log('=== 台北市 venueListUrl 補充（批次 2）===');
console.log('待處理場地數:', toProcess.length);

// 按場地分組
const venueGroups = {};
toProcess.forEach(v => {
  const key = v.url || v.name;
  if (!venueGroups[key]) {
    venueGroups[key] = { url: v.url, name: v.name, ids: [] };
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
    
    const meetingKeywords = ['會議', '宴會', '場地', '租借', '活動', '空間', '設施',
                             'meeting', 'conference', 'venue', 'banquet', 'event', 'space', 'room'];
    
    const links = await page.evaluate((keywords) => {
      const results = [];
      document.querySelectorAll('a').forEach(a => {
        const text = (a.textContent || '').toLowerCase();
        const href = a.href || '';
        if (keywords.some(k => text.includes(k) || href.includes(k))) {
          results.push({ text: (a.textContent || '').trim().slice(0, 80), href });
        }
      });
      return results.filter(l => l.href && l.href.startsWith('http')).slice(0, 15);
    }, meetingKeywords);
    
    const roomPagePatterns = [
      '/venue/room-info/', '/venue/conference', '/page/room', '/meeting',
      '/venue', '/space', '/conference', '/banquet', '/event', '/function'
    ];
    
    let foundRoomPage = null;
    for (const pattern of roomPagePatterns) {
      const match = links.find(l => l.href.toLowerCase().includes(pattern));
      if (match) { foundRoomPage = match; break; }
    }
    if (!foundRoomPage && links.length > 0) foundRoomPage = links[0];
    
    if (foundRoomPage) {
      console.log('  會議室頁面:', foundRoomPage.href);
      result.venueListUrl = foundRoomPage.href;
      
      await page.goto(foundRoomPage.href, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000);
      
      const images = await page.evaluate(() => {
        const results = [];
        document.querySelectorAll('img').forEach(img => {
          if (img.src && img.width > 300 && img.height > 200) {
            results.push({ src: img.src, width: img.width, height: img.height });
          }
        });
        return results.slice(0, 5);
      });
      
      if (images.length > 0) {
        result.venueMainImageUrl = images[0].src;
        console.log('  場地照片:', images[0].src.slice(0, 60) + '...');
      }
      
      const rooms = await page.evaluate(() => {
        const results = [];
        const seen = new Set();
        const excludeKeywords = ['展會活動', '站內搜尋', '與我聯繫', '360°環景圖', '首頁', '下載', 'EN', '服務'];
        
        document.querySelectorAll('table tr').forEach(tr => {
          const cells = tr.querySelectorAll('td, th');
          if (cells.length >= 2) {
            const name = (cells[0].textContent || '').trim();
            if (name.length > 2 && name.length < 50 && !seen.has(name)) {
              if (!excludeKeywords.some(k => name.includes(k))) {
                seen.add(name);
                results.push({ name });
              }
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
  
  // 處理 21-40 個場地
  const batch = uniqueVenues.slice(0, 20);
  
  for (const venue of batch) {
    const result = await crawlVenue(browser, venue);
    results.push(result);
    
    if (result.venueListUrl) {
      data.forEach(v => {
        if (result.ids.includes(v.id)) {
          v.venueListUrl = result.venueListUrl;
          if (result.venueMainImageUrl) v.venueMainImageUrl = result.venueMainImageUrl;
          v.lastVerified = new Date().toISOString();
        }
      });
    }
    
    await new Promise(r => setTimeout(r, 1500));
  }
  
  await browser.close();
  
  console.log('\n=== 統計 ===');
  console.log('處理場地數:', results.length);
  console.log('找到 venueListUrl:', results.filter(r => r.venueListUrl).length);
  console.log('找到 venueMainImageUrl:', results.filter(r => r.venueMainImageUrl).length);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  fs.writeFileSync(`taipei-venuelisturl-batch2-${timestamp}.json`, JSON.stringify(results, null, 2));
  fs.writeFileSync('venues-all-cities.json', JSON.stringify(data, null, 2));
  console.log('\n資料已儲存');
}

main();
