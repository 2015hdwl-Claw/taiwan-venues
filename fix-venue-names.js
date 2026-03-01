const fs = require('fs');

// 讀取資料
const data = JSON.parse(fs.readFileSync('venues-all-cities.json', 'utf8'));

console.log('🔧 修正場地名稱格式...\n');

// 場地名稱對照表（中文名稱 -> 英文簡稱）
const venueAbbreviations = {
  '台北國際會議中心': 'TICC',
  '台北世貿中心': 'TWTC',
  '台大醫院國際會議中心': 'NTUHICC',
  '台中國際會議中心': 'TICC',
  '高雄國際會議中心': 'KICC',
  '台北小巨蛋': 'TPEArena',
  '高雄展覽館': 'KEC',
  '華山1914文化創意產業園區': 'Huashan1914',
  '松山文創園區': 'SCCP',
  '台北花園大酒店': 'TGHotel',
  '台北君悅酒店': 'GrandHyattTaipei',
  '台北晶華酒店': 'RegentTaipei',
  '台北文華東方酒店': 'MOHTaipei',
  '台北遠東香格里拉酒店': 'ShangriLaTaipei',
  '台北國賓大飯店': 'AmbassadorTaipei',
  '台北威斯汀六福皇宮': 'Westin',
  '台北萬豪酒店': 'MarriottTaipei',
  '台北喜來登大飯店': 'SheratonTaipei',
  '台北福華大飯店': 'HowardTaipei',
  '台北老爺大酒店': 'RoyalInnTaipei',
  '台北亞都麗緻大飯店': 'LandisTaipei',
  '台北寒舍艾美酒店': 'LeMeridienTaipei',
  '台北寒舍艾麗酒店': 'HummerHouse',
  '台北W飯店': 'WTaipei',
  '台北大倉久和大飯店': 'OkuraTaipei',
  '台北君品酒店': 'PalaisdeChine',
  '台北西華飯店': 'SherwoodTaipei',
  '台南大億麗緻酒店': 'TainanRegent',
  '台南晶英酒店': 'SilksPlaceTainan',
  '台南香格里拉遠東國際大飯店': 'ShangriLaTainan',
  '台南老爺行旅': 'RoyalTainan',
  '台南桂田酒店': 'GueiLinTainan',
  '台中林酒店': 'TheLin',
  '台中金典酒店': 'SplendorTaichung',
  '台中長榮桂冠酒店': 'EvergreenLaurel',
  '台中福華大飯店': 'HowardTaichung',
  '台中日月千禧酒店': 'Millennium',
  '台中裕元花園酒店': 'Windsor',
  '高雄漢來大飯店': 'GrandHiLaHotel',
  '高雄福華大飯店': 'HowardKaohsiung',
  '高雄寒軒國際大飯店': 'HanHsien',
  '高雄金典酒店': 'SplendorKaohsiung',
  '高雄義大皇家酒店': 'EdaRoyal',
  '墾丁凱撒大飯店': 'CaesarPark',
  '墾丁福華渡假飯店': 'HowardKenting',
  '墾丁悠活渡假村': 'YoHo',
  '墾丁夏都沙灘酒店': 'ChateauBeach',
  '板橋凱撒大飯店': 'CaesarParkBanqiao',
  '福容大飯店淡水漁人碼頭': 'FullonTamsui',
  '福容大飯店': 'Fullon',
  '宜蘭傳藝中心': 'NCFTAIlan',
  '礁溪老爺酒店': 'RoyalJiaoxi',
  '國家表演藝術中心': 'NPAC',
  '國家兩廳院': 'NTCH',
  '中正紀念堂': 'CKSMH',
  '國父紀念館': 'SYSMH',
  '國立台灣大學': 'NTU',
  '台灣大學': 'NTU',
  '國立台灣師範大學': 'NTNU',
  '國立政治大學': 'NCCU',
  '中國文化大學': 'PCCU',
  '文化大學': 'PCCU',
  '淡江大學': 'TKU',
  '輔仁大學': 'FJU',
  '逢甲大學': 'FCU',
  '東海大學': 'Tunghai',
  '成功大學': 'NCKU',
  '台北市立美術館': 'TFAM',
  '高雄市立美術館': 'KMFA',
  '九族文化村': 'Formosan',
  '統一渡假村': 'UniResort',
  '台北市政府': 'TCC',
  '台中市政府': 'TCCG',
  '台南市政府': 'TNG',
  '高雄市政府': 'KCG'
};

// 清理並更新名稱
const updatedData = data.map(venue => {
  let name = venue.name;
  
  // 1. 移除重複的英文簡稱（如 "TICC TICC" -> "TICC"）
  name = name.replace(/\(([A-Z]+)\)\s*\1/g, '($1)');
  name = name.replace(/\(([A-Z]+)\)\1/g, '($1)');
  
  // 2. 移除結尾的重複簡稱（如 "TICC(TICC)" -> "(TICC)"）
  name = name.replace(/\(([A-Z]+)\)\([A-Z]+\)/g, '($1)');
  
  // 3. 檢查是否需要添加英文簡稱
  let hasAbbreviation = /\([A-Z]{2,}\)/.test(name);
  
  if (!hasAbbreviation) {
    // 尋找對應的英文簡稱
    for (const [chinese, english] of Object.entries(venueAbbreviations)) {
      if (name.includes(chinese)) {
        // 在中文名稱後面添加英文簡稱
        name = name.replace(chinese, `${chinese}(${english})`);
        break;
      }
    }
  }
  
  // 4. 清理特殊情況
  name = name.replace(/\(\(/g, '(');
  name = name.replace(/\)\)/g, ')');
  
  venue.name = name;
  return venue;
});

// 儲存更新後的資料
fs.writeFileSync('venues-all-cities.json', JSON.stringify(updatedData, null, 2), 'utf8');

console.log('✅ 場地名稱修正完成');
console.log(`📊 總共處理 ${data.length} 筆資料`);

// 統計並顯示更新
let updateCount = 0;
data.forEach((old, i) => {
  if (old.name !== updatedData[i].name) {
    updateCount++;
    console.log(`更新: "${old.name}" -> "${updatedData[i].name}"`);
  }
});

console.log(`\n✨ 成功修正 ${updateCount} 個場地名稱`);

// 顯示範例
console.log('\n📋 場地名稱範例：');
const examples = updatedData.filter(v => v.name.includes('TICC') || v.name.includes('NTU')).slice(0, 5);
examples.forEach(v => console.log(`  - ${v.name}`));
