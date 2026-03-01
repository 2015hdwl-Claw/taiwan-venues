// 師大進修推廣學院場地抓取
const { execSync } = require('child_process');
const fs = require('fs');

const baseUrl = "https://www.sce.ntnu.edu.tw/home/space/";
const venues = [];

console.log("=== 師大進修推廣學院場地抓取 ===\n");

// 開啟場地頁面
execSync(`agent-browser open "${baseUrl}" --timeout 20000`, { encoding: 'utf8', timeout: 25000 });

// 抓取頁面內容
const text = execSync(`agent-browser eval "document.body.innerText" 2>&1`, { encoding: 'utf8', timeout: 15000 });

// 解析場地清單
const lines = text.split('\n');
const rooms = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  
  // 找場地名稱（包含樓層或教室）
  if (line.match(/^\d+F/) || line.includes('教室') || line.includes('會議室') || line.includes('演講堂')) {
    if (line.length > 3 && line.length < 30) {
      rooms.push(line);
    }
  }
}

console.log("找到場地:", rooms.length, "個");
rooms.forEach((r, i) => console.log(`  ${i+1}. ${r}`));

// 抓取照片
const photoResult = execSync(`agent-browser eval "Array.from(document.querySelectorAll('img')).filter(i=>i.src&&i.width>100).map(i=>i.src).slice(0,20).join('|||')" 2>&1`, { encoding: 'utf8', timeout: 15000 });

let photos = [];
const photoMatch = photoResult.match(/https?:\/\/[^"|]+/g);
if (photoMatch) {
  photos = photoMatch.filter(url => !url.includes('logo') && !url.includes('icon'));
}

console.log("\n照片:", photos.length, "張");
photos.slice(0, 5).forEach((p, i) => console.log(`  ${i+1}. ${p}`));

// 儲存結果
const result = {
  name: "師大進修推廣學院",
  url: "https://www.sce.ntnu.edu.tw/home/index.php",
  venuePageUrl: baseUrl,
  contact: {
    phone: "02-77495800",
    email: "sce@ntnu.edu.tw",
    address: "106 臺北市大安區和平東路一段 129 號"
  },
  rooms: rooms,
  photos: photos
};

fs.writeFileSync('ntnu-venues.json', JSON.stringify(result, null, 2));
console.log("\n結果儲存到 ntnu-venues.json");
