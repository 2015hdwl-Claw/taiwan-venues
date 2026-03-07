#!/bin/bash

# 啟動 API Server

echo "🚀 啟動台灣場地搜尋 API..."

cd "$(dirname "$0")"

# 檢查是否已安裝依賴
if [ ! -d "node_modules" ]; then
    echo "📦 安裝依賴..."
    npm install
fi

# 啟動伺服器
echo "🌐 啟動伺服器..."
npm start
