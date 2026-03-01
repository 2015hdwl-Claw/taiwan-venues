#!/bin/bash
# 使用 agent-browser 爬蟲場地照片

echo "=== 使用 agent-browser 爬蟲場地照片 ==="
echo ""

# 10個重要場地的官網
declare -A venues=(
    ["台北國際會議中心"]="https://www.ticc.com.tw"
    ["台北喜來登大飯店"]="https://www.sheraton.com/taipei"
    ["台北圓山大飯店"]="https://www.grand-hotel.org"
    ["台北文華東方酒店"]="https://www.mandarinoriental.com/taipei"
    ["台北國賓大飯店"]="https://www.ambassadorhotel.com.tw/taipei"
)

# 創建輸出目錄
mkdir -p crawled_photos_agent

# 爬蟲每個場地
for venue in "${!venues[@]}"; do
    url="${venues[$venue]}"
    echo "📍 $venue"
    echo "   URL: $url"

    # 打開網站
    agent-browser open "$url" > /dev/null 2>&1
    sleep 2

    # 獲取 HTML
    html_file="crawled_photos_agent/${venue}.html"
    agent-browser get html body > "$html_file" 2>&1

    # 提取照片網址
    photos_file="crawled_photos_agent/${venue}_photos.txt"
    grep -oE 'src="[^"]*\.(jpg|jpeg|png|webp)[^"]*"' "$html_file" | \
        sed 's/src="//g' | sed 's/"//g' > "$photos_file"

    # 統計
    photo_count=$(wc -l < "$photos_file")
    echo "   ✅ 找到 $photo_count 張照片"
    echo "   📁 已儲存到 $photos_file"
    echo ""

    # 關閉瀏覽器
    agent-browser close > /dev/null 2>&1
    sleep 1
done

echo "=== 爬取完成 ==="
