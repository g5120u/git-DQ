/**
 * BattleScreen.jsx - SFC 風格戰鬥畫面（改進版）
 * 
 * 整合 PixelFrameEngine，顯示真正的逐幀動畫戰鬥
 * 使用公主精靈圖，增強攻擊動作和背景動態效果
 */

const { useState, useEffect, useRef } = React;

function BattleScreen({ world, worldState, onBattleEnd }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const heroRef = useRef(null);
  const bossRef = useRef(null);
  const [battleState, setBattleState] = useState("idle"); // idle, fighting, victory, defeat
  const [attackQueue, setAttackQueue] = useState([]);
  const [lastAttackTime, setLastAttackTime] = useState(0);

  // PixelFrameEngine 類別
  class PixelFrameEngine {
    constructor() {
      this.frame = 0;
      this.actors = [];
      this.effects = [];
      this.running = false;
      this.onUpdateCallbacks = [];
    }

    addActor(actor) {
      this.actors.push(actor);
    }

    removeActor(actor) {
      const index = this.actors.indexOf(actor);
      if (index > -1) {
        this.actors.splice(index, 1);
      }
    }

    playEffect(effect) {
      this.effects.push(effect);
    }

    onUpdate(callback) {
      if (typeof callback === "function") {
        this.onUpdateCallbacks.push(callback);
      }
    }

    start() {
      if (this.running) return;
      this.running = true;
      this.frame = 0;
      this.loop();
    }

    stop() {
      this.running = false;
    }

    reset() {
      this.frame = 0;
      this.actors = [];
      this.effects = [];
      this.onUpdateCallbacks = [];
    }

    loop() {
      if (!this.running) return;
      this.frame++;

      this.actors.forEach(actor => {
        if (actor && typeof actor.update === "function") {
          actor.update(this.frame);
        }
      });

      this.effects = this.effects.filter(effect => {
        if (effect && typeof effect.update === "function") {
          effect.update(this.frame);
          return !effect.finished;
        }
        return false;
      });

      this.onUpdateCallbacks.forEach(callback => {
        try {
          callback(this.frame, this.actors, this.effects);
        } catch (error) {
          console.error("PixelFrameEngine 回調錯誤：", error);
        }
      });

      requestAnimationFrame(() => this.loop());
    }

    getFrame() {
      return this.frame;
    }
  }

  // Actor 類別（改進版）
  class Actor {
    constructor(sprite, x, y, options = {}) {
      this.sprite = sprite;
      this.spriteImage = null;
      this.spriteLoaded = false;
      this.x = x;
      this.y = y;
      this.state = options.state || "idle";
      this.frame = 0;
      this.animationFrame = 0; // 精靈圖動畫幀
      this.direction = options.direction || "right";
      this.scale = options.scale || 1;
      this.opacity = options.opacity || 1;
      this.baseX = x;
      this.baseY = y;
      this.hp = options.hp || 100;
      this.maxHp = options.maxHp || 100;
      this.visible = options.visible !== false;
      this.spriteWidth = options.spriteWidth || 32;
      this.spriteHeight = options.spriteHeight || 48;
      this.spriteCols = options.spriteCols || 3; // 每個方向的幀數
      this.spriteRows = options.spriteRows || 4; // 方向數（前、左、右、後）
      
      // 載入精靈圖
      this.loadSprite();
    }

    loadSprite() {
      // 先透過主進程檢查檔案是否存在，避免 404 在 DevTools 顯示
      const spritePath = `assets/characters/${this.sprite}.png`;
      if (window && window.DQ && typeof window.DQ.fileExists === "function") {
        window.DQ.fileExists(spritePath).then(exists => {
          if (!exists) {
            this.spriteLoaded = false;
            return;
          }
          const img = new Image();
          img.onload = () => {
            this.spriteImage = img;
            this.spriteLoaded = true;
          };
          img.onerror = () => {
            this.spriteLoaded = false;
          };
          try {
            img.src = spritePath;
          } catch (e) {
            this.spriteLoaded = false;
          }
        }).catch(() => {
          this.spriteLoaded = false;
        });
      } else {
        // fallback 行為：直接載入（可能產生 404）
        const img = new Image();
        img.onload = () => {
          this.spriteImage = img;
          this.spriteLoaded = true;
        };
        img.onerror = () => {
          this.spriteLoaded = false;
        };
        try {
          img.src = spritePath;
        } catch (e) {
          this.spriteLoaded = false;
        }
      }
    }

    update(worldFrame) {
      this.frame++;

      switch (this.state) {
        case "idle":
          // 待機動畫：輕微上下浮動 + 精靈圖動畫循環
          this.y = this.baseY + Math.sin(this.frame / 30) * 2;
          this.animationFrame = Math.floor(this.frame / 10) % this.spriteCols;
          break;

        case "attack":
          // 攻擊動畫：向前衝刺 + 揮劍動作
          const attackProgress = this.frame / 20; // 延長攻擊時間
          if (attackProgress < 0.3) {
            // 準備階段：後退
            const direction = this.direction === "right" ? -1 : 1;
            this.x = this.baseX + Math.sin(attackProgress * Math.PI * 3) * 10 * direction;
            this.animationFrame = 0;
          } else if (attackProgress < 0.7) {
            // 攻擊階段：向前衝刺
            const direction = this.direction === "right" ? 1 : -1;
            this.x = this.baseX + Math.sin((attackProgress - 0.3) * Math.PI * 2.5) * 50 * direction;
            this.animationFrame = 1; // 攻擊幀
            this.scale = 1.1; // 稍微放大
          } else {
            // 收招階段：回到原位
            const direction = this.direction === "right" ? 1 : -1;
            this.x = this.baseX + Math.sin((attackProgress - 0.7) * Math.PI) * 20 * direction;
            this.animationFrame = 2;
            this.scale = 1;
          }
          
          if (attackProgress >= 1) {
            this.state = "idle";
            this.frame = 0;
            this.x = this.baseX;
            this.scale = 1;
          }
          break;

        case "hurt":
          // 受傷動畫：後退並閃爍
          const hurtProgress = this.frame / 20;
          if (hurtProgress < 1) {
            const direction = this.direction === "right" ? -1 : 1;
            this.x = this.baseX + Math.sin(hurtProgress * Math.PI * 4) * 15 * direction;
            this.opacity = Math.sin(hurtProgress * Math.PI * 10) > 0 ? 1 : 0.3;
            this.animationFrame = 0;
          } else {
            this.state = "idle";
            this.frame = 0;
            this.x = this.baseX;
            this.opacity = 1;
          }
          break;

        case "victory":
          // 勝利動畫：跳躍
          this.y = this.baseY + Math.sin(this.frame / 8) * 8 - 15;
          this.animationFrame = Math.floor(this.frame / 5) % this.spriteCols;
          break;

        default:
          this.y = this.baseY + Math.sin(this.frame / 30) * 2;
          this.animationFrame = Math.floor(this.frame / 10) % this.spriteCols;
      }
    }

    attack() {
      this.state = "attack";
      this.frame = 0;
      this.baseX = this.x;
    }

    hurt() {
      this.state = "hurt";
      this.frame = 0;
      this.baseX = this.x;
    }

    victory() {
      this.state = "victory";
      this.frame = 0;
    }

    idle() {
      this.state = "idle";
      this.frame = 0;
      this.x = this.baseX;
      this.y = this.baseY;
      this.opacity = 1;
      this.scale = 1;
    }

    setHP(hp) {
      this.hp = Math.max(0, Math.min(hp, this.maxHp));
    }

    // 取得精靈圖的裁剪區域
    getSpriteRect() {
      // 根據方向決定行（0=前, 1=左, 2=右, 3=後）
      let row = 0;
      if (this.direction === "left") row = 1;
      else if (this.direction === "right") row = 2;
      else if (this.state === "victory") row = 3; // 勝利時顯示背面

      const sx = this.animationFrame * this.spriteWidth;
      const sy = row * this.spriteHeight;
      
      return { sx, sy, sw: this.spriteWidth, sh: this.spriteHeight };
    }
    
    // 檢查是否需要水平翻轉（用於面向左側）
    shouldFlip() {
      return this.direction === "left";
    }
  }

  // Effect 類別（改進版）
  class Effect {
    constructor(type, x, y, options = {}) {
      this.type = type;
      this.x = x;
      this.y = y;
      this.frame = 0;
      this.duration = options.duration || 30;
      this.finished = false;
      this.value = options.value || 0;
      this.color = options.color || "#ff0000";
      this.scale = options.scale || 1;
      this.opacity = 1;
      this.rotation = 0;
    }

    update(worldFrame) {
      this.frame++;

      switch (this.type) {
        case "damage":
          // 傷害數字：向上飄並放大淡出
          this.y -= 3;
          this.scale = 1 + (this.frame / this.duration) * 0.5;
          this.opacity = Math.max(0, 1 - this.frame / this.duration);
          if (this.frame >= this.duration) {
            this.finished = true;
          }
          break;
        case "skill":
          // 技能特效：旋轉並放大
          this.rotation += 10;
          this.scale = 1 + (this.frame / this.duration) * 2;
          this.opacity = Math.max(0, 1 - this.frame / this.duration);
          if (this.frame >= this.duration) {
            this.finished = true;
          }
          break;
        case "slash":
          // 斬擊特效：快速移動並淡出
          this.x += 5;
          this.rotation += 15;
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
  }

  // 初始化戰鬥引擎
  useEffect(() => {
    if (!world || !world.exists) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    // 使用較小的畫布尺寸以符合 UI 需求
    canvas.width = 640;
    canvas.height = 320;

    // 建立引擎
    const engine = new PixelFrameEngine();
    engineRef.current = engine;

    // 建立英雄（公主）和怪物
    const hero = new Actor("princess", 200, 280, {
      direction: "right",
      hp: worldState.heroHP || 10,
      maxHp: 10 + worldState.level * 2,
      spriteWidth: 32,
      spriteHeight: 48,
      spriteCols: 3,
      spriteRows: 4
    });
    
    // 怪物使用 slime 或 boss
    const boss = new Actor("slime", 600, 280, {
      direction: "left",
      hp: worldState.enemyHP || 10,
      maxHp: 10 + worldState.stage * 2,
      spriteWidth: 32,
      spriteHeight: 32,
      spriteCols: 3,
      spriteRows: 1
    });

    heroRef.current = hero;
    bossRef.current = boss;

    engine.addActor(hero);
    engine.addActor(boss);

    // 背景動態效果
    let bgOffset = 0;
    const bgPattern = ctx.createPattern(
      (() => {
        const patternCanvas = document.createElement("canvas");
        patternCanvas.width = 100;
        patternCanvas.height = 100;
        const patternCtx = patternCanvas.getContext("2d");
        patternCtx.fillStyle = "#1a1a2e";
        patternCtx.fillRect(0, 0, 100, 100);
        patternCtx.fillStyle = "#2d5016";
        patternCtx.fillRect(0, 0, 100, 50);
        return patternCanvas;
      })(),
      "repeat"
    );

    // 渲染回調
    engine.onUpdate((frame, actors, effects) => {
      bgOffset += 0.5;

      // 繪製動態背景
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#4a7c28");
      gradient.addColorStop(0.5, "#2d5016");
      gradient.addColorStop(1, "#1a1a2e");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 繪製背景圖案（移動的雲或粒子）
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = `rgba(100, 150, 200, ${0.2 + Math.sin(frame / 30 + i) * 0.1})`;
        ctx.fillRect(
          (frame * 0.5 + i * 200) % (canvas.width + 100) - 50,
          50 + i * 60,
          100,
          30
        );
      }

      // 繪製地面
      ctx.fillStyle = "#3d6b1f";
      ctx.fillRect(0, canvas.height - 60, canvas.width, 60);
      
      // 地面紋理
      for (let i = 0; i < canvas.width; i += 20) {
        ctx.fillStyle = `rgba(0, 0, 0, ${0.1 + Math.sin(frame / 20 + i) * 0.05})`;
        ctx.fillRect(i, canvas.height - 60, 1, 60);
      }

      // 繪製角色
      actors.forEach(actor => {
        if (!actor.visible) return;

        ctx.save();
        ctx.globalAlpha = actor.opacity;
        ctx.translate(actor.x, actor.y);
        ctx.scale(actor.scale, actor.scale);
        
        // 如果有精靈圖，使用精靈圖
        if (actor.spriteLoaded && actor.spriteImage) {
          const rect = actor.getSpriteRect();
          
          // 如果面向左側，需要水平翻轉
          if (actor.shouldFlip && actor.shouldFlip()) {
            ctx.scale(-1, 1);
            ctx.drawImage(
              actor.spriteImage,
              rect.sx, rect.sy, rect.sw, rect.sh,
              -rect.sw / 2, -rect.sh,
              rect.sw, rect.sh
            );
          } else {
            // 面向右側或前方，正常顯示
            ctx.drawImage(
              actor.spriteImage,
              rect.sx, rect.sy, rect.sw, rect.sh,
              -rect.sw / 2, -rect.sh,
              rect.sw, rect.sh
            );
          }
        } else {
          // 備用：簡單形狀
          if (actor.direction === "left") {
            ctx.scale(-1, 1);
          }
          ctx.fillStyle = actor.sprite === "princess" ? "#9370DB" : "#90ee90";
          ctx.fillRect(-20, -30, 40, 60);
          ctx.fillStyle = "#fff";
          ctx.fillRect(-10, -20, 5, 5);
          ctx.fillRect(5, -20, 5, 5);
        }

        ctx.restore();

        // 繪製血量條
        const barWidth = 80;
        const barHeight = 8;
        const barX = actor.x - barWidth / 2;
        const barY = actor.y - 60;

        // 血量條背景
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
        
        // 血量條
        ctx.fillStyle = "#000";
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = actor.sprite === "princess" ? "#00ff00" : "#ff0000";
        const hpPercent = actor.hp / actor.maxHp;
        ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
        
        // 血量文字
        ctx.fillStyle = "#fff";
        ctx.font = "bold 12px 'Courier New'";
        ctx.textAlign = "center";
        ctx.fillText(`${Math.ceil(actor.hp)}/${actor.maxHp}`, actor.x, barY - 5);
      });

      // 繪製特效
      effects.forEach(effect => {
        ctx.save();
        ctx.globalAlpha = effect.opacity;
        ctx.translate(effect.x, effect.y);
        ctx.scale(effect.scale, effect.scale);
        ctx.rotate((effect.rotation * Math.PI) / 180);

        switch (effect.type) {
          case "damage":
            ctx.fillStyle = effect.color;
            ctx.font = `bold ${20 * effect.scale}px 'Courier New'`;
            ctx.textAlign = "center";
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 3;
            ctx.strokeText(`-${effect.value}`, 0, 0);
            ctx.fillText(`-${effect.value}`, 0, 0);
            break;
          case "skill":
            ctx.fillStyle = effect.color;
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, Math.PI * 2);
            ctx.fill();
            break;
          case "slash":
            ctx.strokeStyle = effect.color;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(-20, -10);
            ctx.lineTo(20, 10);
            ctx.stroke();
            break;
        }

        ctx.restore();
      });
    });

    // 啟動引擎
    engine.start();
    setBattleState("fighting");

    // 改進的戰鬥循環（更有節奏感）
    let battleFrame = 0;
    const battleLoop = () => {
      battleFrame++;
      
      if (hero.hp <= 0 || boss.hp <= 0) {
        if (hero.hp > 0) {
          hero.victory();
          setBattleState("victory");
        } else {
          setBattleState("defeat");
        }
        // 停止引擎但不自動關閉畫面（轉為手動關閉）
        setTimeout(() => {
          engine.stop();
          // 不自動呼叫 onBattleEnd()，保留畫面給使用者檢視
        }, 300);
        return;
      }

      // 每 2 秒英雄攻擊一次
      if (battleFrame % 120 === 0) {
        hero.attack();
        setTimeout(() => {
          const damage = 3 + Math.floor(Math.random() * 4);
          boss.hurt();
          boss.setHP(boss.hp - damage);
          
          // 斬擊特效
          engine.playEffect(new Effect("slash", hero.x + 50, hero.y, {
            color: "#ffff00",
            duration: 15
          }));
          
          // 傷害數字
          engine.playEffect(new Effect("damage", boss.x, boss.y - 40, {
            value: damage,
            color: "#ff0000",
            duration: 40
          }));
        }, 300);
      }

      // 每 3 秒怪物攻擊一次
      if (battleFrame % 180 === 60) {
        setTimeout(() => {
          boss.attack();
          setTimeout(() => {
            const damage = 2 + Math.floor(Math.random() * 3);
            hero.hurt();
            hero.setHP(hero.hp - damage);
            
            // 傷害數字
            engine.playEffect(new Effect("damage", hero.x, hero.y - 40, {
              value: damage,
              color: "#ff0000",
              duration: 40
            }));
          }, 300);
        }, 500);
      }

      if (battleState === "fighting") {
        requestAnimationFrame(battleLoop);
      }
    };

    battleLoop();

    return () => {
      if (engine) {
        engine.stop();
      }
    };
  }, [world, worldState]);

  if (!world || !world.exists) {
    return null;
  }

  return (
    <PixelScene bg="battle">
      {/* 戰鬥視窗放在右側 */}
      <div style={{
        position: "absolute",
        top: "100px",
        right: "20px",
        width: "36%",
        maxWidth: "420px",
        zIndex: 100
      }}>
        <PixelBox type="dialog" title="⚔️ 戰鬥畫面（動態模式）">
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <canvas
              ref={canvasRef}
              style={{
                width: "100%",
                maxWidth: "640px",
                height: "320px",
                border: "3px solid #9370DB",
                imageRendering: "pixelated",
                imageRendering: "-moz-crisp-edges",
                imageRendering: "crisp-edges",
                background: "#1a1a2e",
                borderRadius: "4px"
              }}
            />
          </div>
          {battleState === "victory" && (
            <div style={{ textAlign: "center", color: "#ffd700", fontSize: "1.2em", marginTop: "10px" }}>
              🎉 勝利！獲得經驗值和金幣！
            </div>
          )}
          {battleState === "defeat" && (
            <div style={{ textAlign: "center", color: "#ff6347", fontSize: "1.2em", marginTop: "10px" }}>
              💀 失敗...但不要放棄！
            </div>
          )}
          {battleState === "fighting" && (
            <div style={{ textAlign: "center", color: "#90ee90", fontSize: "0.9em", marginTop: "10px" }}>
              💡 提示：戰鬥會自動進行，觀察角色的動作和特效！
            </div>
          )}
          {/* 常駐控制按鈕：手動關閉戰鬥畫面 */}
          <div style={{ textAlign: "center", marginTop: "12px" }}>
            <button
              onClick={() => {
                if (onBattleEnd) onBattleEnd();
              }}
              style={{
                padding: "8px 14px",
                background: "#333",
                color: "#fff",
                border: "2px solid #666",
                borderRadius: "4px",
                cursor: "pointer",
                fontFamily: "'Courier New', monospace"
              }}
            >
              關閉戰鬥畫面
            </button>
          </div>
        </PixelBox>
      </div>
    </PixelScene>
  );
}
