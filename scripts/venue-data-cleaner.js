#!/usr/bin/env node
/**
 * 場地資料清理工具
 * 用途：批次修正各種資料問題
 */

const fs = require('fs');
const path = require('path');

class VenueDataCleaner {
  constructor() {
    this.dataPath = path.join(__dirname, '..', 'venues-all-cities.json');
    this.venues = JSON.parse(fs.readFileSync(this.dataPath, 'utf8'));
    this.changes = [];
  }

  // 修正缺電話的場地
  fixMissingPhone(phoneUpdates) {
    console.log(`\n📞 修正缺電話的場地...`);

    phoneUpdates.forEach(update => {
      const venue = this.venues.find(v => v.id === update.id);
      if (venue) {
        venue.contactPhone = update.phone;
        venue.lastFixedAt = new Date().toISOString();
        this.changes.push({
          type: 'fix-phone',
          id: venue.id,
          name: venue.name,
          oldValue: venue.contactPhone,
          newValue: update.phone
        });
        console.log(`  ✅ [${venue.id}] ${venue.name}: ${update.phone}`);
      }
    });
  }

  // 修正缺地址的場地
  fixMissingAddress(addressUpdates) {
    console.log(`\n📍 修正缺地址的場地...`);

    addressUpdates.forEach(update => {
      const venue = this.venues.find(v => v.id === update.id);
      if (venue) {
        venue.address = update.address;
        venue.lastFixedAt = new Date().toISOString();
        this.changes.push({
          type: 'fix-address',
          id: venue.id,
          name: venue.name,
          oldValue: venue.address,
          newValue: update.address
        });
        console.log(`  ✅ [${venue.id}] ${venue.name}: ${update.address}`);
      }
    });
  }

  // 修正缺類型的場地
  fixMissingVenueType(typeUpdates) {
    console.log(`\n🏷️ 修正缺類型的場地...`);

    typeUpdates.forEach(update => {
      const venue = this.venues.find(v => v.id === update.id);
      if (venue) {
        venue.venueType = update.venueType;
        venue.lastFixedAt = new Date().toISOString();
        this.changes.push({
          type: 'fix-type',
          id: venue.id,
          name: venue.name,
          oldValue: venue.venueType,
          newValue: update.venueType
        });
        console.log(`  ✅ [${venue.id}] ${venue.name}: ${update.venueType}`);
      }
    });
  }

  // 修正缺價格的場地
  fixMissingPrice(priceUpdates) {
    console.log(`\n💰 修正缺價格的場地...`);

    priceUpdates.forEach(update => {
      const venue = this.venues.find(v => v.id === update.id);
      if (venue) {
        if (update.priceHalfDay) venue.priceHalfDay = update.priceHalfDay;
        if (update.priceFullDay) venue.priceFullDay = update.priceFullDay;
        if (update.pricePerHour) venue.pricePerHour = update.pricePerHour;
        venue.lastFixedAt = new Date().toISOString();
        this.changes.push({
          type: 'fix-price',
          id: venue.id,
          name: venue.name,
          newValue: update
        });
        console.log(`  ✅ [${venue.id}] ${venue.name}: 半日 ${update.priceHalfDay || '未設定'}`);
      }
    });
  }

  // 批次更新照片
  updatePhotos(photoUpdates) {
    console.log(`\n📷 更新場地照片...`);

    photoUpdates.forEach(update => {
      const venue = this.venues.find(v => v.id === update.id);
      if (venue) {
        if (!venue.images) venue.images = {};
        if (update.main) venue.images.main = update.main;
        if (update.gallery) venue.images.gallery = update.gallery;
        if (update.floorPlan) venue.images.floorPlan = update.floorPlan;
        venue.images.needsUpdate = false;
        venue.images.note = '';
        venue.lastFixedAt = new Date().toISOString();
        this.changes.push({
          type: 'update-photos',
          id: venue.id,
          name: venue.name
        });
        console.log(`  ✅ [${venue.id}] ${venue.name}`);
      }
    });
  }

  // 儲存變更
  save() {
    fs.writeFileSync(this.dataPath, JSON.stringify(this.venues, null, 2));
    console.log(`\n✅ 已儲存 ${this.changes.length} 筆變更`);

    // 儲存變更日誌
    const logPath = path.join(__dirname, '..', 'data-cleanup-log.json');
    const log = {
      timestamp: new Date().toISOString(),
      totalChanges: this.changes.length,
      changes: this.changes
    };
    fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
    console.log(`📝 變更日誌已儲存至：${logPath}`);
  }

  // 產生 Git 提交指令
  generateGitCommand() {
    if (this.changes.length === 0) {
      console.log(`\n無變更，無需提交`);
      return;
    }

    const types = {};
    this.changes.forEach(c => {
      types[c.type] = (types[c.type] || 0) + 1;
    });

    const summary = Object.entries(types)
      .map(([type, count]) => `${count} 筆${type.replace('fix-', '').replace('update-', '')}`)
      .join('、');

    console.log(`\n📦 Git 提交指令：`);
    console.log(`git add venues-all-cities.json`);
    console.log(`git commit -m "fix: 修正 ${summary}"`);
    console.log(`git push origin main`);
  }
}

// 匯出
module.exports = VenueDataCleaner;

// 如果直接執行，顯示使用說明
if (require.main === module) {
  console.log(`
場地資料清理工具
================

使用方式：
1. 建立 Node.js 腳本
2. 引入此模組
3. 呼叫對應的修正方法

範例：
const Cleaner = require('./scripts/venue-data-cleaner');
const cleaner = new Cleaner();

// 修正電話
cleaner.fixMissingPhone([
  { id: 1040, phone: '02-7708-8888' },
  { id: 1106, phone: '02-2321-1818' }
]);

// 儲存變更
cleaner.save();
cleaner.generateGitCommand();
  `);
}
