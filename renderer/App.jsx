const { useState, useEffect } = React;

// 提交歷史組件（退回紀錄）
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
          onClick={async () => {
            try {
              const currentBranch = world.branch;
              if (currentBranch !== "main" && currentBranch !== "master") {
                const result = await window.DQ.switchBranch("main");
                if (result.success) {
                  await onRefresh();
                }
              }
            } catch (error) {
              console.error("回到主線錯誤：", error);
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

// 存檔畫面組件（在 App.jsx 中使用）
function SaveSlotScreen({ world, onSwitchBranch, onRefresh }) {
  const [branchInfo, setBranchInfo] = useState(null);
  const [loading, setLoading] = useState(true);
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
      return;
    }
    
    // 顯示確認對話框
    const confirmed = confirm(
      `確定要切換到「${branch.name}」這個冒險之書嗎？\n\n` +
      `路線：${branch.name}\n` +
      `等級：LV ${branch.commitCount}\n` +
      `任務：${branch.lastCommit || "無提交記錄"}\n\n` +
      `點擊「確定」切換，點擊「取消」取消操作。`
    );
    
    if (!confirmed) {
      return;
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

  // 確保當前分支在最前面
  const allBranches = branchInfo?.branches || [];
  const currentBranchIndex = allBranches.findIndex(b => b.isCurrent);
  
  // 重新排列，當前分支在前
  let sortedBranches = [...allBranches];
  if (currentBranchIndex > 0) {
    const currentBranch = sortedBranches.splice(currentBranchIndex, 1)[0];
    sortedBranches.unshift(currentBranch);
  }
  
  // 取前3個分支作為存檔槽位
  const slots = [
    sortedBranches[0] || null,
    sortedBranches[1] || null,
    sortedBranches[2] || null
  ];

  // 如果沒有分支，至少顯示當前分支
  if (slots[0] === null && branchInfo?.currentBranch) {
    slots[0] = {
      name: branchInfo.currentBranch,
      isCurrent: true,
      commitCount: world.commitCount || 0,
      lastCommit: world.lastCommit || "無提交記錄",
      commitShort: world.lastCommitShort || ""
    };
  }

  return (
    <PixelScene bg="village">
      <PixelBox type="dialog" title="📖 冒險之書（存檔畫面）">
        <div style={{ marginBottom: "20px" }}>
          <PixelTypewriter 
            text="要讀取哪個冒險之書？"
            speed={30}
          />
        </div>

      <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
        {slots.map((slot, index) => (
          <div
            key={index}
            onClick={() => slot && handleSelectSlot(slot)}
            style={{
              background: slot ? (slot.isCurrent 
                ? "linear-gradient(135deg, rgba(255, 215, 0, 0.3) 0%, rgba(255, 200, 0, 0.2) 100%)" 
                : "linear-gradient(135deg, rgba(139, 69, 19, 0.6) 0%, rgba(101, 50, 14, 0.5) 100%)") 
                : "rgba(50, 50, 50, 0.5)",
              border: slot && slot.isCurrent ? "3px solid #FFD700" : "2px solid #8B4513",
              borderRadius: "10px",
              padding: "20px",
              minWidth: "200px",
              cursor: slot && !slot.isCurrent ? "pointer" : "default",
              transition: "all 0.3s",
              opacity: slot ? 1 : 0.5,
              position: "relative",
              boxShadow: slot && slot.isCurrent 
                ? "0 0 20px rgba(255, 215, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                : "0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
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
                <div style={{ 
                  marginBottom: "10px", 
                  textAlign: "center",
                  height: "80px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative"
                }}>
                  {slot.name === "main" || slot.name === "master" ? (
                    <>
                      <img 
                        src="assets/characters/warrior.png" 
                        alt="戰士"
                        className="character-sprite pixel-art"
                        onError={(e) => {
                          // 如果圖片載入失敗，隱藏圖片並顯示 emoji
                          e.target.style.display = "none";
                          const fallback = e.target.parentElement.querySelector(".emoji-fallback");
                          if (fallback) fallback.style.display = "inline-block";
                        }}
                      />
                      <span 
                        className="emoji-fallback"
                        style={{ 
                          display: "none",
                          fontSize: "3em",
                          filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.5))"
                        }}
                      >
                        ⚔️
                      </span>
                    </>
                  ) : (
                    <>
                      <img 
                        src="assets/characters/wizard.png" 
                        alt="魔法師"
                        className="character-sprite pixel-art"
                        onError={(e) => {
                          // 如果圖片載入失敗，隱藏圖片並顯示 emoji
                          e.target.style.display = "none";
                          const fallback = e.target.parentElement.querySelector(".emoji-fallback");
                          if (fallback) fallback.style.display = "inline-block";
                        }}
                      />
                      <span 
                        className="emoji-fallback"
                        style={{ 
                          display: "none",
                          fontSize: "3em",
                          filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.5))"
                        }}
                      >
                        🧙
                      </span>
                    </>
                  )}
                </div>
                <div style={{ color: "#FFF", marginBottom: "5px", fontSize: "0.95em" }}>
                  <strong>路線：</strong>{slot.name}
                </div>
                <div style={{ color: "#FFF", marginBottom: "5px" }}>
                  <strong>等級：</strong>LV {slot.commitCount}
                </div>
                {slot.commitShort && (
                  <div style={{ color: "#90EE90", marginBottom: "5px", fontSize: "0.85em", fontFamily: "monospace" }}>
                    <strong>ID：</strong>{slot.commitShort}
                  </div>
                )}
                <div style={{ color: "#FFF", fontSize: "0.85em", lineHeight: "1.4" }}>
                  <strong>任務：</strong>{slot.lastCommit.length > 25 ? slot.lastCommit.substring(0, 25) + "..." : slot.lastCommit}
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
            <button 
              onClick={() => setShowNewBranchForm(true)}
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: "1em",
                padding: "12px 24px"
              }}
            >
              ➕ 建立新冒險路線（新分支）
            </button>
          ) : (
            <div style={{ marginTop: "15px" }}>
              <div className="form-group">
                <label style={{ fontFamily: "'Courier New', monospace", color: "#ffd700" }}>
                  新冒險路線名稱：
                </label>
                <input
                  type="text"
                  placeholder="例如：feature-new"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleCreateBranch()}
                  style={{
                    fontFamily: "'Courier New', monospace",
                    background: "rgba(0, 0, 0, 0.5)",
                    border: "2px solid #4a90e2",
                    color: "#fff",
                    padding: "8px",
                    width: "100%"
                  }}
                />
              </div>
              <div className="button-group">
                <button 
                  onClick={handleCreateBranch}
                  style={{ fontFamily: "'Courier New', monospace" }}
                >
                  ✅ 建立
                </button>
                <button 
                  onClick={() => { setShowNewBranchForm(false); setNewBranchName(""); }}
                  style={{ fontFamily: "'Courier New', monospace" }}
                >
                  ❌ 取消
                </button>
              </div>
            </div>
          )}
        </div>
      </PixelBox>
    </PixelScene>
  );
}

function App() {
  const [world, setWorld] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [targetPath, setTargetPath] = useState("");
  const [showFolderSelector, setShowFolderSelector] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        // 檢查 DQ API 是否可用
        if (!window.DQ) {
          console.error("DQ API 未載入");
          setMessage({ type: "error", text: "DQ API 未載入，請重新啟動應用程式" });
          setLoading(false);
          return;
        }

        const path = await window.DQ.getTarget();
        setTargetPath(path || "未設定");
      } catch (error) {
        console.error("無法取得目標路徑：", error);
        setMessage({ type: "error", text: "無法取得目標路徑：" + (error.message || String(error)) });
      }
      refresh();
    }
    init();

    // 監聽目標資料夾變更事件
    if (window.DQ && window.DQ.onTargetChanged) {
      window.DQ.onTargetChanged((newPath) => {
        setTargetPath(newPath);
        setWorld(null); // 重置狀態
        refresh();
      });
    }
  }, []);

  async function refresh() {
    setLoading(true);
    setMessage(null);
    try {
      if (!window.DQ) {
        throw new Error("DQ API 未載入");
      }
      const worldData = await window.DQ.scanWorld();
      if (worldData) {
        setWorld(worldData);
      } else {
        throw new Error("掃描結果為空");
      }
    } catch (error) {
      console.error("掃描世界狀態錯誤：", error);
      setMessage({ type: "error", text: "無法掃描世界狀態：" + (error.message || String(error)) });
      setWorld(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleInitWorld() {
    // 顯示確認對話框
    const confirmed = confirm(
      "確定要建立新的村莊（Git 倉庫）嗎？\n\n" +
      "這將會在當前資料夾執行 git init，建立一個新的 Git 倉庫。\n\n" +
      "點擊「確定」建立，點擊「取消」取消操作。"
    );
    
    if (!confirmed) {
      return;
    }
    
    setLoading(true);
    setMessage(null);
    try {
      const result = await window.DQ.initWorld();
      if (result.success) {
        setMessage({ type: "success", text: result.message });
        // 等待一下讓用戶看到成功訊息
        await new Promise(resolve => setTimeout(resolve, 500));
        await refresh();
      } else {
        setMessage({ type: "error", text: result.message || "無法建立世界" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "無法建立世界：" + error.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleSetHero() {
    if (!name.trim() || !email.trim()) {
      setMessage({ type: "error", text: "請填寫完整資訊" });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const result = await window.DQ.setHero(name.trim(), email.trim());
      setMessage({ type: "success", text: result.message });
      setShowForm(false);
      setName("");
      setEmail("");
      await refresh();
    } catch (error) {
      setMessage({ type: "error", text: "無法設定身分：" + error.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectFolder() {
    setLoading(true);
    setMessage(null);
    try {
      const result = await window.DQ.selectFolder();
      if (result && result.success) {
        setTargetPath(result.path);
        setMessage({ type: "success", text: `已切換到：${result.path}` });
        // 重要：完全重置狀態，清除所有舊資料
        // 確保不會顯示上一個人的 Git 資料
        setWorld(null);
        setName("");
        setEmail("");
        setShowForm(false);
        // 等待一小段時間確保狀態清除
        await new Promise(resolve => setTimeout(resolve, 100));
        // 強制重新載入，確保不會顯示上一個人的 Git 資料
        await refresh();
      } else {
        setMessage({ type: "error", text: "未選擇資料夾" });
        setLoading(false);
      }
    } catch (error) {
      console.error("選擇資料夾錯誤：", error);
      setMessage({ type: "error", text: "無法選擇資料夾：" + (error.message || String(error)) });
      setLoading(false);
    }
  }

  if (loading && !world) {
    return (
      <PixelScene bg="dungeon">
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          fontFamily: "'Courier New', monospace",
          color: "#ffd700",
          fontSize: "1.5em"
        }}>
          🔄 正在掃描冒險世界...
        </div>
      </PixelScene>
    );
  }

  if (!world) {
    return (
      <PixelScene bg="dungeon">
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          fontFamily: "'Courier New', monospace",
          color: "#ff6347",
          fontSize: "1.2em"
        }}>
          無法載入世界狀態
        </div>
      </PixelScene>
    );
  }

  return (
    <PixelScene bg="dungeon">
      <div style={{ 
        position: "absolute",
        top: "10px",
        left: "10px",
        right: "10px",
        zIndex: 100
      }}>
        <PixelBox type="info" style={{ marginBottom: "10px", padding: "10px 15px" }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px"
          }}>
            <div style={{ fontFamily: "'Courier New', monospace", fontSize: "0.9em" }}>
              📁 當前冒險世界：<span style={{ color: "#ffd700" }}>{targetPath || "未設定"}</span>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button 
                onClick={refresh}
                style={{
                  padding: "6px 12px",
                  fontSize: "0.8em",
                  margin: "0",
                  background: "rgba(74, 144, 226, 0.8)",
                  border: "2px solid #4a90e2",
                  fontFamily: "'Courier New', monospace",
                  borderRadius: "0",
                  cursor: "pointer"
                }}
              >
                🔄 重新整理
              </button>
              <button 
                onClick={handleSelectFolder}
                style={{
                  padding: "6px 12px",
                  fontSize: "0.8em",
                  margin: "0",
                  background: "rgba(74, 144, 226, 0.8)",
                  border: "2px solid #4a90e2",
                  fontFamily: "'Courier New', monospace",
                  borderRadius: "0",
                  cursor: "pointer"
                }}
              >
                🌍 其他世界
              </button>
            </div>
          </div>
        </PixelBox>
      </div>

      {message && (
        <div style={{
          position: "absolute",
          top: "80px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 200,
          width: "90%",
          maxWidth: "600px"
        }}>
          <PixelBox type={message.type === "success" ? "info" : "warning"}>
            {message.text}
          </PixelBox>
        </div>
      )}

      {!world.exists && (
        <PixelScene bg="dungeon">
          {/* 背景圖片區域 - 在魔法師原來的位置（65%位置） */}
          <div style={{
            position: "absolute",
            top: "60%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "400px",
            height: "300px",
            backgroundImage: "url('assets/backgrounds/dungeon.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            zIndex: 1,
            opacity: 0.8,
            imageRendering: "pixelated"
          }} />
          
          {/* 對話框 - 置中 */}
          <div style={{ 
            position: "absolute", 
            top: "45%", 
            left: "50%", 
            transform: "translate(-50%, -50%)",
            width: "85%",
            maxWidth: "650px",
            zIndex: 20
          }}>
            <PixelBox type="dialog" title="🌍 你還沒有進入任何村莊">
              <PixelTypewriter 
                text="你還沒有進入任何村莊。這個資料夾還沒有 Git 倉庫。要建立新的村莊 (Git 倉庫) 開始你的冒險嗎？建立村莊後，你就可以開始記錄你的冒險歷程了！"
                speed={30}
              />
            </PixelBox>
          </div>
          
          {/* 魔法師 - 在對話框左側（就像他在說話） */}
          <PixelSprite 
            id="hero" 
            facing="right" 
            animated={true}
            style={{
              left: "calc(50% - 350px)", // 對話框左側
              top: "calc(45% - 32px)", // 與對話框對齊
              zIndex: 15,
              transform: "scale(1.2)" // 稍微放大，更明顯
            }}
          />
          
          {/* 按鈕 - 在底部中央 */}
          <div style={{ 
            position: "absolute", 
            bottom: "5%", 
            left: "50%", 
            transform: "translateX(-50%)",
            zIndex: 30,
            pointerEvents: "auto"
          }}>
            <button 
              onClick={handleInitWorld}
              style={{ 
                fontSize: "1.1em", 
                padding: "15px 40px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "4px solid #4a148c",
                color: "#fff",
                fontFamily: "'Courier New', monospace",
                cursor: "pointer",
                borderRadius: "0",
                imageRendering: "pixelated",
                boxShadow: "0 4px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontWeight: "bold",
                transition: "all 0.2s",
                position: "relative",
                zIndex: 30
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0 6px 12px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)";
              }}
            >
              <span style={{ fontSize: "1.2em" }}>🏰</span>
              <span>建立新村莊 (git init)</span>
            </button>
          </div>
        </PixelScene>
      )}

      {world.exists && !world.userName && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90%",
          maxWidth: "500px",
          zIndex: 100
        }}>
          <PixelBox type="dialog" title="👤 設定冒險者身分">
            <PixelTypewriter 
              text="冒險世界已建立！現在請設定你的身分資訊，這些資訊會用於 Git 提交記錄。"
              speed={30}
            />
            {!showForm ? (
              <div style={{ marginTop: "20px", textAlign: "center" }}>
                <button 
                  onClick={() => setShowForm(true)}
                  style={{
                    fontFamily: "'Courier New', monospace",
                    padding: "12px 24px",
                    borderRadius: "0",
                    cursor: "pointer"
                  }}
                >
                  ✏️ 設定冒險者身分
                </button>
              </div>
            ) : (
              <div style={{ marginTop: "20px" }}>
                <div className="form-group">
                  <label style={{ fontFamily: "'Courier New', monospace", color: "#ffd700" }}>
                    冒險者名稱：
                  </label>
                  <input
                    type="text"
                    placeholder="例如：張三"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      fontFamily: "'Courier New', monospace",
                      background: "rgba(0, 0, 0, 0.5)",
                      border: "2px solid #4a90e2",
                      color: "#fff",
                      padding: "8px",
                      borderRadius: "0",
                      width: "100%"
                    }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontFamily: "'Courier New', monospace", color: "#ffd700" }}>
                    電子郵件：
                  </label>
                  <input
                    type="email"
                    placeholder="例如：your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      fontFamily: "'Courier New', monospace",
                      background: "rgba(0, 0, 0, 0.5)",
                      border: "2px solid #4a90e2",
                      color: "#fff",
                      padding: "8px",
                      borderRadius: "0",
                      width: "100%"
                    }}
                  />
                </div>
                <div className="button-group">
                  <button 
                    onClick={handleSetHero}
                    style={{ fontFamily: "'Courier New', monospace", borderRadius: "0" }}
                  >
                    ✅ 確認設定
                  </button>
                  <button 
                    onClick={() => { setShowForm(false); setName(""); setEmail(""); }}
                    style={{ fontFamily: "'Courier New', monospace", borderRadius: "0" }}
                  >
                    ❌ 取消
                  </button>
                </div>
              </div>
            )}
          </PixelBox>
        </div>
      )}

      {world.exists && world.userName && (
        <React.Fragment>
          {/* 村莊狀態顯示 */}
          <div style={{
            position: "absolute",
            top: "100px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "90%",
            maxWidth: "800px",
            zIndex: 50
          }}>
            <PixelBox type="info" title="🏰 當前村莊狀態">
              <div style={{ marginTop: "15px", lineHeight: "1.8", fontFamily: "'Courier New', monospace" }}>
                {world.branch === "main" || world.branch === "master" ? (
                  <>
                    <p style={{ fontSize: "1.1em", color: "#FFD700", marginBottom: "10px" }}>
                      <strong>📍 你目前在：主線劇情（{world.branch}）</strong>
                    </p>
                    <p style={{ color: "#FFF", marginBottom: "10px" }}>
                      ⚔️ 這裡是主戰場，你在這裡對抗主要敵人（處理主要功能開發）
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: "1.1em", color: "#FFD700", marginBottom: "10px" }}>
                      <strong>📍 你目前在：支線劇情（{world.branch}）</strong>
                    </p>
                    <p style={{ color: "#FFF", marginBottom: "10px" }}>
                      🧙 你在進行特殊任務（開發新功能），完成後可以回到主線
                    </p>
                  </>
                )}
                <p style={{ marginTop: "10px", color: "#90EE90" }}>
                  ✅ 村莊已建立，冒險者身分已確認
                </p>
                {world.status && world.status.includes("Changes") && (
                  <p style={{ marginTop: "10px", color: "#FFA500" }}>
                    ⚠️ 你有未保存的變更，準備好打怪（提交）了嗎？
                  </p>
                )}
              </div>
            </PixelBox>
          </div>

          {/* 存檔畫面 */}
          <div style={{
            position: "absolute",
            top: "250px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "95%",
            maxWidth: "900px",
            zIndex: 40
          }}>
            <SaveSlotScreen world={world} onSwitchBranch={refresh} onRefresh={refresh} />
          </div>

          {/* 提交歷史（退回紀錄） */}
          <div style={{
            position: "absolute",
            top: "600px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "95%",
            maxWidth: "900px",
            zIndex: 30
          }}>
            <CommitHistory world={world} onCheckoutCommit={refresh} onRefresh={refresh} />
          </div>

          {/* 冒險世界狀態 */}
          <div style={{
            position: "absolute",
            top: "850px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "95%",
            maxWidth: "900px",
            zIndex: 20
          }}>
            <PixelBox type="menu" title="🧭 冒險世界狀態">
              <div style={{ marginBottom: "15px", fontFamily: "'Courier New', monospace" }}>
                <p><strong>英雄名稱：</strong>{world.userName || "未設定"}</p>
                <p><strong>電子郵件：</strong>{world.userEmail || "未設定"}</p>
                <p><strong>當前分支：</strong>{world.branch || "未建立分支"}</p>
                {world.remote && <p><strong>遠端倉庫：</strong>{world.remote}</p>}
                {world.commitCount !== undefined && (
                  <p><strong>提交數量：</strong>{world.commitCount} 次</p>
                )}
                {world.lastCommit && (
                  <p><strong>最後提交：</strong>{world.lastCommit}</p>
                )}
                {world.branches && world.branches.length > 0 && (
                  <div style={{ marginTop: "10px" }}>
                    <strong>分支列表：</strong>
                    <ul style={{ marginLeft: "20px", marginTop: "5px" }}>
                      {world.branches.slice(0, 10).map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                      {world.branches.length > 10 && <li>... 還有 {world.branches.length - 10} 個分支</li>}
                    </ul>
                  </div>
                )}
                {world.tags && world.tags.length > 0 && (
                  <div style={{ marginTop: "10px" }}>
                    <strong>標籤：</strong>
                    <span style={{ marginLeft: "10px" }}>
                      {world.tags.slice(0, 5).join(", ")}
                      {world.tags.length > 5 && ` ... 還有 ${world.tags.length - 5} 個標籤`}
                    </span>
                  </div>
                )}
              </div>
              <h3 style={{ color: "#ffd700", marginTop: "20px", marginBottom: "10px", fontFamily: "'Courier New', monospace" }}>
                Git 狀態：
              </h3>
              {world.untrackedFiles && world.untrackedFiles.length > 0 && (
                <div style={{ marginBottom: "10px" }}>
                  <strong style={{ color: "#FFA500" }}>❓ 未追蹤檔案（{world.untrackedFiles.length}）：</strong>
                  <ul style={{ marginLeft: "20px", marginTop: "5px", color: "#FFA500", fontFamily: "'Courier New', monospace" }}>
                    {world.untrackedFiles.slice(0, 10).map((file, i) => (
                      <li key={i} style={{ fontSize: "0.9em" }}>{file}</li>
                    ))}
                    {world.untrackedFiles.length > 10 && <li>... 還有 {world.untrackedFiles.length - 10} 個檔案</li>}
                  </ul>
                </div>
              )}
              {world.modifiedFiles && world.modifiedFiles.length > 0 && (
                <div style={{ marginBottom: "10px" }}>
                  <strong style={{ color: "#90EE90" }}>✏️ 已修改檔案（{world.modifiedFiles.length}）：</strong>
                  <ul style={{ marginLeft: "20px", marginTop: "5px", color: "#90EE90", fontFamily: "'Courier New', monospace" }}>
                    {world.modifiedFiles.slice(0, 10).map((file, i) => (
                      <li key={i} style={{ fontSize: "0.9em" }}>{file}</li>
                    ))}
                    {world.modifiedFiles.length > 10 && <li>... 還有 {world.modifiedFiles.length - 10} 個檔案</li>}
                  </ul>
                </div>
              )}
              {world.deletedFiles && world.deletedFiles.length > 0 && (
                <div style={{ marginBottom: "10px" }}>
                  <strong style={{ color: "#FF6347" }}>🗑️ 已刪除檔案（{world.deletedFiles.length}）：</strong>
                  <ul style={{ marginLeft: "20px", marginTop: "5px", color: "#FF6347", fontFamily: "'Courier New', monospace" }}>
                    {world.deletedFiles.slice(0, 10).map((file, i) => (
                      <li key={i} style={{ fontSize: "0.9em" }}>{file}</li>
                    ))}
                    {world.deletedFiles.length > 10 && <li>... 還有 {world.deletedFiles.length - 10} 個檔案</li>}
                  </ul>
                </div>
              )}
              {(!world.untrackedFiles || world.untrackedFiles.length === 0) && 
               (!world.modifiedFiles || world.modifiedFiles.length === 0) && 
               (!world.deletedFiles || world.deletedFiles.length === 0) && (
                <div style={{ color: "#90EE90", padding: "10px", fontFamily: "'Courier New', monospace" }}>✅ 工作區乾淨，無變更</div>
              )}
            </PixelBox>
          </div>
        </React.Fragment>
      )}
    </PixelScene>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));

