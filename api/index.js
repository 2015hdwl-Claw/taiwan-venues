// Vercel Serverless Function Entry Point
const Fastify = require('fastify');
const cors = require('@fastify/cors');
const fs = require('fs');
const path = require('path');
const { chat } = require('./ai-service');

// 初始化 Fastify
const app = Fastify({ 
  logger: false, // Vercel 有自己的日誌系統
  trustProxy: true
});

// 啟用 CORS
app.register(cors, {
  origin: '*'
});

// 載入資料 - 在 Vercel 上使用相對路徑
const venuesPath = path.join(__dirname, '../migrated-data/venues.json');
const roomsPath = path.join(__dirname, '../migrated-data/rooms.json');

let venues = [];
let rooms = [];

try {
  venues = JSON.parse(fs.readFileSync(venuesPath, 'utf8'));
  rooms = JSON.parse(fs.readFileSync(roomsPath, 'utf8'));
  console.log(`✅ 載入 ${venues.length} 個場地, ${rooms.length} 個會議室`);
} catch (error) {
  console.error('❌ 載入資料失敗:', error.message);
}

// ========== API Routes ==========

// 1. 健康檢查
app.get('/health', async (request, reply) => {
  return {
    status: 'ok',
    venues: venues.length,
    rooms: rooms.length,
    timestamp: new Date().toISOString()
  };
});

// 1.1 健康檢查 (Vercel 路徑)
app.get('/api/health', async (request, reply) => {
  const hasNewKey = !!process.env.GLM_API_KEY_NEW;
  const hasOldKey = !!process.env.GLM_API_KEY;

  return {
    status: 'ok',
    venues: venues.length,
    rooms: rooms.length,
    env: {
      GLM_API_KEY_NEW: hasNewKey,
      GLM_API_KEY: hasOldKey,
      keyLength: (process.env.GLM_API_KEY_NEW || process.env.GLM_API_KEY || '').length
    },
    timestamp: new Date().toISOString()
  };
});

// 2. 取得所有城市
app.get('/api/cities', async (request, reply) => {
  const cities = [...new Set(venues.map(v => v.city))].sort();
  return { cities, total: cities.length };
});

// 3. 取得所有場地類型
app.get('/api/venue-types', async (request, reply) => {
  const types = [...new Set(venues.map(v => v.venueType))].sort();
  return { types, total: types.length };
});

// 4. 搜尋場地
app.get('/api/search', async (request, reply) => {
  const {
    city,
    venueType,
    minCapacity,
    maxPrice,
    keyword,
    limit = 20,
    offset = 0
  } = request.query;

  let filtered = venues; // 暫時顯示所有場地（包括下架）

  // 城市篩選
  if (city) {
    filtered = filtered.filter(v => v.city === city);
  }

  // 場地類型篩選
  if (venueType) {
    filtered = filtered.filter(v => v.venueType === venueType);
  }

  // 關鍵字搜尋
  if (keyword) {
    const kw = keyword.toLowerCase();
    filtered = filtered.filter(v =>
      v.name.toLowerCase().includes(kw) ||
      v.address.toLowerCase().includes(kw)
    );
  }

  // 容納人數篩選
  if (minCapacity) {
    const min = parseInt(minCapacity);
    filtered = filtered.filter(v => {
      const roomsForVenue = rooms.filter(r => r.venueId === v.id);
      return roomsForVenue.some(r =>
        Math.max(r.capacity.theater || 0, r.capacity.classroom || 0) >= min
      );
    });
  }

  // 價格篩選
  if (maxPrice) {
    const max = parseInt(maxPrice);
    filtered = filtered.filter(v => {
      const roomsForVenue = rooms.filter(r => r.venueId === v.id);
      return roomsForVenue.some(r =>
        Math.min(r.pricing.halfDay || Infinity, r.pricing.fullDay || Infinity) <= max
      );
    });
  }

  // 分頁
  const total = filtered.length;
  const paginated = filtered.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

  // 附加會議室資訊
  const results = paginated.map(venue => {
    const venueRooms = rooms.filter(r => r.venueId === venue.id);
    return {
      ...venue,
      rooms: venueRooms,
      maxCapacity: Math.max(...venueRooms.map(r =>
        Math.max(r.capacity.theater || 0, r.capacity.classroom || 0)
      ), 0),
      minPrice: Math.min(...venueRooms.map(r =>
        Math.min(r.pricing.halfDay || Infinity, r.pricing.fullDay || Infinity)
      ), Infinity)
    };
  });

  return {
    total,
    offset: parseInt(offset),
    limit: parseInt(limit),
    results
  };
});

// 4.5. 取得所有場地（供 admin.html 使用）
app.get('/api/venues', async (request, reply) => {
  return {
    total: venues.length,
    venues: venues
  };
});

// 5. 取得單一場地詳情
app.get('/api/venues/:id', async (request, reply) => {
  const { id } = request.params;
  const venue = venues.find(v => v.id === parseInt(id));

  if (!venue) {
    reply.code(404);
    return { error: '場地不存在' };
  }

  const venueRooms = rooms.filter(r => r.venueId === venue.id);

  return {
    ...venue,
    rooms: venueRooms
  };
});

// 6. 取得場地的會議室
app.get('/api/venues/:id/rooms', async (request, reply) => {
  const { id } = request.params;
  const venueRooms = rooms.filter(r => r.venueId === parseInt(id));

  return {
    venueId: parseInt(id),
    total: venueRooms.length,
    rooms: venueRooms
  };
});

// 7. AI 對話
app.post('/api/chat', async (request, reply) => {
  const { message, sessionId } = request.body;

  if (!message) {
    reply.code(400);
    return { error: '請提供訊息內容' };
  }

  // 生成或使用現有 sessionId
  const sid = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    console.log('[Chat] Received message:', message);

    // 先檢查訊息中是否包含搜尋意圖
    const searchKeywords = ['找', '搜尋', '需要', '想要', '場地', '會議室', '教室'];
    const shouldSearch = searchKeywords.some(kw => message.includes(kw));

    let searchResults = null;

    // 如果看起來像搜尋請求，嘗試搜尋
    if (shouldSearch) {
      console.log('[Chat] Search intent detected');

      // 簡單的城市檢測
      const cities = ['台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市'];
      const detectedCity = cities.find(city => message.includes(city));

      if (detectedCity) {
        console.log('[Chat] Detected city:', detectedCity);

        // 執行搜尋
        const filtered = venues.filter(v => v.city === detectedCity).slice(0, 5);

        searchResults = filtered.map(venue => {
          const venueRooms = rooms.filter(r => r.venueId === venue.id);
          return {
            ...venue,
            maxCapacity: venueRooms.length > 0 ? Math.max(...venueRooms.map(r =>
              Math.max(r.capacity.theater || 0, r.capacity.classroom || 0)
            ), 0) : 0,
            minPrice: venueRooms.length > 0 ? Math.min(...venueRooms.map(r =>
              Math.min(r.pricing.halfDay || Infinity, r.pricing.fullDay || Infinity)
            ), Infinity) : Infinity
          };
        });

        console.log('[Chat] Found', searchResults.length, 'venues');
      }
    }

    // 呼叫 AI
    console.log('[Chat] Calling AI...');
    const result = await chat(sid, message, searchResults);
    console.log('[Chat] AI response:', result.success ? 'success' : 'failed');

    return {
      success: result.success,
      message: result.message,
      sessionId: sid,
      venues: searchResults
    };
  } catch (error) {
    console.error('Chat Error:', error);
    console.error('Chat Error Stack:', error.stack);
    reply.code(500);
    return {
      success: false,
      error: '對話服務暫時無法使用',
      message: '抱歉，我現在有點問題。請稍後再試一次。'
    };
  }
});

// ========== Vercel Serverless Handler ==========
// 這是 Vercel 需要的入口函數
module.exports = async (req, res) => {
  await app.ready();
  app.server.emit('request', req, res);
};
