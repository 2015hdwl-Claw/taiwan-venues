const fs = require('fs');

// 讀取現有資料
const allVenues = JSON.parse(fs.readFileSync('venues-all-cities.json', 'utf8'));
const ticcComplete = JSON.parse(fs.readFileSync('ticc-complete-data-updated.json', 'utf8'));

// 找出現有 TICC 場地的 ID 範圍
const existingTicc = allVenues.filter(v => v.name.includes('台北國際會議中心'));
console.log(`現有 TICC 場地: ${existingTicc.length} 筆`);
existingTicc.forEach(v => console.log(`  - ID: ${v.id}, ${v.roomName}`));

// 找出最大 ID
const maxId = Math.max(...allVenues.map(v => v.id));
console.log(`\n最大 ID: ${maxId}`);

// 從 ticc-complete-data-updated.json 創建新的場地資料
const newTiccVenues = [];
let newId = maxId + 1;

ticcComplete.rooms.forEach(room => {
  // 檢查是否已存在
  const exists = allVenues.find(v => 
    v.roomName === room.roomName || 
    v.roomName.includes(room.roomId)
  );
  
  if (!exists) {
    const newVenue = {
      id: newId++,
      name: `台北國際會議中心(TICC)`,
      roomName: room.roomName,
      venueType: "會議場地",
      roomType: "會議中心",
      city: "台北市",
      address: ticcComplete.address,
      contactPerson: "場地預約",
      contactPhone: ticcComplete.contact.phone,
      contactEmail: ticcComplete.contact.email,
      priceHalfDay: room.pricing.weekday || null,
      priceFullDay: (room.pricing.weekday || 0) * 2,
      maxCapacityTheater: room.capacity.theater || null,
      maxCapacityClassroom: room.capacity.classroom || null,
      availableTimeWeekday: "08:30-22:30",
      availableTimeWeekend: "08:30-22:30",
      equipment: room.equipment ? room.equipment.join('、') : "",
      images: {
        main: room.photos && room.photos[0] ? room.photos[0] : "",
        gallery: room.photos || [],
        floorPlan: "",
        needsUpdate: !room.photos || room.photos.length === 0,
        note: room.photos && room.photos.length > 0 ? "來源: TICC 官網" : "待補充照片",
        lastUpdated: "2026-03-01"
      },
      url: ticcComplete.venueUrl,
      sourceUrl: room.source || "",
      verified: true,
      verifiedAt: "2026-03-01",
      status: "上架",
      // 額外資訊
      floor: room.floor || "1F",
      areaPing: room.area?.ping || null,
      areaSqm: room.area?.squareMeters || null,
      dimensions: room.area?.dimensions || null,
      pricingWeekend: room.pricing.weekend || null,
      pricingExhibition: room.pricing.exhibition || null,
      capacityHorseshoe: room.capacity.horseshoe || null
    };
    
    newTiccVenues.push(newVenue);
    console.log(`新增: ${room.roomName} (ID: ${newVenue.id})`);
  } else {
    // 更新現有資料
    const idx = allVenues.findIndex(v => v.id === exists.id);
    if (idx !== -1) {
      allVenues[idx].maxCapacityTheater = room.capacity.theater || allVenues[idx].maxCapacityTheater;
      allVenues[idx].maxCapacityClassroom = room.capacity.classroom || allVenues[idx].maxCapacityClassroom;
      allVenues[idx].priceHalfDay = room.pricing.weekday || allVenues[idx].priceHalfDay;
      if (room.photos && room.photos.length > 0) {
        allVenues[idx].images.main = room.photos[0];
        allVenues[idx].images.gallery = room.photos;
        allVenues[idx].images.needsUpdate = false;
        allVenues[idx].images.note = "來源: TICC 官網";
      }
      allVenues[idx].areaPing = room.area?.ping || null;
      allVenues[idx].areaSqm = room.area?.squareMeters || null;
      allVenues[idx].dimensions = room.area?.dimensions || null;
      allVenues[idx].verifiedAt = "2026-03-01";
      console.log(`更新: ${room.roomName} (ID: ${exists.id})`);
    }
  }
});

// 合併新資料
const updatedVenues = [...allVenues, ...newTiccVenues];

// 寫入檔案
fs.writeFileSync('venues-all-cities.json', JSON.stringify(updatedVenues, null, 2));

console.log(`\n=== 更新完成 ===`);
console.log(`原有場地: ${allVenues.length - newTiccVenues.length}`);
console.log(`新增 TICC 場地: ${newTiccVenues.length}`);
console.log(`總計場地: ${updatedVenues.length}`);

// 驗證 TICC 場地數量
const finalTiccCount = updatedVenues.filter(v => v.name.includes('台北國際會議中心')).length;
console.log(`\nTICC 總場地數: ${finalTiccCount}`);
