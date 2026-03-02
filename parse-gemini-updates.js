const fs = require('fs');

// 讀取校正清單
const md = fs.readFileSync('SOP_V3_Problems_Gemini.md', 'utf8');
const data = JSON.parse(fs.readFileSync('venues-all-cities.json', 'utf8'));

console.log('=== 解析校正清單 ===\n');

// 解析表格
function parseTable(lines, startIdx) {
  const updates = [];
  let i = startIdx;
  
  while (i < lines.length && lines[i].includes('|')) {
    const line = lines[i];
    const parts = line.split('|').map(p => p.trim()).filter(p => p);
    
    if (parts.length >= 3 && parts[0] !== '#') {
      const name = parts[1];
      const urlOrStatus = parts[2];
      
      // 判斷狀態
      let url = null;
      let status = '上架';
      
      if (urlOrStatus.includes('已結束營業') || urlOrStatus.includes('歇業')) {
        status = '下架';
      } else if (urlOrStatus.includes('http')) {
        // 提取 URL
        const urlMatch = urlOrStatus.match(/https?:\/\/[^\s\)]+/);
        if (urlMatch) {
          url = urlMatch[0];
        }
      }
      
      if (name && !name.includes('場地名稱')) {
        updates.push({ name, url, status });
      }
    }
    i++;
  }
  
  return updates;
}

// 解析 Markdown
const lines = md.split('\n');
const allUpdates = [];

// 找到各個表格
let inTable = false;
let tableStart = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // 找到表格開始
  if (line.includes('| # |') && line.includes('場地名稱')) {
    const updates = parseTable(lines, i + 2); // 跳過標題行
    allUpdates.push(...updates);
    i += updates.length + 2;
  }
}

console.log('解析到', allUpdates.length, '個更新\n');

// 更新資料庫
let updated = 0;
let closed = 0;
let notFound = 0;

allUpdates.forEach(update => {
  // 模糊匹配場地名稱
  const venue = data.find(v => {
    const vName = v.name.replace(/[()（）]/g, ' ').toLowerCase();
    const uName = update.name.replace(/[()（）]/g, ' ').toLowerCase();
    return vName.includes(uName) || uName.includes(vName) || 
           v.name === update.name;
  });
  
  if (venue) {
    if (update.url) {
      venue.url = update.url;
      venue.lastUpdated = new Date().toISOString();
      venue.status = '上架';
      updated++;
      console.log(`✅ ${venue.name}: ${update.url}`);
    } else if (update.status === '下架') {
      venue.status = '下架';
      venue.note = '已歇業';
      venue.lastUpdated = new Date().toISOString();
      closed++;
      console.log(`🔴 ${venue.name}: 已歇業`);
    }
  } else {
    notFound++;
    console.log(`⚠️ 找不到: ${update.name}`);
  }
});

// 儲存
fs.writeFileSync('venues-all-cities.json', JSON.stringify(data, null, 2));

console.log(`\n=== 更新完成 ===`);
console.log(`已更新官網: ${updated}`);
console.log(`已標記歇業: ${closed}`);
console.log(`找不到匹配: ${notFound}`);
