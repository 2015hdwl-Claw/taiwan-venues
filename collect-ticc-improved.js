const puppeteer = require('puppeteer');
const fs = require('fs');

async function collectTICCDataImproved() {
  console.log('🚀 開始收集台北國際會議中心（TICC）完整資料（改進版）...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const ticcData = {
    name: '台北國際會議中心',
    venueType: '會議場地',
    venueUrl: 'https://www.ticc.com.tw/',
    address: '台北市信義區信義路五段1號',
    contact: {
      phone: '02-2725-5200',
      email: 'ticc@taitra.org.tw'
    },
    rooms: []
  };

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // 步驟 1：訪問首頁
    console.log('1️⃣ 訪問 TICC 官網首頁...');
    await page.goto('https://www.ticc.com.tw/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);

    // 步驟 2：尋找場地查詢連結
    console.log('2️⃣ 尋找場地查詢頁面...');
    const venueUrl = await page.evaluate(() => {
      const links = document.querySelectorAll('a');
      for (const link of links) {
        const text = link.textContent?.trim() || '';
        if (text.includes('場地查詢')) {
          return link.href;
        }
      }
      return null;
    });

    if (venueUrl) {
      console.log(`   ✅ 找到: ${venueUrl}`);
      await page.goto(venueUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await sleep(3000);
    }

    // 步驟 3：尋找所有會議空間的連結（改進版）
    console.log('3️⃣ 尋找所有會議空間連結...');
    const roomLinks = await page.evaluate(() => {
      const links = [];
      const seen = new Set();
      
      // 方法 1：尋找包含 roomId 的連結
      document.querySelectorAll('a[href*="roomId="]').forEach(link => {
        const href = link.href;
        const text = link.textContent?.trim();
        if (text && !seen.has(href)) {
          seen.add(href);
          links.push({ text, href, type: 'roomId' });
        }
      });

      // 方法 2：尋找場地介紹相關的連結
      document.querySelectorAll('a').forEach(link => {
        const href = link.href;
        const text = link.textContent?.trim();
        if (text && !seen.has(href)) {
          if (text.includes('會議室') || 
              text.includes('會議廳') ||
              text.includes('大會堂') ||
              text.includes('場地介紹')) {
            seen.add(href);
            links.push({ text, href, type: 'venue' });
          }
        }
      });

      return links;
    });

    console.log(`   ✅ 找到 ${roomLinks.length} 個會議空間連結\n`);

    // 步驟 4：為每個會議空間收集詳細資料
    for (let i = 0; i < Math.min(roomLinks.length, 10); i++) {
      const roomLink = roomLinks[i];
      console.log(`4️⃣ 處理會議空間 ${i + 1}/${roomLinks.length}: ${roomLink.text}`);
      console.log(`   URL: ${roomLink.href}`);

      try {
        await page.goto(roomLink.href, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await sleep(2000);

        const roomData = await page.evaluate(() => {
          // 提取會議空間名稱（改進版）
          let name = '';
          
          // 嘗試多種選擇器
          const nameSelectors = [
            'h1',
            'h2', 
            '.room-name',
            '.venue-name',
            '.meeting-room-name',
            'title'
          ];

          for (const selector of nameSelectors) {
            const el = document.querySelector(selector);
            if (el && el.textContent?.trim()) {
              const text = el.textContent.trim();
              // 過濾掉太長或太短的名稱
              if (text.length > 2 && text.length < 50 && !text.includes('台北國際會議中心')) {
                name = text;
                break;
              }
            }
          }

          // 如果還是找不到，從 URL 參數提取
          if (!name) {
            const urlParams = new URLSearchParams(window.location.search);
            const roomId = urlParams.get('roomId');
            if (roomId) {
              name = `${roomId}會議室`;
            }
          }

          // 收集實際會議空間照片（改進版）
          const photos = [];
          const photoSelectors = [
            'img[src*="room"]',
            'img[src*="venue"]',
            'img[src*="meeting"]',
            '.photo img',
            '.gallery img'
          ];

          // 先嘗試特定選擇器
          for (const selector of photoSelectors) {
            const imgs = document.querySelectorAll(selector);
            imgs.forEach(img => {
              const src = img.src || img.dataset.src;
              if (src && src.startsWith('http') && 
                  !src.includes('logo') && 
                  !src.includes('icon') &&
                  !src.includes('floor') &&  // 過濾樓層平面圖
                  !src.includes('bg-') &&     // 過濾背景圖
                  !src.includes('button')) {
                photos.push(src);
              }
            });
          }

          // 如果找不到，嘗試所有圖片
          if (photos.length === 0) {
            document.querySelectorAll('img').forEach(img => {
              const src = img.src || img.dataset.src;
              if (src && src.startsWith('http') && 
                  !src.includes('logo') && 
                  !src.includes('icon') &&
                  !src.includes('floor') &&
                  !src.includes('bg-') &&
                  !src.includes('button') &&
                  !src.includes('style1') &&  // 過濾樣式圖片
                  img.width > 200) {          // 只取大圖
                photos.push(src);
              }
            });
          }

          // 收集詳細資訊
          const text = document.body.textContent || '';
          
          // 提取容量
          let capacity = {};
          const theaterMatch = text.match(/演講式[：:]\s*(\d+)/);
          const classroomMatch = text.match(/課堂式[：:]\s*(\d+)/);
          const roundMatch = text.match(/圓桌式[：:]\s*(\d+)/);
          
          if (theaterMatch) capacity.theater = parseInt(theaterMatch[1]);
          if (classroomMatch) capacity.classroom = parseInt(classroomMatch[1]);
          if (roundMatch) capacity.circular = parseInt(roundMatch[1]);

          // 提取價格
          let pricing = { notes: '需詢價' };
          const priceMatch = text.match(/價格[：:]\s*([\d,]+)/);
          if (priceMatch) {
            pricing.notes = `參考價格：${priceMatch[1]} 元`;
          }

          // 提取設備
          const equipment = [];
          if (text.includes('投影')) equipment.push('投影設備');
          if (text.includes('音響')) equipment.push('音響系統');
          if (text.includes('螢幕')) equipment.push('螢幕顯示');
          if (text.includes('麥克風')) equipment.push('麥克風系統');

          return {
            name: name || '會議空間',
            photos: [...new Set(photos)].slice(0, 5),  // 去重並限制 5 張
            capacity,
            pricing,
            equipment,
            description: text.substring(0, 200)
          };
        });

        ticcData.rooms.push({
          roomName: roomData.name,
          photos: roomData.photos,
          capacity: roomData.capacity,
          pricing: roomData.pricing,
          equipment: roomData.equipment,
          source: roomLink.href,
          description: roomData.description
        });

        console.log(`   ✅ ${roomData.name}`);
        console.log(`   📷 ${roomData.photos.length} 張照片`);
        console.log(`   👥 容量: ${JSON.stringify(roomData.capacity)}`);
        console.log(`   💰 價格: ${roomData.pricing.notes}\n`);

      } catch (error) {
        console.log(`   ❌ 錯誤: ${error.message}\n`);
      }

      // 避免請求過快
      await sleep(1000);
    }

    console.log('✅ 資料收集完成！');

  } catch (error) {
    console.error('❌ 錯誤:', error.message);
  } finally {
    await browser.close();
  }

  // 保存資料
  ticcData.totalRooms = ticcData.rooms.length;
  fs.writeFileSync('ticc-complete-data.json', JSON.stringify(ticcData, null, 2));
  
  console.log(`\n📄 資料已保存到 ticc-complete-data.json`);
  console.log(`📊 總會議空間數: ${ticcData.totalRooms}`);

  return ticcData;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

collectTICCDataImproved();
