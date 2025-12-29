/**
 * Git 行為轉換為戰鬥劇情腳本
 * 
 * 將 Git 操作轉換為戰鬥動作：
 * - git add → 準備攻擊
 * - git commit → 執行攻擊
 * - git push → 釋放技能
 * - merge conflict → 防禦/反擊
 */

/**
 * Git diff 轉換為戰鬥動作
 * @param {Array} diffFiles - 變更的檔案列表
 * @returns {Array} 戰鬥動作陣列
 */
export function gitDiffToBattle(diffFiles) {
  if (!diffFiles || diffFiles.length === 0) {
    return [];
  }

  return diffFiles.map((file, index) => ({
    type: "attack",
    actor: "hero",
    target: "boss",
    power: 5 + (file.length || 0),
    delay: index * 10, // 延遲執行（幀數）
    file: file
  }));
}

/**
 * Git commit 轉換為戰鬥劇情
 * @param {Object} commitInfo - Commit 資訊
 * @returns {Object} 戰鬥劇情
 */
export function gitCommitToBattleScript(commitInfo) {
  const { message, files, hash } = commitInfo;

  return {
    type: "commit",
    hash: hash,
    message: message,
    actions: [
      {
        type: "hero_charge",
        duration: 20
      },
      {
        type: "hero_attack",
        power: 10 + (files?.length || 0) * 2,
        duration: 30
      },
      {
        type: "boss_hurt",
        damage: 10 + (files?.length || 0) * 2,
        duration: 20
      },
      {
        type: "victory_check",
        duration: 10
      }
    ]
  };
}

/**
 * Git push 轉換為技能釋放
 * @param {Object} pushInfo - Push 資訊
 * @returns {Object} 技能動作
 */
export function gitPushToSkill(pushInfo) {
  const { branch, commits } = pushInfo;

  return {
    type: "skill",
    name: `推送 ${branch}`,
    power: 20 + (commits?.length || 0) * 5,
    duration: 50,
    effects: [
      {
        type: "particle",
        count: 20,
        color: "#ffff00"
      },
      {
        type: "screen_flash",
        color: "#ffffff",
        duration: 5
      }
    ]
  };
}

/**
 * Merge conflict 轉換為防禦/反擊
 * @param {Object} conflictInfo - 衝突資訊
 * @returns {Object} 防禦動作
 */
export function gitConflictToDefense(conflictInfo) {
  const { files, conflicts } = conflictInfo;

  return {
    type: "defense",
    actor: "hero",
    duration: 30,
    actions: [
      {
        type: "hero_defend",
        duration: 15
      },
      {
        type: "boss_attack",
        power: 15 + conflicts * 3,
        duration: 20
      },
      {
        type: "hero_counter",
        power: 10 + files.length * 2,
        duration: 25
      }
    ]
  };
}

/**
 * Git status 轉換為戰鬥準備
 * @param {Object} status - Git 狀態
 * @returns {Object} 準備動作
 */
export function gitStatusToBattlePrep(status) {
  const { untracked, modified, deleted } = status;

  const totalChanges = (untracked?.length || 0) + 
                       (modified?.length || 0) + 
                       (deleted?.length || 0);

  return {
    type: "prep",
    totalChanges: totalChanges,
    actions: [
      {
        type: "hero_idle",
        duration: 10
      },
      {
        type: "boss_spawn",
        hp: 10 + totalChanges * 2,
        duration: 20
      },
      {
        type: "battle_start",
        duration: 5
      }
    ]
  };
}

/**
 * 執行戰鬥腳本
 * @param {Object} engine - PixelFrameEngine 實例
 * @param {Object} script - 戰鬥腳本
 * @param {Object} actors - 角色物件（hero, boss）
 */
export function executeBattleScript(engine, script, actors) {
  let currentActionIndex = 0;
  let frameCount = 0;

  const executeNextAction = () => {
    if (currentActionIndex >= script.actions.length) {
      return; // 腳本執行完畢
    }

    const action = script.actions[currentActionIndex];
    frameCount = 0;

    const actionHandler = setInterval(() => {
      frameCount++;

      // 根據動作類型執行
      switch (action.type) {
        case "hero_charge":
          if (actors.hero) actors.hero.defend();
          break;
        case "hero_attack":
          if (actors.hero) actors.hero.attack();
          break;
        case "boss_hurt":
          if (actors.boss) {
            actors.boss.hurt();
            actors.boss.setHP(actors.boss.hp - (action.damage || 0));
            // 顯示傷害特效
            engine.playEffect(createDamageEffect(actors.boss.x, actors.boss.y, action.damage));
          }
          break;
        case "hero_defend":
          if (actors.hero) actors.hero.defend();
          break;
        case "boss_attack":
          if (actors.boss) actors.boss.attack();
          break;
        case "hero_counter":
          if (actors.hero) actors.hero.attack();
          break;
        case "hero_idle":
          if (actors.hero) actors.hero.idle();
          break;
        case "boss_spawn":
          if (actors.boss) {
            actors.boss.setHP(action.hp || 10);
            actors.boss.idle();
          }
          break;
      }

      // 檢查動作是否完成
      if (frameCount >= action.duration) {
        clearInterval(actionHandler);
        currentActionIndex++;
        executeNextAction();
      }
    }, 16); // 約 60 FPS
  };

  executeNextAction();
}

// 導入特效建立函數（需要在實際使用時確保已載入）
function createDamageEffect(x, y, damage) {
  // 這裡應該使用 effects.js 中的函數
  // 暫時返回簡單物件
  return {
    type: "damage",
    x: x,
    y: y,
    value: damage,
    frame: 0,
    finished: false,
    update: function(frame) {
      this.frame++;
      this.y -= 2;
      if (this.frame >= 30) {
        this.finished = true;
      }
    }
  };
}

