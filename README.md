# 台灣場地資料庫後台管理系統

## 簡介
台灣各類活動場地（飯店、會議中心、展演空間等）的資料庫管理系統。

## 功能
- 📊 場地資料管理（新增/編輯/刪除）
- 🏷️ 狀態管理（上架/下架）
- 📍 依城市、類型篩選
- ⚠️ 資料完整性檢查
- 📷 照片管理
- 📤 JSON 匯出

## 本地啟動

```bash
cd taiwan-venues
python3 admin-server.py
```

預設網址: http://localhost:8080

## 資料結構

每個場地包含以下欄位：
- name: 場地名稱
- venueType: 場地類型（飯店/展演/機關/會議中心等）
- roomName: 廳房名稱
- city: 城市
- address: 地址
- contactPerson: 聯絡人
- contactPhone: 聯絡電話
- contactEmail: Email
- priceHalfDay/priceFullDay: 價格
- maxCapacityTheater/maxCapacityClassroom: 容納人數
- images: 照片 URL 陣列
- status: 狀態（上架/下架）
