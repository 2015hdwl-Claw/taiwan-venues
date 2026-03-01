#!/bin/bash
# TICC 批量抓取腳本
# 使用 agent-browser 逐一抓取每個會議室

VENUES_FILE="/root/.openclaw/workspace/taiwan-venues/ticc-all-rooms.json"
OUTPUT_FILE="/root/.openclaw/workspace/taiwan-venues/ticc-crawled-data.json"

# 會議室列表（從 JSON 提取）
VENUES=(
  "PH:大會堂"
  "101:101全室"
  "101A:101A"
  "101AB:101AB"
  "101B:101B"
  "101C:101C"
  "101CD:101CD"
  "101D:101D"
  "102:102"
  "103:103"
  "105:105"
  "106:106"
  "1FVIP_N:1F北貴賓室"
  "1FVIP_S:1F南貴賓室"
  "201:201全室"
  "201A:201A"
  "201AB:201AB"
  "201ABC:201ABC"
  "201ABEF:201ABEF"
  "201AF:201AF"
  "201B:201B"
  "201BC:201BC"
  "201BCDE:201BCDE"
  "201BE:201BE"
  "201C:201C"
  "201CD:201CD"
  "201D:201D"
  "201DE:201DE"
  "201DEF:201DEF"
  "201E:201E"
  "201EF:201EF"
  "201F:201F"
  "202:202全室"
  "202A:202A"
  "202B:202B"
  "203:203全室"
  "203A:203A"
  "203B:203B"
  "3FBA:3樓宴會廳"
  "3FLG_N:3樓北軒"
  "3FLG_S:3樓南軒"
  "401:401會議室"
  "402:4樓悅軒"
  "4FLGN:4樓雅軒"
  "4FVIP:4樓鳳凰廳"
)

echo "開始抓取 TICC ${#VENUES[@]} 個會議室..."
echo ""

# 初始化輸出陣列
echo "[" > $OUTPUT_FILE

FIRST=true
for venue in "${VENUES[@]}"; do
  IFS=':' read -r ROOM_ID ROOM_NAME <<< "$venue"
  
  echo "抓取: $ROOM_NAME ($ROOM_ID)"
  
  # 開啟頁面
  URL="https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=$ROOM_ID&ctNode=322&CtUnit=99&BaseDSD=7&mp=1"
  
  agent-browser open "$URL" --timeout 20000 2>/dev/null
  
  # 等待頁面載入
  sleep 1
  
  # 抓取資料
  DATA=$(agent-browser eval "
    const getText = (label) => {
      const el = Array.from(document.querySelectorAll('h4')).find(h => h.textContent.includes(label));
      return el ? el.nextElementSibling?.textContent?.trim() || el.parentElement?.querySelector('p')?.textContent?.trim() : null;
    };
    
    const getPrice = () => {
      const el = Array.from(document.querySelectorAll('h4')).find(h => h.textContent.includes('週一'));
      return el ? el.nextElementSibling?.textContent?.trim()?.replace(/[^0-9]/g, '') : null;
    };
    
    const getCapacity = () => {
      const el = Array.from(document.querySelectorAll('h4')).find(h => h.textContent.includes('劇院型人數'));
      return el ? el.nextElementSibling?.textContent?.trim()?.replace(/[^0-9]/g, '') : null;
    };
    
    const getPhotos = () => {
      const imgs = Array.from(document.querySelectorAll('img')).filter(i => i.src && i.src.includes('/public/Img/f'));
      return [...new Set(imgs.map(i => i.src))].slice(0, 10);
    };
    
    JSON.stringify({
      roomId: '$ROOM_ID',
      roomName: '$ROOM_NAME',
      price: getPrice(),
      capacity: getCapacity(),
      photos: getPhotos()
    });
  " 2>/dev/null)
  
  # 寫入檔案
  if [ "$FIRST" = true ]; then
    FIRST=false
  else
    echo "," >> $OUTPUT_FILE
  fi
  
  echo "$DATA" >> $OUTPUT_FILE
  
  echo "  完成"
done

echo "]" >> $OUTPUT_FILE

echo ""
echo "抓取完成！資料儲存到: $OUTPUT_FILE"
