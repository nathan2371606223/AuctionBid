# Auction Bid Module

拍卖出价模块 - 用于管理球员拍卖和出价系统。

## 结构

- `backend/`: Express API, PostgreSQL migrations, JWT auth, bid processing
- `frontend-editor/`: React 编辑端（密码保护，中文界面）
- `frontend-visitor/`: React 访客端（只读，可出价）
- `DEPLOYMENT_MANUAL.md`: 逐步部署指南

## 功能特性

### 访客网站
- **团队令牌认证**：首次访问需要输入团队令牌，令牌保存在浏览器本地
- 查看球员列表（分页显示，每页50条）
- 出价功能：
  - 选择球队（下拉选择器，先选择级别再选择球队，不支持手动输入）
  - 输入出价（必须为非负整数）
  - 自动验证：不低于最低价格、不低于当前最高出价、不超过最高价格
  - 达到最高价格时自动触发买断锁定
  - 出价成功后自动更新页面显示
- 查看最新出价信息（每个球员显示当前最高出价和出价球队）

### 编辑网站
- 密码登录（与其他模块共享密码）
- 球员管理：
  - 创建球员（手动输入所有字段）
  - 编辑球员信息
  - **批量导入**：使用制表符（Tab）分隔，每行一个球员，11个字段
  - 删除球员（同时删除所有出价历史）
  - 分页显示（每页50条）
- 出价管理：
  - 查看每个球员的完整出价历史
  - 解锁买断锁定（手动解除买断状态，允许继续出价）
- 数据导出：
  - 导出所有球员和完整出价历史为 CSV
- **令牌提醒**：查看和管理令牌与提交不匹配的提醒

## 快速开始（开发）

1. 后端: `cd backend && npm install && npm run dev`
2. 编辑端: `cd frontend-editor && npm install && npm run dev`
3. 访客端: `cd frontend-visitor && npm install && npm run dev`

设置 `VITE_API_BASE` 环境变量指向后端 URL。默认密码：`admin`（与其他模块共享）。

## 数据库

使用 `ab_` 前缀的表以避免与其他模块冲突：
- `ab_players`: 球员表
- `ab_bid_history`: 出价历史表

共享表：
- `lb_config`: 共享配置表（用于密码认证）
- `lb_team_tokens`: 团队令牌表（每个球队一个令牌）
- `lb_token_alerts`: 令牌提醒表（记录令牌与提交不匹配的情况）
- `lb_teams`: 球队表（用于下拉选择）

## 部署

详细部署说明请参考 [DEPLOYMENT_MANUAL.md](DEPLOYMENT_MANUAL.md)。

### 后端部署（Railway）

1. 在现有 Railway 项目中添加新服务
2. 连接到 GitHub 仓库
3. 设置根目录为 `backend/`
4. 配置环境变量（共享数据库）

### 前端部署（GitHub Pages）

1. 推送到 GitHub 仓库
2. GitHub Actions 自动构建和部署
3. 配置 GitHub Pages 使用 `gh-pages` 分支

## 许可证

MIT
