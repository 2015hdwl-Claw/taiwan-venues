const { chromium } = require('playwright');
const fs = require('fs');

// 讀取待驗證清單
const toVerify = JSON.parse(fs.readFileSync('taipei-to-verify.json', 'utf8'));
const data = JSON.parse(fs.readFileSync('venues-all-cities.json', 'utf8'));

console.log('=== SOP v3.0 完整驗證 ===');
console.log('待驗證場地:', toVerify.length, '個\n');

// 會議室相關關鍵字
const meetingKeywords = ['會議', '會議室', '宴會', '場地', '租借', '活動', '廳', '室', 
                         'meeting', 'conference', 'venue', 'banquet', 'event', 'space', 'room'];

// 驗證單一場地
async function verifyVenue(browser, venue, index, total) {
  console.log(`\n[${index + 1}/${total}] ${venue.name}`);
  console.log('官網:', venue.url);
  
  const result = {
    id: venue.id,
    name: venue.name,
    originalUrl: venue.url,
    status: '驗證中',
    verified: false,
    issues: [],
    meetingPageUrl: null,
    officialData: {}
  };
  
  const page = await browser.newPage();
  
  try {
    // Phase 1: 驗證官網
    console.log('  Phase 1: 驗證官網...');
    
    await page.goto(venue.url, { 
      waitUntil: 'domcontentloaded', 
      timeout: 20000 
    });
    await page.waitForTimeout(2000);
    
    const title = await page.title();
    const venueName = venue.name.split('(')[0].trim();
    
    // 檢查官網標題是否匹配
    if (!title.includes(venueName) && !title.toLowerCase().includes(venueName.toLowerCase())) {
      console.log('  ❌ 官網標題不匹配');
      console.log('    場地名稱:', venueName);
      console.log('    官網標題:', title);
      result.issues.push('官網標題不匹配');
    } else {
      console.log('  ✅ 官網標題匹配');
    }
    
    // Phase 2: 尋找會議室頁面
    console.log('  Phase 2: 尋找會議室頁面...');
    
    const meetingLinks = await page.evaluate((keywords) => {
      const links = Array.from(document.querySelectorAll('a'));
      return links
        .filter(a => {
          const text = a.textContent.toLowerCase();
          const href = a.href.toLowerCase();
          return keywords.some(k => text.includes(k) || href.includes(k));
        })
        .map(a => ({
          text: a.textContent.trim().slice(0, 50),
          href: a.href
        }))
        .filter(link => link.href.startsWith('http'))
        .slice(0, 10);
    }, meetingKeywords);
    
    if (meetingLinks.length === 0) {
      console.log('  ❌ 找不到會議室頁面');
      result.issues.push('找不到會議室頁面');
      result.status = '待確認';
      await page.close();
      return result;
    }
    
    console.log('  找到', meetingLinks.length, '個可能的會議室頁面');
    meetingLinks.slice(0, 3).forEach((link, i) => {
      console.log(`    ${i + 1}. ${link.text} → ${link.href.slice(0, 60)}...`);
    });
    
    // Phase 3: 開啟會議室頁面
    console.log('  Phase 3: 開啟會議室頁面...');
    
    const meetingUrl = meetingLinks[0].href;
    result.meetingPageUrl = meetingUrl;
    
    await page.goto(meetingUrl, { 
      waitUntil: 'domcontentloaded', 
      timeout: 20000 
    });
    await page.waitForTimeout(3000);
    
    // 滾動頁面觸發載入
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    
    // Phase 4: 抓取會議室資料
    console.log('  Phase 4: 抓取會議室資料...');
    
    const meetingData = await page.evaluate(() => {
      // 會議室名稱
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4'));
      const roomNames = headings
        .filter(h => {
          const text = h.textContent;
          return text.includes('廳') || text.includes('室') || text.includes('會議');
        })
        .map(h => h.textContent.trim().slice(0, 30));
      
      // 價格
      const bodyText = document.body.innerText;
      const priceMatches = [];
      
      // 常見價格格式
      const patterns = [
        /半日[：:\s]*(\d{1,3}(,\d{3})*)\s*元/g,
        /全日[：:\s]*(\d{1,3}(,\d{3})*)\s*元/g,
        /平日[：:\s]*(\d{1,3}(,\d{3})*)\s*元/g,
        /假日[：:\s]*(\d{1,3}(,\d{3})*)\s*元/g,
        /每[小時時][：:\s]*(\d{1,3}(,\d{3})*)\s*元/g,
        /(\d{1,3}(,\d{3})*)\s*元\s*\/\s*[半全日小時]/g
      ];
      
      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(bodyText)) !== null) {
          priceMatches.push(match[0]);
        }
      });
      
      // 人數
      const capacityMatches = [];
      const capacityPatterns = [
        /劇院式[：:\s]*(\d+)\s*(人|位)/g,
        /教室式[：:\s]*(\d+)\s*(人|位)/g,
        /容納[：:\s]*(\d+)\s*(人|位)/g,
        /最多[：:\s]*(\d+)\s*(人|位)/g,
        /(\d+)\s*(人|位)[，,]\s*最多/g
      ];
      
      capacityPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(bodyText)) !== null) {
          capacityMatches.push(match[0]);
        }
      });
      
      // 會議室照片（過濾條件更嚴格）
      const photos = Array.from(document.querySelectorAll('img'))
        .filter(img => 
          img.src && 
          img.width > 200 && 
          img.height > 150 &&
          !img.src.includes('logo') &&
          !img.src.includes('icon') &&
          !img.src.includes('avatar') &&
          !img.src.includes('sprite') &&
          !img.src.includes('banner') &&
          !img.src.includes('header') &&
          !img.src.includes('footer') &&
          !img.src.endsWith('.svg') &&
          !img.src.includes('ads/')
        )
        .map(img => img.src);
      
      return {
        roomNames,
        priceMatches,
        capacityMatches,
        photos: [...new Set(photos)].slice(0, 10),
        pageTitle: document.title,
        bodyTextLength: bodyText.length
      };
    });
    
    result.officialData = meetingData;
    
    console.log('    頁面標題:', meetingData.pageTitle);
    console.log('    會議室名稱:', meetingData.roomNames.slice(0, 3).join(', ') || '未找到');
    console.log('    價格資訊:', meetingData.priceMatches.slice(0, 3).join(', ') || '未找到');
    console.log('    人數資訊:', meetingData.capacityMatches.slice(0, 3).join(', ') || '未找到');
    console.log('    照片:', meetingData.photos.length, '張');
    
    // Phase 5: 驗證與比對
    console.log('  Phase 5: 驗證與比對...');
    
    // 比對會議室名稱
    if (meetingData.roomNames.length > 0 && venue.roomName) {
      const officialName = meetingData.roomNames[0];
      if (!officialName.includes(venue.roomName) && !venue.roomName.includes(officialName)) {
        console.log('  ⚠️ 會議室名稱不一致');
        console.log('    資料庫:', venue.roomName);
        console.log('    官網:', officialName);
        result.issues.push('會議室名稱不一致');
      } else {
        console.log('  ✅ 會議室名稱一致');
      }
    } else if (!venue.roomName && meetingData.roomNames.length === 0) {
      console.log('  ⚠️ 都沒有會議室名稱');
    }
    
    // 檢查照片
    if (meetingData.photos.length === 0) {
      console.log('  ❌ 未找到會議室照片');
      result.issues.push('缺少會議室照片');
    } else {
      console.log('  ✅ 找到會議室照片');
    }
    
    // 檢查價格
    if (meetingData.priceMatches.length === 0 && !venue.priceHalfDay && !venue.priceFullDay) {
      console.log('  ⚠️ 都沒有價格資訊');
    }
    
    // Phase 6: 更新資料
    if (meetingData.photos.length > 0) {
      result.verified = true;
      result.status = result.issues.length > 0 ? '待修' : '已驗證';
      
      // 更新照片（來源是會議室頁面）
      venue.images = {
        main: meetingData.photos[0],
        gallery: meetingData.photos,
        source: meetingUrl,
        verified: true,
        verifiedAt: new Date().toISOString()
      };
    } else {
      result.status = '待修';
      venue.status = '待修';
    }
    
    // 記錄驗證資訊
    venue.meetingPageUrl = meetingUrl;
    venue.lastVerified = new Date().toISOString();
    venue.verifiedBy = 'SOP v3.0';
    venue.verificationIssues = result.issues;
    
  } catch (err) {
    console.log('  ❌ 錯誤:', err.message);
    result.status = '錯誤';
    result.issues.push(err.message);
    venue.status = '待確認';
    venue.verificationError = err.message;
  }
  
  await page.close();
  return result;
}

// 主程式
async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  
  // 分批處理（每批 10 個）
  const batchSize = 10;
  
  for (let i = 0; i < toVerify.length; i += batchSize) {
    const batch = toVerify.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(toVerify.length / batchSize);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`批次 ${batchNum}/${totalBatches} (場地 ${i + 1}-${Math.min(i + batchSize, toVerify.length)})`);
    console.log('='.repeat(60));
    
    for (let j = 0; j < batch.length; j++) {
      const result = await verifyVenue(browser, batch[j], i + j, toVerify.length);
      results.push(result);
      
      // 間隔避免被封
      await new Promise(r => setTimeout(r, 1500));
    }
    
    // 每 10 分鐘回報進度
    const verified = results.filter(r => r.verified).length;
    const withIssues = results.filter(r => r.issues.length > 0).length;
    
    console.log(`\n📊 目前進度: ${results.length}/${toVerify.length}`);
    console.log(`   已驗證: ${verified}`);
    console.log(`   有問題: ${withIssues}`);
    
    // 儲存中繼結果
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    fs.writeFileSync(`verification-progress-${timestamp}.json`, JSON.stringify(results, null, 2));
    
    // 更新資料庫
    fs.writeFileSync('venues-all-cities.json', JSON.stringify(data, null, 2));
  }
  
  await browser.close();
  
  // 最終統計
  const stats = {
    total: results.length,
    verified: results.filter(r => r.verified).length,
    withIssues: results.filter(r => r.issues.length > 0).length,
    errors: results.filter(r => r.status === '錯誤').length,
    issueTypes: {}
  };
  
  results.forEach(r => {
    r.issues.forEach(issue => {
      stats.issueTypes[issue] = (stats.issueTypes[issue] || 0) + 1;
    });
  });
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('=== 最終統計 ===');
  console.log('='.repeat(60));
  console.log('總場地:', stats.total);
  console.log('已驗證:', stats.verified);
  console.log('有問題:', stats.withIssues);
  console.log('錯誤:', stats.errors);
  console.log('');
  console.log('問題類型:');
  Object.entries(stats.issueTypes)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
  
  // 儲存最終結果
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  fs.writeFileSync(`verification-final-${timestamp}.json`, JSON.stringify(results, null, 2));
  fs.writeFileSync('venues-all-cities.json', JSON.stringify(data, null, 2));
  
  console.log('\n✅ 驗證完成');
  console.log('結果已儲存至:', `verification-final-${timestamp}.json`);
}

main();
