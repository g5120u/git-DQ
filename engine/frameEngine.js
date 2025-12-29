/**
 * PixelFrameEngine（逐幀心臟）
 * Frame Engine
 * 
 * 每 0.1 秒執行一次世界循環
 */

let worldLoopInterval = null;

/**
 * 啟動世界循環
 * @param {Function} onUpdate - 每次更新時的回調函數
 * @returns {Function} 停止函數
 */
export function startWorldLoop(onUpdate) {
  // 如果已經在運行，先停止
  if (worldLoopInterval) {
    stopWorldLoop();
  }

  // 每 0.1 秒執行一次
  worldLoopInterval = setInterval(() => {
    if (onUpdate && typeof onUpdate === "function") {
      onUpdate();
    }
  }, 100); // 100ms = 0.1 秒

  // 返回停止函數
  return stopWorldLoop;
}

/**
 * 停止世界循環
 */
export function stopWorldLoop() {
  if (worldLoopInterval) {
    clearInterval(worldLoopInterval);
    worldLoopInterval = null;
  }
}

/**
 * 檢查世界循環是否正在運行
 */
export function isWorldLoopRunning() {
  return worldLoopInterval !== null;
}

