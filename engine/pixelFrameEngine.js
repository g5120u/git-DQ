/**
 * PixelFrameEngine（逐幀世界引擎）
 * SFC 世界的「時間流動核心」
 * 
 * 負責：
 * 1. 戰鬥動畫（怪物揮拳、角色閃避）
 * 2. 狀態動畫（每秒動畫更新）
 * 3. Git 行為轉換為戰鬥劇情
 */

export class PixelFrameEngine {
  constructor() {
    this.frame = 0;
    this.actors = [];
    this.effects = [];
    this.running = false;
    this.onUpdateCallbacks = [];
  }

  /**
   * 添加角色到場景
   * @param {Actor} actor - 角色物件
   */
  addActor(actor) {
    this.actors.push(actor);
  }

  /**
   * 移除角色
   * @param {Actor} actor - 要移除的角色
   */
  removeActor(actor) {
    const index = this.actors.indexOf(actor);
    if (index > -1) {
      this.actors.splice(index, 1);
    }
  }

  /**
   * 播放特效
   * @param {Object} effect - 特效物件
   */
  playEffect(effect) {
    this.effects.push(effect);
  }

  /**
   * 註冊更新回調
   * @param {Function} callback - 每幀更新時的回調函數
   */
  onUpdate(callback) {
    if (typeof callback === "function") {
      this.onUpdateCallbacks.push(callback);
    }
  }

  /**
   * 啟動引擎
   */
  start() {
    if (this.running) return;
    this.running = true;
    this.frame = 0;
    this.loop();
  }

  /**
   * 停止引擎
   */
  stop() {
    this.running = false;
  }

  /**
   * 重置引擎
   */
  reset() {
    this.frame = 0;
    this.actors = [];
    this.effects = [];
    this.onUpdateCallbacks = [];
  }

  /**
   * 主循環（使用 requestAnimationFrame）
   */
  loop() {
    if (!this.running) return;

    this.frame++;

    // 更新所有角色
    this.actors.forEach(actor => {
      if (actor && typeof actor.update === "function") {
        actor.update(this.frame);
      }
    });

    // 更新所有特效
    this.effects = this.effects.filter(effect => {
      if (effect && typeof effect.update === "function") {
        effect.update(this.frame);
        // 如果特效結束，返回 false 來移除它
        return !effect.finished;
      }
      return false;
    });

    // 執行所有更新回調
    this.onUpdateCallbacks.forEach(callback => {
      try {
        callback(this.frame, this.actors, this.effects);
      } catch (error) {
        console.error("PixelFrameEngine 回調錯誤：", error);
      }
    });

    // 繼續下一幀
    requestAnimationFrame(() => this.loop());
  }

  /**
   * 取得當前幀數
   */
  getFrame() {
    return this.frame;
  }

  /**
   * 取得所有角色
   */
  getActors() {
    return [...this.actors];
  }

  /**
   * 取得所有特效
   */
  getEffects() {
    return [...this.effects];
  }
}

