const { chromium } = require('playwright');
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('venues-all-cities.json', 'utf8'));
const toVerify = JSON.parse(fs.readFileSync('taichung-verify-list.json', 'utf8'));

console.log('=== SOP v3.0 台中市驗證 ===');
console.log('待驗證官網:', toVerify.length, '個\n');

const results = [];

async function verifyUrl(browser, info, index, total) {
  const mainVenue = info.venues[0];
  console.log(`\n[${index + 1}/${total}] ${mainVenue.name}`);
  console.log('官網:', info.url);
  
  const result = {
    url: info.url,
    venues: info.venues.map(v => ({ id: v.id, name: v.name })),
    status: '驗證中',
    issues: [],
    title: null,
    meetingLinks: [],
    meetingPageUrl: null,
    photos: []
  };
  
  const page = await browser.newPage();
  
  try {
    // Phase 1: 驗證官網
    console.log('  Phase 1: 驗證官網...');
    
    await page.goto(info.url, { 
      waitUntil: 'domcontentloaded', 
      timeout: 30000 
    });
    await page.waitForTimeout(3000);
    
    const title = await page.title();
    result.title = title;
    
    // 檢查標題是否匹配
    let titleMatch = false;
    for (const venue of info.venues) {
      const name = venue.name.replace(/[()（）]/g, ' ').split(/\s+/)[0];
      if (title.toLowerCase().includes(name.toLowerCase())) {
        titleMatch = true;
        break;
      }
    }
    
    if (!titleMatch) {
      console.log('  ⚠️ 標題不完全匹配:', title.slice(0, 50));
    } else {
      console.log('  ✅ 標題匹配');
    }
    
    // Phase 2: 尋找會議室頁面
    console.log('  Phase 2: 尋找會議室頁面...');
    
    const meetingKeywords = ['會議', '會議室', '宴會', '場地', '租借', '活動', '廳', '空間',
                             'meeting', 'conference', 'venue', 'banquet', 'event', 'space', 'room'];
    
    const meetingLinks = await page.evaluate((keywords) => {
      const links = Array.from(document.querySelectorAll('a'));
      return links
        .filter(a => {
          const text = (a.textContent || '').toLowerCase();
          const href = (a.href || '').toLowerCase();
          return keywords.some(k => text.includes(k) || href.includes(k));
        })
        .map(a => ({
          text: (a.textContent || '').trim().slice(0, 50),
          href: a.href
        }))
        .filter(link => link.href && link.href.startsWith('http'))
        .slice(0, 10);
    }, meetingKeywords);
    
    if (meetingLinks.length > 0) {
      console.log('  ✅ 找到', meetingLinks.length, '個可能的會議室頁面');
      result.meetingLinks = meetingLinks;
      
      // Phase 3: 開啟會議室頁面
      console.log('  Phase 3: 開啟會議室頁面...');
      
      try {
        await page.goto(meetingLinks[0].href, { 
          waitUntil: 'domcontentloaded', 
          timeout: 20000 
        });
        await page.waitForTimeout(3000);
        
        result.meetingPageUrl = meetingLinks[0].href;
        
        // 滾動頁面
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(2000);
        
        // Phase 4: 抓取照片
        console.log('  Phase 4: 抓取會議室照片...');
        
        const photos = await page.evaluate(() => {
          const imgs = Array.from(document.querySelectorAll('img'));
          return imgs
            .filter(img => 
              img.src && 
              img.width > 200 && 
              img.height > 150 &&
              !img.src.includes('logo') &&
              !img.src.includes('icon') &&
              !img.src.endsWith('.svg')
            )
            .map(img => img.src)
            .slice(0, 10);
        });
        
        if (photos.length > 0) {
          console.log('  ✅ 找到', photos.length, '張照片');
          result.photos = photos;
        } else {
          console.log('  ⚠️ 未找到會議室照片');
          result.issues.push('缺少會議室照片');
        }
        
      } catch (e) {
        console.log('  ⚠️ 無法開啟會議室頁面');
        result.issues.push('會議室頁面無法開啟');
      }
      
    } else {
      console.log('  ⚠️ 找不到會議室頁面');
      result.issues.push('找不到會議室頁面');
    }
    
    // 判定狀態
    if (result.issues.length === 0 && result.photos.length > 0) {
      result.status = 'OK';
    } else if (result.meetingPageUrl) {
      result.status = '部分OK';
    } else {
      result.status = '有問題';
    }
    
    // 更新場地資料
    info.venues.forEach(v => {
      v.lastVerified = new Date().toISOString();
      v.verifiedTitle = title;
      if (result.meetingPageUrl) {
        v.meetingPageUrl = result.meetingPageUrl;
      }
      if (result.photos.length > 0) {
        v.images = {
          main: result.photos[0],
          gallery: result.photos,
          source: result.meetingPageUrl || info.url,
          verified: true,
          verifiedAt: new Date().toISOString()
        };
      }
    });
    
  } catch (err) {
    console.log('  ❌ 錯誤:', err.message.slice(0, 50));
    result.status = '錯誤';
    result.error = err.message;
    result.issues.push(err.message);
    
    info.venues.forEach(v => {
      v.lastVerified = new Date().toISOString();
      v.verificationError = err.message;
    });
  }
  
  await page.close();
  return result;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  
  const batchSize = 5;
  
  for (let i = 0; i < toVerify.length; i += batchSize) {
    const batch = toVerify.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(toVerify.length / batchSize);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`批次 ${batchNum}/${totalBatches}`);
    console.log('='.repeat(60));
    
    for (let j = 0; j < batch.length; j++) {
      const result = await verifyUrl(browser, batch[j], i + j, toVerify.length);
      results.push(result);
      await new Promise(r => setTimeout(r, 2000));
    }
    
    // 儲存進度
    fs.writeFileSync('venues-all-cities.json', JSON.stringify(data, null, 2));
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    fs.writeFileSync(`taichung-verify-progress-${timestamp}.json`, JSON.stringify(results, null, 2));
    
    // 進度報告
    const ok = results.filter(r => r.status === 'OK').length;
    const partial = results.filter(r => r.status === '部分OK').length;
    const problems = results.filter(r => r.status === '有問題' || r.status === '錯誤').length;
    
    console.log(`\n📊 進度: ${results.length}/${toVerify.length}`);
    console.log(`   OK: ${ok} | 部分OK: ${partial} | 有問題: ${problems}`);
  }
  
  await browser.close();
  
  // 最終統計
  console.log(`\n${'='.repeat(60)}`);
  console.log('=== 最終統計 ===');
  console.log('='.repeat(60));
  console.log('總官網:', results.length);
  console.log('OK:', results.filter(r => r.status === 'OK').length);
  console.log('部分OK:', results.filter(r => r.status === '部分OK').length);
  console.log('有問題:', results.filter(r => r.status === '有問題').length);
  console.log('錯誤:', results.filter(r => r.status === '錯誤').length);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  fs.writeFileSync(`taichung-verify-final-${timestamp}.json`, JSON.stringify(results, null, 2));
  fs.writeFileSync('venues-all-cities.json', JSON.stringify(data, null, 2));
  
  console.log('\n✅ 台中市驗證完成');
}

main();
