# GitHub Pages 部署指南

## 專案資訊
- GitHub 用戶名：2015hdwl-Claw
- 倉庫名稱：taiwan-venues
- 部署後網址：https://2015hdwl-claw.github.io/taiwan-venues/

---

## 步驟 1：在 GitHub 建立倉庫

1. 前往 https://github.com/new
2. 填寫：
   - Repository name: `taiwan-venues`
   - Description: `台灣企業活動場地媒合平台`
   - 設為 **Public**
   - **不要**勾選 README、.gitignore、license
3. 點擊「Create repository」

---

## 步驟 2：推送程式碼

```bash
cd /root/.openclaw/workspace/taiwan-venues

# 設定 remote
git remote add origin https://github.com/2015hdwl-Claw/taiwan-venues.git

# 推送
git branch -M main
git push -u origin main
```

---

## 步驟 3：啟用 GitHub Pages

1. 前往 https://github.com/2015hdwl-Claw/taiwan-venues/settings/pages
2. Source 選擇：
   - Branch: `main`
   - Folder: `/ (root)`
3. 點擊「Save」
4. 等待 1-2 分鐘

---

## 步驟 4：訪問網站

網址：https://2015hdwl-claw.github.io/taiwan-venues/

---

## 未來更新流程

每次修改後執行：
```bash
cd /root/.openclaw/workspace/taiwan-venues
git add -A
git commit -m "update: 更新說明"
git push
```

網站會在 1-2 分鐘內自動更新。

---

**建立時間**：2026-02-26
