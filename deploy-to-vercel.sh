#!/bin/bash

# 🚀 Vercel 快速部署腳本
# 使用方式：./deploy-to-vercel.sh

echo "========================================"
echo "🚀 Taiwan Venue API - Vercel 部署"
echo "========================================"
echo ""

# 檢查是否安裝 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI 未安裝"
    echo "📦 正在安裝 Vercel CLI..."
    npm install -g vercel
    echo "✅ Vercel CLI 安裝完成"
    echo ""
fi

# 檢查是否已登入
echo "🔐 檢查 Vercel 登入狀態..."
if ! vercel whoami &> /dev/null; then
    echo "❌ 尚未登入 Vercel"
    echo "🔑 請登入 Vercel..."
    vercel login
    echo ""
fi

# 顯示當前用戶
echo "✅ 已登入為：$(vercel whoami)"
echo ""

# 檢查環境變數
echo "🔑 檢查環境變數..."
if [ -z "$GLM_API_KEY" ]; then
    echo "⚠️  GLM_API_KEY 環境變數未設定"
    echo "請在 Vercel Dashboard 設定環境變數"
    echo ""
    read -p "是否繼續部署？（y/n）" -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 部署已取消"
        exit 1
    fi
else
    echo "✅ GLM_API_KEY 已設定"
fi

# 檢查必要檔案
echo ""
echo "📁 檢查必要檔案..."
required_files=(
    "api/index.js"
    "api/ai-service.js"
    "migrated-data/venues.json"
    "migrated-data/rooms.json"
    "vercel.json"
    "package.json"
)

all_files_exist=true
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ 缺少檔案：$file"
        all_files_exist=false
    fi
done

if [ "$all_files_exist" = false ]; then
    echo "❌ 缺少必要檔案，請檢查專案結構"
    exit 1
fi

echo "✅ 所有必要檔案都存在"
echo ""

# 部署前確認
echo "🚀 準備部署到 Vercel"
echo ""
read -p "確認要部署到 Production？（y/n）" -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 部署已取消"
    exit 1
fi

# 執行部署
echo ""
echo "📦 開始部署..."
vercel --prod

# 檢查部署結果
if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "✅ 部署成功！"
    echo "========================================"
    echo ""
    echo "📝 接下來："
    echo "1. 在 Vercel Dashboard 設定環境變數 GLM_API_KEY"
    echo "2. 測試 API：curl https://your-app.vercel.app/health"
    echo "3. 設定自訂域名（可選）"
    echo ""
    echo "📚 查看詳細文件：VERCEL_DEPLOY.md"
    echo ""
else
    echo ""
    echo "========================================"
    echo "❌ 部署失敗"
    echo "========================================"
    echo ""
    echo "請檢查："
    echo "1. 是否已登入 Vercel"
    echo "2. 是否有權限部署"
    echo "3. 檢查錯誤訊息並修正"
    echo ""
    exit 1
fi
