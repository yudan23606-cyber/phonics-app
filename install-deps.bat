@echo off
cd /d "C:\Users\qddyd\OneDrive\文档\education\phonics-app"
echo Installing phonics-app dependencies...
echo.
call npm install --legacy-peer-deps
echo.
echo Done! You can now run the project with:
echo   npm start
echo   or
echo   build-apk.bat
pause
