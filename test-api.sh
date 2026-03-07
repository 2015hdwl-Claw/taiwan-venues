#!/bin/bash

# 🧪 API 測試腳本
# 使用方式：./test-api.sh [API_URL]

# 預設 URL（部署後請修改）
API_URL="${1:-https://your-app.vercel.app}"

echo "========================================"
echo "🧪 Taiwan Venue API 測試"
echo "========================================"
echo ""
echo "📍 測試 URL: $API_URL"
echo ""

# 測試函數
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo "測試：$description"
    echo "端點：$method $endpoint"
    
    if [ -n "$data" ]; then
        response=$(curl -s -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "${API_URL}${endpoint}")
    else
        response=$(curl -s -X "$method" "${API_URL}${endpoint}")
    fi
    
    # 檢查回應
    if [ $? -eq 0 ]; then
        echo "✅ 成功"
        echo "回應："
        echo "$response" | head -c 200
        if [ ${#response} -gt 200 ]; then
            echo "..."
        fi
        echo ""
    else
        echo "❌ 失敗"
    fi
    echo ""
}

# 1. 健康檢查
echo "1️⃣  健康檢查"
test_endpoint "GET" "/health" "檢查 API 是否正常運行"

# 2. 取得城市列表
echo "2️⃣  取得城市列表"
test_endpoint "GET" "/api/cities" "取得所有城市"

# 3. 取得場地類型
echo "3️⃣  取得場地類型"
test_endpoint "GET" "/api/venue-types" "取得所有場地類型"

# 4. 搜尋場地
echo "4️⃣  搜尋場地"
test_endpoint "GET" "/api/search?city=台北市&limit=3" "搜尋台北市的場地（限制 3 筆）"

# 5. 取得單一場地
echo "5️⃣  取得單一場地"
test_endpoint "GET" "/api/venues/1" "取得 ID=1 的場地詳情"

# 6. 取得場地的會議室
echo "6️⃣  取得場地的會議室"
test_endpoint "GET" "/api/venues/1/rooms" "取得 ID=1 場地的會議室"

# 7. AI 對話
echo "7️⃣  AI 對話"
test_endpoint "POST" "/api/chat" "測試 AI 對話功能" '{"message":"我需要在台北市找一個會議室，大約 50 人"}'

echo "========================================"
echo "✅ 測試完成"
echo "========================================"
echo ""
echo "💡 提示："
echo "- 如果所有測試都成功，API 已正常運行"
echo "- 如果 AI 對話失敗，請檢查 GLM_API_KEY 是否設定"
echo "- 查看詳細錯誤訊息，請直接使用 curl 測試"
