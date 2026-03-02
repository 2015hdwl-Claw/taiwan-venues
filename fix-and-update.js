const fs = require('fs');
const data = JSON.parse(fs.readFileSync('venues-all-cities.json', 'utf8'));

console.log('總場地:', data.length);
console.log('');

// 標記已歇業的場地
var closed = [
  '台中中港大飯店',
  '台中通豪大飯店',
  '台北商務會館',
  '台北國賓大飯店',
  '台北威斯汀六福皇宮',
  '台北六福客棧',
  '台南大億麗緻酒店',
  '台南太子大飯店',
  '彰化桂冠歐悅酒店',
  '彰化鹿港茂迪太陽能會館',
  '新北三重金陵婚宴會館',
  '新北海天地大飯店',
  '桃園千葉婚宴會館',
  '宜蘭傳藝老爺行旅',
  '傳藝老爺行旅',
  '高雄華王大飯店',
  '萬里翡翠灣福華渡假飯店',
  '新板民生婚宴會館',
  '台中麒麟大飯店',
  '高雄翰皇酒店',
  '高雄人承大飯店',
  '台北唯客樂文旅',
  '台東豐泰大飯店',
  '台北典華',
  '高雄國賓大飯店'
];

var closedCount = 0;

closed.forEach(function(name) {
  data.forEach(function(v) {
    if (v.name.indexOf(name) >= 0 || name.indexOf(v.name) >= 0) {
      v.status = '下架';
      v.note = '已歇業';
      v.lastUpdated = new Date().toISOString();
      closedCount++;
    }
  });
});

console.log('已標記歇業:', closedCount, '個');
console.log('');

// 標記不提供會議的場地
var noMeeting = ['CAMA咖啡', 'Goodmans', 'Simple Kaffa', '典藏咖啡'];
var noMeetingCount = 0;
noMeeting.forEach(function(name) {
  data.forEach(function(v) {
    if (v.name.indexOf(name) >= 0 || name.indexOf(v.name) >= 0) {
      v.status = '不提供會議';
      v.note = '咖啡廳，不提供會議室租借';
      noMeetingCount++;
    }
  });
});
console.log('已標記不提供會議:', noMeetingCount, '個');
console.log('');

// 儲存
fs.writeFileSync('venues-all-cities.json', JSON.stringify(data, null, 2));
console.log('✅ 已儲存');
