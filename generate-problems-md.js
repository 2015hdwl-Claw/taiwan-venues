const fs = require('fs');
const results = JSON.parse(fs.readFileSync('verify-final-2026-03-01T23-45-18.json', 'utf8'));

console.log('=== 產生有問題的場地清單 ===');

// 分類
const dns = [];      // DNS 無法解析
const ssl = [];      // SSL 憑證錯誤
const timeout = [];  // 連線逾時
const connection = []; // 連線錯誤
const titleMismatch = []; // 標題不匹配
const noMeeting = []; // 找不到會議室頁面

results.forEach(r => {
  const error = r.error || '';
  const issues = r.issues || [];
  
  // 判斷主要問題
  if (error.includes('ERR_NAME_NOT_RESOLVED') || issues.some(i => i.includes('ERR_NAME_NOT_RESOLVED'))) {
    dns.push(r);
  } else if (error.includes('ERR_CERT') || issues.some(i => i.includes('ERR_CERT'))) {
    ssl.push(r);
  } else if (error.includes('Timeout') || issues.some(i => i.includes('Timeout'))) {
    timeout.push(r);
  } else if (error.includes('ERR_CONNECTION') || error.includes('ERR_ADDRESS') || error.includes('ERR_SSL_PROTOCOL')) {
    connection.push(r);
  } else if (issues.includes('官網標題不匹配')) {
    titleMismatch.push(r);
  } else if (issues.includes('找不到會議室頁面')) {
    noMeeting.push(r);
  }
});

// 產生 Markdown
let md = '# SOP v3.0 有問題的場地清單\n\n';
md += '**驗證日期**: 2026-03-02\n';
md += '**總官網**: 245\n';
md += '**OK**: 17 (6.9%)\n';
md += '**有問題**: 228 (93.1%)\n\n';
md += '---\n\n';

md += '## 統計\n\n';
md += '| 問題類型 | 數量 |\n';
md += '|---------|------|\n';
md += '| DNS 無法解析 | ' + dns.length + ' |\n';
md += '| 官網標題不匹配 | ' + titleMismatch.length + ' |\n';
md += '| 找不到會議室頁面 | ' + noMeeting.length + ' |\n';
md += '| 連線逾時 | ' + timeout.length + ' |\n';
md += '| SSL 憑證錯誤 | ' + ssl.length + ' |\n';
md += '| 連線錯誤 | ' + connection.length + ' |\n';
md += '| **總計** | **' + (dns.length + titleMismatch.length + noMeeting.length + timeout.length + ssl.length + connection.length) + '** |\n\n';
md += '---\n\n';

// 1. DNS 無法解析
md += '## 1. DNS 無法解析（' + dns.length + ' 個）\n\n';
md += '這些場地的官網域名已失效，需要重新搜尋或標記為「已歇業」。\n\n';
md += '| # | 場地名稱 | 官網 |\n';
md += '|---|---------|------|\n';

dns.forEach((r, i) => {
  const name = r.venues[0].name;
  md += '| ' + (i+1) + ' | ' + name + ' | ' + r.url + ' |\n';
});
md += '\n---\n\n';

// 2. 官網標題不匹配
md += '## 2. 官網標題不匹配（' + titleMismatch.length + ' 個）\n\n';
md += '這些場地的官網 URL 可能錯誤，或官網已遷移。\n\n';
md += '| # | 場地名稱 | 官網 | 官網標題 |\n';
md += '|---|---------|------|----------|\n';

titleMismatch.forEach((r, i) => {
  const name = r.venues.map(v => v.name).join(', ').slice(0, 50);
  const title = (r.title || '').slice(0, 50);
  md += '| ' + (i+1) + ' | ' + name + ' | ' + r.url + ' | ' + title + ' |\n';
});
md += '\n---\n\n';

// 3. 找不到會議室頁面
md += '## 3. 找不到會議室頁面（' + noMeeting.length + ' 個）\n\n';
md += '這些場地的官網沒有會議室或場地租借資訊。\n\n';
md += '| # | 場地名稱 | 官網 |\n';
md += '|---|---------|------|\n';

noMeeting.forEach((r, i) => {
  const name = r.venues.map(v => v.name).join(', ').slice(0, 50);
  md += '| ' + (i+1) + ' | ' + name + ' | ' + r.url + ' |\n';
});
md += '\n---\n\n';

// 4. 連線逾時
md += '## 4. 連線逾時（' + timeout.length + ' 個）\n\n';
md += '這些場地的官網回應過慢。\n\n';
md += '| # | 場地名稱 | 官網 |\n';
md += '|---|---------|------|\n';

timeout.forEach((r, i) => {
  const name = r.venues[0].name;
  md += '| ' + (i+1) + ' | ' + name + ' | ' + r.url + ' |\n';
});
md += '\n---\n\n';

// 5. SSL 憑證錯誤
md += '## 5. SSL 憑證錯誤（' + ssl.length + ' 個）\n\n';
md += '這些場地的官網有 SSL 憑證問題。\n\n';
md += '| # | 場地名稱 | 官網 |\n';
md += '|---|---------|------|\n';

ssl.forEach((r, i) => {
  const name = r.venues[0].name;
  md += '| ' + (i+1) + ' | ' + name + ' | ' + r.url + ' |\n';
});
md += '\n---\n\n';

// 6. 連線錯誤
md += '## 6. 連線錯誤（' + connection.length + ' 個）\n\n';
md += '這些場地的官網無法連線。\n\n';
md += '| # | 場地名稱 | 官網 |\n';
md += '|---|---------|------|\n';

connection.forEach((r, i) => {
  const name = r.venues[0].name;
  md += '| ' + (i+1) + ' | ' + name + ' | ' + r.url + ' |\n';
});
md += '\n---\n\n';

// 總結
md += '## 總結\n\n';
md += '### 主要問題\n\n';
md += '1. **93.1% 的官網有問題**（228/245）\n';
md += '2. **DNS 無法解析**：' + dns.length + ' 個（官網已關閉）\n';
md += '3. **官網標題不匹配**：' + titleMismatch.length + ' 個（可能是錯誤官網）\n';
md += '4. **找不到會議室頁面**：' + noMeeting.length + ' 個（官網沒有會議室資訊）\n\n';

md += '### 建議\n\n';
md += '1. **DNS 無法解析的場地**：標記為「待確認」或「已歇業」\n';
md += '2. **官網標題不匹配的場地**：重新搜尋正確官網\n';
md += '3. **找不到會議室頁面的場地**：改用 Google Maps 或 Facebook\n';

fs.writeFileSync('SOP_V3_PROBLEMS.md', md);
console.log('已產生: SOP_V3_PROBLEMS.md');
console.log('');
console.log('=== 分類統計 ===');
console.log('DNS 無法解析:', dns.length);
console.log('官網標題不匹配:', titleMismatch.length);
console.log('找不到會議室頁面:', noMeeting.length);
console.log('連線逾時:', timeout.length);
console.log('SSL 憑證錯誤:', ssl.length);
console.log('連線錯誤:', connection.length);
