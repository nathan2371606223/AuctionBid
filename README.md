# Auction Bid Module

拍卖出价模块 - 用于管理球员拍卖和出价系统。

## 结构

- `backend/`: Express API, PostgreSQL migrations, JWT auth, bid processing
- `frontend-editor/`: React 编辑端（密码保护，中文界面）
- `frontend-visitor/`: React 访客端（只读，可出价）
- `DEPLOYMENT_MANUAL.md`: 逐步部署指南

## 快速开始（开发）

1. 后端: `cd backend && npm install && npm run dev`
2. 编辑端: `cd frontend-editor && npm install && npm run dev`
3. 访客端: `cd frontend-visitor && npm install && npm run dev`

设置 `VITE_API_BASE` 环境变量指向后端 URL。默认密码：`admin`（与其他模块共享）。
