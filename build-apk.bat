@echo off
chcp 65001 >nul
echo ========================================
echo   小树拼读 - 安卓 APK 一键构建
echo ========================================
echo.

cd /d "%~dp0"

:: 检查 Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js，请先安装: https://nodejs.org
    pause
    exit /b 1
)

echo [1/3] 安装依赖...
call npm install
if %errorlevel% neq 0 (
    echo [错误] npm install 失败
    pause
    exit /b 1
)

echo.
echo [2/3] 安装 EAS CLI...
call npm install --save-dev eas-cli
if %errorlevel% neq 0 (
    echo [警告] eas-cli 安装失败，尝试用 npx 直接运行
)

echo.
echo [3/3] 启动云端构建（preview APK）...
echo 大约需要 10-15 分钟，请耐心等待...
echo.

:: 优先使用全局 eas 命令，否则用 npx
where eas >nul 2>&1
if %errorlevel% equ 0 (
    call eas build --platform android --profile preview
) else (
    call npx eas-cli build --platform android --profile preview
)

echo.
echo ========================================
echo   构建提交完成！
echo   查看状态: https://expo.dev/accounts/[你的账号]/projects/phonics-app/builds
echo   构建完成后会生成 APK 下载链接
echo ========================================
echo.
pause
