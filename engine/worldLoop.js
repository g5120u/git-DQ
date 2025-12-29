/**
 * 永動世界引擎
 * World Loop Engine
 * 
 * 世界會自動運行，只要沒有 commit 就會自動刷怪、打怪、升級
 */

import { WorldState } from "./worldState.js";

/**
 * 世界循環一次（每 0.1 秒執行）
 */
export function worldTick() {
  // 如果不在戰鬥中，不執行
  if (!WorldState.inBattle) return;

  // 自動戰鬥：英雄和敵人互相攻擊
  WorldState.enemyHP -= 0.15;  // 敵人每秒掉 1.5 血
  WorldState.heroHP -= 0.05;   // 英雄每秒掉 0.5 血

  // 英雄死亡：重置戰鬥
  if (WorldState.heroHP <= 0) {
    WorldState.heroHP = 10 + WorldState.level * 2;
    WorldState.enemyHP = 10 + WorldState.stage * 2;
    WorldState.exp = Math.max(0, WorldState.exp - 2); // 死亡扣經驗
  }

  // 勝利：擊敗敵人
  if (WorldState.enemyHP <= 0) {
    // 獲得獎勵
    WorldState.exp += 5;
    WorldState.gold += 3;
    WorldState.stage++;

    // 生成新敵人（更強）
    WorldState.enemyHP = 10 + WorldState.stage * 2;
    WorldState.heroHP = Math.min(WorldState.heroHP + 2, 10 + WorldState.level * 2); // 勝利回血
  }

  // 升級：經驗值達到 20 時升級
  if (WorldState.exp >= 20) {
    WorldState.level++;
    WorldState.exp = 0;
    WorldState.heroHP = 10 + WorldState.level * 2; // 升級回滿血並增加上限
  }
}

/**
 * 檢查 commit 狀態，如果有新 commit 則進入新章節
 * @param {string} currentCommitHash - 當前 commit hash
 */
export function checkCommitStatus(currentCommitHash) {
  if (!currentCommitHash) {
    // 沒有 commit，世界繼續運行
    WorldState.inBattle = true;
    return false;
  }

  // 如果有新的 commit
  if (WorldState.lastCommitHash !== currentCommitHash) {
    // 世界進入新章節
    WorldState.lastCommitHash = currentCommitHash;
    WorldState.worldDays++;
    WorldState.inBattle = false; // 暫停戰鬥，進入新章節
    
    // 新章節獎勵
    WorldState.exp += 10;
    WorldState.gold += 5;
    
    // 3 秒後恢復戰鬥
    setTimeout(() => {
      WorldState.inBattle = true;
      WorldState.enemyHP = 10 + WorldState.stage * 2;
      WorldState.heroHP = 10 + WorldState.level * 2;
    }, 3000);
    
    return true; // 有新章節
  }

  return false; // 沒有新章節
}

