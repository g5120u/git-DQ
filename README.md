# 🎮 Git-DQ RPG OS

> **A Professional Git Workflow Assistant - No CLI Commands Required**  
> Transform Git operations into an intuitive RPG game interface for seamless GitHub collaboration.

> **專業級 Git 工作流程助手 - 無需 CLI 指令**  
> 將 Git 操作轉換為直觀的 RPG 遊戲介面，實現無縫的 GitHub 協作。

## 📖 Project Overview / 專案概述

Git-DQ is a **professional-grade Git workflow assistant** that transforms complex Git operations into an intuitive RPG game interface. It's designed for developers who want to collaborate on GitHub without memorizing CLI commands.

Git-DQ 是一個**專業級 Git 工作流程助手**，將複雜的 Git 操作轉換為直觀的 RPG 遊戲介面。專為希望在不記憶 CLI 指令的情況下進行 GitHub 協作的開發者設計。

### Core Value Proposition / 核心價值主張

**"Anyone who doesn't know Git can push code to GitHub through this game interface."**

**「任何不會 Git 的人都能透過這個遊戲介面將程式碼推送到 GitHub。」**

### Three Core Features (MVP) / 三大核心功能（MVP）

#### ① Save Slot Screen = Branch Manager / 存檔畫面 = 分支管理器
- **Game / 遊戲**：Select "Data 1/2/3" (Save Slots) / 選擇「數據 1/2/3」（存檔槽位）
- **Reality / 實際**：`git checkout main/feature-A/feature-B`
- **Display / 顯示**：Commit count (LV), Last commit message (Quest) / 提交數量（等級），最後提交訊息（任務）

#### ② Battle Screen = Commit + Conflict Resolver / 戰鬥畫面 = 提交與衝突解決器
- **Game / 遊戲**：Attack enemy (Manual Edit) / 攻擊敵人（手動編輯）
- **Reality / 實際**：Resolve merge conflicts / 解決合併衝突
- **Result / 結果**：Conflict reduction → Merge completion / 衝突減少 → 合併完成

#### ③ Temple Screen = GitHub Push / 神殿畫面 = GitHub 推送
- **Game / 遊戲**：Upload adventure to cloud / 上傳冒險到雲端
- **Reality / 實際**：`git push origin branch`
- **Animation / 動畫**：Push progress bar / 推送進度條
- **Success / 成功**："Synchronization Complete" / 「同步完成」

## 🎯 Target Users / 目標用戶

- Developers who find Git CLI intimidating / 覺得 Git CLI 令人生畏的開發者
- Teams needing visual Git workflow management / 需要視覺化 Git 工作流程管理的團隊
- Beginners learning Git through gamification / 透過遊戲化學習 Git 的初學者
- Anyone who wants professional GitHub collaboration without command memorization / 希望在不記憶指令的情況下進行專業 GitHub 協作的任何人

## 🚀 Quick Start / 快速開始

### Prerequisites / 前置需求

- Node.js (v18 or higher / v18 或更高版本)
- npm or yarn
- Git (system-level installation required / 需要系統級安裝)

### Installation / 安裝

1. **Clone the repository / 複製倉庫**
   ```bash
   git clone <repository-url>
   cd git-dq
   npm install
   ```

2. **Launch the application / 啟動應用程式**
   ```bash
   # Windows
   start.bat
   
   # Mac/Linux
   npm start
   ```

3. **Start your adventure / 開始你的冒險**
   - The application automatically scans the current folder's Git status / 應用程式會自動掃描當前資料夾的 Git 狀態
   - If no Git repository exists, click "建立新冒險世界" (Create New Adventure World) / 如果沒有 Git 倉庫，點擊「建立新冒險世界」
   - Set your adventurer identity (Git user info) / 設定你的冒險者身分（Git 使用者資訊）
   - View your adventure world status / 查看你的冒險世界狀態

## 📁 Project Structure / 專案結構

```
git-dq/
│
├── start.bat              # Windows launcher script / Windows 啟動腳本
├── git-dq-here.bat        # Quick launcher (can be placed in any project folder) / 快速啟動器（可放在任何專案資料夾）
├── package.json           # Project configuration / 專案配置
├── main.js                # Electron main process / Electron 主進程
├── preload.cjs            # Preload script (IPC bridge) / 預載腳本（IPC 橋接）
├── dq-engine.js           # Git operations core engine / Git 操作核心引擎
├── index.html             # Main page / 主頁面
├── README.md              # Project documentation / 專案文檔
├── 使用說明.md            # Usage guide (Traditional Chinese) / 使用說明（繁體中文）
├── .cursorrules           # Cursor AI rules / Cursor AI 規則
└── renderer/
    ├── App.jsx            # React main component / React 主元件
    ├── PixelScene.jsx     # RPG scene framework / RPG 場景框架
    ├── PixelBox.jsx       # Dialog and menu boxes / 對話框和選單框
    ├── PixelCursor.jsx    # Blinking cursor / 閃爍游標
    ├── PixelSprite.jsx    # Character sprites / 角色精靈圖
    └── PixelTypewriter.jsx # Typewriter text animation / 打字機文字動畫
```

## 🔧 Technical Architecture / 技術架構

- **Frontend / 前端**：React (CDN, no build tools required / CDN，無需建置工具)
- **Backend / 後端**：Electron + Node.js
- **Git Operations / Git 操作**：Executed via `child_process.execSync` / 透過 `child_process.execSync` 執行
- **Standalone / 單機運行**：No web server, loads local HTML files directly / 無網頁伺服器，直接載入本地 HTML 檔案

## 🎮 Game Features / 遊戲功能

### Current Status (Module 0) / 當前狀態（模組 0）

- ✅ **World Creation / 世界建立**：Initialize Git repository (`git init`) / 初始化 Git 倉庫
- ✅ **Identity Setup / 身分設定**：Configure Git user information / 設定 Git 使用者資訊
- ✅ **Status Display / 狀態顯示**：View Git repository status in game format / 以遊戲格式查看 Git 倉庫狀態
- ✅ **Branch Information / 分支資訊**：Display all branches and tags / 顯示所有分支和標籤
- ✅ **Commit History / 提交歷史**：Show commit count and last commit message / 顯示提交數量和最後提交訊息
- ✅ **Save Slot Screen / 存檔畫面**：Branch switching interface with RPG style / 帶有 RPG 風格的分支切換介面
- ✅ **Commit History Screen / 提交歷史畫面**：View and checkout past commits / 查看並切換到過去的提交
- ✅ **Pixel Scene Engine / 像素場景引擎**：RPG-style interface framework / RPG 風格介面框架

### Planned Features / 計劃功能

- [ ] **Battle Screen / 戰鬥畫面**：Conflict resolution interface / 衝突解決介面
- [ ] **Temple Screen / 神殿畫面**：GitHub push interface / GitHub 推送介面
- [ ] **Character Sprites / 角色精靈圖**：Warrior and Mage pixel art assets / 戰士和魔法師像素圖素材

## 📝 Development Status / 開發狀態

**Current Version / 當前版本**：0.1.0 (MVP - Module 0)

**⚠️ 注意：此專案仍在開發中，部分功能尚未完成**

This is the foundation module that provides:
- Git repository initialization / Git 倉庫初始化
- User identity configuration / 使用者身分配置
- Status visualization / 狀態視覺化
- Branch management with RPG interface / 帶有 RPG 介面的分支管理
- Commit history viewing / 提交歷史查看

The Battle Screen and Temple Screen are planned for future releases.

戰鬥畫面和神殿畫面計劃在未來的版本中發布。

## 🔍 Key Features / 關鍵功能

### Automatic Git Repository Detection / 自動 Git 倉庫偵測

- **Multi-level directory support / 多層目錄支援**：Automatically finds Git repositories in parent directories / 自動在父目錄中查找 Git 倉庫
- **Clean state on startup / 啟動時乾淨狀態**：Ensures no cached Git data from previous sessions / 確保沒有來自先前會話的快取 Git 資料
- **Local Git config only / 僅本地 Git 配置**：Only reads repository-specific Git config, not global / 僅讀取倉庫特定的 Git 配置，不讀取全局配置

### RPG Interface / RPG 介面

- **Pixel Scene Engine / 像素場景引擎**：Complete RPG-style interface framework / 完整的 RPG 風格介面框架
- **Typewriter effects / 打字機效果**：Text appears character by character / 文字逐字顯示
- **Pixel art styling / 像素圖風格**：All UI elements use pixel-perfect rendering / 所有 UI 元素使用像素完美渲染

## 📄 License / 授權

**Dual License / 雙授權模式**

本專案採用雙授權模式（Dual License）：

- **開源授權 / Open Source License**：GNU Affero General Public License v3.0 (AGPL-3.0)
  - 可下載、執行、修改本專案
  - 可用於個人、教育、學術及企業內部測試用途
  - 提供公開網路服務者必須完整公開原始碼

- **商業授權 / Commercial License**
  - 如欲用於商業 SaaS、付費服務或專有系統
  - 必須事先向著作權人取得商業授權
  - 聯絡方式：g5120u@hotmail.com

詳細授權條款請參閱 [LICENSE](LICENSE) 文件。

## 🤝 Contributing / 貢獻

Contributions are welcome! Please read the following documents before contributing:

歡迎貢獻！請在貢獻前閱讀以下文件：

- **[CONTRIBUTING.md](CONTRIBUTING.md)** - 貢獻規範與 Pull Request 規則
- **[CLA.md](CLA.md)** - 貢獻者授權同意書

By submitting a Pull Request, you agree to the Contributor License Agreement.

提交 Pull Request 即表示你同意貢獻者授權同意書。

---

**Make Git collaboration an adventure!** ⚔️🛡️✨

**讓 Git 協作成為一場冒險！** ⚔️🛡️✨
