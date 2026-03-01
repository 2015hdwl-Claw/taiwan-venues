const { chromium } = require('playwright');
const fs = require('fs');

// 讀取搜尋清單
const toSearch = JSON.parse(fs.readFileSync('venues-unique-search.json', 'utf8'));
const data = JSON.parse(fs.readFileSync('venues-all-cities.json', 'utf8'));

console.log('=== 使用 Playwright 搜尋官網 ===');
console.log('待搜尋:', toSearch.length, '個場地\n');

// 搜尋結果
const results = [];

// 選擇最佳官網
function selectBestUrl(venueName, urls) {
  if (!urls || urls.length === 0) return null;
  
  const excludeDomains = [
    'facebook.com', 'instagram.com', 'twitter.com', 'line.me',
    'tripadvisor', 'booking.com', 'agoda', 'klook', 'kkday',
    'youtube.com', 'linkedin.com', 'wikipedia.org', 'ltn.com.tw',
    'udn.com', 'chinatimes.com', 'ettoday.net'
  ];
  
  const priorityDomains = ['.com.tw', '.tw', '.edu.tw', '.gov.tw'];
  
  // 提取場地名稱關鍵字
  const keywords = venueName.toLowerCase()
    .replace(/[()（）]/g, ' ')
    .replace(/台北/g, '')
    .split(/\s+/)
    .filter(k => k.length > 2);
  
  let bestUrl = null;
  let bestScore = -1000;
  
  urls.forEach(url => {
    let score = 0;
    const urlLower = url.toLowerCase();
    
    // 排除社群媒體和新聞網站
    if (excludeDomains.some(d => urlLower.includes(d))) {
      score -= 100;
    }
    
    // 優先台灣網域
    if (priorityDomains.some(d => urlLower.includes(d))) {
      score += 20;
    }
    
    // 檢查關鍵字匹配
    keywords.forEach(keyword => {
      if (urlLower.includes(keyword)) {
        score += 10;
      }
    });
    
    if (score > bestScore) {
      bestScore = score;
      bestUrl = url;
    }
  });
  
  // 如果最好的分數太低，返回 null
  if (bestScore < 0) return null;
  
  return bestUrl;
}

// 搜尋單一場地
async function searchVenue(browser, venue, index, total) {
  console.log(`\n[${index + 1}/${total}] ${venue.name}`);
  console.log('原官網:', venue.originalUrl);
  
  const result = {
    id: venue.id,
    name: venue.name,
    originalUrl: venue.originalUrl,
    error: venue.error,
    foundUrl: null,
    googleMaps: null,
    candidates: [],
    status: '搜尋中'
  };
  
  const page = await browser.newPage();
  
  try {
    // 設定更真實的瀏覽器行為
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7'
    });
    
    // 1. Google 搜尋
    console.log('  1. Google 搜尋...');
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(venue.name + ' 台北 官網')}&num=10&hl=zh-TW`;
    
    await page.goto(searchUrl, { 
      waitUntil: 'domcontentloaded', 
      timeout: 20000 
    });
    await page.waitForTimeout(3000);
    
    // 檢查是否有驗證碼
    const title = await page.title();
    if (title.includes('驗證') || title.includes('recaptcha')) {
      console.log('    ⚠️ 遇到驗證碼，跳過');
      result.status = '驗證碼';
      await page.close();
      return result;
    }
    
    // 提取搜尋結果
    const searchResults = await page.evaluate(() => {
      const results = [];
      
      // 嘗試多種選擇器
      const links = Array.from(document.querySelectorAll('a[href^="http"], a[href^="/url"]'));
      
      links.forEach(link => {
        let url = link.href;
        
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
            !url.includes('googleusercontent.com') &&
            !url.includes('webcache.googleusercontent.com')) {
          results.push(url.split('&')[0]);
        }
      });
      
      // 去重
      return [...new Set(results)].slice(0, 15);
    });
    
    console.log('    找到', searchResults.length, '個候選');
    result.candidates = searchResults.slice(0, 5);
    
    // 選擇最佳
    const best = selectBestUrl(venue.name, searchResults);
    
    if (best) {
      console.log('    ✅ 最佳:', best);
      result.foundUrl = best;
      result.status = '已找到';
    }
    
    // 2. 如果沒找到，嘗試 Google Maps
    if (!result.foundUrl) {
      console.log('  2. Google Maps...');
      try {
        const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(venue.name)}`;
        await page.goto(mapsUrl, { 
          waitUntil: 'domcontentloaded', 
          timeout: 15000 
        });
        await page.waitForTimeout(2000);
        
        const currentUrl = page.url();
        if (currentUrl.includes('/place/')) {
          console.log('    ✅ 找到 Google Maps');
          result.googleMaps = currentUrl;
        }
      } catch (e) {
        console.log('    ⚠️ 錯誤:', e.message.slice(0, 30));
      }
    }
    
    if (!result.foundUrl && !result.googleMaps) {
      console.log('    ❌ 未找到');
      result.status = '未找到';
    }
    
  } catch (err) {
    console.log('  ❌ 錯誤:', err.message.slice(0, 50));
    result.status = '錯誤';
    result.error = err.message;
  }
  
  await page.close();
  return result;
}

// 主程式
async function main() {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--disable-blink-features=AutomationControlled']
  });
  
  // 分批處理
  const batchSize = 5;
  
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
          venue.lastSearched = new Date().toISOString();
          venue.status = '上架';
        }
      }
      
      if (result.googleMaps) {
        const venue = data.find(v => v.id === result.id);
        if (venue) {
          venue.googleMaps = result.googleMaps;
        }
      }
      
      // 間隔
      await new Promise(r => setTimeout(r, 3000));
    }
    
    // 儲存進度
    fs.writeFileSync('venues-all-cities.json', JSON.stringify(data, null, 2));
    
    const found = results.filter(r => r.foundUrl).length;
    const maps = results.filter(r => r.googleMaps).length;
    console.log(`\n📊 進度: ${results.length}/${toSearch.length}`);
    console.log(`   已找到官網: ${found}`);
    console.log(`   有 Google Maps: ${maps}`);
    
    // 儲存中繼結果
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    fs.writeFileSync(`search-progress-${timestamp}.json`, JSON.stringify(results, null, 2));
  }
  
  await browser.close();
  
  // 最終統計
  console.log(`\n${'='.repeat(60)}`);
  console.log('=== 最終統計 ===');
  console.log('='.repeat(60));
  console.log('總場地:', results.length);
  console.log('已找到官網:', results.filter(r => r.foundUrl).length);
  console.log('有 Google Maps:', results.filter(r => r.googleMaps).length);
  console.log('未找到:', results.filter(r => !r.foundUrl && !r.googleMaps).length);
  console.log('錯誤:', results.filter(r => r.status === '錯誤').length);
  
  // 儲存結果
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  fs.writeFileSync(`search-final-${timestamp}.json`, JSON.stringify(results, null, 2));
  fs.writeFileSync('venues-all-cities.json', JSON.stringify(data, null, 2));
  
  console.log('\n✅ 搜尋完成');
}

main();
