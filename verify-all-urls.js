const { chromium } = require('playwright');
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('venues-all-cities.json', 'utf8'));

// 過濾待驗證場地
const toVerify = data.filter(v => {
  return v.status === '上架' && v.url && !v.lastVerified;
});

// 按官網去重
const uniqueUrls = new Map();
toVerify.forEach(v => {
  if (!uniqueUrls.has(v.url)) {
    uniqueUrls.set(v.url, {
      url: v.url,
      venues: [v]
    });
  } else {
    uniqueUrls.get(v.url).venues.push(v);
  }
});

console.log('=== SOP v3.0 官網驗證 ===');
console.log('待驗證場地:', toVerify.length);
console.log('唯一官網:', uniqueUrls.size, '\n');

// 結果
const results = [];

// 驗證單一官網
async function verifyUrl(browser, url, venues, index, total) {
  const mainVenue = venues[0];
  console.log(`\n[${index + 1}/${total}] ${mainVenue.name}`);
  console.log('官網:', url);
  console.log('場地數:', venues.length);
  
  const result = {
    url: url,
    venues: venues.map(v => ({ id: v.id, name: v.name })),
    status: '驗證中',
    issues: [],
    title: null,
    meetingLinks: []
  };
  
  const page = await browser.newPage();
  
  try {
    // Phase 1: 驗證官網
    console.log('  Phase 1: 驗證官網...');
    
    await page.goto(url, { 
      waitUntil: 'domcontentloaded', 
      timeout: 20000 
    });
    await page.waitForTimeout(2000);
    
    const title = await page.title();
    result.title = title;
    
    // 檢查標題是否匹配
    let titleMatch = false;
    for (const venue of venues) {
      const name = venue.name.replace(/[()（）]/g, ' ').split(/\s+/)[0];
      if (title.toLowerCase().includes(name.toLowerCase())) {
        titleMatch = true;
        break;
      }
    }
    
    if (!titleMatch) {
      console.log('  ❌ 標題不匹配');
      console.log('    場地:', venues[0].name);
      console.log('    標題:', title);
      result.issues.push('官網標題不匹配');
    } else {
      console.log('  ✅ 標題匹配');
    }
    
    // Phase 2: 尋找會議室頁面
    console.log('  Phase 2: 尋找會議室頁面...');
    
    const meetingKeywords = ['會議', '會議室', '宴會', '場地', '租借', '活動', '廳', 
                             'meeting', 'conference', 'venue', 'banquet', 'event', 'space'];
    
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
        .slice(0, 5);
    }, meetingKeywords);
    
    if (meetingLinks.length > 0) {
      console.log('  ✅ 找到', meetingLinks.length, '個可能的會議室頁面');
      result.meetingLinks = meetingLinks;
    } else {
      console.log('  ❌ 找不到會議室頁面');
      result.issues.push('找不到會議室頁面');
    }
    
    // 判定狀態
    if (result.issues.length === 0) {
      result.status = 'OK';
    } else if (result.issues.length === 1 && result.issues[0] === '找不到會議室頁面') {
      result.status = '無會議室頁面';
    } else {
      result.status = '有問題';
    }
    
    // 更新場地資料
    venues.forEach(v => {
      v.lastVerified = new Date().toISOString();
      v.verifiedTitle = title;
      if (meetingLinks.length > 0) {
        v.meetingPageUrl = meetingLinks[0].href;
      }
    });
    
  } catch (err) {
    console.log('  ❌ 錯誤:', err.message);
    result.status = '錯誤';
    result.error = err.message;
    result.issues.push(err.message);
    
    venues.forEach(v => {
      v.lastVerified = new Date().toISOString();
      v.verificationError = err.message;
    });
  }
  
  await page.close();
  return result;
}

// 主程式
async function main() {
  const browser = await chromium.launch({ headless: true });
  const urls = Array.from(uniqueUrls.values());
  
  // 分批處理
  const batchSize = 10;
  
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(urls.length / batchSize);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`批次 ${batchNum}/${totalBatches}`);
    console.log('='.repeat(60));
    
    for (let j = 0; j < batch.length; j++) {
      const result = await verifyUrl(browser, batch[j].url, batch[j].venues, i + j, urls.length);
      results.push(result);
      
      // 間隔
      await new Promise(r => setTimeout(r, 1500));
    }
    
    // 儲存進度
    fs.writeFileSync('venues-all-cities.json', JSON.stringify(data, null, 2));
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    fs.writeFileSync(`verify-progress-${timestamp}.json`, JSON.stringify(results, null, 2));
    
    // 進度報告
    const ok = results.filter(r => r.status === 'OK').length;
    const problems = results.filter(r => r.status === '有問題' || r.status === '錯誤').length;
    const noMeeting = results.filter(r => r.status === '無會議室頁面').length;
    
    console.log(`\n📊 進度: ${results.length}/${urls.length}`);
    console.log(`   OK: ${ok}`);
    console.log(`   無會議室頁面: ${noMeeting}`);
    console.log(`   有問題: ${problems}`);
  }
  
  await browser.close();
  
  // 最終統計
  console.log(`\n${'='.repeat(60)}`);
  console.log('=== 最終統計 ===');
  console.log('='.repeat(60));
  console.log('總官網:', results.length);
  console.log('OK:', results.filter(r => r.status === 'OK').length);
  console.log('無會議室頁面:', results.filter(r => r.status === '無會議室頁面').length);
  console.log('有問題:', results.filter(r => r.status === '有問題').length);
  console.log('錯誤:', results.filter(r => r.status === '錯誤').length);
  
  // 儲存最終結果
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  fs.writeFileSync(`verify-final-${timestamp}.json`, JSON.stringify(results, null, 2));
  fs.writeFileSync('venues-all-cities.json', JSON.stringify(data, null, 2));
  
  console.log('\n✅ 驗證完成');
}

main();
