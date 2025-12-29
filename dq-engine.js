import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// 儲存目標工作目錄（預設為 Electron 啟動時的工作目錄）
let targetCwd = process.cwd();

/**
 * 設定目標工作目錄
 * @param {string} cwd - 目標資料夾路徑
 */
export function setTargetCwd(cwd) {
  if (cwd && fs.existsSync(cwd)) {
    targetCwd = cwd;
  }
}

/**
 * 取得當前目標工作目錄
 * @returns {string} 目標資料夾路徑
 */
export function getTargetCwd() {
  return targetCwd;
}

function run(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8", cwd: targetCwd }).trim();
  } catch (e) {
    return "";
  }
}

/**
 * 向上查找 Git 倉庫根目錄
 * @param {string} startPath - 起始路徑
 * @returns {string|null} Git 倉庫根目錄，如果找不到則返回 null
 */
function findGitRoot(startPath) {
  let currentPath = path.resolve(startPath);
  const root = path.parse(currentPath).root;
  
  while (currentPath !== root) {
    const gitPath = path.join(currentPath, ".git");
    if (fs.existsSync(gitPath)) {
      return currentPath;
    }
    currentPath = path.dirname(currentPath);
  }
  
  return null;
}

/**
 * 向下查找 Git 倉庫（搜尋子目錄）
 * @param {string} startPath - 起始路徑
 * @param {number} maxDepth - 最大搜尋深度（預設 3 層）
 * @returns {string|null} Git 倉庫根目錄，如果找不到則返回 null
 */
function findGitRootInSubdirs(startPath, maxDepth = 3) {
  if (maxDepth <= 0) {
    return null;
  }
  
  try {
    const items = fs.readdirSync(startPath, { withFileTypes: true });
    
    for (const item of items) {
      if (item.isDirectory()) {
        const itemPath = path.join(startPath, item.name);
        
        // 跳過 .git 和 node_modules 等目錄
        if (item.name === ".git" || item.name === "node_modules" || item.name.startsWith(".")) {
          continue;
        }
        
        // 檢查這個子目錄是否有 .git
        const gitPath = path.join(itemPath, ".git");
        if (fs.existsSync(gitPath)) {
          return itemPath;
        }
        
        // 遞迴搜尋子目錄
        const found = findGitRootInSubdirs(itemPath, maxDepth - 1);
        if (found) {
          return found;
        }
      }
    }
  } catch (error) {
    // 忽略讀取錯誤
  }
  
  return null;
}

/**
 * 掃描目標資料夾的 Git 狀態
 * @returns {Object} 世界狀態資訊
 */
export function scanWorld() {
  // 重要：每次都重新檢查，不使用快取
  // 確保從 GitHub 下載的專案不會顯示別人的 Git 資料
  
  // 如果目標目錄改變，強制重新掃描
  const currentCwd = getTargetCwd();
  if (currentCwd !== targetCwd) {
    // 目錄已改變，重新設定
    targetCwd = currentCwd;
  }
  
  // 重要：先檢查當前目錄，如果沒有再向上查找，最後向下查找子目錄
  // 這樣可以支援 gitDQ 資料夾複製到其他專案的情況
  let actualCwd = targetCwd;
  const currentGitPath = path.join(targetCwd, ".git");
  
  if (!fs.existsSync(currentGitPath)) {
    // 當前目錄沒有 Git 倉庫，先向上查找
    let gitRoot = findGitRoot(targetCwd);
    
    // 如果向上找不到，向下查找子目錄
    if (!gitRoot) {
      gitRoot = findGitRootInSubdirs(targetCwd, 3);
    }
    
    if (gitRoot) {
      actualCwd = gitRoot;
      // 更新目標目錄為找到的 Git 倉庫根目錄
      targetCwd = gitRoot;
    }
  }
  
  const gitPath = path.join(actualCwd, ".git");
  const isRepo = fs.existsSync(gitPath);

  if (!isRepo) {
    return {
      exists: false,
      userName: "",
      userEmail: "",
      status: "",
      branch: "",
      remote: "",
      commitCount: 0,
      lastCommit: "",
      branches: [],
      tags: [],
      repoRoot: targetCwd,
      untracked: [],
      modified: [],
      deleted: []
    };
  }

  // 取得所有分支
  const allBranches = run("git branch -a");
  const branches = allBranches ? allBranches.split("\n").map(b => b.trim().replace(/^\*\s*/, "").replace(/^remotes\//, "")).filter(b => b) : [];

  // 取得標籤
  const allTags = run("git tag");
  const tags = allTags ? allTags.split("\n").filter(t => t.trim()) : [];

  // 取得提交數量
  const commitCount = run("git rev-list --count HEAD") || "0";

  // 取得最後一次提交資訊（包含 commit ID）
  const lastCommitFull = run("git log -1 --pretty=format:%H|%h|%s|%an|%ar") || "";
  let lastCommit = "無提交記錄";
  let lastCommitId = "";
  let lastCommitShort = "";
  
  if (lastCommitFull) {
    const parts = lastCommitFull.split("|");
    if (parts.length >= 5) {
      lastCommitId = parts[0]; // 完整 commit ID
      lastCommitShort = parts[1]; // 短 commit ID (7碼)
      lastCommit = `${parts[1]} - ${parts[2]} (${parts[3]}, ${parts[4]})`;
    }
  }

  // 解析 Git 狀態，分離不同類型的檔案
  const statusOutput = run("git status -sb");
  const untrackedFiles = [];
  const modifiedFiles = [];
  const deletedFiles = [];
  
  if (statusOutput) {
    const lines = statusOutput.split("\n");
    lines.forEach(line => {
      if (line.startsWith("??")) {
        untrackedFiles.push(line.substring(3).trim());
      } else if (line.startsWith(" M") || line.startsWith("M ")) {
        modifiedFiles.push(line.substring(3).trim());
      } else if (line.startsWith(" D") || line.startsWith("D ")) {
        deletedFiles.push(line.substring(3).trim());
      }
    });
  }

  // 使用實際的 Git 倉庫根目錄執行 Git 命令
  const originalCwd = targetCwd;
  const tempCwd = actualCwd;
  
  // 暫時切換到 Git 倉庫根目錄執行命令
  targetCwd = tempCwd;
  
  // 重要：只讀取該倉庫的本地配置，不讀取全局配置
  // 使用 --local 確保只讀取當前倉庫的配置
  const userName = run("git config --local user.name") || "";
  const userEmail = run("git config --local user.email") || "";
  const status = run("git status -sb");
  const branch = run("git branch --show-current") || "未建立分支";
  const remote = run("git remote get-url origin") || "";
  const repoRoot = run("git rev-parse --show-toplevel") || tempCwd;
  
  // 恢復原始目標目錄
  targetCwd = originalCwd;
  
  return {
    exists: true,
    userName: userName,
    userEmail: userEmail,
    status: status,
    branch: branch,
    remote: remote,
    commitCount: parseInt(commitCount) || 0,
    lastCommit: lastCommit,
    lastCommitId: lastCommitId,
    lastCommitShort: lastCommitShort,
    branches: branches,
    tags: tags,
    repoRoot: repoRoot,
    untrackedFiles: untrackedFiles,
    modifiedFiles: modifiedFiles,
    deletedFiles: deletedFiles
  };
}

/**
 * 初始化 Git 倉庫（建立新冒險世界）
 */
export function initWorld() {
  const gitPath = path.join(targetCwd, ".git");
  if (!fs.existsSync(gitPath)) {
    run("git init");
    return { success: true, message: "冒險世界已建立！" };
  }
  return { success: false, message: "冒險世界已存在" };
}

/**
 * 設定冒險者身分（Git 使用者資訊）
 * @param {string} name - 使用者名稱
 * @param {string} email - 使用者電子郵件
 */
export function setHero(name, email) {
  // 重要：只設定該倉庫的本地配置，不影響全局配置
  // 使用 --local 確保只設定當前倉庫的配置
  if (name && name.trim()) {
    run(`git config --local user.name "${name}"`);
  }
  if (email && email.trim()) {
    run(`git config --local user.email "${email}"`);
  }
  return { success: true, message: "冒險者身分已設定！" };
}

/**
 * 切換分支（進入不同的冒險路線）
 * @param {string} branchName - 分支名稱
 */
export function switchBranch(branchName) {
  if (!branchName || !branchName.trim()) {
    return { success: false, message: "分支名稱不能為空" };
  }
  
  try {
    // 檢查分支是否存在
    const branches = run("git branch -a");
    const branchList = branches ? branches.split("\n").map(b => b.trim().replace(/^\*\s*/, "").replace(/^remotes\/[^\/]+\//, "")) : [];
    const branchExists = branchList.some(b => b === branchName || b.endsWith("/" + branchName));
    
    if (!branchExists) {
      // 建立新分支
      run(`git checkout -b ${branchName}`);
      return { success: true, message: `已建立並切換到新路線：${branchName}` };
    } else {
      // 切換到現有分支
      run(`git checkout ${branchName}`);
      return { success: true, message: `已切換到路線：${branchName}` };
    }
  } catch (error) {
    return { success: false, message: `切換失敗：${error.message}` };
  }
}

/**
 * 取得分支詳細資訊（用於存檔畫面）
 */
export function getBranchInfo() {
  const currentBranch = run("git branch --show-current") || "";
  const allBranches = run("git branch");
  const branches = allBranches ? allBranches.split("\n").map(b => b.trim()).filter(b => b) : [];
  
  const branchDetails = branches.map(branch => {
    const isCurrent = branch.startsWith("*");
    const branchName = branch.replace(/^\*\s*/, "");
    const commitCount = run(`git rev-list --count ${branchName}`) || "0";
    const lastCommitFull = run(`git log -1 --pretty=format:%H|%h|%s ${branchName}`) || "";
    
    let lastCommit = "無提交記錄";
    let commitId = "";
    let commitShort = "";
    
    if (lastCommitFull) {
      const parts = lastCommitFull.split("|");
      if (parts.length >= 3) {
        commitId = parts[0];
        commitShort = parts[1];
        lastCommit = parts[2];
      }
    }
    
    return {
      name: branchName,
      isCurrent: isCurrent,
      commitCount: parseInt(commitCount) || 0,
      lastCommit: lastCommit,
      commitId: commitId,
      commitShort: commitShort
    };
  });
  
  return {
    currentBranch: currentBranch,
    branches: branchDetails
  };
}

/**
 * 取得提交歷史（用於退回紀錄）
 * @param {number} limit - 取得數量限制
 */
export function getCommitHistory(limit = 10) {
  try {
    const logOutput = run(`git log --pretty=format:%H|%h|%s|%an|%ar -n ${limit}`);
    if (!logOutput) {
      return [];
    }
    
    return logOutput.split("\n").map(line => {
      const parts = line.split("|");
      if (parts.length >= 5) {
        return {
          id: parts[0],
          shortId: parts[1],
          message: parts[2],
          author: parts[3],
          time: parts[4]
        };
      }
      return null;
    }).filter(c => c !== null);
  } catch (error) {
    return [];
  }
}

/**
 * 切換到指定 commit（退回紀錄）
 * @param {string} commitId - Commit ID（可以是完整或短ID）
 */
export function checkoutCommit(commitId) {
  if (!commitId || !commitId.trim()) {
    return { success: false, message: "Commit ID 不能為空" };
  }
  
  try {
    const id = commitId.trim();
    // 如果是分支名稱，使用 checkout branch
    if (id === "main" || id === "master") {
      run(`git checkout ${id}`);
      return { success: true, message: `已切換到主線：${id}` };
    }
    
    // 否則切換到指定 commit（會進入 detached HEAD 狀態）
    run(`git checkout ${id}`);
    return { success: true, message: `已切換到提交：${id.substring(0, 7)}` };
  } catch (error) {
    return { success: false, message: `切換失敗：${error.message || String(error)}` };
  }
}

// ============================================
// 世界永動核心系統 World Gate System
// ============================================

/**
 * 開啟世界（建立或讀取 .world 檔案）
 * @param {string} folderPath - 資料夾路徑
 * @returns {Object} 世界資料
 */
export function openWorld(folderPath) {
  if (!folderPath || !fs.existsSync(folderPath)) {
    return { success: false, message: "資料夾不存在" };
  }

  const worldFile = path.join(folderPath, ".world");

  // 如果 .world 檔案不存在，建立新世界
  if (!fs.existsSync(worldFile)) {
    const newborn = {
      bornAt: Date.now(),
      days: 0,
      creator: null,
      soul: null,
      worldName: path.basename(folderPath),
      lastWake: Date.now(),
      lastCommitHash: null
    };

    try {
      fs.writeFileSync(worldFile, JSON.stringify(newborn, null, 2), "utf8");
      return { success: true, world: newborn };
    } catch (error) {
      return { success: false, message: `建立世界失敗：${error.message}` };
    }
  }

  // 讀取現有世界
  try {
    const worldData = JSON.parse(fs.readFileSync(worldFile, "utf8"));
    return { success: true, world: worldData };
  } catch (error) {
    return { success: false, message: `讀取世界失敗：${error.message}` };
  }
}

/**
 * 寫入世界靈魂（創世神名字和 email）
 * @param {string} folderPath - 資料夾路徑
 * @param {string} name - 創世神名字
 * @param {string} email - 世界靈魂印記（email）
 */
export function writeSoul(folderPath, name, email) {
  if (!folderPath || !fs.existsSync(folderPath)) {
    return { success: false, message: "資料夾不存在" };
  }

  const worldFile = path.join(folderPath, ".world");
  
  try {
    let world = {};
    if (fs.existsSync(worldFile)) {
      world = JSON.parse(fs.readFileSync(worldFile, "utf8"));
    } else {
      world = {
        bornAt: Date.now(),
        days: 0,
        worldName: path.basename(folderPath),
        lastWake: Date.now(),
        lastCommitHash: null
      };
    }

    world.creator = name || null;
    world.soul = email || null;
    world.lastWake = Date.now();

    fs.writeFileSync(worldFile, JSON.stringify(world, null, 2), "utf8");
    return { success: true, world };
  } catch (error) {
    return { success: false, message: `寫入靈魂失敗：${error.message}` };
  }
}

/**
 * 世界誕生（第一次 commit）
 * @param {string} folderPath - 資料夾路徑
 * @param {string} commitHash - Commit hash
 */
export function worldBorn(folderPath, commitHash) {
  if (!folderPath || !fs.existsSync(folderPath)) {
    return { success: false, message: "資料夾不存在" };
  }

  const worldFile = path.join(folderPath, ".world");
  
  try {
    let world = {};
    if (fs.existsSync(worldFile)) {
      world = JSON.parse(fs.readFileSync(worldFile, "utf8"));
    } else {
      world = {
        bornAt: Date.now(),
        days: 0,
        worldName: path.basename(folderPath),
        lastWake: Date.now(),
        lastCommitHash: null
      };
    }

    // 如果是第一次 commit，世界誕生
    if (world.days === 0) {
      world.days = 1;
    } else {
      world.days++;
    }
    
    world.lastCommitHash = commitHash || null;
    world.lastWake = Date.now();

    fs.writeFileSync(worldFile, JSON.stringify(world, null, 2), "utf8");
    return { success: true, world };
  } catch (error) {
    return { success: false, message: `世界誕生失敗：${error.message}` };
  }
}

/**
 * 世界時間流逝（檢查是否需要增加天數）
 * @param {string} folderPath - 資料夾路徑
 * @returns {Object} 更新後的世界資料
 */
export function tickWorld(folderPath) {
  if (!folderPath || !fs.existsSync(folderPath)) {
    return { success: false, message: "資料夾不存在" };
  }

  const worldFile = path.join(folderPath, ".world");
  
  if (!fs.existsSync(worldFile)) {
    return { success: false, message: "世界檔案不存在" };
  }

  try {
    const world = JSON.parse(fs.readFileSync(worldFile, "utf8"));
    const delta = Date.now() - (world.lastWake || world.bornAt || Date.now());

    // 3 小時沒寫碼，世界老去一天
    if (delta > 1000 * 60 * 60 * 3) {
      world.days++;
      world.lastWake = Date.now();
      fs.writeFileSync(worldFile, JSON.stringify(world, null, 2), "utf8");
    }

    return { success: true, world };
  } catch (error) {
    return { success: false, message: `世界流逝失敗：${error.message}` };
  }
}

/**
 * 取得世界資料
 * @param {string} folderPath - 資料夾路徑
 * @returns {Object} 世界資料
 */
export function getWorldData(folderPath) {
  if (!folderPath || !fs.existsSync(folderPath)) {
    return { success: false, message: "資料夾不存在" };
  }

  const worldFile = path.join(folderPath, ".world");
  
  if (!fs.existsSync(worldFile)) {
    return { success: false, message: "世界檔案不存在" };
  }

  try {
    const world = JSON.parse(fs.readFileSync(worldFile, "utf8"));
    return { success: true, world };
  } catch (error) {
    return { success: false, message: `讀取世界失敗：${error.message}` };
  }
}

