#!/bin/bash
# DNS 連線測試腳本
# 用途：精確區分 DNS 失敗、連線超時、HTTP 錯誤等問題
# 版本：1.0
# 日期：2026-03-03

# 使用方式
# ./dns-test.sh <url>
# ./dns-test.sh batch <url_list_file>

# 測試單一 URL
test_single_url() {
  local id=$1
  local name=$2
  local url=$3
  
  # 移除引號
  url=$(echo "$url" | tr -d '"')
  
  # 執行 curl 測試
  local result=$(curl -sI --connect-timeout 10 "$url" 2>&1 | head -1)
  local http_code=$(echo "$result" | grep -oP 'HTTP/\S+ \K\d+' | head -1)
  
  # 判斷結果
  if [ -z "$result" ]; then
    echo "$id|$name|$url|❌|DNS解析失敗"
  elif [ "$http_code" = "200" ]; then
    echo "$id|$name|$url|✅|HTTP 200 OK"
  elif [ "$http_code" = "301" ] || [ "$http_code" = "302" ]; then
    echo "$id|$name|$url|✅|HTTP $http_code 重定向"
  elif [ "$http_code" = "403" ]; then
    echo "$id|$name|$url|⚠️|HTTP 403 反爬蟲"
  elif [ "$http_code" = "404" ]; then
    echo "$id|$name|$url|❌|HTTP 404 頁面不存在"
  elif [ -n "$http_code" ]; then
    echo "$id|$name|$url|⚠️|HTTP $http_code"
  else
    echo "$id|$name|$url|❌|連線失敗"
  fi
}

# 批次測試
test_batch() {
  local file=$1
  echo "ID|名稱|URL|狀態|錯誤類型"
  echo "---|----|---|----|--------"
  
  while IFS='|' read -r id name url; do
    test_single_url "$id" "$name" "$url"
  done < "$file"
}

# 主程式
if [ "$1" = "batch" ]; then
  test_batch "$2"
else
  test_single_url "$1" "$2" "$3"
fi
