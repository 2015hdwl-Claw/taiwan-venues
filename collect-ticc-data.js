const puppeteer = require('puppeteer');  // 使用 puppeteer 而不是 puppeteer-core
const fs = require('fs');

// TICC 完整資料收集腳本
const VENUE_NAME = '台北國際會議中心';
const VENUE_URL = 'https://www.ticc.com.tw/';

async function collectTICCData() {
  console.log('🚀 開始收集台北國際會議中心（TICC）完整資料...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    ignoreHTTPSErrors: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });

  const ticcData = {
    name: VENUE_NAME,
    venueType: '會議場地',
    venueUrl: VENUE_URL,
    totalRooms: 0,
    rooms: []
  };

  try {
    const page = await browser.newPage();

    // 設定視窗大小
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('1️⃣ 訪問 TICC 官網...');
    await page.goto(VENUE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);

    console.log('2️⃣ 尋找「場地查詢」頁面連結...');
    // 嘗試尋找場地查詢連結
    const venueSearchUrl = await page.evaluate(() => {
      const links = document.querySelectorAll('a');
      for (const link of links) {
        const text = link.textContent?.trim() || '';
        if (text.includes('場地查詢') || text.includes('場地搜尋')) {
          return link.href;
        }
      }
      return null;
    });
      console.log('   ⚠️ 未找到場地查詢頁面連結，嘗試訪問常見 URL...');

      // 嘗試常見的場地查詢 URL
      const commonUrls = [
        'https://www.ticc.com.tw/wSite/ap/lp_VenueSearch.jsp',
        'https://www.ticc.com.tw/wSite/mp?ctNode=322&CtUnit=99&BaseDSD=7&mp=1'
      ];

      for (const url of commonUrls) {
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
          await sleep(2000);

          // 檢查是否成功載入
          const title = await page.title();
          if (title && !title.includes('找不到')) {
            venueSearchUrl = url;
            console.log(`   ✅ 找到場地查詢頁面: ${venueSearchUrl}`);
            break;
          }
        } catch (error) {
          continue;
        }
      }
    }

    if (!venueSearchUrl) {
      console.log('   ❌ 無法找到場地查詢頁面');
      await browser.close();
      return ticcData;
    }

    console.log('3️⃣ 訪問場地查詢頁面...');
    await page.goto(venueSearchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);

    console.log('4️⃣ 爬取會議空間列表...');
    const rooms = await page.evaluate(() => {
      const roomElements = [];
      const possibleSelectors = [
        // 會議空間列表選擇器（嘗試多種可能性）
        '.room-list',
        '.venue-list',
        '.meeting-room',
        'a[href*="roomId="]',
        '.room-item',
        'div.room'
      ];

      let elements = [];
      for (const selector of possibleSelectors) {
        elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          console.log(`   ✅ 使用選擇器: ${selector} 找到 ${elements.length} 個元素`);
          break;
        }
      }

      // 如果沒有找到特定選擇器，嘗試找到所有連結
      if (elements.length === 0) {
        const allLinks = document.querySelectorAll('a[href]');
        elements = allLinks;
        console.log(`   ℹ️ 使用所有連結: ${elements.length} 個連結`);
      }

      elements.forEach((el, index) => {
        const link = el.tagName === 'A' ? el : el.querySelector('a');
        if (link && link.href) {
          const roomName = el.textContent?.trim() || link.textContent?.trim() || `會議空間 ${index + 1}`;
          roomElements.push({
            name: roomName,
            url: link.href
          });
        }
      });

      // 去重
      const uniqueRooms = [];
      const seen = new Set();
      roomElements.forEach(room => {
        if (!seen.has(room.name)) {
          seen.add(room.name);
          uniqueRooms.push(room);
        }
      });

      return uniqueRooms;
    });

    console.log(`   ✅ 找到 ${rooms.length} 個會議空間\n`);

    ticcData.totalRooms = rooms.length;

    // 為每個會議空間收集詳細資料
    for (let i = 0; i < rooms.length; i++) {
      const room = rooms[i];
      console.log(`5️⃣ 處理會議空間 ${i + 1}/${rooms.length}: ${room.name}`);
      console.log(`   URL: ${room.url}`);

      const roomData = await collectRoomDetails(page, room);
      ticcData.rooms.push(roomData);

      // 每個會議空間間隔一下
      await sleep(2000);
    }

    console.log('\n✅ 資料收集完成！');

  } catch (error) {
    console.error('❌ 收集過程發生錯誤:', error.message);
  } finally {
    await browser.close();
  }

  return ticcData;
}

// 收集會議空間詳細資料
async function collectRoomDetails(page, room) {
  try {
    await page.goto(room.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);

    const roomDetails = await page.evaluate(() => {
      const data = {
        roomName: '',
        photos: {
          main: '',
          gallery: []
        },
        capacity: {
          theater: 0,
          classroom: 0,
          circular: 0,
          cabaret: 0
        },
        pricing: {
          pricePerHour: null,
          priceHalfDay: null,
          priceFullDay: null,
          notes: '需詢問'
        },
        equipment: [],
        rentalRules: {
          minBookingTime: '',
          cancellationPolicy: '',
          notes: ''
        },
        address: '',
        contact: {
          person: '',
          phone: '',
          email: ''
        },
        transportation: {},
        notes: ''
      };

      // 嘗試找到會議空間名稱
      const nameSelectors = [
        'h1',
        '.room-name',
        '.meeting-room-name',
        'h2'
      ];

      for (const selector of nameSelectors) {
        const nameEl = document.querySelector(selector);
        if (nameEl && nameEl.textContent?.trim()) {
          data.roomName = nameEl.textContent.trim();
          break;
        }
      }

      if (!data.roomName) {
        data.roomName = '未命名會議空間';
      }

      // 收集照片
      const imageElements = document.querySelectorAll('img');
      const photoUrls = new Set();

      imageElements.forEach(img => {
        const src = img.src || img.dataset.src || img.dataset.background;
        if (src && src.startsWith('http')) {
          // 過濾掉 logo、icon 等圖片
          if (!src.includes('logo') &&
              !src.includes('icon') &&
              !src.includes('avatar') &&
              !src.includes('data:image') &&
              src.length > 50) {
            photoUrls.add(src);
          }
        }
      });

      // 取前 5 張照片
      data.photos.main = Array.from(photoUrls)[0] || '';
      data.photos.gallery = Array.from(photoUrls).slice(1, 5);

      // 收集容量資訊（從文檔或表格中提取）
      const textContent = document.body.textContent;
      const capacityMatch = textContent.match(/容量[:：]\s*(\d+)/);
      if (capacityMatch) {
        data.capacity.theater = parseInt(capacityMatch[1]);
      }

      // 收集地址
      const addressMatch = textContent.match(/地址[:：]\s*([^\n]+)/);
      if (addressMatch) {
        data.address = addressMatch[1].trim();
      }

      // 收集聯絡資訊
      const contactMatch = textContent.match(/電話[:：]\s*([^\n]+)/);
      if (contactMatch) {
        data.contact.phone = contactMatch[1].trim();
      }

      const emailMatch = textContent.match(/Email[:：]\s*([^\n]+)/);
      if (emailMatch) {
        data.contact.email = emailMatch[1].trim();
      }

      return data;
    });

    console.log(`   ✅ 收集到 ${roomData.roomName}`);
    console.log(`   📷 照片數: ${roomData.photos.main ? 1 + roomData.photos.gallery.length : 0}`);
    console.log(`   📋 地址: ${roomData.address || '無'}`);
    console.log(`   👥 容量: ${roomData.capacity.theater} 人\n`);

    return roomData;

  } catch (error) {
    console.log(`   ❌ 收集失敗: ${error.message}`);
    return {
      roomName: room.name,
      photos: { main: '', gallery: [] },
      capacity: { theater: 0, classroom: 0, circular: 0, cabaret: 0 },
      pricing: { pricePerHour: null, priceHalfDay: null, priceFullDay: null, notes: '需詢問' },
      equipment: [],
      rentalRules: { minBookingTime: '', cancellationPolicy: '', notes: '' },
      address: '',
      contact: { person: '', phone: '', email: '' },
      transportation: {},
      notes: '資料收集失敗'
    };
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 執行資料收集
(async () => {
  const ticcData = await collectTICCData();

  // 保存到檔案
  const outputPath = 'ticc-complete-data.json';
  fs.writeFileSync(outputPath, JSON.stringify(ticcData, null, 2));

  console.log(`\n✅ 完整資料已保存到: ${outputPath}`);
  console.log(`📊 總會議空間數: ${ticcData.totalRooms}`);
  console.log(`📝 場地名稱: ${ticcData.name}`);
})();
