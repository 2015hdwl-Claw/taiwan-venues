#!/usr/bin/env node
/**
 * ID 查詢腳本
 * 用途：精確查詢 ID 是否存在於資料庫
 * 版本：1.0
 * 日期：2026-03-03
 */

const fs = require('fs');
const path = require('path');

// 載入資料庫
const dataPath = path.join(__dirname, 'venues-all-cities.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// 查詢單一 ID
function queryId(id) {
  // 使用 == 進行寬鬆比對（支援數字和字串）
  const venue = data.find(v => v.id == id);
  
  if (venue) {
    return {
      exists: true,
      id: venue.id,
      name: venue.name,
      city: venue.city,
      status: venue.status,
      url: venue.url
    };
  } else {
    return {
      exists: false,
      id: id,
      error: 'ID_NOT_FOUND'
    };
  }
}

// 搜尋重複記錄
function findDuplicates(name) {
  const normalizedName = name.replace(/\(.*\)/g, '').trim();
  const duplicates = data.filter(v => 
    v.name.replace(/\(.*\)/g, '').trim() === normalizedName
  );
  
  return {
    name: normalizedName,
    count: duplicates.length,
    ids: duplicates.map(v => v.id)
  };
}

// 批次查詢
function batchQuery(ids) {
  return ids.map(id => queryId(id));
}

// CLI 使用
const args = process.argv.slice(2);
const command = args[0];

if (command === 'query') {
  const id = args[1];
  console.log(JSON.stringify(queryId(id), null, 2));
} else if (command === 'duplicates') {
  const name = args.slice(1).join(' ');
  console.log(JSON.stringify(findDuplicates(name), null, 2));
} else if (command === 'batch') {
  const ids = args.slice(1).map(id => parseInt(id) || id);
  console.log(JSON.stringify(batchQuery(ids), null, 2));
} else {
  console.log('使用方式:');
  console.log('  node id-query.js query <id>');
  console.log('  node id-query.js duplicates <name>');
  console.log('  node id-query.js batch <id1> <id2> ...');
}

module.exports = { queryId, findDuplicates, batchQuery };
