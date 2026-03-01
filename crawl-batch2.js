// 第二批：政府機關/文化中心（網站較穩定）
const { execSync } = require('child_process');
const fs = require('fs');

const venues = [
  { name: "張榮發基金會國際會議中心", url: "https://www.klcfoa.org" },
  { name: "集思台大會議中心", url: "https://www.ntucc.ntu.edu.tw" },
  { name: "公務人力發展學院", url: "https://www.ncsi.gov.tw" },
  { name: "國家圖書館", url: "https://www.ncl.edu.tw" },
  { name: "台北市立圖書館總館", url: "https://www.tpml.edu.tw" }
];

const results = [];
console.log(`開始抓取 ${venues.length} 個場地...\n`);

for (let i = 0; i < venues.length; i++) {
  const venue = venues[i];
  console.log(`[${i + 1}/${venues.length}] ${venue.name}...`);
  
  try {
    execSync(`agent-browser open "${venue.url}" --timeout 20000`, { 
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
    
    results.push({ name: venue.name, url: venue.url, photos });
    console.log(`  照片: ${photos.length} 張\n`);
    
  } catch (err) {
    console.log(`  錯誤: ${err.message.slice(0, 60)}\n`);
    results.push({ name: venue.name, url: venue.url, error: err.message });
  }
}

fs.writeFileSync('batch2-results.json', JSON.stringify(results, null, 2));
console.log(`完成！成功: ${results.filter(r => r.photos?.length > 0).length}/${venues.length}`);
