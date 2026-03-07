#!/bin/bash

# API 測試腳本

API_URL="http://localhost:3000"

echo "========== 場地搜尋 API 測試 =========="
echo ""

echo "1. 健康檢查"
curl -s "$API_URL/health"
echo -e "\n"

echo "2. 取得城市列表"
curl -s "$API_URL/api/cities"
echo -e "\n"

echo "3. 搜尋台北市場地（前 3 筆）"
curl -s "$API_URL/api/search?city=%E5%8F%B0%E5%8C%97%E5%B8%82&limit=3" | head -50
echo -e "\n"

echo "4. 搜尋容納 50 人以上"
curl -s "$API_URL/api/search?minCapacity=50&limit=3" | head -50
echo -e "\n"

echo "5. 搜尋 5000 元以下"
curl -s "$API_URL/api/search?maxPrice=5000&limit=3" | head -50
echo -e "\n"

echo "6. AI 對話測試"
curl -X POST "$API_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"我需要在台北市找一個可以容納50人的會議室"}' | head -100
echo -e "\n"

echo "========== 測試完成 =========="
