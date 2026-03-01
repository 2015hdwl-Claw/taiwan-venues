const https = require('https');
const fs = require('fs');

// 讀取搜尋清單
const toSearch = JSON.parse(fs.readFileSync('venues-unique-search.json', 'utf8'));
const data = JSON.parse(fs.readFileSync('venues-all-cities.json', 'utf8'));

console.log('=== 使用 DuckDuckGo 搜尋官網 ===');
console.log('待搜尋:', toSearch.length, '個場地\n');

// DuckDuckGo 搜尋
function searchDuckDuckGo(query) {
  return new Promise((resolve, reject) => {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
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
    abstract: null,
    status: '搜尋中'
  };
  
  try {
    // 1. 搜尋場地名稱
    console.log('  1. 搜尋場地名稱...');
    const searchData = await searchDuckDuckGo(`${venue.name} 台北`);
    
    if (searchData.AbstractURL) {
      console.log('    ✅ 找到:', searchData.AbstractURL);
      result.foundUrl = searchData.AbstractURL;
      result.abstract = searchData.Abstract?.slice(0, 100);
      result.status = '已找到';
    } else if (searchData.Results && searchData.Results.length > 0) {
      // 從 Results 中找官網
      const official = searchData.Results.find(r => 
        !r.FirstURL.includes('facebook.com') &&
        !r.FirstURL.includes('wikipedia.org') &&
        !r.FirstURL.includes('tripadvisor')
      );
      
      if (official) {
        console.log('    ✅ 找到:', official.FirstURL);
        result.foundUrl = official.FirstURL;
        result.status = '已找到';
      } else {
        console.log('    ❌ 未找到官網');
        result.status = '未找到';
      }
    } else {
      console.log('    ❌ 未找到');
      result.status = '未找到';
    }
    
    // 2. 如果沒找到，嘗試加上「官網」關鍵字
    if (!result.foundUrl) {
      console.log('  2. 嘗試搜尋「官網」...');
      const searchData2 = await searchDuckDuckGo(`${venue.name} 官網`);
      
      if (searchData2.AbstractURL) {
        console.log('    ✅ 找到:', searchData2.AbstractURL);
        result.foundUrl = searchData2.AbstractURL;
        result.abstract = searchData2.Abstract?.slice(0, 100);
        result.status = '已找到（官網搜尋）';
      } else {
        console.log('    ❌ 未找到');
      }
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
    
    // 間隔
    await new Promise(r => setTimeout(r, 1000));
    
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
  
  // 儲存結果
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  fs.writeFileSync(`ddg-search-${timestamp}.json`, JSON.stringify(results, null, 2));
  fs.writeFileSync('venues-all-cities.json', JSON.stringify(data, null, 2));
  
  console.log('\n✅ 搜尋完成');
}

main();
