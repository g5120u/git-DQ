/**
 * Actor 系統
 * 角色與怪物會動的關鍵
 * 
 * 每個 Actor 代表一個會動的角色（英雄、怪物、NPC）
 */

export class Actor {
  constructor(sprite, x, y, options = {}) {
    this.sprite = sprite; // 精靈圖 ID 或路徑
    this.x = x; // X 座標
    this.y = y; // Y 座標
    this.state = options.state || "idle"; // 狀態：idle, attack, hurt, defend, victory
    this.frame = 0; // 當前動畫幀
    this.direction = options.direction || "right"; // 面向：left, right
    this.scale = options.scale || 1; // 縮放比例
    this.opacity = options.opacity || 1; // 透明度
    this.animationSpeed = options.animationSpeed || 1; // 動畫速度
    this.baseX = x; // 原始 X 座標（用於動畫）
    this.baseY = y; // 原始 Y 座標（用於動畫）
    this.hp = options.hp || 100; // 血量
    this.maxHp = options.maxHp || 100; // 最大血量
    this.visible = options.visible !== false; // 是否可見
  }

  /**
   * 更新角色狀態（每幀調用）
   * @param {number} worldFrame - 世界當前幀數
   */
  update(worldFrame) {
    this.frame++;

    // 根據狀態執行不同的動畫
    switch (this.state) {
      case "idle":
        // 待機動畫：輕微上下浮動
        this.y = this.baseY + Math.sin(this.frame / 30) * 2;
        break;

      case "attack":
        // 攻擊動畫：向前衝刺
        const attackProgress = this.frame / 10;
        if (attackProgress < 1) {
          const direction = this.direction === "right" ? 1 : -1;
          this.x = this.baseX + Math.sin(attackProgress * Math.PI) * 30 * direction;
        } else {
          // 攻擊結束，回到待機狀態
          this.state = "idle";
          this.frame = 0;
          this.x = this.baseX;
        }
        break;

      case "hurt":
        // 受傷動畫：後退並閃爍
        const hurtProgress = this.frame / 15;
        if (hurtProgress < 1) {
          const direction = this.direction === "right" ? -1 : 1;
          this.x = this.baseX + Math.sin(hurtProgress * Math.PI * 2) * 10 * direction;
          this.opacity = Math.sin(hurtProgress * Math.PI * 8) > 0 ? 1 : 0.5;
        } else {
          this.state = "idle";
          this.frame = 0;
          this.x = this.baseX;
          this.opacity = 1;
        }
        break;

      case "defend":
        // 防禦動畫：縮小並後退
        const defendProgress = this.frame / 20;
        if (defendProgress < 1) {
          this.scale = 0.9 + Math.sin(defendProgress * Math.PI) * 0.1;
          const direction = this.direction === "right" ? -1 : 1;
          this.x = this.baseX + Math.sin(defendProgress * Math.PI) * 15 * direction;
        } else {
          this.state = "idle";
          this.frame = 0;
          this.x = this.baseX;
          this.scale = 1;
        }
        break;

      case "victory":
        // 勝利動畫：跳躍
        this.y = this.baseY + Math.sin(this.frame / 10) * 5 - 10;
        break;

      default:
        // 預設待機動畫
        this.y = this.baseY + Math.sin(this.frame / 30) * 2;
    }
  }

  /**
   * 執行攻擊動作
   */
  attack() {
    this.state = "attack";
    this.frame = 0;
    this.baseX = this.x;
  }

  /**
   * 執行受傷動作
   */
  hurt() {
    this.state = "hurt";
    this.frame = 0;
    this.baseX = this.x;
  }

  /**
   * 執行防禦動作
   */
  defend() {
    this.state = "defend";
    this.frame = 0;
    this.baseX = this.x;
  }

  /**
   * 執行勝利動作
   */
  victory() {
    this.state = "victory";
    this.frame = 0;
  }

  /**
   * 回到待機狀態
   */
  idle() {
    this.state = "idle";
    this.frame = 0;
    this.x = this.baseX;
    this.y = this.baseY;
    this.opacity = 1;
    this.scale = 1;
  }

  /**
   * 設定位置
   */
  setPosition(x, y) {
    this.x = x;
    this.y = y;
    this.baseX = x;
    this.baseY = y;
  }

  /**
   * 設定面向
   */
  setDirection(direction) {
    this.direction = direction;
  }

  /**
   * 設定血量
   */
  setHP(hp) {
    this.hp = Math.max(0, Math.min(hp, this.maxHp));
  }

  /**
   * 取得角色資訊（用於渲染）
   */
  getRenderData() {
    return {
      sprite: this.sprite,
      x: this.x,
      y: this.y,
      state: this.state,
      frame: this.frame,
      direction: this.direction,
      scale: this.scale,
      opacity: this.opacity,
      hp: this.hp,
      maxHp: this.maxHp,
      visible: this.visible
    };
  }
}

