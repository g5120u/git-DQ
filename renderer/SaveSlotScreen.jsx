const { useState, useEffect } = React;

function SaveSlotScreen({ world, onSwitchBranch, onRefresh }) {
  const [branchInfo, setBranchInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showNewBranchForm, setShowNewBranchForm] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");

  useEffect(() => {
    loadBranchInfo();
  }, [world]);

  async function loadBranchInfo() {
    if (!world || !world.exists) {
      setLoading(false);
      return;
    }
    
    try {
      const info = await window.DQ.getBranchInfo();
      setBranchInfo(info);
    } catch (error) {
      console.error("載入分支資訊錯誤：", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectSlot(branch) {
    if (branch.isCurrent) {
      return; // 已經在當前分支
    }
    
    try {
      const result = await window.DQ.switchBranch(branch.name);
      if (result.success) {
        await onRefresh();
        await loadBranchInfo();
      }
    } catch (error) {
      console.error("切換分支錯誤：", error);
    }
  }

  async function handleCreateBranch() {
    if (!newBranchName.trim()) {
      return;
    }
    
    try {
      const result = await window.DQ.switchBranch(newBranchName.trim());
      if (result.success) {
        setShowNewBranchForm(false);
        setNewBranchName("");
        await onRefresh();
        await loadBranchInfo();
      }
    } catch (error) {
      console.error("建立分支錯誤：", error);
    }
  }

  if (loading) {
    return <div className="loading">🔄 載入存檔資料...</div>;
  }

  if (!world || !world.exists) {
    return null;
  }

  const slots = [
    branchInfo?.branches[0] || null,
    branchInfo?.branches[1] || null,
    branchInfo?.branches[2] || null
  ];

  // 確保至少有 main 分支顯示
  if (slots[0] === null && branchInfo?.currentBranch) {
    slots[0] = {
      name: branchInfo.currentBranch,
      isCurrent: true,
      commitCount: world.commitCount || 0,
      lastCommit: world.lastCommit || "無提交記錄"
    };
  }

  return (
    <div className="status-box" style={{ background: "rgba(139, 69, 19, 0.3)", border: "3px solid #8B4513", padding: "10px" }}>
      <h2 style={{ color: "#FFD700", textAlign: "center", marginBottom: "8px", fontSize: "0.9em" }}>
        📖 冒險之書（存檔畫面）
      </h2>
      
      <p style={{ textAlign: "center", marginBottom: "10px", color: "#FFD700", fontSize: "0.8em" }}>
        要讀取哪個冒險之書？
      </p>

      <div style={{ 
        display: "flex", 
        gap: "6px", 
        justifyContent: "center", 
        flexWrap: "nowrap", // 強制一行顯示
        alignItems: "stretch", // 確保高度一致
        width: "100%"
      }}>
        {slots.map((slot, index) => (
          <div
            key={index}
            onClick={() => slot && handleSelectSlot(slot)}
            style={{
              background: slot ? (slot.isCurrent ? "rgba(255, 215, 0, 0.2)" : "rgba(139, 69, 19, 0.5)") : "rgba(50, 50, 50, 0.5)",
              border: slot && slot.isCurrent ? "3px solid #FFD700" : "2px solid #8B4513",
              borderRadius: "5px",
              padding: "8px",
              flex: "1 1 0", // 平均分配寬度，確保大小一致
              minWidth: "0", // 允許縮小
              maxWidth: "none", // 移除最大寬度限制
              cursor: slot && !slot.isCurrent ? "pointer" : "default",
              transition: "all 0.3s",
              opacity: slot ? 1 : 0.5,
              position: "relative",
              fontSize: "0.7em", // 縮小字體
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start"
            }}
            onMouseEnter={(e) => {
              if (slot && !slot.isCurrent) {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0 0 15px rgba(255, 215, 0, 0.5)";
              }
            }}
            onMouseLeave={(e) => {
              if (slot && !slot.isCurrent) {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }
            }}
          >
            {slot ? (
              <>
                <div style={{ fontSize: "1em", fontWeight: "bold", color: "#FFD700", marginBottom: "6px" }}>
                  數據 {index + 1}
                </div>
                <div style={{ fontSize: "1.2em", marginBottom: "6px", textAlign: "center" }}>
                  {slot.name === "main" ? "⚔️" : "🧙"}
                </div>
                <div style={{ color: "#FFF", marginBottom: "3px", fontSize: "0.85em", lineHeight: "1.3" }}>
                  <strong>路線：</strong><span style={{ wordBreak: "break-word" }}>{slot.name.length > 12 ? slot.name.substring(0, 12) + "..." : slot.name}</span>
                </div>
                <div style={{ color: "#FFF", marginBottom: "3px", fontSize: "0.85em" }}>
                  <strong>等級：</strong>LV {slot.commitCount}
                </div>
                <div style={{ color: "#FFF", fontSize: "0.75em", marginBottom: "3px", lineHeight: "1.3" }}>
                  <strong>任務：</strong><span style={{ wordBreak: "break-word" }}>{slot.lastCommit.length > 12 ? slot.lastCommit.substring(0, 12) + "..." : slot.lastCommit}</span>
                </div>
                {/* 顯示 commit ID 前7碼 - 必須顯示才能倒退時知道是哪個 */}
                {slot.commitShort ? (
                  <div style={{ color: "#87ceeb", fontSize: "0.65em", marginTop: "4px", wordBreak: "break-all" }}>
                    <strong>ID：</strong><code style={{ background: "rgba(0,0,0,0.3)", padding: "1px 3px", borderRadius: "2px", fontFamily: "'Courier New', monospace" }}>{slot.commitShort}</code>
                  </div>
                ) : slot.commitId ? (
                  <div style={{ color: "#87ceeb", fontSize: "0.65em", marginTop: "4px", wordBreak: "break-all" }}>
                    <strong>ID：</strong><code style={{ background: "rgba(0,0,0,0.3)", padding: "1px 3px", borderRadius: "2px", fontFamily: "'Courier New', monospace" }}>{slot.commitId.substring(0, 7)}</code>
                  </div>
                ) : slot.commitCount > 0 ? (
                  <div style={{ color: "#888", fontSize: "0.6em", marginTop: "4px" }}>
                    ID: 無
                  </div>
                ) : null}
                {slot.isCurrent && (
                  <div style={{
                    position: "absolute",
                    top: "6px",
                    right: "6px",
                    background: "#FFD700",
                    color: "#000",
                    padding: "2px 6px",
                    borderRadius: "3px",
                    fontSize: "0.7em",
                    fontWeight: "bold"
                  }}>
                    當前
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: "center", color: "#888", padding: "15px" }}>
                <div style={{ fontSize: "1.5em", marginBottom: "6px" }}>📭</div>
                <div style={{ fontSize: "0.8em" }}>空位</div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: "20px", textAlign: "center" }}>
        {!showNewBranchForm ? (
          <button 
            onClick={() => setShowNewBranchForm(true)}
            style={{
              fontFamily: "'Courier New', monospace",
              padding: "12px 24px",
              borderRadius: "0",
              cursor: "pointer",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "3px solid #4a148c",
              color: "#fff",
              fontWeight: "bold",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <span>➕</span>
            <span>建立新冒險路線（新分支）</span>
            <span style={{ fontSize: "0.85em", opacity: 0.8, marginLeft: "8px" }}>
              (git checkout -b)
            </span>
          </button>
        ) : (
          <div style={{ background: "rgba(0, 0, 0, 0.3)", padding: "15px", borderRadius: "5px" }}>
            <div className="form-group">
              <label>新冒險路線名稱：</label>
              <input
                type="text"
                placeholder="例如：feature-new"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleCreateBranch()}
              />
            </div>
            <div className="button-group">
              <button onClick={handleCreateBranch}>✅ 建立</button>
              <button onClick={() => { setShowNewBranchForm(false); setNewBranchName(""); }}>
                取消
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

