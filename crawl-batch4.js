const { execSync } = require('child_process');
const fs = require('fs');

const pending = JSON.parse(fs.readFileSync('pending-venues.json', 'utf8'));
const batch = pending.slice(20, 30);
const results = [];

console.log(`=== 第四批 (21-30) ===`);
console.log(`時間: ${new Date().toLocaleTimeString('zh-TW')}\n`);

for (let i = 0; i < batch.length; i++) {
  const venue = batch[i];
  console.log(`[${i + 1}/10] ${venue.name}`);
  
  try {
    // 快速測試
    execSync(`agent-browser open "${venue.url}" --timeout 10000 2>&1`, { 
      encoding: 'utf8', timeout: 15000, stdio: ['pipe', 'pipe', 'pipe'] 
    });
    
    const photoResult = execSync(`agent-browser eval "Array.from(document.querySelectorAll('img')).filter(i=>i.src&&i.width>100).map(i=>i.src).slice(0,5).join('|||')" 2>&1`, { 
      encoding: 'utf8', timeout: 10000 
    });
    
    let photos = [];
    const photoMatch = photoResult.match(/https?:\/\/[^"|]+/g);
    if (photoMatch) {
      photos = photoMatch.filter(url => !url.includes('logo') && !url.includes('icon')).slice(0, 3);
    }
    
    results.push({ name: venue.name, url: venue.url, photos, status: 'success' });
    console.log(`  ✅ ${photos.length} 張\n`);
    
  } catch (err) {
    results.push({ name: venue.name, url: venue.url, error: err.message.slice(0, 50), status: 'failed' });
    console.log(`  ❌\n`);
  }
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
fs.writeFileSync(`batch4-results-${timestamp}.json`, JSON.stringify(results, null, 2));

const success = results.filter(r => r.status === 'success' && r.photos?.length > 0).length;
console.log(`完成: ${success}/10`);
