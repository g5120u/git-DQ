@echo off
REM 設定 UTF-8 編碼以正確顯示繁體中文
chcp 65001 >nul 2>&1
cls
color 0B

echo.
echo ========================================
echo    Git-DQ 冒險世界引擎啟動
echo ========================================
echo.
echo [資訊] 當前工作目錄：%CD%
echo.
echo [說明] 此腳本會掃描當前資料夾的 Git 狀態
echo [說明] 如果要掃描其他資料夾，請使用：
echo        npm start -- --target "資料夾路徑"
echo.

REM 檢查 Node.js 是否安裝
where node >nul 2>&1
if errorlevel 1 (
    echo [錯誤] 找不到 Node.js，請先安裝 Node.js
    echo [說明] 下載地址：https://nodejs.org/
    pause
    exit /b 1
)

REM 檢查 npm 是否可用
where npm >nul 2>&1
if errorlevel 1 (
    echo [錯誤] 找不到 npm，請檢查 Node.js 安裝是否完整
    pause
    exit /b 1
)

echo [檢查] 正在檢查環境...
if not exist "node_modules" (
    echo [安裝] 正在安裝依賴套件...
    call npm install >nul 2>&1
    if errorlevel 1 (
        echo [錯誤] 安裝失敗，請檢查 Node.js 是否正確安裝
        echo [說明] 請確認已安裝 Node.js v18 或更高版本
        pause
        exit /b 1
    )
    echo [成功] 依賴套件安裝完成
    echo.
)

echo.
echo [啟動] 啟動冒險世界（掃描：%CD%）...
call npm start 2>nul
if errorlevel 1 (
    echo.
    echo [錯誤] 啟動失敗，請檢查錯誤訊息
    echo [說明] 請確認 Electron 已正確安裝
    pause
    exit /b 1
)
echo.
echo [完成] 冒險世界已關閉
pause
