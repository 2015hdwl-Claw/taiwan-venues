// 自動批次抓取 - 依照 SOP
const { execSync } = require('child_process');
const fs = require('fs');

const pending = JSON.parse(fs.readFileSync('pending-venues.json', 'utf8'));
const results = [];
const startTime = Date.now();

console.log(`=== 開始批次抓取 ===`);
console.log(`時間: ${new Date().toLocaleTimeString('zh-TW')}`);
console.log(`待處理: ${pending.length} 個場地\n`);

for (let i = 0; i < Math.min(10, pending.length); i++) {
  const venue = pending[i];
  console.log(`[${i + 1}/10] ${venue.name}`);
  
  try {
    // Step 1: 開啟官網
    const openResult = execSync(`agent-browser open "${venue.url}" --timeout 15000 2>&1`, { 
      encoding: 'utf8', timeout: 20000, stdio: ['pipe', 'pipe', 'pipe'] 
    });
    
    // Step 2: 抓取照片
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
    console.log(`  ❌ 失敗\n`);
  }
  
  // 每 10 分鐘回報
  if ((i + 1) % 5 === 0) {
    const elapsed = Math.round((Date.now() - startTime) / 1000 / 60);
    const success = results.filter(r => r.status === 'success').length;
    console.log(`--- 進度回報 ---`);
    console.log(`已處理: ${i + 1}/10`);
    console.log(`成功: ${success}`);
    console.log(`耗時: ${elapsed} 分鐘\n`);
  }
}

// 儲存結果
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
fs.writeFileSync(`batch-results-${timestamp}.json`, JSON.stringify(results, null, 2));

// 總結
const success = results.filter(r => r.status === 'success');
const total = Math.round((Date.now() - startTime) / 1000);

console.log(`\n=== 批次完成 ===`);
console.log(`處理: ${results.length} 個`);
console.log(`成功: ${success.length} 個`);
console.log(`耗時: ${Math.floor(total / 60)}分${total % 60}秒`);
console.log(`結果: batch-results-${timestamp}.json`);
