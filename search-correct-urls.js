const { chromium } = require('playwright');
const fs = require('fs');

// 讀取搜尋清單
const searchList = JSON.parse(fs.readFileSync('venues-to-search.json', 'utf8'));
const data = JSON.parse(fs.readFileSync('venues-all-cities.json', 'utf8'));

console.log('=== 重新搜尋正確官網 ===');
console.log('待搜尋:', searchList.length, '個場地\n');

// 搜尋結果
const searchResults = [];

// 搜尋單一場地
async function searchVenue(browser, venue, index, total) {
  console.log(`\n[${index + 1}/${total}] ${venue.name}`);
  console.log('原官網:', venue.originalUrl);
  
  const result = {
    id: venue.id,
    name: venue.name,
    originalUrl: venue.originalUrl,
    issue: venue.issue,
    foundUrls: [],
    googleMaps: null,
    facebook: null,
    bestMatch: null,
    status: '搜尋中'
  };
  
  const page = await browser.newPage();
  
  try {
    // 1. Google 搜尋
    console.log('  1. Google 搜尋...');
    const searchQuery = encodeURIComponent(venue.name + ' 官網');
    const googleUrl = `https://www.google.com/search?q=${searchQuery}&num=5`;
    
    await page.goto(googleUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    
    // 提取搜尋結果
    const searchLinks = await page.evaluate(() => {
      const results = [];
      const links = Array.from(document.querySelectorAll('a[href*="http"]'));
      
      links.forEach(link => {
        const href = link.href;
        const text = link.textContent.trim();
        
        // 過濾掉 Google 自己的連結
        if (href && 
            !href.includes('google.com') && 
            !href.includes('googleusercontent.com') &&
            !href.includes('webcache.googleusercontent.com') &&
            text.length > 3) {
          
          // 嘗試提取真實 URL
          let url = href;
          if (href.includes('/url?q=')) {
            const match = href.match(/\/url\?q=([^&]+)/);
            if (match) {
              url = decodeURIComponent(match[1]);
            }
          }
          
          if (url.startsWith('http')) {
            results.push({
              url: url.split('&')[0].split('?')[0],
              text: text.slice(0, 50)
            });
          }
        }
      });
      
      // 去重
      const seen = new Set();
      return results.filter(r => {
        if (seen.has(r.url)) return false;
        seen.add(r.url);
        return true;
      }).slice(0, 10);
    });
    
    console.log('    找到', searchLinks.length, '個結果');
    searchLinks.slice(0, 3).forEach((link, i) => {
      console.log(`      ${i + 1}. ${link.text}`);
      console.log(`         ${link.url}`);
    });
    
    result.foundUrls = searchLinks;
    
    // 2. Google Maps 搜尋
    console.log('  2. Google Maps 搜尋...');
    const mapsQuery = encodeURIComponent(venue.name);
    const mapsUrl = `https://www.google.com/maps/search/${mapsQuery}`;
    
    await page.goto(mapsUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);
    
    // 提取 Maps 資訊
    const mapsInfo = await page.evaluate(() => {
      // 嘗試找第一個結果
      const firstResult = document.querySelector('[data-item-id]');
      if (firstResult) {
        return {
          found: true,
          name: firstResult.textContent.slice(0, 100)
        };
      }
      
      // 或從 URL 提取
      const url = window.location.href;
      if (url.includes('/place/')) {
        return {
          found: true,
          url: url
        };
      }
      
      return { found: false };
    });
    
    if (mapsInfo.found) {
      console.log('    ✅ 找到 Google Maps');
      result.googleMaps = page.url();
    } else {
      console.log('    ❌ 未找到');
    }
    
    // 3. Facebook 搜尋
    console.log('  3. Facebook 搜尋...');
    const fbQuery = encodeURIComponent(venue.name);
    const fbUrl = `https://www.facebook.com/search/pages?q=${fbQuery}`;
    
    try {
      await page.goto(fbUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(2000);
      
      // 檢查是否找到粉絲專頁
      const fbInfo = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="/pages/"]'));
        if (links.length > 0) {
          return {
            found: true,
            url: links[0].href
          };
        }
        return { found: false };
      });
      
      if (fbInfo.found) {
        console.log('    ✅ 找到 Facebook 粉絲專頁');
        result.facebook = fbInfo.url;
      } else {
        console.log('    ❌ 未找到');
      }
    } catch (e) {
      console.log('    ⚠️ Facebook 搜尋失敗');
    }
    
    // 4. 選擇最佳匹配
    console.log('  4. 選擇最佳匹配...');
    
    const venueKeywords = venue.name.toLowerCase().split(/[\s\(]+/);
    
    // 優先順序：官網 > Google Maps > Facebook
    let bestMatch = null;
    let bestScore = 0;
    
    searchLinks.forEach(link => {
      let score = 0;
      
      // 檢查 URL 是否包含場地名稱關鍵字
      venueKeywords.forEach(keyword => {
        if (keyword.length > 2 && link.url.toLowerCase().includes(keyword)) {
          score += 10;
        }
      });
      
      // 檢查是否是常見的官方網域
      if (link.url.includes('.com.tw') || link.url.includes('.tw')) {
        score += 5;
      }
      
      // 排除社群媒體和訂房網站
      const excludeDomains = ['facebook.com', 'instagram.com', 'tripadvisor', 'booking.com', 'agoda', 'klook', 'kkday'];
      if (excludeDomains.some(d => link.url.includes(d))) {
        score -= 50;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = link.url;
      }
    });
    
    // 如果沒有好的匹配，使用第一個結果
    if (!bestMatch && searchLinks.length > 0) {
      bestMatch = searchLinks[0].url;
    }
    
    if (bestMatch) {
      console.log('    ✅ 最佳匹配:', bestMatch);
      result.bestMatch = bestMatch;
      result.status = '已找到';
    } else {
      console.log('    ❌ 未找到合適的官網');
      result.status = '未找到';
    }
    
  } catch (err) {
    console.log('  ❌ 錯誤:', err.message);
    result.status = '錯誤';
    result.error = err.message;
  }
  
  await page.close();
  return result;
}

// 主程式
async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  
  // 分批處理
  const batchSize = 10;
  
  for (let i = 0; i < searchList.length; i += batchSize) {
    const batch = searchList.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(searchList.length / batchSize);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`批次 ${batchNum}/${totalBatches}`);
    console.log('='.repeat(60));
    
    for (let j = 0; j < batch.length; j++) {
      const result = await searchVenue(browser, batch[j], i + j, searchList.length);
      results.push(result);
      
      // 間隔
      await new Promise(r => setTimeout(r, 2000));
    }
    
    // 儲存進度
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    fs.writeFileSync(`search-progress-${timestamp}.json`, JSON.stringify(results, null, 2));
    
    // 更新資料庫
    results.forEach(r => {
      if (r.bestMatch) {
        const venue = data.find(v => v.id === r.id);
        if (venue) {
          venue.url = r.bestMatch;
          venue.googleMaps = r.googleMaps;
          venue.facebook = r.facebook;
          venue.lastSearched = new Date().toISOString();
        }
      }
    });
    fs.writeFileSync('venues-all-cities.json', JSON.stringify(data, null, 2));
    
    // 進度報告
    const found = results.filter(r => r.bestMatch).length;
    console.log(`\n📊 進度: ${results.length}/${searchList.length}`);
    console.log(`   已找到: ${found}`);
  }
  
  await browser.close();
  
  // 最終統計
  const stats = {
    total: results.length,
    found: results.filter(r => r.bestMatch).length,
    notFound: results.filter(r => !r.bestMatch).length,
    errors: results.filter(r => r.status === '錯誤').length,
    withMaps: results.filter(r => r.googleMaps).length,
    withFacebook: results.filter(r => r.facebook).length
  };
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('=== 最終統計 ===');
  console.log('='.repeat(60));
  console.log('總場地:', stats.total);
  console.log('已找到:', stats.found);
  console.log('未找到:', stats.notFound);
  console.log('錯誤:', stats.errors);
  console.log('有 Google Maps:', stats.withMaps);
  console.log('有 Facebook:', stats.withFacebook);
  
  // 儲存最終結果
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  fs.writeFileSync(`search-final-${timestamp}.json`, JSON.stringify(results, null, 2));
  
  console.log('\n✅ 搜尋完成');
}

main();
