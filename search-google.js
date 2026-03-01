const { chromium } = require('playwright');
const fs = require('fs');

// 讀取資料
const toSearch = JSON.parse(fs.readFileSync('venues-really-need-search.json', 'utf8'));
const data = JSON.parse(fs.readFileSync('venues-all-cities.json', 'utf8'));

console.log('=== 重新搜尋正確官網 ===');
console.log('待搜尋:', toSearch.length, '個場地\n');

// 搜尋結果
const results = [];

// 搜尋單一場地
async function searchVenue(browser, venue, index, total) {
  console.log(`\n[${index + 1}/${total}] ${venue.name}`);
  console.log('原官網:', venue.originalUrl);
  console.log('錯誤:', venue.error?.slice(0, 50));
  
  const result = {
    id: venue.id,
    name: venue.name,
    originalUrl: venue.originalUrl,
    error: venue.error,
    foundUrl: null,
    googleMaps: null,
    facebook: null,
    status: '搜尋中'
  };
  
  const page = await browser.newPage();
  
  try {
    // 1. Google 搜尋
    console.log('  1. Google 搜尋...');
    const searchQuery = encodeURIComponent(venue.name + ' 台北');
    const googleUrl = `https://www.google.com/search?q=${searchQuery}&num=10`;
    
    await page.goto(googleUrl, { 
      waitUntil: 'domcontentloaded', 
      timeout: 20000 
    });
    await page.waitForTimeout(2000);
    
    // 提取搜尋結果
    const searchResults = await page.evaluate(() => {
      const results = [];
      
      // 嘗試多種選擇器
      const selectors = [
        'div.g a[href^="http"]',
        'a[href^="/url?q="]',
        '#search a[href^="http"]'
      ];
      
      for (const selector of selectors) {
        const links = Array.from(document.querySelectorAll(selector));
        
        links.forEach(link => {
          let url = link.href;
          const text = link.textContent.trim();
          
          // 提取真實 URL
          if (url.includes('/url?q=')) {
            const match = url.match(/\/url\?q=([^&]+)/);
            if (match) {
              url = decodeURIComponent(match[1]);
            }
          }
          
          // 過濾
          if (url.startsWith('http') && 
              !url.includes('google.com') &&
              text.length > 2) {
            results.push({
              url: url.split('&')[0],
              text: text.slice(0, 50)
            });
          }
        });
        
        if (results.length > 0) break;
      }
      
      // 去重
      const seen = new Set();
      return results.filter(r => {
        if (seen.has(r.url)) return false;
        seen.add(r.url);
        return true;
      }).slice(0, 10);
    });
    
    console.log('    找到', searchResults.length, '個結果');
    
    // 2. 選擇最佳官網
    console.log('  2. 選擇最佳官網...');
    
    // 排除的網域
    const excludeDomains = [
      'facebook.com', 'instagram.com', 'twitter.com', 'line.me',
      'tripadvisor', 'booking.com', 'agoda', 'klook', 'kkday',
      'youtube.com', 'linkedin.com', 'wikipedia.org'
    ];
    
    // 優先的網域
    const priorityDomains = ['.com.tw', '.tw', '.edu.tw', '.gov.tw'];
    
    let bestMatch = null;
    let bestScore = -100;
    
    const venueKeywords = venue.name.toLowerCase()
      .replace(/[()（）]/g, ' ')
      .split(/\s+/)
      .filter(k => k.length > 2);
    
    searchResults.forEach(r => {
      let score = 0;
      const urlLower = r.url.toLowerCase();
      
      // 排除社群媒體和訂房網站
      if (excludeDomains.some(d => urlLower.includes(d))) {
        score -= 100;
      }
      
      // 優先台灣網域
      if (priorityDomains.some(d => urlLower.includes(d))) {
        score += 10;
      }
      
      // 檢查關鍵字匹配
      venueKeywords.forEach(keyword => {
        if (urlLower.includes(keyword)) {
          score += 5;
        }
      });
      
      // 檢查文字匹配
      const textLower = r.text.toLowerCase();
      venueKeywords.forEach(keyword => {
        if (textLower.includes(keyword)) {
          score += 3;
        }
      });
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = r.url;
      }
    });
    
    if (bestMatch) {
      console.log('    ✅ 找到:', bestMatch);
      result.foundUrl = bestMatch;
      result.status = '已找到';
    } else if (searchResults.length > 0) {
      console.log('    ⚠️ 使用第一個結果:', searchResults[0].url);
      result.foundUrl = searchResults[0].url;
      result.status = '已找到（未驗證）';
    } else {
      console.log('    ❌ 未找到');
      result.status = '未找到';
    }
    
    // 3. Google Maps
    console.log('  3. Google Maps...');
    try {
      const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(venue.name)}`;
      await page.goto(mapsUrl, { 
        waitUntil: 'domcontentloaded', 
        timeout: 15000 
      });
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/place/') || currentUrl.includes('/search/')) {
        console.log('    ✅ 找到 Google Maps');
        result.googleMaps = currentUrl;
      } else {
        console.log('    ❌ 未找到');
      }
    } catch (e) {
      console.log('    ⚠️ 錯誤:', e.message.slice(0, 30));
    }
    
    // 4. Facebook（選擇性）
    if (!result.foundUrl) {
      console.log('  4. Facebook...');
      try {
        const fbUrl = `https://www.facebook.com/search/pages?q=${encodeURIComponent(venue.name)}`;
        await page.goto(fbUrl, { 
          waitUntil: 'domcontentloaded', 
          timeout: 10000 
        });
        await page.waitForTimeout(2000);
        
        const fbLink = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a[href*="facebook.com/"]'));
          const first = links.find(a => 
            a.href.includes('/pages/') || 
            !a.href.includes('/search/')
          );
          return first ? first.href : null;
        });
        
        if (fbLink) {
          console.log('    ✅ 找到 Facebook');
          result.facebook = fbLink;
        } else {
          console.log('    ❌ 未找到');
        }
      } catch (e) {
        console.log('    ⚠️ 錯誤:', e.message.slice(0, 30));
      }
    }
    
  } catch (err) {
    console.log('  ❌ 搜尋錯誤:', err.message.slice(0, 50));
    result.status = '錯誤';
    result.error = err.message;
  }
  
  await page.close();
  return result;
}

// 主程式
async function main() {
  const browser = await chromium.launch({ headless: true });
  
  // 分批處理
  const batchSize = 10;
  
  for (let i = 0; i < toSearch.length; i += batchSize) {
    const batch = toSearch.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(toSearch.length / batchSize);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`批次 ${batchNum}/${totalBatches}`);
    console.log('='.repeat(60));
    
    for (let j = 0; j < batch.length; j++) {
      const result = await searchVenue(browser, batch[j], i + j, toSearch.length);
      results.push(result);
      
      // 更新資料庫
      if (result.foundUrl) {
        const venue = data.find(v => v.id === result.id);
        if (venue) {
          venue.url = result.foundUrl;
          venue.googleMaps = result.googleMaps;
          venue.facebook = result.facebook;
          venue.lastSearched = new Date().toISOString();
          venue.status = '上架';
        }
      }
      
      // 間隔
      await new Promise(r => setTimeout(r, 2000));
    }
    
    // 儲存進度
    fs.writeFileSync('venues-all-cities.json', JSON.stringify(data, null, 2));
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    fs.writeFileSync(`search-progress-${timestamp}.json`, JSON.stringify(results, null, 2));
    
    // 進度報告
    const found = results.filter(r => r.foundUrl).length;
    console.log(`\n📊 進度: ${results.length}/${toSearch.length}`);
    console.log(`   已找到: ${found}`);
    console.log(`   成功率: ${Math.round(found/results.length*100)}%`);
  }
  
  await browser.close();
  
  // 最終統計
  console.log(`\n${'='.repeat(60)}`);
  console.log('=== 最終統計 ===');
  console.log('='.repeat(60));
  console.log('總場地:', results.length);
  console.log('已找到:', results.filter(r => r.foundUrl).length);
  console.log('有 Google Maps:', results.filter(r => r.googleMaps).length);
  console.log('有 Facebook:', results.filter(r => r.facebook).length);
  
  // 儲存最終結果
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  fs.writeFileSync(`search-final-${timestamp}.json`, JSON.stringify(results, null, 2));
  fs.writeFileSync('venues-all-cities.json', JSON.stringify(data, null, 2));
  
  console.log('\n✅ 搜尋完成');
}

main();
