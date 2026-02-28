const { chromium } = require('playwright');
const fs = require('fs');

async function crawlVenue(url, venueName) {
  console.log(`\n🔍 開始爬蟲: ${venueName}`);
  console.log(`   URL: ${url}\n`);

  const browser = await chromium.launch({
    headless: true
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  try {
    // 訪問網站
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log(`✅ 頁面載入成功`);

    // 等待動態內容載入
    await page.waitForTimeout(3000);

    // 獲取頁面標題
    const title = await page.title();
    console.log(`   標題: ${title}`);

    // 獲取所有會議室連結
    const roomLinks = await page.evaluate(() => {
      const links = [];
      const anchors = document.querySelectorAll('a');
      anchors.forEach(a => {
        const text = a.textContent.trim();
        const href = a.href;
        if (text && href && (
          text.includes('會議室') ||
          text.includes('場地') ||
          text.includes('教室') ||
          text.includes('廳') ||
          text.includes('館') ||
          text.includes('空間')
        )) {
          links.push({ text, href });
        }
      });
      return links;
    });

    console.log(`   找到 ${roomLinks.length} 個相關連結`);

    // 收集會議室詳細資訊
    const rooms = [];

    for (const link of roomLinks) {
      try {
        console.log(`   訪問: ${link.text}`);
        await page.goto(link.href, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(2000);

        // 提取會議室資訊
        const roomInfo = await page.evaluate(() => {
          const info = {
            name: '',
            size: '',
            capacity: '',
            price: '',
            equipment: [],
            photos: [],
            description: ''
          };

          // 嘗試提取名稱
          const titleSelectors = ['h1', 'h2', '.title', '.room-name', '.venue-name'];
          for (const selector of titleSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
              info.name = element.textContent.trim();
              break;
            }
          }

          // 嘗試提取大小
          const sizeRegex = /(\d+(?:\.\d+)?)\s*(?:坪|平方公尺|㎡|m²)/;
          const pageText = document.body.innerText;
          const sizeMatch = pageText.match(sizeRegex);
          if (sizeMatch) {
            info.size = sizeMatch[0];
          }

          // 嘗試提取容納人數
          const capacityRegex = /(\d+)\s*(?:人|位)/;
          const capacityMatch = pageText.match(capacityRegex);
          if (capacityMatch) {
            info.capacity = capacityMatch[0];
          }

          // 嘗試提取價格
          const priceRegex = /(\d+(?:,\d+)?)\s*(?:元|NTD|TWD)/;
          const priceMatch = pageText.match(priceRegex);
          if (priceMatch) {
            info.price = priceMatch[0];
          }

          // 提取照片
          const images = document.querySelectorAll('img');
          images.forEach(img => {
            if (img.src && (
              img.src.includes('room') ||
              img.src.includes('venue') ||
              img.src.includes('space') ||
              img.alt?.includes('會議')
            )) {
              info.photos.push(img.src);
            }
          });

          // 提取描述
          const descSelectors = ['.description', '.content', '.intro', 'p'];
          for (const selector of descSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim().length > 20) {
              info.description = element.textContent.trim().substring(0, 200);
              break;
            }
          }

          return info;
        });

        roomInfo.url = link.href;
        rooms.push(roomInfo);

      } catch (error) {
        console.log(`   ⚠️ 訪問失敗: ${error.message}`);
      }
    }

    // 添加基本資訊
    const venueInfo = {
      venueName,
      url,
      title,
      crawledAt: new Date().toISOString(),
      rooms
    };

    await browser.close();

    console.log(`\n✅ 爬蟲完成: ${rooms.length} 個會議室\n`);
    return venueInfo;

  } catch (error) {
    await browser.close();
    console.log(`\n❌ 爬蟲失敗: ${error.message}\n`);
    return {
      venueName,
      url,
      error: error.message,
      crawledAt: new Date().toISOString()
    };
  }
}

async function main() {
  console.log('🚀 Playwright 深度爬蟲啟動！\n');

  const venues = [
    {
      name: '台灣文創中心（TPQC）',
      url: 'https://www.tpqc.com.tw/'
    },
    {
      name: '政大公企中心（CPBAE）',
      url: 'https://cpbae.nccu.edu.tw/'
    },
    {
      name: '台大醫院國際會議中心（NTHCC）',
      url: 'https://www.nthcc.com.tw/'
    }
  ];

  const results = [];

  for (const venue of venues) {
    const result = await crawlVenue(venue.url, venue.name);
    results.push(result);

    // 保存中間結果
    const filename = venue.name.replace(/[（）]/g, '').replace(/\s+/g, '-').toLowerCase() + '-playwright.json';
    fs.writeFileSync(filename, JSON.stringify(result, null, 2));
    console.log(`💾 已保存: ${filename}\n`);

    // 發送進度報告
    const message = `📊 深度爬蟲進度\n\n` +
      `✅ 已完成: ${venue.name}\n` +
      `會議室數量: ${result.rooms?.length || 0}\n` +
      `檔案: ${filename}`;

    // 這裡可以調用 Telegram API 發送進度
    console.log(`📱 進度報告: ${message}\n`);
  }

  // 保存總結果
  fs.writeFileSync('playwright-crawl-results.json', JSON.stringify(results, null, 2));
  console.log('✅ 總結果已保存: playwright-crawl-results.json\n');

  console.log('🎉 所有爬蟲任務完成！');
}

main().catch(console.error);
