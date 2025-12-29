/**
 * 世界狀態核心
 * World State Core
 * 
 * 儲存當前世界的所有狀態資訊
 */

export const WorldState = {
  level: 1,           // 等級
  exp: 0,             // 經驗值
  gold: 0,            // 金幣
  stage: 1,           // 關卡
  inBattle: true,     // 是否在戰鬥中
  enemyHP: 10,        // 敵人血量
  heroHP: 10,         // 英雄血量
  lastCommitHash: null, // 最後一次 commit 的 hash
  worldDays: 0,       // 世界天數
  worldName: "",      // 世界名稱
  creator: "",       // 創世神名字
  soul: "",          // 世界靈魂印記（email）
  bornAt: null       // 世界誕生時間
};

/**
 * 重置世界狀態
 */
export function resetWorldState() {
  WorldState.level = 1;
  WorldState.exp = 0;
  WorldState.gold = 0;
  WorldState.stage = 1;
  WorldState.inBattle = true;
  WorldState.enemyHP = 10;
  WorldState.heroHP = 10;
  WorldState.lastCommitHash = null;
  WorldState.worldDays = 0;
  WorldState.worldName = "";
  WorldState.creator = "";
  WorldState.soul = "";
  WorldState.bornAt = null;
}

/**
 * 從世界檔案載入狀態
 */
export function loadWorldState(worldData) {
  if (worldData) {
    WorldState.worldDays = worldData.days || 0;
    WorldState.worldName = worldData.worldName || "";
    WorldState.creator = worldData.creator || "";
    WorldState.soul = worldData.soul || "";
    WorldState.bornAt = worldData.bornAt || null;
  }
}

