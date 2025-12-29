# 世界永動核心系統 World Engine

這個資料夾包含世界永動核心系統的原始碼，包括數值引擎和逐幀動畫引擎。

## 📁 檔案說明

### 數值引擎（基礎系統）

#### `worldState.js`
世界狀態核心，定義並管理世界的所有狀態變數：
- 等級、經驗值、金幣
- 關卡、戰鬥狀態
- 英雄和敵人血量
- 世界天數、創世神資訊

#### `worldLoop.js`
永動世界引擎，實現世界的自動運行邏輯：
- 自動戰鬥系統
- 勝利獎勵機制
- 升級系統
- Commit 狀態檢查（新章節觸發）

#### `frameEngine.js`
逐幀引擎（舊版），提供世界循環的基礎設施：
- 啟動/停止世界循環
- 每 0.1 秒執行一次世界更新

### 逐幀動畫引擎（SFC 模式）✨

#### `pixelFrameEngine.js`
**PixelFrameEngine（逐幀世界引擎）** - SFC 世界的「時間流動核心」
- 使用 `requestAnimationFrame` 實現真正的逐幀動畫
- 管理所有角色（Actors）和特效（Effects）
- 提供更新回調機制
- 這是讓世界「活起來」的心臟

#### `actors.js`
**Actor 系統** - 角色與怪物會動的關鍵
- 每個 Actor 代表一個會動的角色（英雄、怪物、NPC）
- 支援多種狀態：idle, attack, hurt, defend, victory
- 自動執行動畫（攻擊、受傷、防禦等）
- 提供位置、血量、面向等屬性管理

#### `effects.js`
**Effects 系統** - 技能特效、傷害數字、粒子效果
- 傷害數字特效
- 治療特效
- 技能特效
- 粒子效果

#### `gitToBattleScript.js`
**Git 行為轉換為戰鬥劇情腳本**
- `gitDiffToBattle()` - Git diff 轉換為戰鬥動作
- `gitCommitToBattleScript()` - Commit 轉換為戰鬥劇情
- `gitPushToSkill()` - Push 轉換為技能釋放
- `gitConflictToDefense()` - Merge conflict 轉換為防禦/反擊
- `gitStatusToBattlePrep()` - Git status 轉換為戰鬥準備

## 🎮 世界運行機制

### 數值模式（基礎）
1. **自動戰鬥**：只要沒有 commit，世界就會自動刷怪、打怪
2. **新章節**：每次 commit 後，世界進入新章節，獲得獎勵
3. **世界老去**：3 小時沒寫碼，世界天數自動增加

### SFC 模式（逐幀動畫）✨
1. **逐幀動畫**：使用 `requestAnimationFrame` 實現 60 FPS 動畫
2. **角色動畫**：英雄和怪物會自動執行攻擊、受傷、防禦等動畫
3. **特效系統**：傷害數字、技能特效會自動播放
4. **Git 劇情化**：Git 操作會轉換為戰鬥動作和劇情

## 🕹️ 使用方式

### 基礎數值模式
世界會自動運行，顯示在主畫面頂部的狀態條中。

### SFC 戰鬥模式
點擊主畫面的「⚔️ 進入戰鬥畫面（SFC 模式）」按鈕，進入真正的逐幀動畫戰鬥：
- 英雄和怪物會自動動畫
- 傷害數字會飄出
- 戰鬥會自動進行直到勝利或失敗

## 📝 注意事項

- 數值引擎檔案是 ES6 模組格式，實際運行時會整合到 `App.jsx` 中
- PixelFrameEngine 系統在 `BattleScreen.jsx` 中實現
- 世界狀態會儲存在專案根目錄的 `.world` 檔案中
- `.world` 檔案由 `dq-engine.js` 中的世界門戶系統管理
- 戰鬥畫面使用 Canvas 進行逐幀渲染

