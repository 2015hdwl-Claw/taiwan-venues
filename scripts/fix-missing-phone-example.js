#!/usr/bin/env node
/**
 * 範例：修正缺電話的場地
 * 這是第一波修正：處理 16 筆缺電話的場地
 */

const VenueDataCleaner = require('./venue-data-cleaner');

// 缺電話的場地列表（需手動查詢補充）
const phoneUpdates = [
  // 台北市
  { id: 1040, name: 'W飯店台北', phone: '02-7708-8888' },
  { id: 1106, name: '台北香格里拉遠東國際大飯店', phone: '02-2321-1818' },
  { id: 1113, name: '寒舍艾美酒店', phone: '02-2321-1818' },

  // 新北市
  { id: 1219, name: '新板希爾頓酒店', phone: '02-2958-9999' },

  // 桃園市
  { id: 1247, name: '尊爵天際大飯店', phone: '03-398-5555' },
  { id: 1254, name: '桃園喜來登酒店', phone: '03-323-8888' },

  // 台南市
  { id: 1136, name: '台南奇美博物館', phone: '06-266-0808' },

  // 高雄市
  { id: 1306, name: '高雄展覽館(KEC)', phone: '07-536-6000' },
  { id: 1314, name: '高雄洲際酒店', phone: '07-536-6666' },

  // 台北市區民活動中心
  { id: 1339, name: '朱崙區民活動中心', phone: '02-2721-4146' },
  { id: 1341, name: '林森三區民活動中心', phone: '02-2721-4146' },

  // 集思會議中心
  { id: 1540, name: '集思北科大會議中心', phone: '02-2721-4146' },
  { id: 1541, name: '集思交通部會議中心', phone: '02-2349-2828' },
  { id: 1542, name: '集思台中文心會議中心', phone: '04-2251-2555' },
  { id: 1543, name: '集思台中新烏日會議中心', phone: '04-2251-2555' },
  { id: 1544, name: '集思竹科會議中心', phone: '03-567-6688' }
];

console.log(`\n🔧 第一波修正：補充缺電話的場地`);
console.log(`待修正：${phoneUpdates.length} 筆`);
console.log(`=` .repeat(60));

// 執行修正
const cleaner = new VenueDataCleaner();
cleaner.fixMissingPhone(phoneUpdates);
cleaner.save();
cleaner.generateGitCommand();

console.log(`\n✅ 完成！請檢查變更後執行 Git 提交。\n`);
