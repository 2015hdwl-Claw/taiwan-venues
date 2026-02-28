const fs = require('fs');

console.log('📋 嚴謹的優先場地收集計畫\n');

// 4 個需要詳細更新的場地
const priorityVenues = [
  {
    name: '政大公企中心',
    currentStatus: '部分完整',
    needsUpdate: [
      '會議室名稱和數量',
      '每個會議室的照片',
      '每個會議室的場地大小（坪數）',
      '每個會議室的容納人數（不同座位配置）',
      '每個會議室的價格（半日/全日）',
      '每個會議室的設備清單',
      '聯絡電話和 Email',
      '可租用時段'
    ],
    officialWebsite: 'https://paep.nccu.edu.tw/ (無法訪問)',
    dataSource: '需手動驗證',
    action: '電話查證或實地訪查'
  },
  {
    name: '集思會議中心',
    currentStatus: '不存在',
    needsUpdate: [
      '新增完整場地資料',
      '所有會議室名稱',
      '每個會議室的照片',
      '每個會議室的場地大小（坪數）',
      '每個會議室的容納人數（不同座位配置）',
      '每個會議室的價格（半日/全日）',
      '每個會議室的設備清單',
      '地址、電話、Email',
      '可租用時段'
    ],
    officialWebsite: 'https://www.meeting.com.tw/',
    dataSource: '需手動驗證',
    action: '官網資料收集或電話查證'
  },
  {
    name: '文化大學',
    currentStatus: '完全不完整',
    needsUpdate: [
      '會議室名稱和數量',
      '每個會議室的照片',
      '每個會議室的場地大小（坪數）',
      '每個會議室的容納人數（不同座位配置）',
      '每個會議室的價格（半日/全日）',
      '每個會議室的設備清單',
      '聯絡電話和 Email',
      '可租用時段'
    ],
    officialWebsite: 'https://www.sce.pccu.edu.tw/',
    dataSource: '需手動驗證',
    action: '官網資料收集或電話查證'
  },
  {
    name: '台大醫院國際會議中心',
    currentStatus: '部分完整',
    needsUpdate: [
      '每個會議室的場地大小（坪數）',
      '每個會議室的照片（如果缺少）',
      '每個會議室的價格（如果缺少）',
      '每個會議室的設備清單',
      '可租用時段'
    ],
    officialWebsite: 'https://ntuh.mc.ntu.edu.tw/ (無法訪問)',
    dataSource: '需手動驗證',
    action: '電話查證或實地訪查'
  }
];

// 顯示計畫
console.log('🎯 優先處理場地（4 個）\n');
priorityVenues.forEach((venue, index) => {
  console.log(`${index + 1}. ${venue.name}`);
  console.log(`   狀態: ${venue.currentStatus}`);
  console.log(`   官網: ${venue.officialWebsite}`);
  console.log(`   資料來源: ${venue.dataSource}`);
  console.log(`   行動: ${venue.action}`);
  console.log(`   需要更新:`);
  venue.needsUpdate.forEach(item => {
    console.log(`     - ${item}`);
  });
  console.log('');
});

console.log('\n📊 資料收集標準\n');
console.log('✅ 必須包含：');
console.log('  - 場地名稱、會議室名稱');
console.log('  - 地址、電話、Email');
console.log('  - 官方網站 URL');
console.log('  - 場地大小（坪數）');
console.log('  - 容納人數（劇院型、課桌式、宴會型）');
console.log('  - 價格（半日、全日）');
console.log('  - 照片 URL');
console.log('  - 設備清單');
console.log('  - 可租用時段');
console.log('');
console.log('⚠️ 資料來源標記：');
console.log('  - dataSource: "official_website" | "phone_verification" | "manual_verification"');
console.log('  - dataSourceUrl: 官網 URL');
console.log('  - dataCollectedAt: ISO 時間戳記');
console.log('  - verified: true/false');
console.log('  - needsManualVerification: true/false');
console.log('');

// 保存計畫
fs.writeFileSync(
  'priority-venues-collection-plan.json',
  JSON.stringify({
    timestamp: new Date().toISOString(),
    priorityVenues,
    standards: {
      requiredFields: [
        'name', 'roomName', 'address', 'contactPhone', 'url',
        'dimensions.area', 'maxCapacityTheater', 'priceHalfDay',
        'images.main', 'contactEmail'
      ],
      dataSourceRequired: true,
      noGuessingAllowed: true
    }
  }, null, 2)
);

console.log('✅ 計畫已保存到: priority-venues-collection-plan.json');
