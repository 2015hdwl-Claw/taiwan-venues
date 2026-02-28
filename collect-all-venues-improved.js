const puppeteer = require('puppeteer');
const fs = require('fs');

// 改進版場地資料收集腳本
class ImprovedVenueDataCollector {
  constructor() {
    this.browser = null;
    this.processedCount = 0;
    this.errorCount = 0;
    this.startTime = Date.now();

    // URL 修正資料庫
    this.urlCorrections = {
      'www.rph.com.tw': 'www.regenttaipei.com',
      'www.royal-taipei.com': 'www.royal-taipei.com.tw',
      'www.thesherwood.com.tw': 'www.sherwood.com.tw',
      'www.the-forest.com.tw': 'www.theforest.com.tw',
      'www.edithotel.com.tw': 'www.edaroyal.com.tw',
      'www.npot-ntt.gov.tw': 'www.npac-ntt.org',
      'www.fullon-hotels.com': 'www.fullon-hotels.com.tw',
      'www.nice-prince.com.tw': 'www.niceprince.com.tw',
      'www.mohg.com': 'www.mandarinoriental.com/taipei',
      'www.millenniumtaipei.com': 'www.millenniumhotels.com',
      'www.silksplace-yilan.com': 'www.silksplace.com/yilan',
      'www.dianhua.com.tw': 'www.dianhua.com.tw',
      'www.landis-tainan.com': 'www.landis-tainan.com.tw',
      'www.evergreen-chiayi.com.tw': 'www.evergreen.com.tw',
      'www.reefsilks.com.tw': 'www.reefsilks.com',
      'www.chateaudechine-hualien.com': 'www.chateaudechine.com',
      'www.wtctc.org.tw': 'www.wtctc.org.tw'
    };
  }

  async initialize() {
    console.log('🚀 初始化瀏覽器（改進版）...\n');
    this.browser = await puppeteer.launch({
      headless: 'new',
      ignoreHTTPSErrors: true,  // 改進：忽略 SSL 錯誤
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--ignore-certificate-errors'  // 改進：忽略憑證錯誤
      ]
    });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  // 改進：URL 修正
  correctUrl(url) {
    for (const [wrong, correct] of Object.entries(this.urlCorrections)) {
      if (url.includes(wrong)) {
        const correctedUrl = url.replace(wrong, correct);
        console.log(`   🔧 URL 修正: ${url} → ${correctedUrl}`);
        return correctedUrl;
      }
    }
    return url;
  }

  // 改進：超時重試機制
  async retryWithBackoff(fn, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        const delay = 5000 * (i + 1);
        console.log(`   ⏳ 重試 ${i + 1}/${maxRetries}，等待 ${delay/1000} 秒...`);
        await this.sleep(delay);
      }
    }
  }

  async collectVenueData(venue) {
    const page = await this.browser.newPage();
    const result = {
      name: venue.name,
      venueType: venue.type,
      city: venue.city,
      originalUrl: venue.url,
      correctedUrl: venue.url,
      rooms: [],
      status: 'pending'
    };

    try {
      await page.setViewport({ width: 1920, height: 1080 });

      // 改進：URL 修正
      const correctedUrl = this.correctUrl(venue.url);
      result.correctedUrl = correctedUrl;

      console.log(`📍 訪問: ${venue.name}`);
      console.log(`   原始 URL: ${venue.url}`);
      if (correctedUrl !== venue.url) {
        console.log(`   修正 URL: ${correctedUrl}`);
      }

      // 改進：使用重試機制訪問網站
      await this.retryWithBackoff(async () => {
        await page.goto(correctedUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 20000  // 改進：增加超時時間
        });
      });

      await this.sleep(2000);

      // 收集基本資訊
      const venueData = await page.evaluate(() => {
        const data = {
          photos: [],
          links: [],
          text: ''
        };

        // 收集照片
        document.querySelectorAll('img').forEach(img => {
          const src = img.src || img.dataset.src;
          if (src && src.startsWith('http') &&
              !src.includes('logo') &&
              !src.includes('icon') &&
              img.width > 200) {
            data.photos.push(src);
          }
        });

        // 收集連結
        document.querySelectorAll('a').forEach(link => {
          const text = link.textContent?.trim();
          const href = link.href;
          if (text && href && (
            text.includes('會議') ||
            text.includes('場地') ||
            text.includes('空間') ||
            text.includes('租借')
          )) {
            data.links.push({ text, href });
          }
        });

        // 收集文字內容
        data.text = document.body.textContent?.substring(0, 1000) || '';

        return data;
      });

      // 提取地址和聯絡資訊
      const addressMatch = venueData.text.match(/地址[：:]\s*([^\n]+)/);
      const phoneMatch = venueData.text.match(/電話[：:]\s*([^\n]+)/);

      result.address = addressMatch ? addressMatch[1].trim() : venue.address || '';
      result.contact = {
        phone: phoneMatch ? phoneMatch[1].trim() : venue.contactPhone || ''
      };

      // 如果找到會議空間相關連結，訪問並收集資料
      if (venueData.links.length > 0) {
        console.log(`   ✅ 找到 ${venueData.links.length} 個相關連結`);

        // 只處理前 3 個連結
        for (const link of venueData.links.slice(0, 3)) {
          try {
            await page.goto(link.href, {
              waitUntil: 'domcontentloaded',
              timeout: 10000
            });

            await this.sleep(1500);

            const roomData = await page.evaluate(() => {
              const room = {
                name: '',
                photos: [],
                capacity: {},
                equipment: []
              };

              // 提取名稱
              const titleEl = document.querySelector('h1, h2, .title');
              if (titleEl) {
                room.name = titleEl.textContent?.trim();
              }

              // 提取照片
              document.querySelectorAll('img').forEach(img => {
                const src = img.src || img.dataset.src;
                if (src && src.startsWith('http') &&
                    !src.includes('logo') &&
                    !src.includes('icon') &&
                    img.width > 200) {
                  room.photos.push(src);
                }
              });

              // 提取容量
              const text = document.body.textContent || '';
              const capacityMatch = text.match(/(\d+)\s*人/);
              if (capacityMatch) {
                room.capacity.max = parseInt(capacityMatch[1]);
              }

              return room;
            });

            if (roomData.name || roomData.photos.length > 0) {
              result.rooms.push(roomData);
            }

          } catch (error) {
            console.log(`   ⚠️ 連結訪問失敗: ${error.message}`);
          }
        }
      }

      // 如果沒有找到會議空間，使用主頁照片
      if (result.rooms.length === 0 && venueData.photos.length > 0) {
        result.rooms.push({
          name: venue.roomName || '主場地',
          photos: venueData.photos.slice(0, 5),
          capacity: {
            theater: venue.maxCapacityTheater || null,
            classroom: venue.maxCapacityClassroom || null
          }
        });
      }

      result.status = 'success';
      this.processedCount++;
      console.log(`   ✅ 成功收集 ${result.rooms.length} 個會議空間\n`);

    } catch (error) {
      result.status = 'error';
      result.error = error.message;
      this.errorCount++;
      console.log(`   ❌ 錯誤: ${error.message}\n`);
    } finally {
      await page.close();
    }

    return result;
  }

  async processBatch(venues, startIndex = 0, batchSize = 50) {
    const results = [];
    const batch = venues.slice(startIndex, startIndex + batchSize);

    console.log(`\n📊 處理批次: ${startIndex + 1} - ${startIndex + batch.length} / ${venues.length}`);
    console.log(`⏱️  預計時間: ${Math.ceil(batch.length * 15 / 60)} 分鐘\n`);

    for (let i = 0; i < batch.length; i++) {
      const venue = batch[i];
      const progress = ((startIndex + i + 1) / venues.length * 100).toFixed(1);

      console.log(`\n[${startIndex + i + 1}/${venues.length}] (${progress}%)`);

      const result = await this.collectVenueData(venue);
      results.push(result);

      // 每 10 個場地保存一次進度
      if ((i + 1) % 10 === 0) {
        this.saveProgress(results, startIndex + i + 1);
      }

      // 避免請求過快
      await this.sleep(1000);
    }

    return results;
  }

  saveProgress(results, processedCount) {
    const progress = {
      timestamp: new Date().toISOString(),
      processedCount,
      totalVenues: 405,
      errorCount: this.errorCount,
      elapsedTime: Math.round((Date.now() - this.startTime) / 1000),
      results
    };

    fs.writeFileSync(
      'venue-collection-progress-improved.json',
      JSON.stringify(progress, null, 2)
    );

    console.log(`\n💾 進度已保存: ${processedCount}/405 場地`);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 主程式
async function main() {
  const collector = new ImprovedVenueDataCollector();

  try {
    // 讀取場地資料
    const venues = JSON.parse(fs.readFileSync('sample-data.json', 'utf8'));

    // 去重（根據名稱和 URL）
    const uniqueVenues = [];
    const seen = new Set();

    venues.forEach(venue => {
      const key = `${venue.name}_${venue.url}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueVenues.push(venue);
      }
    });

    console.log(`📊 總場地數: ${venues.length}`);
    console.log(`📊 去重後場地數: ${uniqueVenues.length}\n`);

    // 初始化瀏覽器
    await collector.initialize();

    // 處理場地（可以指定開始位置和批次大小）
    const startIndex = parseInt(process.argv[2]) || 50;  // 從第 51 個開始
    const batchSize = parseInt(process.argv[3]) || 50;

    const results = await collector.processBatch(uniqueVenues, startIndex, batchSize);

    // 保存最終結果
    const finalOutput = {
      timestamp: new Date().toISOString(),
      totalProcessed: results.length,
      successCount: results.filter(r => r.status === 'success').length,
      errorCount: results.filter(r => r.status === 'error').length,
      venues: results
    };

    fs.writeFileSync(
      'collected-venues-data-improved.json',
      JSON.stringify(finalOutput, null, 2)
    );

    console.log('\n✅ 批次處理完成！');
    console.log(`📊 成功: ${finalOutput.successCount}`);
    console.log(`📊 失敗: ${finalOutput.errorCount}`);
    console.log(`📄 結果已保存到: collected-venues-data-improved.json`);

  } catch (error) {
    console.error('❌ 主程式錯誤:', error.message);
  } finally {
    await collector.close();
  }
}

main();
