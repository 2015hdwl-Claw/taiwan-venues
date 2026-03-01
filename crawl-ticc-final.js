// TICC 批量抓取 - 正確版
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

for (let i = 0; i < venues.length; i++) {
  const venue = venues[i];
  console.log(`[${i + 1}/${venues.length}] ${venue.name}...`);
  
  const url = `https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=${venue.roomId}&ctNode=322&CtUnit=99&BaseDSD=7&mp=1`;
  
  try {
    // 開啟頁面
    execSync(`agent-browser open "${url}" --timeout 15000`, { encoding: 'utf8', timeout: 20000 });
    
    // 抓取頁面文字
    const text = execSync(`agent-browser eval "document.body.innerText" 2>&1`, { encoding: 'utf8', timeout: 15000 });
    
    // 解析價格（平日）
    const priceWeekdayMatch = text.match(/週一[～~]週五[\s\S]*?(\d+)\s*元/);
    const priceWeekendMatch = text.match(/週六[～~]週日[\s\S]*?(\d+)\s*元/);
    
    // 解析容納人數
    const classroomMatch = text.match(/教室型人數\s*(\d+)/);
    const theaterMatch = text.match(/劇院型人數\s*(\d+)/);
    const horseshoeMatch = text.match(/馬蹄型人數\s*(\d+)/);
    
    // 解析面積
    const areaMatch = text.match(/(\d+\.?\d*)\s*平方公尺\s*\/\s*(\d+\.?\d*)\s*坪/);
    
    // 抓取照片
    let photos = [];
    try {
      const photoResult = execSync(`agent-browser eval "Array.from(document.querySelectorAll('img')).filter(i=>i.src&&i.src.includes('/public/Img/f')).map(i=>i.src).slice(0,10).join('\\\\n')" 2>&1`, { 
        encoding: 'utf8', 
        timeout: 10000 
      });
      photos = photoResult.split('\n').filter(p => p.includes('http'));
    } catch (e) {}
    
    const result = {
      roomId: venue.roomId,
      roomName: venue.name,
      priceWeekday: priceWeekdayMatch ? parseInt(priceWeekdayMatch[1]) : null,
      priceWeekend: priceWeekendMatch ? parseInt(priceWeekendMatch[1]) : null,
      capacityClassroom: classroomMatch ? parseInt(classroomMatch[1]) : null,
      capacityTheater: theaterMatch ? parseInt(theaterMatch[1]) : null,
      capacityHorseshoe: horseshoeMatch ? parseInt(horseshoeMatch[1]) : null,
      areaSqm: areaMatch ? parseFloat(areaMatch[1]) : null,
      areaPing: areaMatch ? parseFloat(areaMatch[2]) : null,
      photos: photos,
      url: url
    };
    
    results.push(result);
    console.log(`  平日: ${result.priceWeekday || 'N/A'}, 假日: ${result.priceWeekend || 'N/A'}, 劇院: ${result.capacityTheater || 'N/A'}, 教室: ${result.capacityClassroom || 'N/A'}, 照片: ${photos.length}張`);
    
  } catch (err) {
    console.log(`  錯誤: ${err.message.slice(0, 50)}`);
    results.push({ roomId: venue.roomId, roomName: venue.name, error: err.message });
  }
}

// 儲存結果
fs.writeFileSync('/root/.openclaw/workspace/taiwan-venues/ticc-crawled-data.json', JSON.stringify(results, null, 2));

console.log(`\n完成！資料儲存到 ticc-crawled-data.json`);
console.log(`成功: ${results.filter(r => r.priceWeekday || r.capacityTheater).length}/${venues.length}`);
