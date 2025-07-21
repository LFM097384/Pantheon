@echo off
echo 安装依赖包...
npm install

echo 构建项目...
npm run build

echo 启动Pantheon...
npm run dev

pause
