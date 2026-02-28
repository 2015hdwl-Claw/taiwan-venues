const puppeteer = require('puppeteer');
const fs = require('fs');

async function collectTICCData() {
  console.log('🚀 開始收集台北國際會議中心（TICC）資料...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const ticcData = {
    name: '台北國際會議中心',
    venueType: '會議場地',
    venueUrl: 'https://www.ticc.com.tw/',
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
    } else {
      console.log('   ⚠️ 未找到場地查詢連結');
    }

    // 步驟 3：收集頁面上的所有連結
    console.log('3️⃣ 收集頁面連結...');
    const allLinks = await page.evaluate(() => {
      const links = [];
      document.querySelectorAll('a[href]').forEach(link => {
        const text = link.textContent?.trim();
        const href = link.href;
        if (text && href && href.includes('ticc.com.tw')) {
          links.push({ text, href });
        }
      });
      return links;
    });

    console.log(`   ✅ 找到 ${allLinks.length} 個連結`);

    // 步驟 4：嘗試訪問可能的會議空間頁面
    console.log('4️⃣ 尋找會議空間資訊...');
    
    // 過濾可能的會議空間連結
    const roomLinks = allLinks.filter(link => 
      link.text.includes('會議室') || 
      link.text.includes('會議廳') ||
      link.text.includes('場地') ||
      link.href.includes('roomId') ||
      link.href.includes('venue')
    );

    console.log(`   ✅ 找到 ${roomLinks.length} 個可能的會議空間連結`);

    // 為每個會議空間收集資料
    for (const roomLink of roomLinks.slice(0, 5)) {  // 只處理前 5 個
      console.log(`\n5️⃣ 收集: ${roomLink.text}`);
      
      try {
        await page.goto(roomLink.href, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await sleep(2000);

        const roomData = await page.evaluate(() => {
          // 收集基本資訊
          const name = document.querySelector('h1, h2, .room-name')?.textContent?.trim() || '未命名';
          
          // 收集照片
          const photos = [];
          document.querySelectorAll('img').forEach(img => {
            const src = img.src || img.dataset.src;
            if (src && src.startsWith('http') && !src.includes('logo') && !src.includes('icon')) {
              photos.push(src);
            }
          });

          // 收集文字內容
          const text = document.body.textContent;

          return {
            name,
            photos: photos.slice(0, 5),
            text: text.substring(0, 500)  // 前 500 字元
          };
        });

        ticcData.rooms.push({
          roomName: roomData.name,
          photos: roomData.photos,
          source: roomLink.href
        });

        console.log(`   ✅ ${roomData.name} - ${roomData.photos.length} 張照片`);

      } catch (error) {
        console.log(`   ❌ 錯誤: ${error.message}`);
      }
    }

    console.log('\n✅ 資料收集完成！');

  } catch (error) {
    console.error('❌ 錯誤:', error.message);
  } finally {
    await browser.close();
  }

  // 保存資料
  fs.writeFileSync('ticc-complete-data.json', JSON.stringify(ticcData, null, 2));
  console.log(`\n📄 資料已保存到 ticc-complete-data.json`);
  console.log(`📊 總會議空間數: ${ticcData.rooms.length}`);

  return ticcData;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

collectTICCData();
