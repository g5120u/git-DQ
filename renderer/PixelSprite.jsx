/**
 * PixelSprite.jsx - 角色/怪物/王
 * 8-bit RPG 風格的角色精靈圖
 */

const { useState, useEffect } = React;

function PixelSprite({ 
  id = "hero", // hero, warrior, mage, slime, boss
  x = 0,
  y = 0,
  facing = "right", // left, right, up, down
  animated = false,
  className = "",
  style = {}
}) {
  const spriteData = {
    hero: { emoji: "🧙", color: "#9370DB" },
    warrior: { emoji: "⚔️", color: "#4a90e2" },
    mage: { emoji: "🧙", color: "#9370DB" },
    slime: { emoji: "🟢", color: "#90ee90" },
    boss: { emoji: "👹", color: "#ff6347" }
  };

  const sprite = spriteData[id] || spriteData.hero;
  const [animationFrame, setAnimationFrame] = useState(0);

  useEffect(() => {
    if (animated) {
      const interval = setInterval(() => {
        setAnimationFrame(prev => (prev + 1) % 4);
      }, 200);
      return () => clearInterval(interval);
    }
  }, [animated]);

  const baseStyle = {
    position: "absolute",
    left: `${x}px`,
    top: `${y}px`,
    fontSize: "48px",
    imageRendering: "pixelated",
    imageRendering: "-moz-crisp-edges",
    imageRendering: "crisp-edges",
    filter: "drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.8))",
    transform: facing === "left" ? "scaleX(-1)" : "none",
    transition: animated ? "transform 0.2s" : "none",
    zIndex: 10,
    ...style
  };

  // 如果有圖片資源，優先使用圖片
  // 預設使用 emoji，避免產生大量 404 錯誤
  const [imgError, setImgError] = useState(true); // 預設為 true，直接顯示 emoji
  const [imgLoaded, setImgLoaded] = useState(false);
  const imgPath = `assets/characters/${id}.png`;

  // 嘗試載入圖片，但不在 DevTools 顯示 404：使用主程式檢查檔案存在性
  useEffect(() => {
    let mounted = true;

    async function tryLoad() {
      try {
        // 如果沒有 Window.DQ 或 fileExists，退回到直接載入（舊行為）
        if (!window.DQ || typeof window.DQ.fileExists !== "function") {
          const img = new Image();
          img.onload = () => { if (!mounted) return; setImgLoaded(true); setImgError(false); };
          img.onerror = () => { if (!mounted) return; setImgError(true); setImgLoaded(false); };
          try { img.src = imgPath; } catch (e) { if (!mounted) return; setImgError(true); setImgLoaded(false); }
          return;
        }

        const exists = await window.DQ.fileExists(imgPath);
        if (!mounted) return;
        if (!exists) {
          setImgError(true);
          setImgLoaded(false);
          return;
        }

        // 檔案存在，安全載入圖片
        const img = new Image();
        img.onload = () => { if (!mounted) return; setImgLoaded(true); setImgError(false); };
        img.onerror = () => { if (!mounted) return; setImgError(true); setImgLoaded(false); };
        img.src = imgPath;
      } catch (error) {
        if (!mounted) return;
        setImgError(true);
        setImgLoaded(false);
      }
    }

    tryLoad();

    return () => { mounted = false; };
  }, [id, imgPath]);

  return (
    <div
      className={`pixel-sprite pixel-sprite-${id} ${className}`}
      style={baseStyle}
    >
      {imgLoaded && !imgError ? (
        <img
          src={imgPath}
          alt={id}
          style={{
            width: "64px",
            height: "64px",
            imageRendering: "pixelated",
            imageRendering: "-moz-crisp-edges",
            imageRendering: "crisp-edges",
            display: "block"
          }}
          onError={() => {
            setImgError(true);
            setImgLoaded(false);
          }}
        />
      ) : (
        <div style={{
          fontSize: "64px",
          lineHeight: "1",
          filter: "drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.8))"
        }}>
          {sprite.emoji}
        </div>
      )}
    </div>
  );
}

