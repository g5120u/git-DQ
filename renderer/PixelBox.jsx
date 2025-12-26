/**
 * PixelBox.jsx - 對話框、選單框
 * 8-bit RPG 風格的對話框和選單框
 */

const { useState, useEffect } = React;

function PixelBox({ 
  children, 
  title = "",
  type = "dialog", // dialog, menu, info, warning
  onClose = null,
  className = "",
  style = {}
}) {
  const typeStyles = {
    dialog: {
      border: "4px solid #ffd700",
      background: "rgba(0, 0, 0, 0.9)",
      boxShadow: "inset 0 0 0 2px #000, 0 0 0 2px #ffd700"
    },
    menu: {
      border: "3px solid #4a90e2",
      background: "rgba(0, 0, 0, 0.85)",
      boxShadow: "inset 0 0 0 2px #000, 0 0 0 2px #4a90e2"
    },
    info: {
      border: "3px solid #90ee90",
      background: "rgba(0, 0, 0, 0.85)",
      boxShadow: "inset 0 0 0 2px #000, 0 0 0 2px #90ee90"
    },
    warning: {
      border: "3px solid #ff6347",
      background: "rgba(0, 0, 0, 0.85)",
      boxShadow: "inset 0 0 0 2px #000, 0 0 0 2px #ff6347"
    }
  };

  const baseStyle = {
    position: "relative",
    padding: "20px",
    margin: "10px 0",
    borderRadius: "0",
    fontFamily: "'Courier New', 'Consolas', monospace",
    color: "#fff",
    fontSize: "16px",
    lineHeight: "1.6",
    imageRendering: "pixelated",
    imageRendering: "-moz-crisp-edges",
    imageRendering: "crisp-edges",
    ...typeStyles[type],
    ...style
  };

  return (
    <div 
      className={`pixel-box pixel-box-${type} ${className}`}
      style={baseStyle}
    >
      {title && (
        <div style={{
          color: typeStyles[type].border.replace("3px solid ", "").replace("4px solid ", ""),
          fontWeight: "bold",
          marginBottom: "10px",
          fontSize: "18px",
          textTransform: "uppercase"
        }}>
          {title}
        </div>
      )}
      {children}
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "5px",
            right: "5px",
            background: "transparent",
            border: "2px solid #fff",
            color: "#fff",
            width: "24px",
            height: "24px",
            cursor: "pointer",
            fontSize: "16px",
            lineHeight: "1",
            padding: "0",
            fontFamily: "'Courier New', monospace"
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

function PixelMenu({ 
  items = [], 
  selectedIndex = 0,
  onSelect = null,
  className = "",
  style = {}
}) {
  const [currentIndex, setCurrentIndex] = useState(selectedIndex);

  useEffect(() => {
    setCurrentIndex(selectedIndex);
  }, [selectedIndex]);

  const handleKeyPress = (e) => {
    if (e.key === "ArrowDown" && currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (e.key === "ArrowUp" && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (e.key === "Enter" && onSelect) {
      onSelect(items[currentIndex], currentIndex);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentIndex]);

  return (
    <PixelBox type="menu" className={className} style={style}>
      {items.map((item, index) => (
        <div
          key={index}
          onClick={() => {
            setCurrentIndex(index);
            if (onSelect) onSelect(item, index);
          }}
          style={{
            padding: "8px 12px",
            margin: "4px 0",
            cursor: "pointer",
            background: index === currentIndex ? "rgba(74, 144, 226, 0.3)" : "transparent",
            border: index === currentIndex ? "2px solid #4a90e2" : "2px solid transparent",
            color: index === currentIndex ? "#4a90e2" : "#fff",
            fontFamily: "'Courier New', monospace",
            transition: "none",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
          onMouseEnter={() => setCurrentIndex(index)}
        >
          {index === currentIndex && <span style={{ color: "#4a90e2" }}>▶</span>}
          <span>{item.label || item}</span>
        </div>
      ))}
    </PixelBox>
  );
}

