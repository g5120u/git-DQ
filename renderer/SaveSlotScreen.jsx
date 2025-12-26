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
    <div className="status-box" style={{ background: "rgba(139, 69, 19, 0.3)", border: "3px solid #8B4513" }}>
      <h2 style={{ color: "#FFD700", textAlign: "center", marginBottom: "20px" }}>
        📖 冒險之書（存檔畫面）
      </h2>
      
      <p style={{ textAlign: "center", marginBottom: "20px", color: "#FFD700" }}>
        要讀取哪個冒險之書？
      </p>

      <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
        {slots.map((slot, index) => (
          <div
            key={index}
            onClick={() => slot && handleSelectSlot(slot)}
            style={{
              background: slot ? (slot.isCurrent ? "rgba(255, 215, 0, 0.2)" : "rgba(139, 69, 19, 0.5)") : "rgba(50, 50, 50, 0.5)",
              border: slot && slot.isCurrent ? "3px solid #FFD700" : "2px solid #8B4513",
              borderRadius: "10px",
              padding: "20px",
              minWidth: "200px",
              cursor: slot && !slot.isCurrent ? "pointer" : "default",
              transition: "all 0.3s",
              opacity: slot ? 1 : 0.5,
              position: "relative"
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
                <div style={{ fontSize: "1.2em", fontWeight: "bold", color: "#FFD700", marginBottom: "10px" }}>
                  數據 {index + 1}
                </div>
                <div style={{ fontSize: "1.5em", marginBottom: "10px" }}>
                  {slot.name === "main" ? "⚔️" : "🧙"}
                </div>
                <div style={{ color: "#FFF", marginBottom: "5px" }}>
                  <strong>路線：</strong>{slot.name}
                </div>
                <div style={{ color: "#FFF", marginBottom: "5px" }}>
                  <strong>等級：</strong>LV {slot.commitCount}
                </div>
                <div style={{ color: "#FFF", fontSize: "0.9em" }}>
                  <strong>任務：</strong>{slot.lastCommit.length > 20 ? slot.lastCommit.substring(0, 20) + "..." : slot.lastCommit}
                </div>
                {slot.isCurrent && (
                  <div style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    background: "#FFD700",
                    color: "#000",
                    padding: "3px 8px",
                    borderRadius: "5px",
                    fontSize: "0.8em",
                    fontWeight: "bold"
                  }}>
                    當前
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: "center", color: "#888", padding: "20px" }}>
                <div style={{ fontSize: "2em", marginBottom: "10px" }}>📭</div>
                <div>空位</div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: "20px", textAlign: "center" }}>
        {!showNewBranchForm ? (
          <button onClick={() => setShowNewBranchForm(true)}>
            ➕ 建立新冒險路線（新分支）
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

