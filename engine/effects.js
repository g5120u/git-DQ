/**
 * Effects 系統
 * 技能特效、傷害數字、粒子效果等
 */

export class Effect {
  constructor(type, x, y, options = {}) {
    this.type = type; // 特效類型：damage, heal, skill, particle
    this.x = x;
    this.y = y;
    this.frame = 0;
    this.duration = options.duration || 30; // 持續時間（幀數）
    this.finished = false;
    this.value = options.value || 0; // 數值（傷害、治療等）
    this.color = options.color || "#ff0000";
    this.scale = options.scale || 1;
    this.opacity = 1;
  }

  /**
   * 更新特效
   * @param {number} worldFrame - 世界當前幀數
   */
  update(worldFrame) {
    this.frame++;

    switch (this.type) {
      case "damage":
        // 傷害數字：向上飄並淡出
        this.y -= 2;
        this.opacity = Math.max(0, 1 - this.frame / this.duration);
        if (this.frame >= this.duration) {
          this.finished = true;
        }
        break;

      case "heal":
        // 治療數字：向上飄並淡出（綠色）
        this.y -= 2;
        this.opacity = Math.max(0, 1 - this.frame / this.duration);
        if (this.frame >= this.duration) {
          this.finished = true;
        }
        break;

      case "skill":
        // 技能特效：放大並淡出
        this.scale = 1 + (this.frame / this.duration) * 2;
        this.opacity = Math.max(0, 1 - this.frame / this.duration);
        if (this.frame >= this.duration) {
          this.finished = true;
        }
        break;

      case "particle":
        // 粒子效果：擴散並淡出
        this.x += Math.sin(this.frame / 5) * 2;
        this.y -= 1;
        this.opacity = Math.max(0, 1 - this.frame / this.duration);
        if (this.frame >= this.duration) {
          this.finished = true;
        }
        break;

      default:
        if (this.frame >= this.duration) {
          this.finished = true;
        }
    }
  }

  /**
   * 取得渲染資料
   */
  getRenderData() {
    return {
      type: this.type,
      x: this.x,
      y: this.y,
      frame: this.frame,
      value: this.value,
      color: this.color,
      scale: this.scale,
      opacity: this.opacity
    };
  }
}

/**
 * 建立傷害特效
 */
export function createDamageEffect(x, y, damage) {
  return new Effect("damage", x, y, {
    value: damage,
    color: "#ff0000",
    duration: 30
  });
}

/**
 * 建立治療特效
 */
export function createHealEffect(x, y, heal) {
  return new Effect("heal", x, y, {
    value: heal,
    color: "#00ff00",
    duration: 30
  });
}

/**
 * 建立技能特效
 */
export function createSkillEffect(x, y, skillName) {
  return new Effect("skill", x, y, {
    value: skillName,
    color: "#ffff00",
    duration: 40
  });
}

