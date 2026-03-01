// 第三批：知名場地（用更長 timeout）
const { execSync } = require('child_process');
const fs = require('fs');

const venues = [
  { name: "台中國家歌劇院", url: "https://www.npac-ntt.org/venuehire/rentnews" },
  { name: "台中日月千禧酒店", url: "https://www.millenniumhotels.com/taichung" },
  { name: "台中日航酒店", url: "https://www.nikkotaichung.com" },
  { name: "台中林酒店", url: "https://www.linhotel.com.tw" },
  { name: "台中裕元花園酒店", url: "https://www.windsortaiwan.com" }
];

const results = [];
console.log(`開始抓取 ${venues.length} 個場地...\n`);

for (let i = 0; i < venues.length; i++) {
  const venue = venues[i];
  console.log(`[${i + 1}/${venues.length}] ${venue.name}...`);
  
  try {
    execSync(`agent-browser open "${venue.url}" --timeout 25000`, { 
      encoding: 'utf8', timeout: 30000, stdio: ['pipe', 'pipe', 'pipe'] 
    });
    
    const photoResult = execSync(`agent-browser eval "Array.from(document.querySelectorAll('img')).filter(i=>i.src&&i.width>100).map(i=>i.src).slice(0,10).join('|||')" 2>&1`, { 
      encoding: 'utf8', timeout: 15000 
    });
    
    let photos = [];
    const photoMatch = photoResult.match(/https?:\/\/[^"|]+/g);
    if (photoMatch) {
      photos = photoMatch.filter(url => !url.includes('logo') && !url.includes('icon')).slice(0, 5);
    }
    
    results.push({ name: venue.name, url: venue.url, photos });
    console.log(`  ✅ 照片: ${photos.length} 張\n`);
    
  } catch (err) {
    console.log(`  ❌ 錯誤\n`);
    results.push({ name: venue.name, url: venue.url, error: err.message });
  }
}

fs.writeFileSync('batch3-results.json', JSON.stringify(results, null, 2));
console.log(`完成！成功: ${results.filter(r => r.photos?.length > 0).length}/${venues.length}`);
