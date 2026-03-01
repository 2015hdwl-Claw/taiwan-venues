const { execSync } = require('child_process');
const fs = require('fs');

const pending = JSON.parse(fs.readFileSync('pending-venues.json', 'utf8'));
const results = [];
const startIdx = 10; // 第二批從第 11 個開始

console.log(`=== 第二批抓取 (11-20) ===`);
console.log(`時間: ${new Date().toLocaleTimeString('zh-TW')}\n`);

for (let i = startIdx; i < Math.min(startIdx + 10, pending.length); i++) {
  const venue = pending[i];
  console.log(`[${i + 1 - startIdx}/10] ${venue.name}`);
  
  try {
    // 先測試網址是否可達
    try {
      execSync(`curl -I "${venue.url}" --connect-timeout 5 2>&1 | head -1`, { 
        encoding: 'utf8', timeout: 8000, stdio: ['pipe', 'pipe', 'pipe'] 
      });
    } catch (e) {
      console.log(`  ⚠️ 網址無法連線，跳過\n`);
      results.push({ name: venue.name, url: venue.url, status: 'unreachable' });
      continue;
    }
    
    // 開啟官網
    execSync(`agent-browser open "${venue.url}" --timeout 15000 2>&1`, { 
      encoding: 'utf8', timeout: 20000, stdio: ['pipe', 'pipe', 'pipe'] 
    });
    
    // 抓取照片
    const photoResult = execSync(`agent-browser eval "Array.from(document.querySelectorAll('img')).filter(i=>i.src&&i.width>100).map(i=>i.src).slice(0,10).join('|||')" 2>&1`, { 
      encoding: 'utf8', timeout: 15000 
    });
    
    let photos = [];
    const photoMatch = photoResult.match(/https?:\/\/[^"|]+/g);
    if (photoMatch) {
      photos = photoMatch.filter(url => !url.includes('logo') && !url.includes('icon')).slice(0, 5);
    }
    
    results.push({ name: venue.name, url: venue.url, photos, status: 'success' });
    console.log(`  ✅ 照片: ${photos.length} 張\n`);
    
  } catch (err) {
    results.push({ name: venue.name, url: venue.url, error: err.message.slice(0, 100), status: 'failed' });
    console.log(`  ❌ 失敗: ${err.message.slice(0, 50)}\n`);
  }
}

// 儲存結果
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
fs.writeFileSync(`batch2-results-${timestamp}.json`, JSON.stringify(results, null, 2));

const success = results.filter(r => r.status === 'success').length;
console.log(`\n=== 第二批完成 ===`);
console.log(`處理: ${results.length}, 成功: ${success}, 失敗: ${results.length - success - results.filter(r => r.status === 'unreachable').length}, 無法連線: ${results.filter(r => r.status === 'unreachable').length}`);
