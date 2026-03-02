const { chromium } = require('playwright');
const fs = require('fs');

/**
 * 會議室清單抓取腳本
 * 
 * 功能：
 * 1. 開啟場地官網
 * 2. 尋找會議室頁面
 * 3. 抓取所有會議室名稱和資訊
 * 4. 更新資料庫
 */

async function crawlVenueRooms(browser, venue) {
  const result = {
    id: venue.id,
    name: venue.name,
    url: venue.url,
    rooms: [],
    venueListUrl: null,
    meetingPageUrl: null,
    status: '驗證中',
    error: null
  };
  
  console.log(`\n[${venue.id}] ${venue.name}`);
  console.log('URL:', venue.url);
  
  const page = await browser.newPage();
  
  try {
    // Phase 1: 開啟官網
    console.log('  Phase 1: 開啟官網...');
    await page.goto(venue.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const title = await page.title();
    console.log('  標題:', title);
    
    // Phase 2: 尋找會議室頁面
    console.log('  Phase 2: 尋找會議室頁面...');
    
    const meetingKeywords = ['會議', '宴會', '場地', '租借', '活動', '空間', '設施',
                             'meeting', 'conference', 'venue', 'banquet', 'event', 'space', 'room'];
    
    const links = await page.evaluate((keywords) => {
      const results = [];
      document.querySelectorAll('a').forEach(a => {
        const text = (a.textContent || '').toLowerCase();
        const href = a.href || '';
        if (keywords.some(k => text.includes(k) || href.includes(k))) {
          results.push({
            text: (a.textContent || '').trim().slice(0, 100),
            href
          });
        }
      });
      return results.filter(l => l.href && l.href.startsWith('http')).slice(0, 10);
    }, meetingKeywords);
    
    if (links.length === 0) {
      console.log('  ⚠️ 找不到會議室頁面');
      result.status = '找不到會議室頁面';
      await page.close();
      return result;
    }
    
    console.log(`  找到 ${links.length} 個可能的會議室頁面`);
    result.meetingPageUrl = links[0].href;
    
    // Phase 3: 開啟會議室頁面，抓取會議室清單
    console.log('  Phase 3: 開啟會議室頁面...');
    await page.goto(links[0].href, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3000);
    
    result.venueListUrl = links[0].href;
    
    // 滾動頁面觸發載入
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    
    // Phase 4: 抓取會議室清單
    console.log('  Phase 4: 抓取會議室清單...');
    
    const roomsData = await page.evaluate(() => {
      const rooms = [];
      
      // 方法 1: 尋找列表項目
      document.querySelectorAll('li, .room, .venue, .meeting-room, .conference-room, [class*="room"], [class*="venue"]').forEach(el => {
        const text = (el.textContent || '').trim();
        if (text.length > 2 && text.length < 100) {
          // 過濾掉明顯不是會議室名稱的文字
          if (!text.includes('首頁') && !text.includes('聯絡') && !text.includes('關於')) {
            rooms.push({ name: text.slice(0, 50), source: 'list' });
          }
        }
      });
      
      // 方法 2: 尋找標題
      document.querySelectorAll('h1, h2, h3, h4, h5').forEach(el => {
        const text = (el.textContent || '').trim();
        if (text.length > 2 && text.length < 50) {
          if (text.includes('廳') || text.includes('室') || text.includes('會議') || 
              text.includes('Room') || text.includes('Hall')) {
            rooms.push({ name: text, source: 'heading' });
          }
        }
      });
      
      // 方法 3: 尋找表格
      document.querySelectorAll('table tr').forEach(tr => {
        const cells = tr.querySelectorAll('td');
        if (cells.length >= 2) {
          const name = (cells[0].textContent || '').trim();
          const capacity = (cells[1].textContent || '').trim();
          if (name.length > 0 && name.length < 50) {
            rooms.push({ 
              name, 
              capacity: capacity.replace(/[^0-9]/g, ''),
              source: 'table' 
            });
          }
        }
      });
      
      // 去重
      const seen = new Set();
      return rooms.filter(r => {
        if (seen.has(r.name)) return false;
        seen.add(r.name);
        return true;
      }).slice(0, 20);
    });
    
    if (roomsData.length > 0) {
      console.log(`  ✅ 找到 ${roomsData.length} 個會議室`);
      roomsData.forEach((r, i) => {
        console.log(`    ${i + 1}. ${r.name}${r.capacity ? ` (${r.capacity}人)` : ''}`);
      });
      result.rooms = roomsData;
      result.status = 'OK';
    } else {
      console.log('  ⚠️ 未找到會議室清單');
      result.status = '未找到會議室清單';
    }
    
  } catch (e) {
    console.log('  ❌ 錯誤:', e.message.slice(0, 80));
    result.status = '錯誤';
    result.error = e.message;
  }
  
  await page.close();
  return result;
}

// 主程式
async function main() {
  const data = JSON.parse(fs.readFileSync('venues-all-cities.json', 'utf8'));
  
  // 取得需要補充會議室清單的台北市場地
  const toVerify = data.filter(v => 
    v.city === '台北市' && 
    v.status === '上架' && 
    !v.roomName.includes('廳') && // 排除已經有具體會議室名稱的
    v.id !== 1118 // 排除政大公企中心（網站無法連線）
  ).slice(0, 10); // 先處理 10 個
  
  console.log('=== 台北市會議室清單抓取 ===');
  console.log('待處理場地數:', toVerify.length);
  
  const browser = await chromium.launch({ headless: true });
  const results = [];
  
  for (const venue of toVerify) {
    const result = await crawlVenueRooms(browser, venue);
    results.push(result);
    
    // 間隔
    await new Promise(r => setTimeout(r, 2000));
  }
  
  await browser.close();
  
  // 統計
  console.log('\n=== 統計 ===');
  const ok = results.filter(r => r.status === 'OK').length;
  const noRooms = results.filter(r => r.status === '未找到會議室清單').length;
  const noPage = results.filter(r => r.status === '找不到會議室頁面').length;
  const error = results.filter(r => r.status === '錯誤').length;
  
  console.log('找到會議室清單:', ok);
  console.log('未找到會議室清單:', noRooms);
  console.log('找不到會議室頁面:', noPage);
  console.log('錯誤:', error);
  
  // 儲存結果
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  fs.writeFileSync(`taipei-rooms-crawl-${timestamp}.json`, JSON.stringify(results, null, 2));
  console.log(`\n結果已儲存到 taipei-rooms-crawl-${timestamp}.json`);
}

main();
