/**
 * PixelScene.jsx - RPG 畫面框架
 * 提供 8-bit RPG 風格的場景容器
 */

const { useState, useEffect } = React;

function PixelScene({ 
  bg = "dungeon", // 背景主題：dungeon, village, temple, battle, castle
  children,
  className = "",
  style = {}
}) {
  const [bgImageLoaded, setBgImageLoaded] = React.useState(false);
  const [bgImageError, setBgImageError] = React.useState(false);
  
  // 嘗試載入背景圖片
  React.useEffect(() => {
    if (bg === "dungeon") {
      const img = new Image();
      img.src = "assets/backgrounds/dungeon.png";
      img.onload = () => setBgImageLoaded(true);
      img.onerror = () => setBgImageError(true);
    }
  }, [bg]);
  
  const bgStyles = {
    dungeon: {
      background: bgImageLoaded && !bgImageError 
        ? `url("assets/backgrounds/dungeon.png")`
        : "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      backgroundSize: bgImageLoaded && !bgImageError ? "cover" : "100% 100%",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundImage: bgImageLoaded && !bgImageError 
        ? `url("assets/backgrounds/dungeon.png")`
        : `
          repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px),
          repeating-linear-gradient(90deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px)
        `
    },
    castle: {
      background: "linear-gradient(to bottom, #2c2c2c 0%, #1a1a1a 50%, #0f0f0f 100%)",
      backgroundImage: `
        /* 柱子 */
        linear-gradient(to right, transparent 30%, rgba(200,200,200,0.1) 30%, rgba(200,200,200,0.1) 32%, transparent 32%),
        linear-gradient(to right, transparent 68%, rgba(200,200,200,0.1) 68%, rgba(200,200,200,0.1) 70%, transparent 70%),
        /* 地板格線 */
        repeating-linear-gradient(0deg, rgba(100,100,100,0.1) 0px, rgba(100,100,100,0.1) 1px, transparent 1px, transparent 40px),
        repeating-linear-gradient(90deg, rgba(100,100,100,0.1) 0px, rgba(100,100,100,0.1) 1px, transparent 1px, transparent 40px),
        /* 紅色地毯 */
        linear-gradient(to bottom, transparent 60%, rgba(139,0,0,0.3) 60%, rgba(139,0,0,0.3) 100%)
      `,
      backgroundSize: "100% 100%, 100% 100%, 40px 40px, 40px 40px, 100% 100%",
      position: "relative"
    },
    village: {
      background: "linear-gradient(135deg, #2d5016 0%, #3d6b1f 50%, #4a7c28 100%)",
      backgroundImage: `
        repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, transparent 1px, transparent 4px)
      `
    },
    temple: {
      background: "linear-gradient(135deg, #4a148c 0%, #6a1b9a 50%, #8e24aa 100%)",
      backgroundImage: `
        radial-gradient(circle at 50% 50%, rgba(255,215,0,0.1) 0%, transparent 70%)
      `
    },
    battle: {
      background: "linear-gradient(135deg, #8b0000 0%, #a52a2a 50%, #dc143c 100%)",
      backgroundImage: `
        repeating-linear-gradient(45deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 2px, transparent 2px, transparent 4px)
      `
    }
  };

  const baseStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100vh",
    overflow: "hidden",
    boxSizing: "border-box",
    imageRendering: "pixelated",
    imageRendering: "-moz-crisp-edges",
    imageRendering: "crisp-edges",
    ...bgStyles[bg],
    ...style
  };

  return (
    <div 
      className={`pixel-scene ${className}`}
      style={baseStyle}
    >
      {children}
    </div>
  );
}

