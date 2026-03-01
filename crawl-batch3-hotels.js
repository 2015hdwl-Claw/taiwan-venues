// 第三批：知名飯店（官網較穩定）
const { execSync } = require('child_process');
const fs = require('fs');

const hotels = [
  { name: "台北亞都麗緻大飯店", url: "https://www.landistpe.com" },
  { name: "台北喜來登大飯店", url: "https://www.sheraton-taipei.com" },
  { name: "台北君悅酒店", url: "https://www.grandhyatttaipei.com" },
  { name: "台北W飯店", url: "https://www.marriott.com/hotels/travel/tpegi-w-taipei" },
  { name: "台北國賓大飯店", url: "https://www.ambassadorhotel.com.tw" }
];

const results = [];

console.log(`=== 第三批：知名飯店 ===`);
console.log(`時間: ${new Date().toLocaleTimeString('zh-TW')}\n`);

for (let i = 0; i < hotels.length; i++) {
  const hotel = hotels[i];
  console.log(`[${i + 1}/${hotels.length}] ${hotel.name}`);
  
  try {
    execSync(`agent-browser open "${hotel.url}" --timeout 20000 2>&1`, { 
      encoding: 'utf8', timeout: 25000, stdio: ['pipe', 'pipe', 'pipe'] 
    });
    
    const photoResult = execSync(`agent-browser eval "Array.from(document.querySelectorAll('img')).filter(i=>i.src&&i.width>100).map(i=>i.src).slice(0,10).join('|||')" 2>&1`, { 
      encoding: 'utf8', timeout: 15000 
    });
    
    let photos = [];
    const photoMatch = photoResult.match(/https?:\/\/[^"|]+/g);
    if (photoMatch) {
      photos = photoMatch.filter(url => !url.includes('logo') && !url.includes('icon')).slice(0, 5);
    }
    
    results.push({ name: hotel.name, url: hotel.url, photos, status: 'success' });
    console.log(`  ✅ 照片: ${photos.length} 張\n`);
    
  } catch (err) {
    results.push({ name: hotel.name, url: hotel.url, error: err.message.slice(0, 100), status: 'failed' });
    console.log(`  ❌ 失敗\n`);
  }
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
fs.writeFileSync(`batch3-results-${timestamp}.json`, JSON.stringify(results, null, 2));

const success = results.filter(r => r.status === 'success').length;
console.log(`\n=== 第三批完成 ===`);
console.log(`成功: ${success}/${hotels.length}`);
