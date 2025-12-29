const { contextBridge, ipcRenderer } = require("electron");

// 將 DQ API 暴露給渲染進程
contextBridge.exposeInMainWorld("DQ", {
  /**
   * 設定目標工作目錄
   * @param {string} targetPath - 目標資料夾路徑
   * @returns {Promise<Object>} 操作結果
   */
  setTarget: (targetPath) => ipcRenderer.invoke("world:setTarget", targetPath),

  /**
   * 取得當前目標工作目錄
   * @returns {Promise<string>} 目標資料夾路徑
   */
  getTarget: () => ipcRenderer.invoke("world:getTarget"),

  /**
   * 掃描當前 Git 世界狀態
   * @returns {Promise<Object>} 世界狀態資訊
   */
  scanWorld: () => ipcRenderer.invoke("world:scan"),

  /**
   * 初始化 Git 倉庫（建立新冒險世界）
   * @returns {Promise<Object>} 操作結果
   */
  initWorld: () => ipcRenderer.invoke("world:init"),

  /**
   * 設定冒險者身分（Git 使用者資訊）
   * @param {string} name - 使用者名稱
   * @param {string} email - 使用者電子郵件
   * @returns {Promise<Object>} 操作結果
   */
  setHero: (name, email) => ipcRenderer.invoke("hero:set", name, email),

  /**
   * 選擇資料夾對話框（進入其他冒險世界）
   * @returns {Promise<Object>} 操作結果，包含選中的路徑
   */
  selectFolder: () => ipcRenderer.invoke("world:selectFolder"),

  /**
   * 監聽目標資料夾變更事件
   * @param {Function} callback - 回調函數
   */
  onTargetChanged: (callback) => {
    ipcRenderer.on("world:targetChanged", (_, path) => callback(path));
  },

  /**
   * 切換分支（進入不同的冒險路線）
   * @param {string} branchName - 分支名稱
   * @returns {Promise<Object>} 操作結果
   */
  switchBranch: (branchName) => ipcRenderer.invoke("branch:switch", branchName),

  /**
   * 取得分支詳細資訊（用於存檔畫面）
   * @returns {Promise<Object>} 分支資訊
   */
  getBranchInfo: () => ipcRenderer.invoke("branch:info"),

  /**
   * 取得提交歷史（用於退回紀錄）
   * @param {number} limit - 取得數量限制
   * @returns {Promise<Array>} 提交歷史陣列
   */
  getCommitHistory: (limit) => ipcRenderer.invoke("commit:history", limit),

  /**
   * 切換到指定 commit（退回紀錄）
   * @param {string} commitId - Commit ID
   * @returns {Promise<Object>} 操作結果
   */
  checkoutCommit: (commitId) => ipcRenderer.invoke("commit:checkout", commitId),

  // ============================================
  // 世界永動核心系統 World Gate System
  // ============================================

  /**
   * 開啟世界（建立或讀取 .world 檔案）
   * @param {string} folderPath - 資料夾路徑（可選，預設為當前目標目錄）
   * @returns {Promise<Object>} 世界資料
   */
  openWorld: (folderPath) => ipcRenderer.invoke("world:open", folderPath),

  /**
   * 寫入世界靈魂（創世神名字和 email）
   * @param {string} folderPath - 資料夾路徑（可選）
   * @param {string} name - 創世神名字
   * @param {string} email - 世界靈魂印記（email）
   * @returns {Promise<Object>} 操作結果
   */
  writeSoul: (folderPath, name, email) => ipcRenderer.invoke("world:writeSoul", folderPath, name, email),

  /**
   * 世界誕生（第一次 commit）
   * @param {string} folderPath - 資料夾路徑（可選）
   * @param {string} commitHash - Commit hash
   * @returns {Promise<Object>} 操作結果
   */
  worldBorn: (folderPath, commitHash) => ipcRenderer.invoke("world:born", folderPath, commitHash),

  /**
   * 世界時間流逝（檢查是否需要增加天數）
   * @param {string} folderPath - 資料夾路徑（可選）
   * @returns {Promise<Object>} 更新後的世界資料
   */
  tickWorld: (folderPath) => ipcRenderer.invoke("world:tick", folderPath),

  /**
   * 取得世界資料
   * @param {string} folderPath - 資料夾路徑（可選）
   * @returns {Promise<Object>} 世界資料
   */
  getWorldData: (folderPath) => ipcRenderer.invoke("world:getData", folderPath)
  ,
  /**
   * 檢查檔案是否存在（避免在 renderer 直接載入造成 404 出現在 DevTools）
   * @param {string} filePath
   * @returns {Promise<boolean>}
   */
  fileExists: (filePath) => ipcRenderer.invoke("file:exists", filePath)
});

