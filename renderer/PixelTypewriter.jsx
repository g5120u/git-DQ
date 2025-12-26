/**
 * PixelTypewriter.jsx - 打字機字幕動畫
 * 8-bit RPG 風格的打字機效果文字
 */

const { useState, useEffect } = React;

function PixelTypewriter({ 
  text = "",
  speed = 50, // 每個字元的延遲（毫秒）
  onComplete = null,
  className = "",
  style = {}
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!text) {
      setDisplayedText("");
      setIsComplete(false);
      return;
    }

    setDisplayedText("");
    setIsComplete(false);
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsComplete(true);
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span
      className={`pixel-typewriter ${className}`}
      style={{
        fontFamily: "'Courier New', 'Consolas', monospace",
        color: "#fff",
        ...style
      }}
    >
      {displayedText}
      {!isComplete && <PixelCursor blinkSpeed={300} />}
    </span>
  );
}

