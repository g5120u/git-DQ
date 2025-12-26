const { useState, useEffect } = React;

function CommitHistory({ world, onCheckoutCommit, onRefresh }) {
  const [commitHistory, setCommitHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommit, setSelectedCommit] = useState(null);

  useEffect(() => {
    if (world && world.exists) {
      loadCommitHistory();
    }
  }, [world]);

  async function loadCommitHistory() {
    if (!world || !world.exists) {
      setLoading(false);
      return;
    }
    
    try {
      const history = await window.DQ.getCommitHistory(20);
      setCommitHistory(history || []);
    } catch (error) {
      console.error("載入提交歷史錯誤：", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckoutCommit(commit) {
    if (!confirm(`確定要切換到提交 ${commit.shortId} 嗎？\n這會將你的工作區切換到該時間點。`)) {
      return;
    }
    
    try {
      const result = await window.DQ.checkoutCommit(commit.id);
      if (result.success) {
        setSelectedCommit(commit);
        await onRefresh();
      }
    } catch (error) {
      console.error("切換提交錯誤：", error);
    }
  }

  if (loading) {
    return <div className="loading">🔄 載入提交歷史...</div>;
  }

  if (!world || !world.exists || commitHistory.length === 0) {
    return null;
  }

  return (
    <div className="status-box" style={{ 
      background: "linear-gradient(135deg, rgba(75, 0, 130, 0.3) 0%, rgba(138, 43, 226, 0.2) 100%)", 
      border: "3px solid #9370DB",
      marginTop: "20px"
    }}>
      <h2 style={{ color: "#DDA0DD", textAlign: "center", marginBottom: "20px" }}>
        📜 冒險紀錄（提交歷史）
      </h2>
      
      <p style={{ textAlign: "center", marginBottom: "15px", color: "#DDA0DD", fontSize: "0.9em" }}>
        點擊提交可以回到該時間點
      </p>

      <div style={{ maxHeight: "300px", overflowY: "auto", padding: "10px" }}>
        {commitHistory.map((commit, index) => (
          <div
            key={commit.id}
            onClick={() => handleCheckoutCommit(commit)}
            style={{
              background: selectedCommit && selectedCommit.id === commit.id
                ? "rgba(255, 215, 0, 0.3)"
                : "rgba(0, 0, 0, 0.3)",
              border: selectedCommit && selectedCommit.id === commit.id
                ? "2px solid #FFD700"
                : "1px solid #9370DB",
              borderRadius: "8px",
              padding: "12px",
              marginBottom: "10px",
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "15px"
            }}
            onMouseEnter={(e) => {
              if (!selectedCommit || selectedCommit.id !== commit.id) {
                e.currentTarget.style.background = "rgba(147, 112, 219, 0.4)";
                e.currentTarget.style.transform = "translateX(5px)";
              }
            }}
            onMouseLeave={(e) => {
              if (!selectedCommit || selectedCommit.id !== commit.id) {
                e.currentTarget.style.background = "rgba(0, 0, 0, 0.3)";
                e.currentTarget.style.transform = "translateX(0)";
              }
            }}
          >
            <div style={{
              background: "#9370DB",
              color: "#FFF",
              padding: "5px 10px",
              borderRadius: "5px",
              fontFamily: "monospace",
              fontSize: "0.85em",
              fontWeight: "bold",
              minWidth: "70px",
              textAlign: "center"
            }}>
              {commit.shortId}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#FFF", fontWeight: "bold", marginBottom: "5px" }}>
                {commit.message}
              </div>
              <div style={{ color: "#DDA0DD", fontSize: "0.85em" }}>
                {commit.author} • {commit.time}
              </div>
            </div>
            {selectedCommit && selectedCommit.id === commit.id && (
              <div style={{ color: "#FFD700", fontSize: "1.2em" }}>✓</div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: "15px", textAlign: "center" }}>
        <button 
          onClick={() => {
            if (world.branch === "main" || world.branch === "master") {
              handleCheckoutCommit({ id: world.branch, shortId: world.branch });
            } else {
              window.DQ.switchBranch("main").then(() => onRefresh());
            }
          }}
          style={{ fontSize: "0.9em", padding: "8px 16px" }}
        >
          🏠 回到主線
        </button>
      </div>
    </div>
  );
}

