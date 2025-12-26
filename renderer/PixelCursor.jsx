/**
 * PixelCursor.jsx - 閃爍游標
 * 8-bit RPG 風格的閃爍游標動畫
 */

const { useState, useEffect } = React;

function PixelCursor({ 
  blinkSpeed = 500, // 閃爍速度（毫秒）
  color = "#ffd700",
  size = "1em",
  className = "",
  style = {}
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(prev => !prev);
    }, blinkSpeed);

    return () => clearInterval(interval);
  }, [blinkSpeed]);

  return (
    <span
      className={`pixel-cursor ${className}`}
      style={{
        color: color,
        fontSize: size,
        opacity: visible ? 1 : 0,
        fontFamily: "'Courier New', monospace",
        fontWeight: "bold",
        transition: "opacity 0.1s",
        ...style
      }}
    >
      ▊
    </span>
  );
}

