# 🤖 Agent 協作系統使用說明

## 系統架構

```
taiwan-venues/agents/
├── config.json              # 系統配置
├── dispatcher.py            # 任務調度器
├── orchestrator/            # 🎯 總管
│   ├── SOUL.md
│   └── IDENTITY.md
├── marketing-research/      # 📈 行銷研究
│   ├── SOUL.md
│   └── IDENTITY.md
├── project-manager/         # 📋 專案管理
│   ├── SOUL.md
│   └── IDENTITY.md
├── dev/                     # 💻 程式開發
│   ├── SOUL.md
│   └── IDENTITY.md
└── shared/                  # 共享資源
    ├── tasks/
    │   └── board.json       # 任務看板
    ├── reports/             # 報告存放
    └── data/                # 共享資料
```

---

## 🎯 Agent 一覽表

| Agent | 提及方式 | 模型 | 職責 |
|-------|---------|------|------|
| Orchestrator | `@Orchestrator` / `@總管` | GLM-5 | 任務分派、進度追蹤、每日報告 |
| MarketingResearch | `@MarketingResearch` / `@行銷研究` | GLM-5 | 市場研究、場地發掘、推廣文案 |
| ProjectManager | `@ProjectManager` / `@專案管理` | GLM-5 | 資料品質、任務看板、進度追蹤 |
| Dev | `@Dev` / `@開發` | GLM-5 | 網頁維護、API開發、爬蟲 |

---

## 📝 使用方式

### 方式一：直接提及（推薦）

在對話中直接提及 Agent：

```
@MarketingResearch 請幫我找 10 個新北市的婚宴場地

@ProjectManager 檢查一下目前資料庫的完整率

@Dev 幫我把最新的 CSV 匯入到網頁版

@Orchestrator 今天有什麼待辦事項？
```

### 方式二：透過 Orchestrator 分派

```
@Orchestrator 我需要：
1. 收集桃園市會議場地
2. 寫一篇 Facebook 推廣文案
3. 檢查資料品質

Orchestrator 會自動分派給對應的 Agent
```

---

## ⏰ 自動化排程

| 時間 | 任務 | 執行 Agent |
|------|------|-----------|
| 每天 09:00 | 資料品質檢查 | ProjectManager |
| 每天 22:00 | 發送進度報告 | Orchestrator |
| 每週一 | 重點縣市收集 | MarketingResearch |
| 資料更新時 | 同步部署 | Dev |

---

## 📊 目前任務看板

### 待辦（4）
- [ ] 收集新北市場地（目標 20 筆）- @MarketingResearch
- [ ] 開發場地查詢 API - @Dev
- [ ] 撰寫 Accupass 推廣文案 - @MarketingResearch
- [ ] 檢查現有 15 筆資料完整率 - @ProjectManager

### 已完成（1）
- [x] 建立 Agent 協作系統 - @Orchestrator

---

## 🔧 技術實現

當你提及 `@Agent名稱` 時：

1. **系統識別**：解析提及的 Agent
2. **載入角色**：讀取對應的 SOUL.md
3. **生成 Session**：使用 sessions_spawn
4. **執行任務**：以該 Agent 身份處理
5. **回報結果**：更新任務看板

---

## 📁 共享 Workspace

所有 Agent 共用：
```
/root/.openclaw/workspace/taiwan-venues/
├── sample-data.json        # 場地資料
├── venues-data-20260226.csv
├── index.html              # 網頁
├── script.js
├── style.css
└── agents/                 # Agent 系統
```

---

## 💡 範例對話

**用戶**：`@MarketingResearch 幫我研究一下台北市的飯店會議室`

**MarketingResearch**：
> 📈 收到！我來幫你研究台北市飯店會議室...
> 
> 以下是調查結果：
> 1. 君悅酒店 - 10 間會議室
> 2. W飯店 - 5 間會議室
> ...
> 
> 建議優先收集：君悅、晶華、老爺酒店
> 
> 是否要我開始收集詳細資料？

**用戶**：`@ProjectManager 把這些加入任務看板`

**ProjectManager**：
> 📋 已加入任務：
> - TASK-005: 收集君悅酒店會議室資料
> - TASK-006: 收集晶華酒店會議室資料
> - TASK-007: 收集老爺酒店會議室資料
> 
> 優先級：高
> 預計完成：3 天內

---

**建立時間**：2026-02-26
**系統版本**：v1.0
