const puppeteer = require('puppeteer');
const fs = require('fs');

async function collectTICCDataFinal() {
  console.log('🚀 開始收集台北國際會議中心（TICC）完整資料（最終版）...\n');

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

    // 步驟 3：尋找所有會議空間的連結（改進版 - 保留完整文字）
    console.log('3️⃣ 尋找所有會議空間連結...');
    const roomLinks = await page.evaluate(() => {
      const links = [];
      const seen = new Set();
      
      // 尋找包含 roomId 的連結
      document.querySelectorAll('a[href*="roomId="]').forEach(link => {
        const href = link.href;
        // 獲取完整的連結文字（包括子元素）
        const text = link.textContent?.trim().replace(/\s+/g, ' ');
        
        if (text && !seen.has(href)) {
          seen.add(href);
          links.push({ 
            text: text,  // 保留完整文字
            href: href, 
            type: 'roomId' 
          });
        }
      });

      return links;
    });

    console.log(`   ✅ 找到 ${roomLinks.length} 個會議空間連結\n`);

    // 步驟 4：為每個會議空間收集詳細資料
    for (let i = 0; i < roomLinks.length; i++) {
      const roomLink = roomLinks[i];
      
      // 從連結文字中提取會議空間名稱（第一行）
      const roomName = roomLink.text.split('\n')[0].trim();
      
      console.log(`4️⃣ 處理會議空間 ${i + 1}/${roomLinks.length}: ${roomName}`);
      console.log(`   完整文字: ${roomLink.text.substring(0, 100)}...`);
      console.log(`   URL: ${roomLink.href}`);

      try {
        await page.goto(roomLink.href, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await sleep(2000);

        const roomData = await page.evaluate(() => {
          // 收集照片
          const photos = [];
          document.querySelectorAll('img').forEach(img => {
            const src = img.src || img.dataset.src;
            if (src && src.startsWith('http') && 
                !src.includes('logo') && 
                !src.includes('icon') &&
                !src.includes('floor') &&
                !src.includes('bg-') &&
                !src.includes('button') &&
                !src.includes('style1') &&
                img.width > 200) {
              photos.push(src);
            }
          });

          // 收集頁面文字
          const text = document.body.textContent || '';
          
          // 提取容量（改進版）
          const capacity = {};
          
          // 嘗試多種模式
          const patterns = [
            /教室型[：:]\s*(\d+)\s*人/,
            /劇院型[：:]\s*(\d+)\s*人/,
            /馬蹄型[：:]\s*(\d+)\s*人/,
            /演講式[：:]\s*(\d+)\s*人/,
            /課堂式[：:]\s*(\d+)\s*人/,
            /圓桌式[：:]\s*(\d+)\s*人/
          ];
          
          const classroomMatch = text.match(patterns[0]);
          const theaterMatch = text.match(patterns[1]);
          const horseshoeMatch = text.match(patterns[2]);
          
          if (classroomMatch) capacity.classroom = parseInt(classroomMatch[1]);
          if (theaterMatch) capacity.theater = parseInt(theaterMatch[1]);
          if (horseshoeMatch) capacity.horseshoe = parseInt(horseshoeMatch[1]);

          // 提取設備
          const equipment = [];
          if (text.includes('投影')) equipment.push('投影設備');
          if (text.includes('音響')) equipment.push('音響系統');
          if (text.includes('螢幕')) equipment.push('螢幕顯示');
          if (text.includes('麥克風')) equipment.push('麥克風系統');
          if (text.includes('燈光')) equipment.push('燈光設備');
          if (text.includes('舞台')) equipment.push('舞台設備');

          return {
            photos: [...new Set(photos)].slice(0, 5),
            capacity,
            equipment,
            text: text.substring(0, 500)
          };
        });

        // 從連結文字中提取容量資訊（備用方案）
        if (Object.keys(roomData.capacity).length === 0) {
          const linkText = roomLink.text;
          const classroomMatch = linkText.match(/教室型\s*(\d+)\s*人/);
          const theaterMatch = linkText.match(/劇院型\s*(\d+)\s*人/);
          const horseshoeMatch = linkText.match(/馬蹄型\s*(\d+)\s*人/);
          
          if (classroomMatch) roomData.capacity.classroom = parseInt(classroomMatch[1]);
          if (theaterMatch) roomData.capacity.theater = parseInt(theaterMatch[1]);
          if (horseshoeMatch) roomData.capacity.horseshoe = parseInt(horseshoeMatch[1]);
        }

        ticcData.rooms.push({
          roomName: roomName,
          roomId: roomLink.href.match(/roomId=([^&]+)/)?.[1] || '',
          photos: roomData.photos,
          capacity: roomData.capacity,
          pricing: {
            notes: '需詢價'
          },
          equipment: roomData.equipment,
          source: roomLink.href,
          description: roomData.text.substring(0, 200)
        });

        console.log(`   ✅ ${roomName}`);
        console.log(`   📷 ${roomData.photos.length} 張照片`);
        console.log(`   👥 容量: ${JSON.stringify(roomData.capacity)}`);
        console.log(`   🛠️ 設備: ${roomData.equipment.join(', ')}\n`);

      } catch (error) {
        console.log(`   ❌ 錯誤: ${error.message}\n`);
      }

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

  // 輸出摘要
  console.log('\n📋 會議空間摘要:');
  ticcData.rooms.forEach((room, index) => {
    console.log(`${index + 1}. ${room.roomName} - ${room.photos.length} 張照片`);
    if (Object.keys(room.capacity).length > 0) {
      console.log(`   容量: ${JSON.stringify(room.capacity)}`);
    }
  });

  return ticcData;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

collectTICCDataFinal();
