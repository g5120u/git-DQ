const { useState, useEffect } = React;

// ============================================
// 世界永動核心系統 World State & Loop
// ============================================

// 世界狀態核心
const WorldState = {
  level: 1,
  exp: 0,
  gold: 0,
  stage: 1,
  inBattle: true,
  enemyHP: 10,
  heroHP: 10,
  lastCommitHash: null,
  worldDays: 0,
  worldName: "",
  creator: "",
  soul: "",
  bornAt: null
};

// 世界循環函數
function worldTick() {
  if (!WorldState.inBattle) return;

  // 自動戰鬥
  WorldState.enemyHP -= 0.15;
  WorldState.heroHP -= 0.05;

  // 英雄死亡：重置戰鬥
  if (WorldState.heroHP <= 0) {
    WorldState.heroHP = 10 + WorldState.level * 2;
    WorldState.enemyHP = 10 + WorldState.stage * 2;
    WorldState.exp = Math.max(0, WorldState.exp - 2);
  }

  // 勝利：擊敗敵人
  if (WorldState.enemyHP <= 0) {
    WorldState.exp += 5;
    WorldState.gold += 3;
    WorldState.stage++;
    WorldState.enemyHP = 10 + WorldState.stage * 2;
    WorldState.heroHP = Math.min(WorldState.heroHP + 2, 10 + WorldState.level * 2);
  }

  // 升級
  if (WorldState.exp >= 20) {
    WorldState.level++;
    WorldState.exp = 0;
    WorldState.heroHP = 10 + WorldState.level * 2;
  }
}

// 檢查 commit 狀態
function checkCommitStatus(currentCommitHash) {
  if (!currentCommitHash) {
    WorldState.inBattle = true;
    return false;
  }

  if (WorldState.lastCommitHash !== currentCommitHash) {
    WorldState.lastCommitHash = currentCommitHash;
    WorldState.worldDays++;
    WorldState.inBattle = false;
    
    WorldState.exp += 10;
    WorldState.gold += 5;
    
    setTimeout(() => {
      WorldState.inBattle = true;
      WorldState.enemyHP = 10 + WorldState.stage * 2;
      WorldState.heroHP = 10 + WorldState.level * 2;
    }, 3000);
    
    return true;
  }

  return false;
}

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
  const [page, setPage] = useState(0);
  const pageSize = 3;
  const [warriorExists, setWarriorExists] = useState(false);
  const [wizardExists, setWizardExists] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function checkAssets() {
      try {
        if (window.DQ && typeof window.DQ.fileExists === "function") {
          const w1 = await window.DQ.fileExists("assets/characters/warrior.png");
          const w2 = await window.DQ.fileExists("assets/characters/wizard.png");
          if (!mounted) return;
          setWarriorExists(Boolean(w1));
          setWizardExists(Boolean(w2));
        } else {
          // 若沒有 DQ.fileExists，嘗試假設檔案不存在（讓 fallback 顯示）
          setWarriorExists(false);
          setWizardExists(false);
        }
      } catch (e) {
        if (!mounted) return;
        setWarriorExists(false);
        setWizardExists(false);
      }
    }
    checkAssets();
    return () => { mounted = false; };
  }, []);

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
  // 分頁：將所有分支排列並分頁顯示
  const allBranches = branchInfo?.branches || [];
  const currentBranchIndex = allBranches.findIndex(b => b.isCurrent);
  let sortedBranches = [...allBranches];
  if (currentBranchIndex > 0) {
    const currentBranch = sortedBranches.splice(currentBranchIndex, 1)[0];
    sortedBranches.unshift(currentBranch);
  }

  // 當沒有任何 branches，使用當前 branch 作為 fallback
  if (sortedBranches.length === 0 && branchInfo?.currentBranch) {
    sortedBranches = [{
      name: branchInfo.currentBranch,
      isCurrent: true,
      commitCount: world.commitCount || 0,
      lastCommit: world.lastCommit || "無提交記錄",
      commitShort: world.lastCommitShort || ""
    }];
  }

  const pageCount = Math.max(1, Math.ceil(sortedBranches.length / pageSize));
  // clamp page
  const safePage = Math.min(Math.max(0, page), pageCount - 1);
  if (safePage !== page) setPage(safePage);
  const pageStart = safePage * pageSize;
  const pageItems = sortedBranches.slice(pageStart, pageStart + pageSize);
  // ensure length = pageSize with null placeholders
  const slots = Array.from({ length: pageSize }, (_, i) => pageItems[i] || null);

  return (
    <PixelScene bg="village">
      <PixelBox type="dialog" title="📖 冒險之書（存檔畫面）">
        <div style={{ marginBottom: "20px" }}>
          <PixelTypewriter 
            text="要讀取哪個冒險之書？"
            speed={30}
          />
        </div>
        {/* 分頁控制（右上） */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <div></div>
          {pageCount > 1 && (
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={safePage === 0} style={{ padding: "6px 8px", cursor: safePage === 0 ? "not-allowed" : "pointer" }}>◀</button>
              <div style={{ color: "#FFD700", fontFamily: "'Courier New', monospace" }}>{safePage + 1} / {pageCount}</div>
              <button onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))} disabled={safePage === pageCount - 1} style={{ padding: "6px 8px", cursor: safePage === pageCount - 1 ? "not-allowed" : "pointer" }}>▶</button>
            </div>
          )}
        </div>

      <div style={{ display: "flex", gap: "15px", justifyContent: "space-between", flexWrap: "nowrap", alignItems: "stretch" }}>
        {slots.map((slot, index) => (
          <div
            key={index}
            onClick={() => slot && handleSelectSlot(slot)}
            style={{
              flex: "0 0 calc((100% - 30px) / 3)", // 三欄平均分配，考慮 gap
              maxWidth: "33%",
              minWidth: "180px",
              background: slot ? (slot.isCurrent 
                ? "linear-gradient(135deg, rgba(255, 215, 0, 0.3) 0%, rgba(255, 200, 0, 0.2) 100%)" 
                : "linear-gradient(135deg, rgba(139, 69, 19, 0.6) 0%, rgba(101, 50, 14, 0.5) 100%)") 
                : "rgba(50, 50, 50, 0.5)",
              border: slot && slot.isCurrent ? "3px solid #FFD700" : "2px solid #8B4513",
              borderRadius: "10px",
              padding: "20px",
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
                      {warriorExists ? (
                        <img 
                          src="assets/characters/warrior.png" 
                          alt="戰士"
                          className="character-sprite pixel-art"
                          onError={(e) => {
                            e.target.style.display = "none";
                            const fallback = e.target.parentElement.querySelector(".emoji-fallback");
                            if (fallback) fallback.style.display = "inline-block";
                          }}
                        />
                      ) : (
                        <span 
                          className="emoji-fallback"
                          style={{ 
                            display: "inline-block",
                            fontSize: "3em",
                            filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.5))"
                          }}
                        >
                          ⚔️
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      {wizardExists ? (
                        <img 
                          src="assets/characters/wizard.png" 
                          alt="魔法師"
                          className="character-sprite pixel-art"
                          onError={(e) => {
                            e.target.style.display = "none";
                            const fallback = e.target.parentElement.querySelector(".emoji-fallback");
                            if (fallback) fallback.style.display = "inline-block";
                          }}
                        />
                      ) : (
                        <span 
                          className="emoji-fallback"
                          style={{ 
                            display: "inline-block",
                            fontSize: "3em",
                            filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.5))"
                          }}
                        >
                          🧙
                        </span>
                      )}
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
  const [worldState, setWorldState] = useState({ ...WorldState });
  const [showBattleScreen, setShowBattleScreen] = useState(false);
  const [showEncounterOptions, setShowEncounterOptions] = useState(null); // { repoRoot, lastCommitId }
  const [showVillageSim, setShowVillageSim] = useState(false);
  const [simRunning, setSimRunning] = useState(false);
  const [actionLog, setActionLog] = useState([]);
  const simIntervalRef = React.useRef(null);
  const [showInitConfirm, setShowInitConfirm] = useState(false);
  const [villageAutoRunning, setVillageAutoRunning] = useState(false);
  const [villageLog, setVillageLog] = useState([]);

  // 世界永動循環（只在有 commit 時啟動）
  useEffect(() => {
    // 使用 ref 儲存 interval，避免在 effect 內部互相遮蔽
    const startWorldLoopIfNeeded = () => {
      // 已存在則不重複啟動
      if (window._worldLoopRef && window._worldLoopRef.interval) return;

      if (world && world.exists && world.lastCommitId && worldState.inBattle) {
        // 啟動循環
        window._worldLoopRef = window._worldLoopRef || {};
        window._worldLoopRef.interval = setInterval(() => {
          try {
            worldTick();
            // 更新 React state 以觸發重新渲染
            setWorldState({ ...WorldState });
          } catch (e) {
            console.error("worldTick error:", e);
          }
        }, 100);
      }
    };

    const stopWorldLoop = () => {
      if (window._worldLoopRef && window._worldLoopRef.interval) {
        clearInterval(window._worldLoopRef.interval);
        window._worldLoopRef.interval = null;
      }
    };

    // 啟動或停止循環依據目前條件
    if (world && world.exists && world.lastCommitId && worldState.inBattle) {
      startWorldLoopIfNeeded();
    } else {
      stopWorldLoop();
      // 如果沒有 commit，不啟動戰鬥（同步 global）
      if (world && world.exists && !world.lastCommitId) {
        WorldState.inBattle = false;
        setWorldState({ ...WorldState });
      }
    }

    // 清理
    return () => {
      stopWorldLoop();
    };
  }, [world, world?.lastCommitId, worldState.inBattle]);

  // 檢查 commit 狀態 - 有讀到 commit 就啟動戰鬥
  useEffect(() => {
    if (world && world.exists && world.lastCommitId) {
      // 如果有 commit，立即啟動戰鬥（無論是否為新的 commit）
      // 初始化世界天數（如果還沒有）
      if (!WorldState.worldDays || WorldState.worldDays === 0) {
        WorldState.worldDays = 1;
      }
      
      // 立即啟動戰鬥
      WorldState.lastCommitHash = world.lastCommitId;
      WorldState.inBattle = true;
      WorldState.heroHP = WorldState.heroHP || (10 + WorldState.level * 2);
      WorldState.enemyHP = WorldState.enemyHP || (10 + WorldState.stage * 2);
      
      // 強制更新狀態 - 確保所有屬性都正確設置
      const newState = {
        ...WorldState,
        inBattle: true,
        worldDays: WorldState.worldDays || 1,
        heroHP: WorldState.heroHP || (10 + WorldState.level * 2),
        enemyHP: WorldState.enemyHP || (10 + WorldState.stage * 2),
        lastCommitHash: world.lastCommitId
      };
      setWorldState(newState);
      
      // 顯示戰鬥通知
      setMessage({ 
        type: "success", 
        text: `✅ 已讀取 commit 紀錄。\n\n⚔️ 勇者遭遇怪物，開始戰鬥！\n🌍 世界第 ${WorldState.worldDays || 1} 天` 
      });
      
      // 通知世界誕生
      if (window.DQ && window.DQ.worldBorn) {
        window.DQ.worldBorn(targetPath, world.lastCommitId);
      }
      
      // 確保戰鬥循環啟動和動態模式按鈕可見 - 多次更新確保 UI 刷新
      setTimeout(() => {
        setWorldState(prev => ({ 
          ...prev, 
          ...WorldState,
          inBattle: true,
          worldDays: WorldState.worldDays || 1
        }));
      }, 100);
      
      setTimeout(() => {
        setWorldState(prev => ({ 
          ...prev, 
          inBattle: true
        }));
      }, 300);
      
      // 再次強制更新，確保 UI 刷新
      setTimeout(() => {
        setWorldState(prev => ({ 
          ...prev, 
          inBattle: true,
          worldDays: WorldState.worldDays || 1,
          heroHP: WorldState.heroHP || (10 + WorldState.level * 2),
          enemyHP: WorldState.enemyHP || (10 + WorldState.stage * 2)
        }));
      }, 500);
    } else if (world && world.exists && !world.lastCommitId) {
      // 沒有 commit，不啟動戰鬥
      WorldState.inBattle = false;
      setWorldState({ ...WorldState, inBattle: false });
    }
  }, [world?.lastCommitId, world?.exists, targetPath]);

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

        // 開啟世界（建立或讀取 .world 檔案）
        if (window.DQ.openWorld) {
          const worldResult = await window.DQ.openWorld(path);
          if (worldResult.success && worldResult.world) {
            WorldState.worldDays = worldResult.world.days || 0;
            WorldState.worldName = worldResult.world.worldName || "";
            WorldState.creator = worldResult.world.creator || "";
            WorldState.soul = worldResult.world.soul || "";
            WorldState.bornAt = worldResult.world.bornAt || null;
            WorldState.lastCommitHash = worldResult.world.lastCommitHash || null;
            setWorldState({ ...WorldState });
          }
        }

        // 世界時間流逝
        if (window.DQ.tickWorld) {
          await window.DQ.tickWorld(path);
        }
      } catch (error) {
        console.error("無法取得目標路徑：", error);
        setMessage({ type: "error", text: "無法取得目標路徑：" + (error.message || String(error)) });
      }
      refresh();
    }
    init();

    // 監聽目標資料夾變更事件
    if (window.DQ && window.DQ.onTargetChanged) {
      window.DQ.onTargetChanged(async (newPath) => {
        setTargetPath(newPath);
        setWorld(null); // 重置狀態
        
        // 重置世界狀態
        WorldState.level = 1;
        WorldState.exp = 0;
        WorldState.gold = 0;
        WorldState.stage = 1;
        WorldState.inBattle = true;
        WorldState.enemyHP = 10;
        WorldState.heroHP = 10;
        WorldState.lastCommitHash = null;
        
        // 開啟新世界
        if (window.DQ.openWorld) {
          const worldResult = await window.DQ.openWorld(newPath);
          if (worldResult.success && worldResult.world) {
            WorldState.worldDays = worldResult.world.days || 0;
            WorldState.worldName = worldResult.world.worldName || "";
            WorldState.creator = worldResult.world.creator || "";
            WorldState.soul = worldResult.world.soul || "";
            WorldState.bornAt = worldResult.world.bornAt || null;
            WorldState.lastCommitHash = worldResult.world.lastCommitHash || null;
            setWorldState({ ...WorldState });
          }
        }
        
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
        
        // 如果有 commit，立即啟動戰鬥
        if (worldData.exists && worldData.lastCommitId) {
          // 初始化世界天數（如果還沒有）
          if (!WorldState.worldDays || WorldState.worldDays === 0) {
            WorldState.worldDays = 1;
          }
          
          // 立即啟動戰鬥（無論是否為新的 commit）
          WorldState.inBattle = true;
          WorldState.lastCommitHash = worldData.lastCommitId;
          WorldState.heroHP = WorldState.heroHP || (10 + WorldState.level * 2);
          WorldState.enemyHP = WorldState.enemyHP || (10 + WorldState.stage * 2);
          
          // 強制更新狀態 - 確保所有屬性都正確設置
          const newState = {
            ...WorldState,
            inBattle: true,
            worldDays: WorldState.worldDays || 1,
            heroHP: WorldState.heroHP || (10 + WorldState.level * 2),
            enemyHP: WorldState.enemyHP || (10 + WorldState.stage * 2),
            lastCommitHash: worldData.lastCommitId
          };
          setWorldState(newState);
          
          // 顯示戰鬥通知（包含世界天數）
          setMessage({ 
            type: "success", 
            text: `✅ 已讀取 commit 紀錄。\n\n⚔️ 勇者遭遇怪物，開始戰鬥！\n🌍 世界第 ${WorldState.worldDays || 1} 天` 
          });
          
          // 通知世界誕生
          if (window.DQ && window.DQ.worldBorn) {
            const path = await window.DQ.getTarget();
            window.DQ.worldBorn(worldData.repoRoot || path, worldData.lastCommitId);
          }
          
          // 確保戰鬥循環啟動和動態模式按鈕可見 - 多次更新確保 UI 刷新
          setTimeout(() => {
            setWorldState(prev => ({ 
              ...prev, 
              ...WorldState,
              inBattle: true,
              worldDays: WorldState.worldDays || 1
            }));
          }, 100);
          
          setTimeout(() => {
            setWorldState(prev => ({ 
              ...prev, 
              inBattle: true
            }));
          }, 300);
        } else if (worldData.exists && !worldData.lastCommitId) {
          // 沒有 commit，不啟動戰鬥
          WorldState.inBattle = false;
          setWorldState({ ...WorldState });
        }
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
    // 顯示自訂確認對話
    setShowInitConfirm(true);
  }

  async function doInitWorldConfirmed() {
    setShowInitConfirm(false);
    setLoading(true);
    setMessage(null);
    try {
      const result = await window.DQ.initWorld();
      if (result.success) {
        // 世界誕生：開啟世界檔案
        if (window.DQ && window.DQ.openWorld) {
          const path = await window.DQ.getTarget();
          await window.DQ.openWorld(path);
        }
        
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
      
      // 寫入世界靈魂（創世神名字和 email）
      if (window.DQ && window.DQ.writeSoul) {
        const path = await window.DQ.getTarget();
        const soulResult = await window.DQ.writeSoul(path, name.trim(), email.trim());
        if (soulResult.success && soulResult.world) {
          WorldState.creator = soulResult.world.creator || "";
          WorldState.soul = soulResult.world.soul || "";
          setWorldState({ ...WorldState });
        }
      }
      
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
        
        // 重要：完全重置狀態，清除所有舊資料
        setWorld(null);
        setName("");
        setEmail("");
        setShowForm(false);
        setShowBattleScreen(false);
        
        // 等待一小段時間確保狀態清除
        await new Promise(resolve => setTimeout(resolve, 100));

        // 明確設定目標路徑給主進程（加強保險）
        if (window.DQ && typeof window.DQ.setTarget === "function") {
          await window.DQ.setTarget(result.path);
          // 等待主進程更新 targetCwd
          await new Promise(resolve => setTimeout(resolve, 150));
        }

        // 強制重新載入
        const worldData = await window.DQ.scanWorld();
        
        // 如果第一層沒有找到倉庫，自動搜尋其他層
        if (!worldData || !worldData.exists) {
          setMessage({ 
            type: "info", 
            text: "🔍 當前資料夾沒有 Git 倉庫，正在自動搜尋其他異世界（子目錄）..." 
          });
          
          // 等待一下讓用戶看到訊息
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // 重新掃描（scanWorld 會自動向上查找）
          const retryData = await window.DQ.scanWorld();
          if (retryData && retryData.exists) {
            setWorld(retryData);
            
            // 如果有 commit，立即啟動戰鬥
            if (retryData.lastCommitId) {
              // 初始化世界天數（如果還沒有）
              if (!WorldState.worldDays || WorldState.worldDays === 0) {
                WorldState.worldDays = 1;
              }
              
              // 立即啟動戰鬥
              WorldState.inBattle = true;
              WorldState.lastCommitHash = retryData.lastCommitId;
              WorldState.heroHP = WorldState.heroHP || (10 + WorldState.level * 2);
              WorldState.enemyHP = WorldState.enemyHP || (10 + WorldState.stage * 2);
              
              // 強制更新狀態 - 確保所有屬性都正確設置
              const newState = {
                ...WorldState,
                inBattle: true,
                worldDays: WorldState.worldDays || 1,
                heroHP: WorldState.heroHP || (10 + WorldState.level * 2),
                enemyHP: WorldState.enemyHP || (10 + WorldState.stage * 2),
                lastCommitHash: retryData.lastCommitId
              };
              setWorldState(newState);
              
              // 顯示戰鬥通知，並彈出選擇（村莊或出征）
              setMessage({ 
                type: "success", 
                text: `✅ 找到 Git 倉庫！已讀取 commit 紀錄。🌍 世界第 ${WorldState.worldDays} 天` 
              });
              setShowEncounterOptions({
                repoRoot: retryData.repoRoot || result.path,
                lastCommitId: retryData.lastCommitId
              });
              
              // 通知世界誕生
              if (window.DQ && window.DQ.worldBorn) {
                window.DQ.worldBorn(retryData.repoRoot || result.path, retryData.lastCommitId);
              }
              
              // 確保動態模式按鈕可見和狀態更新 - 多次更新確保 UI 刷新
              setTimeout(() => {
                setWorldState(prev => ({ 
                  ...prev, 
                  ...WorldState,
                  inBattle: true,
                  worldDays: WorldState.worldDays || 1
                }));
              }, 100);
              
              setTimeout(() => {
                setWorldState(prev => ({ 
                  ...prev, 
                  inBattle: true
                }));
              }, 300);
              
              // (已改為手動點擊「動態模式」開戰) - 不自動開啟戰鬥畫面
            } else {
              setMessage({ 
                type: "info", 
                text: "✅ 找到 Git 倉庫，但還沒有任何 commit 紀錄。" 
              });
              WorldState.inBattle = false;
              setWorldState({ ...WorldState });
            }
          } else {
            // 沒有找到倉庫，確保顯示初始畫面
            setWorld({ exists: false });
            setMessage({ 
              type: "info", 
              text: "未找到 Git 倉庫。請選擇包含 Git 倉庫的資料夾，或建立新的村莊（git init）。" 
            });
          }
        } else {
          setWorld(worldData);
          
          // 如果有 commit，立即啟動戰鬥並顯示通知
          if (worldData.lastCommitId) {
            // 初始化世界天數（如果還沒有）
            if (!WorldState.worldDays || WorldState.worldDays === 0) {
              WorldState.worldDays = 1;
            }
            
            // 立即啟動戰鬥
            WorldState.inBattle = true;
            WorldState.lastCommitHash = worldData.lastCommitId;
            WorldState.heroHP = WorldState.heroHP || (10 + WorldState.level * 2);
            WorldState.enemyHP = WorldState.enemyHP || (10 + WorldState.stage * 2);
            
            // 強制更新狀態 - 確保所有屬性都正確設置
            const newState = {
              ...WorldState,
              inBattle: true,
              worldDays: WorldState.worldDays || 1,
              heroHP: WorldState.heroHP || (10 + WorldState.level * 2),
              enemyHP: WorldState.enemyHP || (10 + WorldState.stage * 2),
              lastCommitHash: worldData.lastCommitId
            };
            setWorldState(newState);
            
            // 顯示戰鬥通知（包含世界天數），並顯示選項
            setMessage({ 
              type: "success", 
              text: `✅ 已讀取 commit 紀錄。🌍 世界第 ${WorldState.worldDays} 天` 
            });
            setShowEncounterOptions({
              repoRoot: worldData.repoRoot || result.path,
              lastCommitId: worldData.lastCommitId
            });
            
            // 通知世界誕生
            if (window.DQ && window.DQ.worldBorn) {
              window.DQ.worldBorn(worldData.repoRoot || result.path, worldData.lastCommitId);
            }
            
            // 確保動態模式按鈕可見和狀態更新 - 多次更新確保 UI 刷新
            setTimeout(() => {
              setWorldState(prev => ({ 
                ...prev, 
                ...WorldState,
                inBattle: true,
                worldDays: WorldState.worldDays || 1
              }));
            }, 100);
            
            setTimeout(() => {
              setWorldState(prev => ({ 
                ...prev, 
                inBattle: true
              }));
            }, 300);
            
            // (已改為手動點擊「動態模式」開戰) - 不自動開啟戰鬥畫面
          } else {
            // 沒有 commit，不啟動戰鬥
            WorldState.inBattle = false;
            setWorldState({ ...WorldState });
          }
        }
      } else {
        // 用戶取消選擇，確保顯示初始畫面
        if (!world || !world.exists) {
          setWorld({ exists: false });
        }
        // 顯示訊息並在 3 秒後自動消失
        setMessage({ type: "error", text: "未選擇資料夾" });
        setTimeout(() => {
          setMessage(null);
        }, 3000);
      }
    } catch (error) {
      console.error("選擇資料夾錯誤：", error);
      // 確保即使出錯也顯示初始畫面
      if (!world || !world.exists) {
        setWorld({ exists: false });
      }
      setMessage({ type: "error", text: "無法選擇資料夾：" + (error.message || String(error)) });
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } finally {
      setLoading(false);
    }
  }

  // Debug: 手動觸發找到 commit 並啟動戰鬥（測試用）
  async function triggerDebugBattle() {
    try {
      setMessage(null);
      const path = (window.DQ && window.DQ.getTarget) ? await window.DQ.getTarget() : targetPath;
      const fake = {
        exists: true,
        userName: world && world.userName ? world.userName : "DebugHero",
        userEmail: world && world.userEmail ? world.userEmail : "debug@example.com",
        branch: world && world.branch ? world.branch : "main",
        commitCount: world && world.commitCount ? world.commitCount : 1,
        lastCommit: "debug: 強制觸發戰鬥",
        lastCommitId: "debug0000000000000000000000000000000000",
        repoRoot: path,
        untrackedFiles: [],
        modifiedFiles: [],
        deletedFiles: []
      };

      // 設定 world 與 global WorldState，並更新 React state
      setWorld(fake);
      if (!WorldState.worldDays || WorldState.worldDays === 0) WorldState.worldDays = 1;
      WorldState.inBattle = true;
      WorldState.lastCommitHash = fake.lastCommitId;
      WorldState.heroHP = WorldState.heroHP || (10 + WorldState.level * 2);
      WorldState.enemyHP = WorldState.enemyHP || (10 + WorldState.stage * 2);
      setWorldState({ ...WorldState });

      setMessage({ type: "success", text: `🔧 Debug：已模擬找到 commit，將啟動戰鬥。\n🌍 世界第 ${WorldState.worldDays} 天` });

      // 確保世界循環與 UI 更新
      setTimeout(() => {
        setWorldState(prev => ({ ...prev, inBattle: true, worldDays: WorldState.worldDays || 1 }));
      }, 150);
      // 只顯示通知，保留手動開啟戰鬥（Debug 不自動開啟）
    } catch (error) {
      console.error("triggerDebugBattle error:", error);
      setMessage({ type: "error", text: "Debug 觸發失敗：" + (error.message || String(error)) });
    }
  }

  // 使用者手動開啟戰鬥畫面（有檢查）
  function handleOpenBattleScreen() {
    if (!world || !world.exists) {
      setMessage({ type: "error", text: "尚未選擇有效的冒險世界（沒有倉庫）" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    if (!world.userName) {
      setMessage({ type: "error", text: "請先設定冒險者身分（右側設定）" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    if (!world.lastCommitId) {
      setMessage({ type: "info", text: "此倉庫尚無 commit，無法進入動態戰鬥模式" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    // 條件都滿足，顯示戰鬥畫面
    setShowBattleScreen(true);
  }

  // 處理使用者在找到 commit 時的選擇（村莊日常或出征）
  function handleEncounterChoice(choice) {
    setShowEncounterOptions(null);
    if (choice === "village") {
      // 顯示村莊模擬器
      setShowVillageSim(true);
    } else if (choice === "expedition") {
      // 直接進入戰鬥（手動）
      handleOpenBattleScreen();
    }
  }

  // 村莊模擬器自動循環 effect
  useEffect(() => {
    if (simRunning && showVillageSim) {
      // 每 3 秒做一個隨機事件
      simIntervalRef.current = setInterval(() => {
        const actions = [
          { text: "打雜工作，獲得 5 金幣", fn: () => { WorldState.gold += 5; WorldState.exp += 2; } },
          { text: "幫忙村民，獲得 3 金幣", fn: () => { WorldState.gold += 3; WorldState.exp += 1; } },
          { text: "購買補給，花費 4 金幣", fn: () => { WorldState.gold = Math.max(0, WorldState.gold - 4); } },
          { text: "接完成小任務，獲得 8 金幣", fn: () => { WorldState.gold += 8; WorldState.exp += 3; } }
        ];
        const act = actions[Math.floor(Math.random() * actions.length)];
        act.fn();
        const time = new Date().toLocaleTimeString();
        setActionLog(prev => [...prev, `${time} - ${act.text}`].slice(-200));
        setWorldState({ ...WorldState });
      }, 3000);
    } else {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
    }

    return () => {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
    };
  }, [simRunning, showVillageSim]);

  // 初始化確認對話的 UI（git init 白話說明）
  // 放在 App return 的最上層區塊附近

  // worldState 更新回調，傳給 BattleScreen 使用
  function handleWorldStateUpdate(patch) {
    Object.assign(WorldState, patch);
    setWorldState({ ...WorldState });
  }

  // 村莊模擬器：自動循環處理
  useEffect(() => {
    let interval = null;
    if (showVillageSim && villageAutoRunning) {
      interval = setInterval(() => {
        // 隨機選一個行動
        const acts = ["work", "buy", "rest"];
        const act = acts[Math.floor(Math.random() * acts.length)];
        let entry = "";
        if (act === "work") {
          WorldState.gold = (WorldState.gold || 0) + 5;
          entry = `打雜工作 +5 金幣（總 ${WorldState.gold}）`;
        } else if (act === "buy") {
          WorldState.gold = Math.max(0, (WorldState.gold || 0) - 3);
          entry = `購買補給 -3 金幣（總 ${WorldState.gold}）`;
        } else {
          WorldState.exp = (WorldState.exp || 0) + 2;
          entry = `休息恢復，獲得 EXP +2（總 ${WorldState.exp}）`;
        }
        setWorldState({ ...WorldState });
        setVillageLog(l => [`${new Date().toLocaleTimeString()} - ${entry}`, ...l].slice(0, 50));
      }, 2500); // 每 2.5s 一次
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showVillageSim, villageAutoRunning]);

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
              {/* Debug 測試按鈕（顯示為小型紅色按鈕） */}
              <button
                onClick={triggerDebugBattle}
                style={{
                  padding: "6px 8px",
                  fontSize: "0.75em",
                  margin: "0",
                  background: "#8b0000",
                  border: "2px solid #ff6347",
                  color: "#fff",
                  fontFamily: "'Courier New', monospace",
                  borderRadius: "3px",
                  cursor: "pointer"
                }}
                title="Debug：手動模擬找到 commit 並啟動戰鬥"
              >
                Debug 戰鬥
              </button>
            </div>
          </div>
        </PixelBox>
        
        {/* 世界狀態顯示 - 有 commit 時顯示完整數據 */}
        {world && world.exists && world.lastCommitId && worldState.inBattle && (
          <PixelBox type="info" style={{ marginTop: "10px", padding: "10px 15px" }}>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-around", 
              alignItems: "center",
              flexWrap: "wrap",
              gap: "15px",
              fontFamily: "'Courier New', monospace",
              fontSize: "0.85em"
            }}>
              <div style={{ color: "#ffd700" }}>
                ⚔️ LV {worldState.level} | EXP {worldState.exp}/20
              </div>
              <div style={{ color: "#ffd700" }}>
                💰 {worldState.gold} 金幣
              </div>
              <div style={{ color: "#ffd700" }}>
                📖 第 {worldState.stage} 關
              </div>
              <div style={{ color: worldState.inBattle ? "#90ee90" : "#ff6347" }}>
                {worldState.inBattle ? "⚔️ 戰鬥中" : "✨ 新章節"}
              </div>
              <div style={{ color: "#9370DB" }}>
                ❤️ {Math.max(0, Math.ceil(worldState.heroHP))}/{10 + worldState.level * 2} HP
              </div>
              <div style={{ color: "#ff6347" }}>
                👹 {Math.max(0, Math.ceil(worldState.enemyHP))} HP
              </div>
              {/* 顯示世界天數 */}
              <div style={{ color: "#87ceeb" }}>
                🌍 世界第 {worldState.worldDays || 1} 天
              </div>
            </div>
          </PixelBox>
        )}
      </div>

      {/* 訊息框 - 放在右上角，稍微下移避免擋到按鈕或標題列
          若為「未找到 Git 倉庫」訊息，改在中間冒險之書的右側下方顯示（較自然） */}
      {message && !message.text?.includes("未找到 Git 倉庫") && !showBattleScreen && (
        <div style={{
          position: "absolute",
          top: "140px",
          right: "10px",
          zIndex: 1300,
          width: "auto",
          maxWidth: "420px",
          minWidth: "220px"
        }}>
          <PixelBox type={message.type === "success" ? "info" : message.type === "error" ? "warning" : "info"}>
            <div style={{ 
              whiteSpace: "pre-line",
              fontFamily: "'Courier New', monospace",
              fontSize: "0.8em",
              lineHeight: "1.4"
            }}>
              {message.text}
            </div>
          </PixelBox>
        </div>
      )}

      {/* 建立新村莊確認對話（說明 git init） */}
      {showInitConfirm && (
        <div style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 2500,
          width: "640px",
          maxWidth: "90%"
        }}>
          <PixelBox type="dialog" title="建立新村莊（Git 倉庫） - 確認">
            <div style={{ padding: "10px", fontFamily: "'Courier New', monospace", fontSize: "0.9em", lineHeight: 1.6 }}>
              <p><strong>你即將在此資料夾執行 <code>git init</code>，建立新的 Git 倉庫。</strong></p>
              <p>簡單說明：</p>
              <ul>
                <li><strong>git init</strong>：在目前資料夾建立一個全新的 Git 倉庫（會產生 <code>.git/</code> 資料夾），之後你可以用 <code>git add</code>、<code>git commit</code> 來記錄版本。</li>
                <li>如果資料夾是空的，這會建立一個 <em>乾淨的新倉庫</em>，不會把別人的 commit 帶進來。</li>
                <li>如果這個資料夾已經是另一個倉庫（已存在 <code>.git</code> 或已 clone 來的專案），在不確定情況下執行 <code>git init</code> 可能造成版本結構混亂或巢狀倉庫，請小心。</li>
              </ul>
              <p>是否確定要在 <code>{targetPath || "當前資料夾"}</code> 建立新的村莊（執行 <code>git init</code>）？</p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button onClick={() => setShowInitConfirm(false)} style={{ padding: "8px 12px", cursor: "pointer" }}>取消</button>
                <button onClick={() => doInitWorldConfirmed()} style={{ padding: "8px 12px", cursor: "pointer", background: "#4a90e2", color: "#fff", border: "none" }}>確定建立村莊</button>
              </div>
            </div>
          </PixelBox>
        </div>
      )}

      {!world.exists && (
        <PixelScene bg="dungeon">
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
          
          {/* 魔法師 - 在對話框左側（往左移，不卡到畫面） */}
          <PixelSprite 
            id="hero" 
            facing="right" 
            animated={true}
            style={{
              left: "calc(50% - 420px)", // 往左移更多，避免卡到畫面
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

      {/* 移除非全螢幕的 BattleScreen 渲染，改以全螢幕覆蓋呈現 */}

      {/* 戰鬥畫面 - 全屏覆蓋 */}
      {showBattleScreen && world && world.exists && world.userName && world.lastCommitId && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          background: "rgba(0, 0, 0, 0.8)"
        }}>
          <BattleScreen 
            world={world} 
            worldState={worldState}
            onBattleEnd={() => setShowBattleScreen(false)}
          />
        </div>
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
          {/* 左側：當前村莊狀態 */}
          <div style={{
            position: "absolute",
            top: "120px",
            left: "20px",
            width: "260px",
            maxWidth: "260px",
            zIndex: 50
          }}>
            <PixelBox type="info" title="🏰 當前村莊狀態">
              <div style={{ marginTop: "20px", lineHeight: "1.5", fontFamily: "'Courier New', monospace", fontSize: "0.85em" }}>
                {world && (world.branch === "main" || world.branch === "master") ? (
                  <>
                    <p style={{ fontSize: "0.95em", color: "#FFD700", marginBottom: "6px" }}>
                      <strong>📍 主線劇情（{world.branch || "main"}）</strong>
                    </p>
                    <p style={{ color: "#FFF", marginBottom: "6px", fontSize: "0.8em" }}>
                      ⚔️ 主戰場（處理主要功能開發）
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: "0.95em", color: "#FFD700", marginBottom: "6px" }}>
                      <strong>📍 支線劇情（{world?.branch || "-" }）</strong>
                    </p>
                    <p style={{ color: "#FFF", marginBottom: "6px", fontSize: "0.8em" }}>
                      🧙 特殊任務（開發新功能）
                    </p>
                  </>
                )}
                <p style={{ marginTop: "6px", color: "#90EE90", fontSize: "0.8em", marginBottom: "8px" }}>
                  ✅ 村莊已建立，冒險者身分已確認
                </p>
                {/* 顯示 commit ID 前7碼 */}
                {world && world.lastCommitId && (
                  <p style={{ marginTop: "6px", color: "#87ceeb", fontSize: "0.8em" }}>
                    📝 ID: <code style={{ background: "rgba(0,0,0,0.3)", padding: "2px 5px" }}>{world.lastCommitId.substring(0, 7)}</code>
                  </p>
                )}
                {/* quick-action 按鈕群 */}
                <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <button
                    onClick={() => setShowForm(true)}
                    style={{
                      background: "linear-gradient(135deg, #4a90e2 0%, #2b6cb0 100%)",
                      border: "2px solid #2b6cb0",
                      color: "#fff",
                      padding: "8px 10px",
                      fontFamily: "'Courier New', monospace",
                      cursor: "pointer",
                      borderRadius: "4px",
                      fontSize: "0.85em"
                    }}
                  >
                    ✏️ 設定冒險者身分
                  </button>
                  <button
                    onClick={handleInitWorld}
                    style={{
                      background: "linear-gradient(135deg, #8b5cf6 0%, #5a31c6 100%)",
                      border: "2px solid #5a31c6",
                      color: "#fff",
                      padding: "8px 10px",
                      fontFamily: "'Courier New', monospace",
                      cursor: "pointer",
                      borderRadius: "4px",
                      fontSize: "0.85em"
                    }}
                  >
                    🏰 建立新村莊（git init）
                  </button>
                  <button
                    onClick={() => setShowVillageSim(true)}
                    style={{
                      background: "linear-gradient(135deg, #6bbf6b 0%, #3c8a3c 100%)",
                      border: "2px solid #3c8a3c",
                      color: "#fff",
                      padding: "8px 10px",
                      fontFamily: "'Courier New', monospace",
                      cursor: "pointer",
                      borderRadius: "4px",
                      fontSize: "0.85em"
                    }}
                  >
                    🏡 村莊日常
                  </button>
                </div>
              </div>
            </PixelBox>
          </div>

          {/* 右側：動態模式按鈕和主角數據欄 */}
          <div style={{
            position: "absolute",
            top: "290px",               // 下移動態模式按鈕，避免與彈窗或通知重疊
            right: "12px",
            width: "220px",
            maxWidth: "280px",
            zIndex: 80
          }}>
            {/* 動態模式按鈕 - 有 commit 時顯示 */}
            {world && world.exists && world.lastCommitId && worldState.inBattle && (
              <div style={{ marginBottom: "12px" }}>
                <button
                  onClick={() => handleOpenBattleScreen()}
                  style={{
                    fontSize: "0.85em",
                    padding: "8px 16px",
                    width: "100%",
                    background: "linear-gradient(135deg, #8b0000 0%, #dc143c 100%)",
                    border: "3px solid #ff6347",
                    color: "#fff",
                    fontFamily: "'Courier New', monospace",
                    cursor: "pointer",
                    borderRadius: "0",
                    imageRendering: "pixelated",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.5)",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.boxShadow = "0 6px 12px rgba(255,99,71,0.7)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.5)";
                  }}
                >
                  <span style={{ fontSize: "1em" }}>⚔️</span>
                  <span>動態模式</span>
                </button>
              </div>
            )}
            
            {/* 主角數據 - 移至左側，右側保留按鈕 */}
          </div>

          {/* 中間：存檔畫面 - 往上移 */}
          <div style={{
            position: "absolute",
            top: "110px",              // 上拉冒險之書框，讓下方輸入欄可見
            left: "50%",
            transform: "translateX(-50%)",
            width: "70%",              // 稍微縮小以給右側固定按鈕空間
            maxWidth: "900px",
            zIndex: 40
          }}>
            <SaveSlotScreen world={world} onSwitchBranch={refresh} onRefresh={refresh} />

            {/* 當為「未找到 Git 倉庫」訊息時，在此處右側下方顯示（貼齊冒險之書右側） */}
            {message && message.text && message.text.includes("未找到 Git 倉庫") && (
              <div style={{
                position: "absolute",
                top: "100%",          // 在冒險之書下方
                right: "0",
                transform: "translateY(12px)",
                zIndex: 50,
                minWidth: "260px"
              }}>
                <PixelBox type="warning">
                  <div style={{
                    whiteSpace: "pre-line",
                    fontFamily: "'Courier New', monospace",
                    fontSize: "0.85em",
                    lineHeight: 1.4
                  }}>
                    {message.text}
                  </div>
                </PixelBox>
              </div>
            )}
            {/* 村莊日常模擬器（自動循環 + 日誌） */}
            {showVillageSim && (
              <div style={{
                position: "absolute",
                top: "100%",
                left: "0",
                transform: "translateY(12px)",
                zIndex: 60,
                width: "320px",
                maxWidth: "40%"
              }}>
                <PixelBox type="dialog" title="🏘️ 村莊日常（模擬）">
                  <div style={{ padding: "8px", fontFamily: "'Courier New', monospace" }}>
                    <div style={{ display: "flex", gap: "10px", marginBottom: "12px", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <button onClick={() => { setSimRunning(s => !s); }} style={{ padding: "8px 12px", cursor: "pointer", background: "#6b8cff", color: "#fff", border: "2px solid #506ed1", borderRadius: "6px" }}>
                          {simRunning ? "停止自動" : "開始自動"}
                        </button>
                        <button onClick={() => { setActionLog([]); }} style={{ padding: "8px 12px", cursor: "pointer", background: "#ffb86b", color: "#2b2b2b", border: "2px solid #d9964a", borderRadius: "6px" }}>
                          清除日誌
                        </button>
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <button onClick={() => setShowVillageSim(false)} style={{ padding: "8px 12px", cursor: "pointer", background: "#c94b6e", color: "#fff", border: "2px solid #9a3950", borderRadius: "6px" }}>
                          關閉
                        </button>
                      </div>
                    </div>
                    <div style={{ maxHeight: "220px", overflowY: "auto", background: "linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.25))", padding: "8px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.03)" }}>
                      {actionLog.length === 0 ? (
                        <div style={{ color: "#999", padding: "8px" }}>日誌空白</div>
                      ) : (
                        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                          {actionLog.slice().reverse().map((entry, i) => {
                            const parts = entry.split(" - ");
                            const time = parts[0] || "";
                            const text = parts.slice(1).join(" - ") || parts[0];
                            return (
                              <li key={i} style={{ display: "flex", justifyContent: "space-between", gap: "8px", padding: "8px", borderBottom: "1px dashed rgba(255,255,255,0.03)" }}>
                                <div style={{ color: "#eee", fontSize: "0.92em" }}>{text}</div>
                                <div style={{ color: "#87ceeb", fontSize: "0.78em", whiteSpace: "nowrap", marginLeft: "8px" }}>{time}</div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                    <div style={{ marginTop: "10px", color: "#ffd66b", fontWeight: "bold" }}>金幣：{worldState.gold ?? 0}</div>
                  </div>
                </PixelBox>
              </div>
            )}
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

