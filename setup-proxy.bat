@echo off
echo Setting up proxy server for GutCheck...

REM Install proxy dependencies
echo Installing proxy dependencies...
npm install express cors http-proxy-middleware nodemon --save

REM Copy package.json for proxy
copy package-proxy.json proxy-package.json

REM Set environment variable
set EXPO_PUBLIC_ANTHROPIC_API_KEY=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

echo Proxy server setup complete!
echo.
echo To start the proxy server, run:
echo   node proxy-server.js
echo.
echo Then start your Expo app with:
echo   npx expo start --web
echo.
pause
