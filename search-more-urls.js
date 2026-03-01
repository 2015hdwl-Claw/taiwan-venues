const { execSync } = require('child_process');

// 更多可能的官網
const searches = [
  { name: '台北亞都麗緻大飯店', urls: [
    'https://www.landishotels.com',
    'https://www.thelandis.com',
    'https://landis.hotels.com'
  ]},
  { name: '公務人力發展學院', urls: [
    'https://www.nacs.gov.tw',
    'https://www.csf.gov.tw',
    'https://www.hrd.gov.tw'
  ]},
  { name: '台北典華', urls: [
    'https://www.dianhua.com.tw',
    'https://www.banquet.com.tw',
    'https://dianhua banquet.com.tw'
  ]},
  { name: 'CAMA咖啡', urls: [
    'https://www.cama.com.tw',
    'https://cama.com.tw',
    'https://www.camacoffee.com.tw'
  ]},
  { name: '台北六福客棧', urls: [
    'https://www.leofoo.com.tw',
    'https://www.six福气hotel.com.tw'
  ]}
];

console.log('=== 搜尋更多官網 ===\n');

for (const search of searches) {
  console.log(`🔍 ${search.name}`);
  
  for (const url of search.urls) {
    try {
      const res = execSync(`curl -I "${url}" --connect-timeout 5 -s 2>&1 | head -1`, { 
        encoding: 'utf8', timeout: 8000 
      });
      
      if (res.includes('200') || res.includes('301') || res.includes('302')) {
        console.log(`  ✅ 找到: ${url}`);
        break;
      } else {
        console.log(`  ❌ ${url}`);
      }
    } catch (e) {
      console.log(`  ❌ ${url}`);
    }
  }
  console.log('');
}
