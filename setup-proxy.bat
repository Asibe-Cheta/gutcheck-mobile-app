@echo off
echo Setting up proxy server for GutCheck...

REM Install proxy dependencies
echo Installing proxy dependencies...
npm install express cors http-proxy-middleware nodemon --save

REM Copy package.json for proxy
copy package-proxy.json proxy-package.json

REM Set environment variable (replace with your own API key)
REM For security, use a .env file or set it manually:
REM set EXPO_PUBLIC_ANTHROPIC_API_KEY=your-api-key-here
REM Production builds use EAS environment variables automatically

echo Proxy server setup complete!
echo.
echo To start the proxy server, run:
echo   node proxy-server.js
echo.
echo Then start your Expo app with:
echo   npx expo start --web
echo.
pause
