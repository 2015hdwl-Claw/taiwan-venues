const fs = require('fs');

console.log('📋 整理 DNS/URL 錯誤清單...\n');

// 讀取錯誤報告
const report = JSON.parse(fs.readFileSync('url-image-validation-report.json', 'utf8'));

// 分類錯誤
const dnsErrors = [];
const http403Errors = [];
const http400Errors = [];
const timeoutErrors = [];
const sslErrors = [];
const otherErrors = [];

report.errors.urls.forEach(error => {
  if (error.error.includes('ENOTFOUND') || error.error.includes('EAI_AGAIN')) {
    dnsErrors.push(error);
  } else if (error.error.includes('HTTP 403')) {
    http403Errors.push(error);
  } else if (error.error.includes('HTTP 400')) {
    http400Errors.push(error);
  } else if (error.error === 'timeout') {
    timeoutErrors.push(error);
  } else if (error.error.includes('certificate') || error.error.includes('SSL')) {
    sslErrors.push(error);
  } else {
    otherErrors.push(error);
  }
});

console.log('📊 錯誤分類統計:\n');
console.log(`DNS 錯誤（需手動修正）: ${dnsErrors.length}`);
console.log(`HTTP 403（可用爬蟲修正）: ${http403Errors.length}`);
console.log(`HTTP 400（可用爬蟲修正）: ${http400Errors.length}`);
console.log(`超時（可用爬蟲修正）: ${timeoutErrors.length}`);
console.log(`SSL 錯誤（可用爬蟲修正）: ${sslErrors.length}`);
console.log(`其他錯誤: ${otherErrors.length}`);

console.log('\n' + '='.repeat(80));
console.log('❌ DNS 錯誤清單（需要手動修正 URL）');
console.log('='.repeat(80) + '\n');

dnsErrors.forEach((error, i) => {
  console.log(`${i + 1}. ${error.name} (${error.city})`);
  console.log(`   錯誤 URL: ${error.url}`);
  console.log(`   錯誤原因: ${error.error}`);
  console.log('');
});

console.log('\n' + '='.repeat(80));
console.log('⚠️ HTTP 403 錯誤清單（可用爬蟲修正）');
console.log('='.repeat(80) + '\n');

http403Errors.forEach((error, i) => {
  console.log(`${i + 1}. ${error.name} (${error.city})`);
  console.log(`   URL: ${error.url}`);
  console.log(`   錯誤: ${error.error}`);
  console.log('');
});

console.log('\n' + '='.repeat(80));
console.log('⚠️ HTTP 400 錯誤清單（可用爬蟲修正）');
console.log('='.repeat(80) + '\n');

http400Errors.forEach((error, i) => {
  console.log(`${i + 1}. ${error.name} (${error.city})`);
  console.log(`   URL: ${error.url}`);
  console.log(`   錯誤: ${error.error}`);
  console.log('');
});

console.log('\n' + '='.repeat(80));
console.log('⚠️ 超時錯誤清單（可用爬蟲修正）');
console.log('='.repeat(80) + '\n');

timeoutErrors.forEach((error, i) => {
  console.log(`${i + 1}. ${error.name} (${error.city})`);
  console.log(`   URL: ${error.url}`);
  console.log(`   錯誤: ${error.error}`);
  console.log('');
});

console.log('\n' + '='.repeat(80));
console.log('⚠️ SSL 錯誤清單（可用爬蟲修正）');
console.log('='.repeat(80) + '\n');

sslErrors.forEach((error, i) => {
  console.log(`${i + 1}. ${error.name} (${error.city})`);
  console.log(`   URL: ${error.url}`);
  console.log(`   錯誤: ${error.error}`);
  console.log('');
});

// 保存分類結果
const classified = {
  dnsErrors,
  http403Errors,
  http400Errors,
  timeoutErrors,
  sslErrors,
  otherErrors
};

fs.writeFileSync('classified-errors.json', JSON.stringify(classified, null, 2));

console.log('\n✅ 已保存分類結果到: classified-errors.json');

// 生成 DNS 錯誤清單（供手動修正）
const dnsErrorList = dnsErrors.map(e => ({
  name: e.name,
  city: e.city,
  wrongUrl: e.url,
  error: e.error,
  needsManualFix: true
}));

fs.writeFileSync('dns-errors-manual-fix.json', JSON.stringify(dnsErrorList, null, 2));

console.log('✅ 已保存 DNS 錯誤清單到: dns-errors-manual-fix.json');

// 生成可爬蟲修正的清單
const crawlableErrors = [
  ...http403Errors,
  ...http400Errors,
  ...timeoutErrors,
  ...sslErrors
];

fs.writeFileSync('crawlable-errors.json', JSON.stringify(crawlableErrors, null, 2));

console.log('✅ 已保存可爬蟲修正清單到: crawlable-errors.json');
