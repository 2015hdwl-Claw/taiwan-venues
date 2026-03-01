const https = require('https');
const fs = require('fs');

// 讀取搜尋清單
const toSearch = JSON.parse(fs.readFileSync('venues-unique-search.json', 'utf8'));
const data = JSON.parse(fs.readFileSync('venues-all-cities.json', 'utf8'));

console.log('=== 使用 Google 搜尋官網 ===');
console.log('待搜尋:', toSearch.length, '個場地\n');

// Google 搜尋
function searchGoogle(query) {
  return new Promise((resolve, reject) => {
    // 使用 Google 的搜尋 URL
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=10&hl=zh-TW`;
    
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache'
      }
    };
    
    https.get(url, options, (res) => {
      let html = '';
      res.on('data', chunk => html += chunk);
      res.on('end', () => {
        try {
          // 解析 HTML 提取 URL
          const urls = [];
          
          // 提取所有 URL
          const urlRegex = /href="([^"]*)"/g;
          let match;
          
          while ((match = urlRegex.exec(html)) !== null) {
            let url = match[1];
            
            // 提取真實 URL
            if (url.includes('/url?q=')) {
              const urlMatch = url.match(/\/url\?q=([^&]+)/);
              if (urlMatch) {
                url = decodeURIComponent(urlMatch[1]);
              }
            }
            
            // 過濾有效的 URL
            if (url.startsWith('http') && 
                !url.includes('google.com') &&
                !url.includes('googleusercontent.com') &&
                !url.includes('webcache.googleusercontent.com') &&
                !url.includes('schema.org')) {
              urls.push(url.split('&')[0]);
            }
          }
          
          // 去重
          const uniqueUrls = [...new Set(urls)].slice(0, 10);
          resolve(uniqueUrls);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

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

// 搜尋結果
const results = [];

// 處理單一場地
async function searchVenue(venue, index, total) {
  console.log(`\n[${index + 1}/${total}] ${venue.name}`);
  console.log('原官網:', venue.originalUrl);
  
  const result = {
    id: venue.id,
    name: venue.name,
    originalUrl: venue.originalUrl,
    error: venue.error,
    foundUrl: null,
    candidates: [],
    status: '搜尋中'
  };
  
  try {
    // 搜尋
    console.log('  搜尋中...');
    const urls = await searchGoogle(`${venue.name} 台北 官網`);
    
    console.log('    找到', urls.length, '個候選');
    result.candidates = urls.slice(0, 5);
    
    // 選擇最佳
    const best = selectBestUrl(venue.name, urls);
    
    if (best) {
      console.log('    ✅ 最佳:', best);
      result.foundUrl = best;
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
  
  return result;
}

// 主程式
async function main() {
  for (let i = 0; i < toSearch.length; i++) {
    const result = await searchVenue(toSearch[i], i, toSearch.length);
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
    
    // 間隔（避免被阻擋）
    await new Promise(r => setTimeout(r, 2000));
    
    // 每 10 個儲存進度
    if ((i + 1) % 10 === 0) {
      console.log(`\n📊 進度: ${i + 1}/${toSearch.length}`);
      const found = results.filter(r => r.foundUrl).length;
      console.log(`   已找到: ${found}`);
      
      fs.writeFileSync('venues-all-cities.json', JSON.stringify(data, null, 2));
    }
  }
  
  // 最終統計
  console.log(`\n${'='.repeat(60)}`);
  console.log('=== 最終統計 ===');
  console.log('='.repeat(60));
  console.log('總場地:', results.length);
  console.log('已找到:', results.filter(r => r.foundUrl).length);
  console.log('未找到:', results.filter(r => !r.foundUrl).length);
  console.log('錯誤:', results.filter(r => r.status === '錯誤').length);
  
  // 儲存結果
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  fs.writeFileSync(`google-search-${timestamp}.json`, JSON.stringify(results, null, 2));
  fs.writeFileSync('venues-all-cities.json', JSON.stringify(data, null, 2));
  
  console.log('\n✅ 搜尋完成');
}

main();
