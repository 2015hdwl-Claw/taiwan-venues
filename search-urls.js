const { execSync } = require('child_process');

// 可能的官網變體
const searches = [
  { name: 'CAMA咖啡', urls: [
    'https://www.camacoffee.com.tw',
    'https://camacoffee.com.tw',
    'https://www.cama.com.tw'
  ]},
  { name: 'Goodmans咖啡廳', urls: [
    'https://www.goodmans.com.tw',
    'https://goodmanscafe.com.tw'
  ]},
  { name: 'TCCC台灣文創訓練中心', urls: [
    'https://www.tcc-creative.com.tw',
    'https://www.tcccafe.com.tw'
  ]},
  { name: '公務人力發展學院', urls: [
    'https://www.nacs.gov.tw',
    'https://www.ncsi.gov.tw',
    'https://csf.gov.tw'
  ]},
  { name: '典藏咖啡廳', urls: [
    'https://www.artco-cafe.com.tw',
    'https://artco.com.tw'
  ]},
  { name: '台北一樂園大飯店', urls: [
    'https://www.ile-hotel.com.tw',
    'https://www.onehotel.com.tw'
  ]},
  { name: '台北丹迪旅店', urls: [
    'https://www.dandyhotel.com.tw',
    'https://www.ttdhotel.com.tw'
  ]},
  { name: '台北亞都麗緻大飯店', urls: [
    'https://www.landistpe.com',
    'https://www.landis.com.tw',
    'https://www.thelandistaipei.com'
  ]},
  { name: '台北京站酒店', urls: [
    'https://www.caametro.com.tw',
    'https://www.cityinn.com.tw'
  ]},
  { name: '台北八方美學商旅', urls: [
    'https://www.bafang-hotel.com.tw',
    'https://www.hotelbf.com.tw'
  ]},
  { name: '台北六福客棧', urls: [
    'https://www.leofoohotel.com.tw',
    'https://www.sixstarhotel.com.tw'
  ]},
  { name: '台北典華', urls: [
    'https://www.dianhua.com',
    'https://www.tpe-dianhua.com.tw'
  ]},
  { name: '台北北投會館', urls: [
    'https://www.beitou-hall.com.tw',
    'https://www.bt-hall.gov.tw'
  ]},
  { name: '台北友春大飯店', urls: [
    'https://www.youchun-hotel.com.tw',
    'https://www.friendhotel.com.tw'
  ]}
];

console.log('=== 搜尋正確官網 ===\n');

const results = [];

for (const search of searches) {
  console.log(`🔍 ${search.name}`);
  
  let found = null;
  for (const url of search.urls) {
    try {
      const res = execSync(`curl -I "${url}" --connect-timeout 5 -s 2>&1 | head -1`, { 
        encoding: 'utf8', timeout: 8000 
      });
      
      if (res.includes('200') || res.includes('301') || res.includes('302')) {
        found = url;
        console.log(`  ✅ 找到: ${url}`);
        break;
      }
    } catch (e) {
      // 繼續嘗試下一個
    }
  }
  
  if (!found) {
    console.log('  ❌ 未找到');
  }
  
  results.push({ name: search.name, found });
  console.log('');
}

// 輸出結果
console.log('=== 搜尋結果 ===');
const found = results.filter(r => r.found);
console.log(`找到: ${found.length}/${results.length}`);

found.forEach(r => {
  console.log(`✅ ${r.name}: ${r.found}`);
});
