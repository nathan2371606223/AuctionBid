# 拍卖出价模块部署手册（Windows 用户零基础版）

本手册覆盖从安装工具到部署上线的完整步骤。所有命令以 Windows PowerShell/CMD 形式展示。

## 0. 准备

### 前提条件
- 操作系统：Windows 10/11
- 已部署预算模块（LeagueBudget）到 Railway 和 GitHub Pages
- 必备账号：GitHub、Railway（与预算模块使用同一账号）

### 安装软件（如未安装）
- **Node.js LTS**：https://nodejs.org （安装后重启 PowerShell）
- **Git for Windows**：https://git-scm.com/download/win

### 验证安装
打开 PowerShell（右键开始菜单 → Windows PowerShell），运行：
```powershell
node --version
npm --version
git --version
```
如果显示版本号，说明安装成功。

## 1. 获取代码

### 1.1 创建本地目录
```powershell
# 选择保存目录，例如
cd E:\PyProj\Listenburg
mkdir AuctionBid
cd AuctionBid
```

### 1.2 初始化 Git 仓库（如果从零开始）
```powershell
git init
git branch -M main
```

### 1.3 创建 GitHub 仓库
1. 登录 GitHub
2. 点击右上角 "+" → "New repository"
3. 仓库名：`AuctionBid`（或您喜欢的名称）
4. 选择 Public 或 Private
5. **不要**勾选 "Initialize this repository with a README"
6. 点击 "Create repository"

### 1.4 连接本地仓库到 GitHub
```powershell
# 将 YOUR_USERNAME 和 YOUR_REPO_NAME 替换为您的实际值
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

## 2. 后端部署（Railway）

### 2.1 准备后端代码
确保 `backend/` 目录已包含所有文件（`package.json`、`src/` 等）。

### 2.2 在现有 Railway 项目中添加新服务

**重要**：AuctionBid 后端将作为新服务添加到**现有的 Railway 项目**（与预算模块同一项目），并共享数据库。

1. 登录 Railway：https://railway.app
2. 打开您部署预算模块的项目
3. 点击 "+ New" → "GitHub Repo"
4. 选择您的 AuctionBid GitHub 仓库
5. 在服务设置中：
   - **Root Directory**：设置为 `backend`
   - Railway 会自动检测 Node.js 并开始构建

### 2.3 配置环境变量

在 Railway 服务设置 → Variables 中添加：

1. **DATABASE_URL**：
   - 从预算模块的 PostgreSQL 服务复制
   - 在预算模块的 PostgreSQL 服务 → Variables 中找到 `DATABASE_PUBLIC_URL`
   - 复制完整连接字符串（格式：`postgresql://postgres:密码@主机:端口/数据库名`）
   - 粘贴到 AuctionBid 服务的 `DATABASE_URL` 变量

2. **JWT_SECRET**：
   - 建议与预算模块使用相同的值（以便共享令牌）
   - 或使用新的随机字符串

3. **CORS_ORIGINS**：
   - 设置为您的 GitHub Pages URL（逗号分隔）
   - 例如：`https://YOUR_USERNAME.github.io/AuctionBid/visitor/,https://YOUR_USERNAME.github.io/AuctionBid/editor/`
   - 注意：包含协议 `https://`，末尾有斜杠 `/`

4. **PGSSLMODE**（可选）：
   - Railway 默认即可，通常不需要设置

### 2.4 验证部署

1. 在 Railway 服务页面查看 "Deployments" 标签
2. 等待构建完成（绿色勾号）
3. 点击服务名称，查看 "Settings" → "Domains"
4. 复制生成的域名（例如：`https://auctionbid-production.up.railway.app`）
5. 在浏览器访问：`https://您的域名/health`
6. 应看到：`{"status":"ok"}`

### 2.5 本地调试（可选）

如果需要本地测试后端：

```powershell
cd backend
npm install
```

设置环境变量（PowerShell）：
```powershell
$env:DATABASE_URL="postgresql://postgres:密码@主机:端口/数据库名"
$env:JWT_SECRET="您的密钥"
$env:CORS_ORIGINS="http://localhost:5176,http://localhost:5177"
```

启动开发服务器：
```powershell
npm run dev
```

默认端口 3000，健康检查：http://localhost:3000/health

## 3. 前端部署（GitHub Pages）

前端有两个独立站点：访客端 `frontend-visitor`，编辑端 `frontend-editor`。

### 3.1 配置访客前端

```powershell
cd frontend-visitor
npm install
```

创建 `.env` 文件（在 `frontend-visitor/` 目录下）：
```
VITE_API_BASE=https://您的Railway后端域名/api
VITE_BASE_PATH=/AuctionBid/visitor/
```

**注意**：
- 将 `https://您的Railway后端域名` 替换为实际的后端 URL（不含末尾斜杠）
- `VITE_BASE_PATH` 根据您的 GitHub Pages 路径调整（如果仓库名是 `AuctionBid`，路径通常是 `/AuctionBid/visitor/`）

### 3.2 配置编辑前端

```powershell
cd ..\frontend-editor
npm install
```

创建 `.env` 文件（在 `frontend-editor/` 目录下）：
```
VITE_API_BASE=https://您的Railway后端域名/api
VITE_BASE_PATH=/AuctionBid/editor/
```

### 3.3 本地测试（可选）

访客前端：
```powershell
cd frontend-visitor
npm run dev
```
访问：http://localhost:5176

编辑前端：
```powershell
cd frontend-editor
npm run dev
```
访问：http://localhost:5177

### 3.4 使用 GitHub Actions 自动部署（推荐）

#### 3.4.1 更新 GitHub Actions 工作流

工作流文件已创建在 `.github/workflows/` 目录：
- `deploy-visitor.yml`：部署访客端
- `deploy-editor.yml`：部署编辑端

**需要修改**：编辑这两个文件，在 `npm run build` 步骤添加环境变量：

**deploy-visitor.yml**：
```yaml
- run: npm run build
  env:
    VITE_API_BASE: https://您的Railway后端域名/api
    VITE_BASE_PATH: /AuctionBid/visitor/
```

**deploy-editor.yml**：
```yaml
- run: npm run build
  env:
    VITE_API_BASE: https://您的Railway后端域名/api
    VITE_BASE_PATH: /AuctionBid/editor/
```

#### 3.4.2 提交并推送代码

```powershell
# 在项目根目录
git add .
git commit -m "Initial commit: AuctionBid module"
git push -u origin main
```

#### 3.4.3 配置 GitHub Pages

1. 在 GitHub 仓库页面，点击 "Settings"
2. 左侧菜单选择 "Pages"
3. Source 选择：`Deploy from a branch`
4. Branch 选择：`gh-pages`，文件夹选择：`/ (root)`
5. 点击 "Save"

#### 3.4.4 等待部署完成

1. 点击仓库顶部的 "Actions" 标签
2. 查看两个工作流（Deploy Visitor 和 Deploy Editor）的状态
3. 等待绿色勾号表示部署成功

#### 3.4.5 访问网站

部署完成后，访问：
- 访客端：`https://YOUR_USERNAME.github.io/AuctionBid/visitor/`
- 编辑端：`https://YOUR_USERNAME.github.io/AuctionBid/editor/`

### 3.5 手动部署（备选方案）

如果 GitHub Actions 不可用，可以手动部署：

```powershell
# 访客端
cd frontend-visitor
npm run build
npx gh-pages -d dist --dest visitor

# 编辑端
cd ..\frontend-editor
npm run build
npx gh-pages -d dist --dest editor
```

## 4. 配置与验证

### 4.1 验证访客端

1. 访问访客端 URL
2. **首次访问需要输入团队令牌**：
   - 系统会显示令牌输入界面
   - 输入对应球队的令牌（令牌由管理员在数据库中管理）
   - 令牌会保存在浏览器本地存储中，下次访问自动使用
   - 也可以通过 URL 参数传递：`?token=YOUR_TOKEN`
3. 应看到球员列表（如果已创建球员数据）
   - **分页显示**：每页显示50条记录
   - 可以在页面底部翻页查看更多球员
4. 测试出价功能：
   - 点击某个球员的"出价"按钮
   - 选择球队（使用下拉选择器，先选择级别再选择球队，**不支持手动输入**）
   - 输入出价（必须为非负整数）
   - 提交
   - 应看到成功或失败消息（如果失败，会显示具体原因）
   - **注意**：出价成功后，页面会自动更新显示最新出价信息，无需手动刷新

### 4.2 验证编辑端

1. 访问编辑端 URL
2. 使用默认密码 `admin` 登录（与预算模块共享密码）
3. 测试功能：
   - 创建新球员（手动输入所有字段）
   - 编辑球员信息
   - **批量导入球员**：使用制表符（Tab）分隔的格式，每行一个球员，包含11个字段
   - 查看出价历史（每个球员的完整出价历史）
   - 解锁买断锁定（手动解除买断状态，允许继续出价）
   - 删除球员（同时删除所有出价历史）
   - 导出 CSV（包含完整出价历史）
   - 查看令牌提醒（"令牌提醒"标签页）
   - 修改密码（会影响所有模块）

### 4.3 验证出价功能

1. 在编辑端创建一个测试球员（设置最低价格和最高价格）
2. 在访客端对该球员出价
3. 验证：
   - 出价低于最低价格应失败
   - 出价高于最高价格应失败
   - 出价低于当前最高出价应失败
   - 出价达到最高价格应触发买断锁定
   - 编辑端可以解锁买断锁定

## 5. 日常运维

### 5.1 更新代码

```powershell
# 拉取最新代码
git pull origin main

# 如果有新依赖，重新安装
cd backend
npm install
cd ..\frontend-visitor
npm install
cd ..\frontend-editor
npm install
```

推送后，GitHub Actions 会自动重新部署前端，Railway 会自动重新部署后端。

### 5.2 更改密码

1. 登录编辑端
2. 点击 "修改密码"
3. 输入原密码和新密码
4. **注意**：密码修改会影响**所有模块**（预算模块、转会市场模块和拍卖出价模块），因为它们共享同一个密码

### 5.3 查看日志

- **后端日志**：Railway 服务页面 → "Deployments" → 点击最新部署 → "View Logs"
- **前端部署日志**：GitHub 仓库 → "Actions" → 选择工作流运行

### 5.4 管理球员数据

在编辑端的球员管理页面：
- **创建球员**：单个创建或批量导入
- **编辑球员**：修改球员信息
- **批量导入**：
  - 格式：每行一个球员，字段用**制表符（Tab）**分隔，**不要使用逗号**
  - 字段顺序：球员名、转出球队、年龄、CA、PA、位置、次要位置、身高、体重、最低价格、最高价格
  - 如果球员已存在（按球员名匹配），则更新；否则创建新记录
  - 示例：`球员A[TAB]球队1[TAB]25[TAB]150[TAB]180[TAB]前锋[TAB]边锋[TAB]180cm[TAB]75kg[TAB]1000[TAB]5000`
- **删除球员**：删除球员及其所有出价历史
- **解锁买断**：解除买断锁定，允许继续出价
- **查看历史**：查看某个球员的完整出价历史
- **导出数据**：导出所有球员和完整出价历史为 CSV
- **分页显示**：每页显示50条记录（可在页面底部翻页）

### 5.5 管理团队令牌

**团队令牌系统**用于防止用户冒充他人提交请求。每个球队（`lb_teams` 表中的记录）都有一个唯一的令牌。

#### 5.5.1 查看令牌

令牌存储在 `lb_team_tokens` 表中。您可以通过直接访问数据库查看：
- `team_id`：球队 ID（关联 `lb_teams.id`）
- `token`：令牌字符串（随机生成，首次部署时自动创建）
- `active`：是否激活（通常为 `true`）

#### 5.5.2 重置令牌

如果需要重置某个球队的令牌（例如令牌泄露）：
1. 直接访问数据库
2. 更新 `lb_team_tokens` 表中对应 `team_id` 的 `token` 字段
3. 设置新的随机字符串作为令牌
4. 旧令牌将立即失效，用户需要重新输入新令牌

#### 5.5.3 查看令牌提醒

在编辑端的"令牌提醒"标签页：
- **查看未处理提醒**：显示所有令牌与提交数据不匹配的情况
- **标记已处理**：处理完提醒后标记为已处理
- **删除提醒**：删除不再需要的提醒记录

**注意**：系统不会阻止提交，但如果令牌对应的球队未出现在提交数据中，会生成提醒供管理员审查。

## 6. 故障排查（Windows 常见问题）

### 6.1 命令找不到

**问题**：运行 `node`、`npm` 或 `git` 时提示 "不是内部或外部命令"

**解决**：
1. 确认已安装 Node.js 和 Git
2. 重启 PowerShell（关闭后重新打开）
3. 检查 PATH 环境变量：
   ```powershell
   $env:PATH
   ```
   应包含 Node.js 和 Git 的路径

### 6.2 PowerShell 执行策略错误

**问题**：`npm : 无法加载文件...因为在此系统上禁止运行脚本`

**解决**（选择其一）：
- **方法 1**：更改执行策略（推荐）
  ```powershell
  Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
  ```
- **方法 2**：使用 CMD 代替 PowerShell
  - 按 Win+R，输入 `cmd`，回车
  - 在 CMD 中运行命令

### 6.3 端口占用

**问题**：本地开发时端口被占用

**解决**：
- 关闭占用端口的程序
- 或修改 `vite.config.js` 中的端口号

### 6.4 CORS 错误

**问题**：浏览器控制台显示 CORS 错误

**解决**：
1. 检查 Railway 后端的 `CORS_ORIGINS` 环境变量
2. 确保包含前端 URL（协议、域名、路径都要匹配）
3. 多个 URL 用逗号分隔，不要有空格

### 6.5 数据库连接失败

**问题**：后端日志显示数据库连接错误

**解决**：
1. 检查 Railway 后端的 `DATABASE_URL` 环境变量
2. 确认从预算模块的 PostgreSQL 服务复制了正确的连接字符串
3. 使用 `DATABASE_PUBLIC_URL`（不是 `DATABASE_URL`）

### 6.6 构建失败

**问题**：GitHub Actions 或本地构建失败

**解决**：
1. 检查 Node.js 版本：`node --version`（应为 18+）
2. 删除 `node_modules` 和 `package-lock.json`，重新安装：
   ```powershell
   Remove-Item -Recurse -Force node_modules
   Remove-Item package-lock.json
   npm install
   ```
3. 检查 `.env` 文件格式（不要有多余空格或引号）

### 6.7 页面 404 错误

**问题**：访问 GitHub Pages 显示 404

**解决**：
1. 确认 GitHub Pages 设置正确（Source: `gh-pages` 分支，`/ (root)` 文件夹）
2. 检查 `VITE_BASE_PATH` 是否与 GitHub Pages 路径匹配
3. 等待几分钟让 GitHub Pages 更新

### 6.8 登录失败

**问题**：编辑端无法登录

**解决**：
1. 确认使用正确的密码（默认 `admin`，或预算模块中设置的密码）
2. 检查后端日志是否有错误
3. 确认 `JWT_SECRET` 环境变量已设置

### 6.9 共享数据库冲突

**问题**：多个模块互相影响

**解决**：
- AuctionBid 使用 `ab_` 前缀的表，不会与其他模块冲突
- 密码存储在共享的 `lb_config` 表中，这是预期的行为
- 如果遇到表冲突，检查迁移脚本是否正确使用了 `ab_` 前缀

### 6.10 出价失败

**问题**：出价总是失败

**解决**：
1. 检查出价是否满足条件：
   - 不低于最低价格
   - 不低于当前最高出价（如果有）
   - 不超过最高价格
2. 检查球员是否已买断锁定
3. 查看后端日志了解具体错误原因

## 7. 重要参数汇总

### 7.1 默认值
- **默认密码**：`admin`（部署后请尽快修改）
- **密码共享**：所有模块共享同一密码

### 7.2 后端环境变量（Railway）
- `DATABASE_URL`：PostgreSQL 连接字符串（从预算模块的 PostgreSQL 服务复制）
- `JWT_SECRET`：JWT 密钥（建议与其他模块相同）
- `CORS_ORIGINS`：允许的 CORS 来源（逗号分隔，包含协议和路径）
- `PORT`：Railway 自动设置

### 7.3 前端环境变量（.env 文件或 GitHub Actions）
- `VITE_API_BASE`：后端 API 基础 URL（例如：`https://your-app.up.railway.app/api`）
- `VITE_BASE_PATH`：GitHub Pages 基础路径（例如：`/AuctionBid/visitor/` 或 `/AuctionBid/editor/`）

### 7.4 数据库表
- `ab_players`：球员表
- `ab_bid_history`：出价历史表
- `lb_config`：共享配置表（用于密码）
- `lb_team_tokens`：团队令牌表（每个球队一个令牌）
- `lb_token_alerts`：令牌提醒表（记录令牌与提交不匹配的情况）

## 8. 安全建议

1. **修改默认密码**：部署后立即修改默认密码 `admin`
2. **保护 JWT_SECRET**：使用强随机字符串，不要提交到代码仓库
3. **限制 CORS**：只允许您的前端域名访问后端 API
4. **定期备份**：定期导出数据作为备份
5. **管理团队令牌**：
   - 定期检查令牌提醒，确保没有异常提交
   - 如果令牌泄露，立即重置该球队的令牌
   - 令牌应仅分发给对应球队的授权用户

## 9. 获取帮助

如果遇到问题：
1. 检查本文档的"故障排查"部分
2. 查看 Railway 日志和 GitHub Actions 日志
3. 检查浏览器控制台错误信息
4. 确认所有环境变量设置正确

## 10. 下一步

部署完成后，您可以：
1. 测试所有功能（创建球员、出价、查看历史等）
2. 修改密码（记住会影响所有模块）
3. 开始使用系统管理球员拍卖
4. 导出数据进行分析

祝您使用愉快！
