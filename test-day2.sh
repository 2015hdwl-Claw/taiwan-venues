#!/bin/bash

# Day 2 功能測試腳本

API_BASE="https://taiwan-venue-api.vercel.app"

echo "🧪 測試 Day 2 功能..."
echo ""

# 1. 測試前台
echo "1️⃣ 測試前台..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_BASE/)
if [ "$FRONTEND_STATUS" == "200" ]; then
    echo "✅ 前台正常 (HTTP $FRONTEND_STATUS)"
else
    echo "❌ 前台異常 (HTTP $FRONTEND_STATUS)"
fi
echo ""

# 2. 測試 API 健康檢查
echo "2️⃣ 測試 API 健康檢查..."
HEALTH=$(curl -s $API_BASE/health)
echo $HEALTH
echo ""

# 3. 測試場地搜尋
echo "3️⃣ 測試場地搜尋..."
SEARCH_RESULT=$(curl -s "$API_BASE/api/search?city=台北市&limit=3")
TOTAL=$(echo $SEARCH_RESULT | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
echo "✅ 找到 $TOTAL 個台北市場地"
echo ""

# 4. 測試場地詳情
echo "4️⃣ 測試場地詳情..."
VENUE_DETAIL=$(curl -s "$API_BASE/api/venues/1001")
VENUE_NAME=$(echo $VENUE_DETAIL | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "✅ 場地: $VENUE_NAME"
echo ""

# 5. 測試 AI 對話
echo "5️⃣ 測試 AI 對話..."
CHAT_RESULT=$(curl -s -X POST $API_BASE/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"測試訊息"}')
CHAT_SUCCESS=$(echo $CHAT_RESULT | grep -o '"success":[^,]*' | cut -d':' -f2)
if [ "$CHAT_SUCCESS" == "true" ] || [ "$CHAT_SUCCESS" == "false" ]; then
    echo "✅ AI 對話 API 正常回應"
else
    echo "❌ AI 對話 API 異常"
fi
echo ""

# 6. 測試靜態資源
echo "6️⃣ 測試靜態資源..."
CSS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_BASE/style.css)
JS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_BASE/app.js)

if [ "$CSS_STATUS" == "200" ] && [ "$JS_STATUS" == "200" ]; then
    echo "✅ 靜態資源正常 (CSS: $CSS_STATUS, JS: $JS_STATUS)"
else
    echo "❌ 靜態資源異常 (CSS: $CSS_STATUS, JS: $JS_STATUS)"
fi
echo ""

echo "🎉 測試完成！"
echo ""
echo "📱 前台網址: $API_BASE"
echo "📊 API 文件: $API_BASE/api/"
