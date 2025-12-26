@echo off
REM 設定 UTF-8 編碼以正確顯示繁體中文
chcp 65001 >nul 2>&1
cls
color 0B

REM 儲存當前目錄
set CURRENT_DIR=%CD%

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

echo.
echo ========================================
echo    Git-DQ 冒險世界啟動器
echo ========================================
echo.
echo [資訊] 當前資料夾：%CURRENT_DIR%
echo.

REM 檢查 Git-DQ 是否在當前目錄
if exist "main.js" (
    echo [成功] 在當前資料夾找到 Git-DQ，直接啟動...
    if not exist "node_modules" (
        echo [安裝] 正在安裝依賴套件...
        call npm install >nul 2>&1
        if errorlevel 1 (
            echo [錯誤] 安裝失敗，請檢查 Node.js 是否正確安裝
            pause
            exit /b 1
        )
        echo [成功] 依賴套件安裝完成
    )
    echo.
    echo [啟動] 啟動冒險世界（掃描當前資料夾：%CURRENT_DIR%）...
    call npm start -- --target "%CURRENT_DIR%" 2>nul
    if errorlevel 1 (
        echo.
        echo [錯誤] 啟動失敗，請檢查錯誤訊息
        pause
        exit /b 1
    )
    pause
    exit /b 0
)

REM 檢查是否在 Git-DQ 安裝目錄
if exist "dq-engine.js" (
    echo [成功] 在 Git-DQ 安裝目錄，啟動並掃描當前工作目錄...
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
    )
    echo.
    echo [啟動] 啟動冒險世界（掃描：%CURRENT_DIR%）...
    call npm start -- --target "%CURRENT_DIR%" 2>nul
    if errorlevel 1 (
        echo.
        echo [錯誤] 啟動失敗，請檢查錯誤訊息
        echo [說明] 請確認 Electron 已正確安裝
        pause
        exit /b 1
    )
    pause
    exit /b 0
)

REM 向上尋找 Git-DQ 安裝目錄（最多向上 5 層）
set SEARCH_DIR=%CD%
set SEARCH_COUNT=0
:SEARCH_LOOP
set /a SEARCH_COUNT+=1
if %SEARCH_COUNT% gtr 5 goto :NOT_FOUND
if exist "%SEARCH_DIR%\dq-engine.js" (
    echo [成功] 找到 Git-DQ 安裝目錄：%SEARCH_DIR%
    cd /d "%SEARCH_DIR%"
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
    )
    echo.
    echo [啟動] 啟動冒險世界（掃描：%CURRENT_DIR%）...
    call npm start -- --target "%CURRENT_DIR%" 2>nul
    if errorlevel 1 (
        echo.
        echo [錯誤] 啟動失敗，請檢查錯誤訊息
        echo [說明] 請確認 Electron 已正確安裝
        pause
        exit /b 1
    )
    pause
    exit /b 0
)
set PARENT_DIR=%SEARCH_DIR%\..
if "%PARENT_DIR%"=="%SEARCH_DIR%" goto :NOT_FOUND
set SEARCH_DIR=%PARENT_DIR%
goto :SEARCH_LOOP

:NOT_FOUND
REM 如果都不在，提示用戶
echo.
echo ========================================
echo   錯誤：找不到 Git-DQ 安裝目錄！
echo ========================================
echo.
echo [說明] 使用方式：
echo       1. 將此腳本放到 Git-DQ 安裝目錄
echo       2. 或在任何資料夾中執行此腳本（需在上層目錄有 Git-DQ）
echo.
echo [資訊] 當前目錄：%CURRENT_DIR%
echo.
pause
exit /b 1
