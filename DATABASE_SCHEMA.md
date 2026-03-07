# 資料庫 Schema 設計文件

**版本**: 1.0
**日期**: 2026-03-05
**資料庫**: PostgreSQL 15+

---

## 📋 目錄

1. [概覽](#概覽)
2. [核心資料表](#核心資料表)
3. [關聯設計](#關聯設計)
4. [索引策略](#索引策略)
5. [查詢優化](#查詢優化)
6. [資料遷移](#資料遷移)

---

## 概覽

### 設計原則

1. **正規化與反正規化平衡**
   - 核心資料正規化（避免重複）
   - 查詢頻繁的資料反正規化（提升效能）

2. **JSONB 彈性欄位**
   - 設備、設施等可變欄位使用 JSONB
   - 保持 Schema 穩定性

3. **時間戳記完整記錄**
   - 所有資料表都有 created_at, updated_at
   - 重要操作記錄時間戳

4. **軟刪除設計**
   - 使用 status 欄位而非實際刪除
   - 保留歷史資料

### ER 圖

```
┌─────────────┐
│   users     │
│─────────────│
│ id (PK)     │
│ line_user_id│
│ ...         │
└──────┬──────┘
       │
       │ 1:N
       │
       ▼
┌─────────────┐         ┌─────────────┐
│conversations│         │ search_logs │
│─────────────│         │─────────────│
│ id (PK)     │         │ id (PK)     │
│ user_id(FK) │         │ user_id(FK) │
│ ...         │         │ ...         │
└─────────────┘         └─────────────┘

┌─────────────┐         ┌─────────────┐
│   venues    │◄────────│   rooms     │
│─────────────│   1:N   │─────────────│
│ id (PK)     │         │ id (PK)     │
│ ...         │         │ venue_id(FK)│
└─────────────┘         │ ...         │
                        └─────────────┘

┌─────────────┐         ┌─────────────┐
│  schools    │◄────────│ departments │
│─────────────│   1:N   │─────────────│
│ id (PK)     │         │ id (PK)     │
│ ...         │         │ school_id(FK)│
└─────────────┘         │ ...         │
                        └─────────────┘
```

---

## 核心資料表

### 1. venues (場地主表)

```sql
CREATE TABLE venues (
  -- 主鍵
  id SERIAL PRIMARY KEY,
  
  -- 基本資訊
  name VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  room_name VARCHAR(255),
  venue_type VARCHAR(50) NOT NULL,
  
  -- 地點資訊
  city VARCHAR(50) NOT NULL,
  district VARCHAR(50),
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- 聯絡資訊
  contact_person VARCHAR(100),
  contact_phone VARCHAR(50),
  contact_phone_2 VARCHAR(50),
  contact_email VARCHAR(100),
  contact_fax VARCHAR(50),
  
  -- 價格資訊
  price_half_day DECIMAL(10, 2),
  price_full_day DECIMAL(10, 2),
  price_hour DECIMAL(10, 2),
  price_note TEXT,
  currency VARCHAR(10) DEFAULT 'TWD',
  
  -- 容量資訊
  max_capacity_theater INTEGER,
  max_capacity_classroom INTEGER,
  max_capacity_u_shape INTEGER,
  max_capacity_round_table INTEGER,
  max_capacity_note TEXT,
  
  -- 時間資訊
  available_time_weekday VARCHAR(100),
  available_time_weekend VARCHAR(100),
  available_time_note TEXT,
  
  -- 設備與設施
  equipment JSONB DEFAULT '[]'::jsonb,
  facilities JSONB DEFAULT '[]'::jsonb,
  services JSONB DEFAULT '[]'::jsonb,
  
  -- 網址資訊
  url VARCHAR(500),
  venue_list_url VARCHAR(500),
  meeting_page_url VARCHAR(500),
  booking_url VARCHAR(500),
  
  -- 照片
  venue_main_image_url VARCHAR(500),
  images JSONB DEFAULT '{
    "main": null,
    "gallery": [],
    "floorPlan": null,
    "source": null,
    "verified": false,
    "verifiedAt": null,
    "needsUpdate": false,
    "note": null
  }'::jsonb,
  
  -- 會議室資訊
  rooms_count INTEGER DEFAULT 0,
  room_names TEXT[] DEFAULT '{}',
  
  -- 驗證狀態
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  last_verified TIMESTAMP,
  verified_title VARCHAR(255),
  verification_note TEXT,
  
  -- 狀態
  status VARCHAR(20) DEFAULT '待修' CHECK (
    status IN ('上架', '下架', '待修', '不提供會議')
  ),
  
  -- 評價
  rating DECIMAL(2, 1),
  review_count INTEGER DEFAULT 0,
  
  -- 統計
  view_count INTEGER DEFAULT 0,
  search_count INTEGER DEFAULT 0,
  booking_count INTEGER DEFAULT 0,
  
  -- 中繼資料
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_updated TIMESTAMP,
  update_reason TEXT,
  update_source VARCHAR(50),
  
  -- 索引
  created_by VARCHAR(100),
  tags TEXT[] DEFAULT '{}',
  
  -- 完整性約束
  CONSTRAINT valid_price CHECK (
    price_half_day IS NULL OR price_half_day >= 0
  ),
  CONSTRAINT valid_capacity CHECK (
    max_capacity_theater IS NULL OR max_capacity_theater >= 0
  )
);

-- 索引
CREATE INDEX idx_venues_type ON venues(venue_type);
CREATE INDEX idx_venues_city ON venues(city);
CREATE INDEX idx_venues_status ON venues(status);
CREATE INDEX idx_venues_verified ON venues(verified);
CREATE INDEX idx_venues_price ON venues(price_full_day);
CREATE INDEX idx_venues_capacity ON venues(max_capacity_theater);
CREATE INDEX idx_venues_rating ON venues(rating DESC);
CREATE INDEX idx_venues_created ON venues(created_at DESC);
CREATE INDEX idx_venues_location ON venues USING GIST (
  ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
);

-- 全文搜尋索引
CREATE INDEX idx_venues_search ON venues USING GIN (
  to_tsvector('chinese', name || ' ' || COALESCE(address, ''))
);

-- JSONB 索引
CREATE INDEX idx_venues_equipment ON venues USING GIN (equipment);
CREATE INDEX idx_venues_images ON venues USING GIN (images);
```

### 2. rooms (會議室表)

```sql
CREATE TABLE rooms (
  id SERIAL PRIMARY KEY,
  venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  
  -- 基本資訊
  name VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  floor INTEGER,
  area_sqm DECIMAL(10, 2),
  
  -- 容量
  capacity_theater INTEGER,
  capacity_classroom INTEGER,
  capacity_u_shape INTEGER,
  capacity_round_table INTEGER,
  
  -- 價格
  price_half_day DECIMAL(10, 2),
  price_full_day DECIMAL(10, 2),
  price_hour DECIMAL(10, 2),
  
  -- 設備
  equipment JSONB DEFAULT '[]'::jsonb,
  
  -- 照片
  image_url VARCHAR(500),
  gallery JSONB DEFAULT '[]'::jsonb,
  
  -- 網址
  detail_url VARCHAR(500),
  
  -- 狀態
  status VARCHAR(20) DEFAULT '上架',
  
  -- 中繼資料
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- 索引
  room_order INTEGER DEFAULT 0
);

-- 索引
CREATE INDEX idx_rooms_venue ON rooms(venue_id);
CREATE INDEX idx_rooms_capacity ON rooms(capacity_theater);
CREATE INDEX idx_rooms_price ON rooms(price_full_day);
```

### 3. schools (學校主表)

```sql
CREATE TABLE schools (
  id SERIAL PRIMARY KEY,
  
  -- 基本資訊
  name VARCHAR(255) NOT NULL,
  short_name VARCHAR(100),
  name_en VARCHAR(255),
  type VARCHAR(50), -- 大學, 科技大學, 技術學院, 專科學校
  category VARCHAR(50), -- 公立, 私立
  
  -- 地點
  city VARCHAR(50),
  district VARCHAR(50),
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- 聯絡資訊
  phone VARCHAR(50),
  email VARCHAR(100),
  fax VARCHAR(50),
  
  -- 網址
  url VARCHAR(500),
  admission_url VARCHAR(500),
  department_url VARCHAR(500),
  
  -- 入學管道
  admission_channels JSONB DEFAULT '[]'::jsonb,
  -- ["申請入學", "繁星推薦", "分發入學", "獨立招生"]
  
  -- 統計資訊
  total_students INTEGER,
  acceptance_rate DECIMAL(5, 2),
  tuition_fee DECIMAL(10, 2),
  
  -- 評價
  rating DECIMAL(2, 1),
  review_count INTEGER DEFAULT 0,
  
  -- 狀態
  status VARCHAR(20) DEFAULT '上架',
  
  -- 中繼資料
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  tags TEXT[] DEFAULT '{}',
  
  -- 索引
  CONSTRAINT valid_acceptance CHECK (
    acceptance_rate IS NULL OR (acceptance_rate >= 0 AND acceptance_rate <= 100)
  )
);

-- 索引
CREATE INDEX idx_schools_type ON schools(type);
CREATE INDEX idx_schools_city ON schools(city);
CREATE INDEX idx_schools_category ON schools(category);
CREATE INDEX idx_schools_rating ON schools(rating DESC);

-- 全文搜尋
CREATE INDEX idx_schools_search ON schools USING GIN (
  to_tsvector('chinese', name || ' ' || COALESCE(short_name, ''))
);
```

### 4. departments (科系表)

```sql
CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  
  -- 基本資訊
  name VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  code VARCHAR(50),
  college VARCHAR(100), -- 學院
  
  -- 招生資訊
  quota INTEGER,
  admission_type VARCHAR(50), -- 申請入學, 繁星推薦, etc.
  subjects JSONB DEFAULT '[]'::jsonb, -- 採計科目
  weights JSONB DEFAULT '{}'::jsonb, -- 加權
  
  -- 統計
  acceptance_rate DECIMAL(5, 2),
  last_year_score DECIMAL(5, 2),
  
  -- 網址
  url VARCHAR(500),
  
  -- 狀態
  status VARCHAR(20) DEFAULT '上架',
  
  -- 中繼資料
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- 索引
  department_order INTEGER DEFAULT 0
);

-- 索引
CREATE INDEX idx_departments_school ON departments(school_id);
CREATE INDEX idx_departments_name ON departments(name);
CREATE INDEX idx_departments_admission ON departments(admission_type);
```

### 5. users (用戶表)

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  
  -- LINE 資訊
  line_user_id VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  picture_url VARCHAR(500),
  status_message TEXT,
  
  -- 個人資訊
  email VARCHAR(100),
  phone VARCHAR(50),
  
  -- 偏好設定
  preferences JSONB DEFAULT '{
    "defaultCity": null,
    "priceRange": [0, 100000],
    "capacityRange": [0, 1000],
    "favoriteTypes": [],
    "notificationEnabled": true
  }'::jsonb,
  
  -- 使用統計
  search_count INTEGER DEFAULT 0,
  venue_view_count INTEGER DEFAULT 0,
  school_view_count INTEGER DEFAULT 0,
  
  -- 活動時間
  first_active_at TIMESTAMP,
  last_active_at TIMESTAMP,
  
  -- 中繼資料
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- 標籤
  tags TEXT[] DEFAULT '{}',
  notes TEXT
);

-- 索引
CREATE INDEX idx_users_line ON users(line_user_id);
CREATE INDEX idx_users_active ON users(last_active_at DESC);
```

### 6. conversations (對話記錄表)

```sql
CREATE TABLE conversations (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  bot_type VARCHAR(50) NOT NULL, -- 活動大師, 升學大師
  
  -- 訊息內容
  message_id VARCHAR(100),
  message_type VARCHAR(50) DEFAULT 'text', -- text, image, location, sticker
  user_message TEXT,
  bot_response TEXT,
  
  -- AI 分析
  intent VARCHAR(100), -- 搜尋場地, 比較價格, 查詢詳情, etc.
  entities JSONB DEFAULT '{}'::jsonb,
  -- { "city": "台北市", "capacity": 100, "price": 50000 }
  confidence DECIMAL(3, 2),
  processing_time_ms INTEGER,
  
  -- 上下文
  context JSONB DEFAULT '{}'::jsonb,
  -- { "lastVenueId": 123, "searchResults": [...], "state": "browsing" }
  
  -- 回饋
  feedback_rating INTEGER, -- 1-5
  feedback_text TEXT,
  
  -- 時間戳
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- 分區鍵（按月份）
  partition_key VARCHAR(7) GENERATED ALWAYS AS (
    TO_CHAR(created_at, 'YYYY-MM')
  ) STORED
);

-- 索引
CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_conversations_bot ON conversations(bot_type);
CREATE INDEX idx_conversations_intent ON conversations(intent);
CREATE INDEX idx_conversations_time ON conversations(created_at DESC);
CREATE INDEX idx_conversations_partition ON conversations(partition_key);

-- 分區（按月份）
CREATE TABLE conversations_2026_03 PARTITION OF conversations
  FOR VALUES FROM ('2026-03') TO ('2026-04');

CREATE TABLE conversations_2026_04 PARTITION OF conversations
  FOR VALUES FROM ('2026-04') TO ('2026-05');
```

### 7. search_logs (搜尋記錄表)

```sql
CREATE TABLE search_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  bot_type VARCHAR(50) NOT NULL,
  
  -- 搜尋條件
  search_type VARCHAR(50), -- venue, school
  search_query TEXT,
  filters JSONB DEFAULT '{}'::jsonb,
  -- { "city": "台北市", "type": "飯店", "capacity": 100, "priceMax": 50000 }
  
  -- 搜尋結果
  result_count INTEGER,
  results JSONB DEFAULT '[]'::jsonb,
  -- [venue_id1, venue_id2, ...]
  
  -- 用戶行為
  clicked_results JSONB DEFAULT '[]'::jsonb,
  -- [venue_id1, venue_id3]
  view_duration_seconds INTEGER,
  scroll_depth DECIMAL(3, 2),
  
  -- 時間戳
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- 分區鍵
  partition_key VARCHAR(7) GENERATED ALWAYS AS (
    TO_CHAR(created_at, 'YYYY-MM')
  ) STORED
);

-- 索引
CREATE INDEX idx_search_logs_user ON search_logs(user_id);
CREATE INDEX idx_search_logs_type ON search_logs(search_type);
CREATE INDEX idx_search_logs_time ON search_logs(created_at DESC);
```

### 8. analytics (分析統計表)

```sql
CREATE TABLE analytics (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  bot_type VARCHAR(50) NOT NULL,
  
  -- 用戶統計
  new_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  returning_users INTEGER DEFAULT 0,
  
  -- 訊息統計
  total_messages INTEGER DEFAULT 0,
  user_messages INTEGER DEFAULT 0,
  bot_messages INTEGER DEFAULT 0,
  
  -- 搜尋統計
  total_searches INTEGER DEFAULT 0,
  avg_results_per_search DECIMAL(5, 2),
  top_search_queries JSONB DEFAULT '[]'::jsonb,
  
  -- 場地統計
  venue_views INTEGER DEFAULT 0,
  top_venues JSONB DEFAULT '[]'::jsonb,
  
  -- 學校統計
  school_views INTEGER DEFAULT 0,
  top_schools JSONB DEFAULT '[]'::jsonb,
  
  -- 效能統計
  avg_response_time_ms INTEGER,
  error_count INTEGER DEFAULT 0,
  
  -- 時間戳
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- 唯一約束
  CONSTRAINT unique_date_bot UNIQUE (date, bot_type)
);

-- 索引
CREATE INDEX idx_analytics_date ON analytics(date DESC);
CREATE INDEX idx_analytics_bot ON analytics(bot_type);
```

---

## 關聯設計

### 外鍵關聯

```sql
-- venues -> rooms (1:N)
ALTER TABLE rooms
  ADD CONSTRAINT fk_rooms_venue
  FOREIGN KEY (venue_id) REFERENCES venues(id)
  ON DELETE CASCADE;

-- schools -> departments (1:N)
ALTER TABLE departments
  ADD CONSTRAINT fk_departments_school
  FOREIGN KEY (school_id) REFERENCES schools(id)
  ON DELETE CASCADE;

-- users -> conversations (1:N)
ALTER TABLE conversations
  ADD CONSTRAINT fk_conversations_user
  FOREIGN KEY (user_id) REFERENCES users(id)
  ON DELETE SET NULL;

-- users -> search_logs (1:N)
ALTER TABLE search_logs
  ADD CONSTRAINT fk_search_logs_user
  FOREIGN KEY (user_id) REFERENCES users(id)
  ON DELETE SET NULL;
```

---

## 索引策略

### 1. 主要索引

| 資料表 | 索引名稱 | 欄位 | 類型 | 用途 |
|--------|---------|------|------|------|
| venues | idx_venues_type | venue_type | B-Tree | 類型篩選 |
| venues | idx_venues_city | city | B-Tree | 城市篩選 |
| venues | idx_venues_status | status | B-Tree | 狀態篩選 |
| venues | idx_venues_price | price_full_day | B-Tree | 價格排序 |
| venues | idx_venues_capacity | max_capacity_theater | B-Tree | 容量排序 |
| venues | idx_venues_search | name, address | GIN | 全文搜尋 |
| venues | idx_venues_location | lat, lng | GIST | 地理搜尋 |

### 2. 複合索引

```sql
-- 常用查詢組合
CREATE INDEX idx_venues_city_type ON venues(city, venue_type);
CREATE INDEX idx_venues_status_verified ON venues(status, verified);
CREATE INDEX idx_venues_city_status ON venues(city, status);

-- 搜尋優化
CREATE INDEX idx_venues_search_composite ON venues(
  city, venue_type, status, price_full_day
);
```

### 3. 部分索引

```sql
-- 只索引上架場地
CREATE INDEX idx_venues_online ON venues(name, city)
  WHERE status = '上架' AND verified = TRUE;

-- 只索引有照片的場地
CREATE INDEX idx_venues_with_photos ON venues(id)
  WHERE venue_main_image_url IS NOT NULL;
```

---

## 查詢優化

### 1. 常用查詢範例

#### 場地搜尋

```sql
-- 基本搜尋
SELECT * FROM venues
WHERE city = '台北市'
  AND venue_type = '飯店場地'
  AND status = '上架'
  AND verified = TRUE
  AND max_capacity_theater >= 100
  AND price_full_day <= 50000
ORDER BY rating DESC, price_full_day ASC
LIMIT 20;

-- 全文搜尋
SELECT * FROM venues
WHERE to_tsvector('chinese', name || ' ' || COALESCE(address, '')) 
  @@ to_tsquery('chinese', '台北 & 會議')
  AND status = '上架'
ORDER BY ts_rank(
  to_tsvector('chinese', name || ' ' || COALESCE(address, '')),
  to_tsquery('chinese', '台北 & 會議')
) DESC;

-- 地理搜尋（附近場地）
SELECT *, 
  ST_Distance(
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326),
    ST_SetSRID(ST_MakePoint(121.5, 25.0), 4326)
  ) as distance
FROM venues
WHERE status = '上架'
  AND ST_DWithin(
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
    ST_SetSRID(ST_MakePoint(121.5, 25.0), 4326)::geography,
    5000 -- 5 公里
  )
ORDER BY distance
LIMIT 20;
```

#### 統計查詢

```sql
-- 場地類型統計
SELECT venue_type, COUNT(*) as count
FROM venues
WHERE status = '上架'
GROUP BY venue_type
ORDER BY count DESC;

-- 城市分佈
SELECT city, COUNT(*) as count
FROM venues
WHERE status = '上架'
GROUP BY city
ORDER BY count DESC;

-- 價格分佈
SELECT 
  CASE 
    WHEN price_full_day < 10000 THEN '0-10K'
    WHEN price_full_day < 30000 THEN '10K-30K'
    WHEN price_full_day < 50000 THEN '30K-50K'
    WHEN price_full_day < 100000 THEN '50K-100K'
    ELSE '100K+'
  END as price_range,
  COUNT(*) as count
FROM venues
WHERE status = '上架' AND price_full_day IS NOT NULL
GROUP BY price_range
ORDER BY price_range;
```

### 2. 查詢效能優化

#### 使用 EXPLAIN ANALYZE

```sql
EXPLAIN ANALYZE
SELECT * FROM venues
WHERE city = '台北市' AND venue_type = '飯店場地';
```

#### 避免 SELECT *

```sql
-- ❌ 不好
SELECT * FROM venues WHERE id = 123;

-- ✅ 更好
SELECT id, name, city, venue_type, price_full_day
FROM venues
WHERE id = 123;
```

#### 使用 LIMIT

```sql
-- ✅ 限制結果數量
SELECT * FROM venues
WHERE city = '台北市'
ORDER BY rating DESC
LIMIT 20;
```

---

## 資料遷移

### 1. 從 JSON 遷移到 PostgreSQL

```python
import json
import psycopg2
from datetime import datetime

# 連線資料庫
conn = psycopg2.connect(
  host="localhost",
  database="eventmaster",
  user="admin",
  password="password"
)
cur = conn.cursor()

# 讀取 JSON 資料
with open('venues-all-cities.json', 'r', encoding='utf-8') as f:
  venues = json.load(f)

# 遷移資料
for venue in venues:
  cur.execute("""
    INSERT INTO venues (
      name, room_name, venue_type, city, district, address,
      contact_person, contact_phone, contact_email,
      price_half_day, price_full_day,
      max_capacity_theater, max_capacity_classroom,
      available_time_weekday, available_time_weekend,
      equipment, url, venue_list_url,
      venue_main_image_url, images,
      rooms_count, room_names,
      verified, verified_at, last_verified, verified_title,
      status, created_at, updated_at, last_updated,
      update_reason, update_source
    ) VALUES (
      %s, %s, %s, %s, %s, %s,
      %s, %s, %s,
      %s, %s,
      %s, %s,
      %s, %s,
      %s, %s, %s,
      %s, %s,
      %s, %s,
      %s, %s, %s, %s,
      %s, %s, %s, %s,
      %s, %s
    )
  """, (
    venue.get('name'),
    venue.get('roomName'),
    venue.get('venueType'),
    venue.get('city'),
    venue.get('district'),
    venue.get('address'),
    venue.get('contactPerson'),
    venue.get('contactPhone'),
    venue.get('contactEmail'),
    venue.get('priceHalfDay'),
    venue.get('priceFullDay'),
    venue.get('maxCapacityTheater'),
    venue.get('maxCapacityClassroom'),
    venue.get('availableTimeWeekday'),
    venue.get('availableTimeWeekend'),
    json.dumps(venue.get('equipment', [])),
    venue.get('url'),
    venue.get('venueListUrl'),
    venue.get('venueMainImageUrl'),
    json.dumps(venue.get('images', {})),
    venue.get('roomsCount'),
    venue.get('roomNames', []),
    venue.get('verified', False),
    venue.get('verifiedAt'),
    venue.get('lastVerified'),
    venue.get('verifiedTitle'),
    venue.get('status', '待修'),
    venue.get('created_at', datetime.now()),
    venue.get('updated_at', datetime.now()),
    venue.get('lastUpdated'),
    venue.get('updateReason'),
    venue.get('updateSource')
  ))

conn.commit()
cur.close()
conn.close()

print(f"遷移完成：{len(venues)} 筆資料")
```

### 2. 資料驗證

```sql
-- 檢查遷移後的資料筆數
SELECT COUNT(*) FROM venues;

-- 檢查欄位完整性
SELECT 
  COUNT(*) as total,
  COUNT(address) as has_address,
  COUNT(contact_phone) as has_phone,
  COUNT(price_full_day) as has_price,
  COUNT(max_capacity_theater) as has_capacity
FROM venues;

-- 檢查異常資料
SELECT id, name, city, venue_type
FROM venues
WHERE city IS NULL OR venue_type IS NULL;
```

---

## 備份與還原

### 1. 備份策略

```bash
# 完整備份
pg_dump -U admin -d eventmaster > backup_$(date +%Y%m%d).sql

# 壓縮備份
pg_dump -U admin -d eventmaster | gzip > backup_$(date +%Y%m%d).sql.gz

# 僅備份資料（不含結構）
pg_dump -U admin -d eventmaster --data-only > data_$(date +%Y%m%d).sql

# 僅備份結構（不含資料）
pg_dump -U admin -d eventmaster --schema-only > schema.sql
```

### 2. 還原

```bash
# 還原資料庫
psql -U admin -d eventmaster < backup_20260305.sql

# 還原壓縮備份
gunzip -c backup_20260305.sql.gz | psql -U admin -d eventmaster
```

---

**文件維護**: Jobs (CTO)
**最後更新**: 2026-03-05
**版本**: 1.0
