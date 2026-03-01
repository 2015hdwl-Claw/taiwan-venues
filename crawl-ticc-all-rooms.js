// TICC 批量抓取 - Node.js 版本
const { execSync } = require('child_process');
const fs = require('fs');

const venues = [
  { roomId: "PH", name: "大會堂" },
  { roomId: "101", name: "101全室" },
  { roomId: "101A", name: "101A" },
  { roomId: "101AB", name: "101AB" },
  { roomId: "101B", name: "101B" },
  { roomId: "101C", name: "101C" },
  { roomId: "101CD", name: "101CD" },
  { roomId: "101D", name: "101D" },
  { roomId: "102", name: "102" },
  { roomId: "103", name: "103" },
  { roomId: "105", name: "105" },
  { roomId: "106", name: "106" },
  { roomId: "1FVIP_N", name: "1F北貴賓室" },
  { roomId: "1FVIP_S", name: "1F南貴賓室" },
  { roomId: "201", name: "201全室" },
  { roomId: "201A", name: "201A" },
  { roomId: "201AB", name: "201AB" },
  { roomId: "201ABC", name: "201ABC" },
  { roomId: "201ABEF", name: "201ABEF" },
  { roomId: "201AF", name: "201AF" },
  { roomId: "201B", name: "201B" },
  { roomId: "201BC", name: "201BC" },
  { roomId: "201BCDE", name: "201BCDE" },
  { roomId: "201BE", name: "201BE" },
  { roomId: "201C", name: "201C" },
  { roomId: "201CD", name: "201CD" },
  { roomId: "201D", name: "201D" },
  { roomId: "201DE", name: "201DE" },
  { roomId: "201DEF", name: "201DEF" },
  { roomId: "201E", name: "201E" },
  { roomId: "201EF", name: "201EF" },
  { roomId: "201F", name: "201F" },
  { roomId: "202", name: "202全室" },
  { roomId: "202A", name: "202A" },
  { roomId: "202B", name: "202B" },
  { roomId: "203", name: "203全室" },
  { roomId: "203A", name: "203A" },
  { roomId: "203B", name: "203B" },
  { roomId: "3FBA", name: "3樓宴會廳" },
  { roomId: "3FLG_N", name: "3樓北軒" },
  { roomId: "3FLG_S", name: "3樓南軒" },
  { roomId: "401", name: "401會議室" },
  { roomId: "402", name: "4樓悅軒" },
  { roomId: "4FLGN", name: "4樓雅軒" },
  { roomId: "4FVIP", name: "4樓鳳凰廳" }
];

const results = [];

console.log(`開始抓取 ${venues.length} 個會議室...\n`);

venues.forEach((venue, index) => {
  console.log(`[${index + 1}/${venues.length}] ${venue.name}...`);
  
  const url = `https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=${venue.roomId}&ctNode=322&CtUnit=99&BaseDSD=7&mp=1`;
  
  try {
    // 開啟頁面
    execSync(`agent-browser open "${url}" --timeout 15000`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    
    // 抓取資料
    const evalScript = `
      const getText = (label) => {
        const el = Array.from(document.querySelectorAll('h4')).find(h => h.textContent.includes(label));
        return el ? (el.nextElementSibling?.textContent?.trim() || el.parentElement?.querySelector('p')?.textContent?.trim()) : null;
      };
      
      const getPrice = () => {
        const el = Array.from(document.querySelectorAll('h4')).find(h => h.textContent.includes('週一'));
        return el ? el.nextElementSibling?.textContent?.replace(/[^0-9]/g, '') : null;
      };
      
      const getCapacity = () => {
        const el = Array.from(document.querySelectorAll('h4')).find(h => h.textContent.includes('劇院型人數'));
        return el ? el.nextElementSibling?.textContent?.replace(/[^0-9]/g, '') : null;
      };
      
      const getPhotos = () => {
        const imgs = Array.from(document.querySelectorAll('img')).filter(i => i.src && i.src.includes('/public/Img/f'));
        return [...new Set(imgs.map(i => i.src))].slice(0, 10);
      };
      
      JSON.stringify({
        price: getPrice(),
        capacity: getCapacity(),
        photos: getPhotos()
      });
    `;
    
    const result = execSync(`agent-browser eval "${evalScript.replace(/"/g, '\\"').replace(/\n/g, ' ')}" --timeout 10000`, { 
      encoding: 'utf8', 
      stdio: ['pipe', 'pipe', 'pipe'] 
    });
    
    // 解析結果
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      results.push({
        roomId: venue.roomId,
        roomName: venue.name,
        price: data.price ? parseInt(data.price) : null,
        capacity: data.capacity ? parseInt(data.capacity) : null,
        photos: data.photos || []
      });
      console.log(`  價格: ${data.price || 'N/A'}, 容納: ${data.capacity || 'N/A'}, 照片: ${data.photos?.length || 0}張`);
    } else {
      results.push({ roomId: venue.roomId, roomName: venue.name, price: null, capacity: null, photos: [] });
      console.log(`  解析失敗`);
    }
  } catch (err) {
    console.log(`  錯誤: ${err.message}`);
    results.push({ roomId: venue.roomId, roomName: venue.name, price: null, capacity: null, photos: [], error: err.message });
  }
});

// 儲存結果
fs.writeFileSync('/root/.openclaw/workspace/taiwan-venues/ticc-crawled-data.json', JSON.stringify(results, null, 2));

console.log(`\n完成！資料儲存到 ticc-crawled-data.json`);
console.log(`成功: ${results.filter(r => r.price || r.capacity).length}/${venues.length}`);
