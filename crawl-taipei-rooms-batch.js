const { chromium } = require('playwright');
const fs = require('fs');

// 台北市待處理場地
const toProcess = JSON.parse(fs.readFileSync('taipei-rooms-to-process.json', 'utf8'));

console.log('=== 台北市會議室清單批次抓取 ===');
console.log('待處理場地數:', toProcess.length);
console.log('');

async function crawlVenue(browser, venue) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[${venue.id}] ${venue.name}`);
  console.log('URL:', venue.url);
  
  const page = await browser.newPage();
  const result = {
    id: venue.id,
    name: venue.name,
    url: venue.url,
    rooms: [],
    venueListUrl: null,
    error: null
  };
  
  try {
    // 開啟官網
    await page.goto(venue.url, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(3000);
    
    const title = await page.title();
    console.log('標題:', title);
    
    // 尋找會議室相關連結
    const meetingKeywords = ['會議', '宴會', '場地', '租借', '活動', '空間', '設施', '廳',
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
      console.log('⚠️ 找不到會議室頁面');
      result.error = '找不到會議室頁面';
      await page.close();
      return result;
    }
    
    console.log(`找到 ${links.length} 個可能的會議室頁面`);
    
    // 嘗試開啟會議室頁面
    for (const link of links.slice(0, 3)) {
      try {
        console.log('嘗試:', link.text.slice(0, 30), '|', link.href.slice(0, 50));
        await page.goto(link.href, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForTimeout(3000);
        
        // 滾動頁面
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(2000);
        
        result.venueListUrl = link.href;
        
        // 抓取會議室清單
        const rooms = await page.evaluate(() => {
          const results = [];
          
          // 方法 1: 尋找包含「人」的容納人數
          const capacityPattern = /(\d+)\s*人/;
          const seen = new Set();
          
          // 尋找場地卡片
          document.querySelectorAll('*').forEach(el => {
            const text = (el.textContent || '').trim();
            
            // 檢查是否包含容納人數
            const match = text.match(capacityPattern);
            if (match && text.length < 300) {
              // 嘗試找出會議室名稱
              const lines = text.split('\n').filter(l => l.trim());
              for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.length > 3 && trimmed.length < 80 && 
                    !seen.has(trimmed) &&
                    (trimmed.includes('廳') || trimmed.includes('室') || 
                     trimmed.includes('會議') || trimmed.includes('場') ||
                     trimmed.includes('Room') || trimmed.includes('Hall'))) {
                  seen.add(trimmed);
                  results.push({
                    name: trimmed,
                    capacity: match[1]
                  });
                  break;
                }
              }
            }
          });
          
          // 方法 2: 尋找表格
          document.querySelectorAll('table tr').forEach(tr => {
            const cells = tr.querySelectorAll('td, th');
            if (cells.length >= 2) {
              const name = (cells[0].textContent || '').trim();
              const capacity = (cells[1].textContent || '').replace(/[^0-9]/g, '');
              if (name.length > 2 && name.length < 50 && !seen.has(name)) {
                seen.add(name);
                results.push({
                  name,
                  capacity
                });
              }
            }
          });
          
          return results.slice(0, 20);
        });
        
        if (rooms.length > 0) {
          console.log(`✅ 找到 ${rooms.length} 個會議室`);
          rooms.forEach((r, i) => {
            console.log(`   ${i + 1}. ${r.name}${r.capacity ? ` (${r.capacity}人)` : ''}`);
          });
          result.rooms = rooms;
          break;
        }
        
      } catch (e) {
        console.log('頁面載入失敗:', e.message.slice(0, 50));
      }
    }
    
    if (result.rooms.length === 0) {
      console.log('⚠️ 未找到會議室清單');
      result.error = '未找到會議室清單';
    }
    
  } catch (e) {
    console.log('❌ 錯誤:', e.message);
    result.error = e.message;
  }
  
  await page.close();
  return result;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  
  for (const venue of toProcess) {
    const result = await crawlVenue(browser, venue);
    results.push(result);
    
    // 間隔
    await new Promise(r => setTimeout(r, 2000));
  }
  
  await browser.close();
  
  // 統計
  console.log(`\n${'='.repeat(60)}`);
  console.log('=== 統計 ===');
  console.log('總場地數:', results.length);
  console.log('找到會議室:', results.filter(r => r.rooms.length > 0).length);
  console.log('未找到:', results.filter(r => r.rooms.length === 0).length);
  
  // 儲存結果
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  fs.writeFileSync(`taipei-rooms-batch-${timestamp}.json`, JSON.stringify(results, null, 2));
  console.log(`\n結果已儲存到 taipei-rooms-batch-${timestamp}.json`);
  
  // 更新資料庫
  const data = JSON.parse(fs.readFileSync('venues-all-cities.json', 'utf8'));
  
  results.forEach(result => {
    if (result.rooms.length > 0) {
      // 找到原本的記錄
      const original = data.find(v => v.id === result.id);
      if (original) {
        // 更新原本記錄
        original.roomName = result.rooms[0].name;
        original.maxCapacityTheater = parseInt(result.rooms[0].capacity) || original.maxCapacityTheater;
        original.venueListUrl = result.venueListUrl;
        original.verificationStatus = '已驗證';
        original.verificationNote = `會議室清單已補充（${result.rooms.length}個會議室）`;
        original.lastVerified = new Date().toISOString();
        
        // 新增其他會議室記錄
        if (result.rooms.length > 1) {
          let newId = Math.max(...data.map(v => v.id)) + 1;
          for (let i = 1; i < result.rooms.length; i++) {
            const room = result.rooms[i];
            data.push({
              id: newId++,
              name: original.name,
              roomName: room.name,
              venueType: original.venueType,
              city: original.city,
              address: original.address,
              contactPerson: original.contactPerson,
              contactPhone: original.contactPhone,
              contactEmail: original.contactEmail,
              url: original.url,
              venueListUrl: result.venueListUrl,
              maxCapacityTheater: parseInt(room.capacity) || null,
              status: '上架',
              verificationStatus: '已驗證',
              verificationNote: '會議室清單已補充',
              lastVerified: new Date().toISOString()
            });
          }
        }
        
        console.log(`\n更新 ${original.name}: ${result.rooms.length} 個會議室`);
      }
    }
  });
  
  // 儲存資料庫
  fs.writeFileSync('venues-all-cities.json', JSON.stringify(data, null, 2));
  console.log('\n資料庫已更新');
}

main();
