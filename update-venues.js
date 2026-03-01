const fs = require('fs');
const data = JSON.parse(fs.readFileSync('venues-all-cities.json', 'utf8'));

console.log('=== 更新台北市場地官網 ===\n');

// 更新清單
const updates = [
  // DNS 無法解析 - 更新官網
  { name: 'CAMA咖啡', url: 'https://www.camacafe.com/', status: '上架' },
  { name: 'Goodmans咖啡廳', url: 'https://www.goodmanscoffee.com/', status: '上架' },
  { name: 'TCCC台灣文創訓練中心', url: 'https://www.tccc.com.tw/', status: '上架' },
  { name: '台北典華', url: 'https://www.denwell.com/', status: '上架' },
  { name: '台北北投會館', url: 'https://btresort.metro.taipei/', status: '上架' },
  { name: '台北商務會館', url: 'https://www.tbc-group.com/', status: '上架' },
  { name: '台北喜瑞飯店', url: 'https://www.ambiencehotel.com.tw/', status: '上架' },
  { name: '台北歐華酒店', url: 'https://www.rivierataipei.com/', status: '上架' },
  { name: '台北福君海悅大飯店', url: 'https://www.fortune-hiayue.com/', status: '上架' },
  { name: '台北維多麗亞酒店', url: 'https://www.grandvictoria.com.tw/', status: '上架' },
  { name: '台北老爺大酒店', url: 'https://www.royal-nikko-taipei.com.tw/', status: '上架' },
  { name: '台北萬豪酒店', url: 'https://www.taipeimarriott.com.tw/', status: '上架' },
  { name: '台北豪景大酒店', url: 'https://www.riverview.com.tw/', status: '上架' },
  { name: '台北金來商旅', url: 'https://www.jollyhotel.com.tw/', status: '上架' },
  { name: '台北集賢大飯店', url: 'https://www.jixian-hotel.com.tw/', status: '上架' },
  { name: '台北香城大飯店', url: 'https://www.city-hotel.com.tw/', status: '上架' },
  { name: '台北駿宇飯店', url: 'https://www.grandeehotels.com.tw/', status: '上架' },
  { name: '台中世貿中心', url: 'https://www.wtct.org.tw/', status: '上架' },
  { name: '台灣大學', url: 'https://www.ntu.edu.tw/', status: '上架' },
  { name: '國泰商旅', url: 'https://www.cathayhotel.com.tw/', status: '上架' },
  { name: '台北中山運動中心', url: 'https://zssc.cyc.org.tw/', status: '上架' },
  { name: '台北信義運動中心', url: 'https://xysc.cyc.org.tw/', status: '上架' },
  { name: '台北內湖運動中心', url: 'https://nhsc.cyc.org.tw/', status: '上架' },
  { name: '國父紀念館(SYSMH)', url: 'https://www.yatsen.gov.tw/', status: '上架' },
  
  // 區民活動中心 - 統一使用中山區公所
  { name: '朱崙區民活動中心', url: 'https://zsdp.gov.taipei/', status: '上架' },
  { name: '松江區民活動中心', url: 'https://zsdp.gov.taipei/', status: '上架' },
  { name: '林森三區民活動中心', url: 'https://zsdp.gov.taipei/', status: '上架' },
  { name: '台北長安東路區民活動中心', url: 'https://zsdp.gov.taipei/', status: '上架' },
  { name: '台北魚籃區民活動中心', url: 'https://zsdp.gov.taipei/', status: '上架' },
  
  // 結束營業
  { name: '台北一樂園大飯店', status: '下架', note: '已拆除改建' },
  { name: '台北八方美學商旅', status: '下架', note: '現址已改為其他品牌' },
  { name: '台北友春大飯店', status: '下架', note: '結束營業' },
  { name: '台北姿美大飯店', status: '下架', note: '結束營業' },
  { name: '台北康華大飯店', status: '下架', note: '2022年3月結束營業' },
  { name: '台北慶泰大飯店', status: '下架', note: '2021年12月結束營業' },
  { name: '台北漢承大飯店', status: '下架', note: '結束營業' },
  { name: '台北西華飯店', status: '下架', note: '2022年2月結束營業' },
  
  // SSL 問題修復
  { name: '典藏咖啡廳', url: 'https://cafe.artco.com.tw/', status: '上架' },
  { name: '台北W飯店(WTaipei)', url: 'https://www.marriott.com/tpewh', status: '上架' },
  { name: '台大校友會館', url: 'https://www.ntualumni.org.tw/', status: '上架' },
  { name: '維多麗亞酒店', url: 'https://www.grandvictoria.com.tw/', status: '上架' },
  { name: '客家藝文活動中心', url: 'https://thcf.org.tw/', status: '上架' },
  
  // 連線問題
  { name: '台北唯客樂文旅', url: 'https://www.victoriam.com/', status: '上架' },
  { name: '台北國賓大飯店(AmbassadorTaipei)', url: 'https://www.ambassadorhotel.com.tw/taipei', status: '上架' },
  { name: '台北第一大飯店', status: '下架', note: '結束營業' },
  { name: '台北體育館', url: 'https://www.tms.gov.taipei/', status: '上架' },
  
  // 其他 DNS 問題
  { name: '台北德立莊酒店', url: 'https://www.midtownrichard.com/', status: '待確認' },
  { name: '台北松意酒店', url: 'https://www.songyi-hotel.com/', status: '待確認' },
  { name: '台北洛碁大飯店', url: 'https://www.chateau-china.com/', status: '待確認' },
  { name: '台北神旺大飯店(SanWantTaipei)', url: 'https://www.san-want.com/', status: '待確認' },
  { name: '台北第一酒店(FirstHotel)', url: 'https://www.first-hotel.com.tw/', status: '待確認' },
  { name: '台北統一大飯店', url: 'https://www.tongyi-hotel.com/', status: '待確認' },
  { name: '台北華國大飯店(ImperialTaipei)', url: 'https://www.imperial-hotel.com.tw/', status: '待確認' },
  { name: '台北華泰瑞舍', url: 'https://www.gloria-residence.com/', status: '待確認' },
  { name: '台北陽明山中國麗緻大飯店', url: 'https://www.landisresort.com/', status: '待確認' },
  { name: '圓山花博公園流行館', url: 'https://www.taipeiexpopark.tw/', status: '待確認' },
  { name: '天母體育館', url: 'https://www.tms.gov.taipei/', status: '待確認' },
  { name: '張榮發基金會(KLCF)國際會議中心', url: 'https://www.yfpcf.org/', status: '待確認' },
  { name: '復興美學共享空間', url: 'https://www.fuxing.space/', status: '待確認' },
  { name: '文華東方婚宴會館', url: 'https://www.mandarin-wedding.com/', status: '待確認' },
  { name: '社會創新實驗中心', url: 'https://www.siihub.org/', status: '待確認' },
  { name: '花博公園爭艷館', url: 'https://www.taipeiexpopark.tw/', status: '待確認' },
  { name: '貳樓餐廳', url: 'https://www.secondfloor.com.tw/', status: '待確認' },
  { name: '集思台大會議中心(NTUCC)', url: 'https://www.ntuacc.org/', status: '待確認' }
];

// 執行更新
let updated = 0;
let closed = 0;
let pending = 0;

updates.forEach(update => {
  const venue = data.find(v => v.name === update.name || v.name.includes(update.name));
  
  if (venue) {
    if (update.url) {
      venue.url = update.url;
    }
    if (update.status) {
      venue.status = update.status;
    }
    if (update.note) {
      venue.note = update.note;
    }
    venue.lastUpdated = new Date().toISOString();
    
    if (update.status === '上架') updated++;
    else if (update.status === '下架') closed++;
    else if (update.status === '待確認') pending++;
    
    console.log(`✅ ${venue.name}: ${update.status || '更新'}`);
  } else {
    console.log(`⚠️ 找不到: ${update.name}`);
  }
});

// 儲存
fs.writeFileSync('venues-all-cities.json', JSON.stringify(data, null, 2));

console.log(`\n=== 更新完成 ===`);
console.log(`已上架: ${updated}`);
console.log(`已下架: ${closed}`);
console.log(`待確認: ${pending}`);
console.log(`總計: ${updated + closed + pending}`);
