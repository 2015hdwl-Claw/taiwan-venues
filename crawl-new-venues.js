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
    await page.waitForTimeout(5000);

    // 獲取頁面標題
    const title = await page.title();
    console.log(`   標題: ${title}`);

    // 提取會議室資訊
    const venueInfo = await page.evaluate(() => {
      const info = {
        name: '',
        size: '',
        capacity: '',
        price: '',
        equipment: [],
        photos: [],
        description: '',
        rooms: []
      };

      // 嘗試提取名稱
      const titleSelectors = ['h1', 'h2', '.title', '.venue-name', '.room-title'];
      for (const selector of titleSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          info.name = element.textContent.trim();
          break;
        }
      }

      // 提取所有文字內容
      const pageText = document.body.innerText;

      // 嘗試提取大小
      const sizePatterns = [
        /(\d+(?:\.\d+)?)\s*(?:坪|平方公尺|㎡|m²)/g,
        /面積[：:]\s*(\d+(?:\.\d+)?)\s*(?:坪|平方公尺|㎡|m²)/,
        /場地大小[：:]\s*(\d+(?:\.\d+)?)\s*(?:坪|平方公尺|㎡|m²)/
      ];

      for (const pattern of sizePatterns) {
        const match = pageText.match(pattern);
        if (match) {
          info.size = match[0];
          break;
        }
      }

      // 嘗試提取容納人數
      const capacityPatterns = [
        /(\d+)\s*(?:人|位|人數)/g,
        /容納[：:]\s*(\d+)\s*(?:人|位)/,
        /可容納[：:]\s*(\d+)\s*(?:人|位)/
      ];

      for (const pattern of capacityPatterns) {
        const match = pageText.match(pattern);
        if (match) {
          info.capacity = match[0];
          break;
        }
      }

      // 嘗試提取價格
      const pricePatterns = [
        /(\d+(?:,\d+)?)\s*(?:元|NTD|TWD|\$)/g,
        /價格[：:]\s*(\d+(?:,\d+)?)\s*(?:元|NTD|TWD|\$)/,
        /費用[：:]\s*(\d+(?:,\d+)?)\s*(?:元|NTD|TWD|\$)/
      ];

      for (const pattern of pricePatterns) {
        const match = pageText.match(pattern);
        if (match) {
          info.price = match[0];
          break;
        }
      }

      // 提取所有照片
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (img.src && !img.src.includes('logo') && !img.src.includes('icon')) {
          info.photos.push(img.src);
        }
      });

      // 提取描述
      const descSelectors = ['.description', '.content', '.intro', '.venue-intro', 'p'];
      for (const selector of descSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim().length > 20) {
          info.description = element.textContent.trim().substring(0, 500);
          break;
        }
      }

      // 嘗試提取所有會議室
      const roomElements = document.querySelectorAll('.room-item, .venue-item, .space-item, .conference-room, .meeting-room');
      roomElements.forEach(room => {
        const roomInfo = {
          name: '',
          size: '',
          capacity: '',
          price: '',
          photos: []
        };

        // 提取會議室名稱
        const nameElement = room.querySelector('.room-name, .venue-name, h3, h4');
        if (nameElement) {
          roomInfo.name = nameElement.textContent.trim();
        }

        // 提取會議室照片
        const roomImages = room.querySelectorAll('img');
        roomImages.forEach(img => {
          if (img.src) {
            roomInfo.photos.push(img.src);
          }
        });

        if (roomInfo.name || roomInfo.photos.length > 0) {
          info.rooms.push(roomInfo);
        }
      });

      return info;
    });

    venueInfo.url = url;
    venueInfo.venueName = venueName;
    venueInfo.title = title;
    venueInfo.crawledAt = new Date().toISOString();

    await browser.close();

    console.log(`\n✅ 爬蟲完成\n`);
    console.log(`   場地名稱: ${venueInfo.name}`);
    console.log(`   場地大小: ${venueInfo.size || '未找到'}`);
    console.log(`   容納人數: ${venueInfo.capacity || '未找到'}`);
    console.log(`   價格: ${venueInfo.price || '未找到'}`);
    console.log(`   照片數量: ${venueInfo.photos.length} 張`);
    console.log(`   會議室數量: ${venueInfo.rooms.length} 個`);
    console.log('');

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
  console.log('🚀 Playwright 深度爬蟲三個新場地！\n');

  const venues = [
    {
      name: '台北香格里拉遠東國際大飯店',
      url: 'https://tpe.fareasternhotel.com.tw/tc/events/meeting/site/'
    },
    {
      name: '新板希爾頓酒店',
      url: 'https://www.hilton.com/zh-hant/hotels/tsatchi-hilton-taipei-sinban/events/'
    },
    {
      name: '台中市世貿中心',
      url: 'https://www.wtctxg.org.tw/wtctxg/equipment/meeting'
    }
  ];

  const results = [];

  for (const venue of venues) {
    const result = await crawlVenue(venue.url, venue.name);
    results.push(result);

    // 發送進度報告
    const message = `📊 深度爬蟲進度\n\n` +
      `✅ 已完成: ${venue.name}\n` +
      `照片: ${result.photos?.length || 0} 張\n` +
      `會議室: ${result.rooms?.length || 0} 個`;

    console.log(`📱 進度報告: ${message}\n`);
  }

  // 保存總結果
  fs.writeFileSync('new-venues-playwright.json', JSON.stringify(results, null, 2));
  console.log('✅ 總結果已保存: new-venues-playwright.json\n');

  console.log('🎉 所有爬蟲任務完成！');
}

main().catch(console.error);
