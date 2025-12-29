import { app, BrowserWindow, ipcMain, dialog, Menu } from "electron";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import { scanWorld, initWorld, setHero, setTargetCwd, getTargetCwd, switchBranch, getBranchInfo, getCommitHistory, checkoutCommit, openWorld, writeSoul, worldBorn, tickWorld, getWorldData } from "./dq-engine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 設定應用程式名稱（繁體中文）
app.setName("Git-DQ 冒險世界");

let mainWindow;

// 建立繁體中文選單
function createMenu() {
  const template = [
    {
      label: "檔案",
      submenu: [
        {
          label: "選擇冒險世界",
          accelerator: "CmdOrCtrl+O",
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ["openDirectory"],
              title: "選擇要掃描的資料夾"
            });
            if (!result.canceled && result.filePaths.length > 0) {
              const targetPath = result.filePaths[0];
              setTargetCwd(targetPath);
              mainWindow.webContents.send("world:targetChanged", targetPath);
            }
          }
        },
        { type: "separator" },
        {
          label: "離開",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: "編輯",
      submenu: [
        { label: "復原", accelerator: "CmdOrCtrl+Z", role: "undo" },
        { label: "重做", accelerator: "Shift+CmdOrCtrl+Z", role: "redo" },
        { type: "separator" },
        { label: "剪下", accelerator: "CmdOrCtrl+X", role: "cut" },
        { label: "複製", accelerator: "CmdOrCtrl+C", role: "copy" },
        { label: "貼上", accelerator: "CmdOrCtrl+V", role: "paste" }
      ]
    },
    {
      label: "檢視",
      submenu: [
        { label: "重新載入", accelerator: "CmdOrCtrl+R", role: "reload" },
        { label: "強制重新載入", accelerator: "CmdOrCtrl+Shift+R", role: "forceReload" },
        { label: "切換開發者工具", accelerator: "F12", role: "toggleDevTools" },
        { type: "separator" },
        { label: "實際大小", accelerator: "CmdOrCtrl+0", role: "resetZoom" },
        { label: "放大", accelerator: "CmdOrCtrl+=", role: "zoomIn" },
        { label: "縮小", accelerator: "CmdOrCtrl+-", role: "zoomOut" },
        { type: "separator" },
        { label: "切換全螢幕", accelerator: "F11", role: "togglefullscreen" }
      ]
    },
    {
      label: "視窗",
      submenu: [
        { label: "最小化", accelerator: "CmdOrCtrl+M", role: "minimize" },
        { label: "關閉", accelerator: "CmdOrCtrl+W", role: "close" }
      ]
    },
    {
      label: "說明",
      submenu: [
        {
          label: "關於 Git-DQ",
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "關於 Git-DQ",
              message: "Git-DQ 冒險世界",
              detail: "將 Git 操作遊戲化的冒險世界\n版本 0.1.0"
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  // 重要：每次啟動時都強制清除之前的目標目錄設定
  // 確保從 GitHub 下載的專案不會顯示別人的 Git 資料
  setTargetCwd(process.cwd());
  
  // 檢查命令列參數，如果有傳入資料夾路徑，設定為目標目錄
  const args = process.argv.slice(1);
  const targetPathIndex = args.findIndex(arg => arg === "--target" || arg === "-t");
  if (targetPathIndex !== -1 && args[targetPathIndex + 1]) {
    const targetPath = args[targetPathIndex + 1];
    // 確保路徑存在且是目錄
    try {
      const stats = fs.statSync(targetPath);
      if (stats.isDirectory()) {
        // 重要：設定目標目錄，scanWorld 會自動向上查找 Git 倉庫
        setTargetCwd(targetPath);
      } else {
        setTargetCwd(process.cwd());
      }
    } catch (error) {
      // 如果路徑不存在或無法存取，使用啟動時的工作目錄
      setTargetCwd(process.cwd());
    }
  } else {
    // 如果沒有指定，使用啟動時的工作目錄
    // scanWorld 會自動向上查找 Git 倉庫（如果當前目錄沒有）
    setTargetCwd(process.cwd());
  }
  
  // 重要：每次啟動時都重新掃描，不使用快取
  // 這樣可以確保從 GitHub 下載的專案不會顯示別人的 Git 資料

  mainWindow = new BrowserWindow({
    width: 960,
    height: 640,
    title: "Git-DQ 冒險世界",
    webPreferences: {
      preload: join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    },
    // icon: join(__dirname, "assets", "icon.png") // 可選：如果有圖示檔案可取消註解
  });

  // 處理視窗關閉事件
  // 建立繁體中文選單
  createMenu();

  // 載入本地 HTML 檔案（不使用開發伺服器）
  mainWindow.loadFile("index.html");

  // 處理視窗關閉事件
  mainWindow.on("close", (event) => {
    // 在 Windows 和 Linux 上，直接關閉並退出應用程式
    if (process.platform !== "darwin") {
      // 清除目標目錄設定，確保下次啟動時重新掃描
      setTargetCwd(process.cwd());
      mainWindow = null;
      app.quit();
    } else {
      // macOS 上，隱藏視窗而不是關閉
      event.preventDefault();
      mainWindow.hide();
    }
  });

  // 錯誤處理
  mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
    console.error("載入失敗：", errorCode, errorDescription);
  });

  // 開發模式下開啟開發者工具
  if (process.argv.includes("--dev")) {
    mainWindow.webContents.openDevTools();
  }

  // 記錄載入完成
  mainWindow.webContents.on("did-finish-load", () => {
    console.log("頁面載入完成，當前目標目錄：", getTargetCwd());
  });
}

// IPC 處理器
ipcMain.handle("world:setTarget", async (_, targetPath) => {
  // 強制重新設定目標目錄，清除任何快取
  if (targetPath && fs.existsSync(targetPath)) {
    setTargetCwd(targetPath);
    // 強制重新掃描
    return { success: true, cwd: getTargetCwd() };
  }
  return { success: false, message: "目標路徑不存在" };
});

ipcMain.handle("world:selectFolder", async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
      title: "選擇要掃描的資料夾（冒險世界）"
    });
    if (!result.canceled && result.filePaths.length > 0) {
      const targetPath = result.filePaths[0];
      console.log("選擇資料夾：", targetPath);
      
      // 重要：清除之前的設定，強制重新掃描
      // 確保不會顯示上一個人的 Git 資料
      setTargetCwd(targetPath);
      
      // 發送事件通知渲染進程，強制重新載入
      mainWindow.webContents.send("world:targetChanged", targetPath);
      
      return { success: true, path: targetPath };
    }
    return { success: false };
  } catch (error) {
    console.error("選擇資料夾錯誤：", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("world:getTarget", async () => {
  return getTargetCwd();
});

// 檢查檔案是否存在（供 renderer 安全呼叫，避免 404 in DevTools）
ipcMain.handle("file:exists", async (_, filePath) => {
  try {
    if (!filePath) return false;
    // 若為相對路徑，轉為專案根目錄相對路徑
    const resolved = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
    return fs.existsSync(resolved);
  } catch (error) {
    console.error("file:exists 錯誤：", error);
    return false;
  }
});

ipcMain.handle("world:scan", async () => {
  try {
    const result = scanWorld();
    console.log("掃描結果：", result);
    return result;
  } catch (error) {
    console.error("掃描世界狀態錯誤：", error);
    throw error;
  }
});

ipcMain.handle("world:init", async () => {
  return initWorld();
});

ipcMain.handle("hero:set", async (_, name, email) => {
  return setHero(name, email);
});

ipcMain.handle("branch:switch", async (_, branchName) => {
  return switchBranch(branchName);
});

ipcMain.handle("branch:info", async () => {
  return getBranchInfo();
});

ipcMain.handle("commit:history", async (_, limit) => {
  return getCommitHistory(limit || 10);
});

ipcMain.handle("commit:checkout", async (_, commitId) => {
  return checkoutCommit(commitId);
});

// 世界永動核心系統 IPC Handlers
ipcMain.handle("world:open", async (_, folderPath) => {
  return openWorld(folderPath || getTargetCwd());
});

ipcMain.handle("world:writeSoul", async (_, folderPath, name, email) => {
  return writeSoul(folderPath || getTargetCwd(), name, email);
});

ipcMain.handle("world:born", async (_, folderPath, commitHash) => {
  return worldBorn(folderPath || getTargetCwd(), commitHash);
});

ipcMain.handle("world:tick", async (_, folderPath) => {
  return tickWorld(folderPath || getTargetCwd());
});

ipcMain.handle("world:getData", async (_, folderPath) => {
  return getWorldData(folderPath || getTargetCwd());
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  // 所有視窗關閉時，完全退出應用程式
  // 在 Windows 和 Linux 上，應用程式會完全退出
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// 處理應用程式退出前的事件
app.on("before-quit", (event) => {
  // 確保完全退出，不保留任何進程
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.destroy();
  }
});

