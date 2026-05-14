# SmartAuto CI/CD 部署流程规范

## 概述

SmartAuto（非标自动化设备公司全流程ERP）的代码部署遵循 Git 驱动流程，本地开发 → Git 仓库 → 自动构建 → 生产部署，全程无需手动 SSH。

---

## 两条部署链路

### 链路A：生产链路（备案通过后启用）

```
本地 push → Gitee → Webhook → 服务器自动构建 → 部署
```

- Gitee Webhook: `https://lg-auto.com/webhook/deploy`
- 触发条件: push 到 master 分支
- 部署延迟: 秒级
- 使用 Let's Encrypt 证书（lg-auto.com 有效域名）

### 链路B：临时链路（备案期间 / Webhook 故障时）

```
本地 push → Gitee → 服务器每5分钟 git pull → 构建 → 部署
```

- Cron: `*/5 * * * * /var/www/lugong/deploy-smartauto.sh`
- 部署延迟: ≤5分钟
- 备案解封后切回链路A

---

## 环境信息

| 项目 | 值 |
|------|-----|
| 源码仓库 | https://gitee.com/LGA_1_0/smartauto |
| 镜像仓库 | https://github.com/18820211920/smartauto |
| 服务器 | ubuntu@123.207.15.108 |
| 前端部署路径 | /var/www/lugong/system-dev/ |
| 源码工作目录 | /var/www/lugong/system-dev-src/ |
| Webhook 服务 | PM2 守护，端口 6000 |
| 构建日志 | /tmp/smartauto-deploy.log |
| Cron 日志 | /tmp/smartauto-cron.log |
| 部署脚本 | /var/www/lugong/deploy-smartauto.sh |
| Webhook 服务文件 | /var/www/lugong/webhook-server.js |
| Nginx 配置 | /etc/nginx/sites-enabled/zhqt.conf |
| 访问地址 | https://123.207.15.108/system-dev/ |

---

## 日常开发流程

### 1. 本地开发

```bash
cd /workspace/smartauto/docs/system-dev

# 开发修改...

# 构建验证（必须！）
npm run build

# 提交代码
git add .
git commit -m "feat/fix: 描述"

# 推送到 Gitee（自动触发部署）
git push gitee master

# 可选：同步 GitHub
git push github master
```

### 2. 等待部署

- Webhook 链路: 数秒内自动完成
- Cron 链路: 最迟5分钟内自动完成

### 3. 验证

```
https://123.207.15.108/system-dev/
```

---

## 服务器关键组件

### Webhook 服务

```bash
# 重启
pm2 restart webhook-smartauto

# 查看状态
pm2 list | grep webhook

# 查看日志
pm2 logs webhook-smartauto

# 查看部署日志
tail -f /tmp/smartauto-deploy.log
```

### 手动部署

```bash
# 在服务器上手动触发
/var/www/lugong/deploy-smartauto.sh

# 或手动 pull + build
cd /var/www/lugong/system-dev-src
git pull origin master
cd docs/system-dev && npm install && npm run build
cp -r dist/* /var/www/lugong/system-dev/
```

### 切换链路

```bash
# 备案通过后: 启用 Webhook（链路A）
# 1. Gitee Webhook URL 改为 https://lg-auto.com/webhook/deploy
# 2. 删除 cron
crontab -e  # 删除 */5 * * * * 那行

# 回退到 Cron（链路B）
(crontab -l 2>/dev/null; echo '*/5 * * * * /var/www/lugong/deploy-smartauto.sh >> /tmp/smartauto-cron.log 2>&1') | crontab -
```

---

## Nginx 配置

关键路由已配置在 `/etc/nginx/sites-enabled/zhqt.conf`：

- `/system-dev/` → alias `/var/www/lugong/system-dev/` (SPA)
- `/webhook/deploy` → 转发到 `127.0.0.1:6000/deploy` (Webhook接收器)

---

## Git Token 管理

当前 Gitee Token: `8cb48a2606dec5e3158eadfb0fac2dbb`

Token 失效时的处理：
1. Gitee → 右上角头像 → 设置 → 私人令牌 → 新建
2. 更新所有环境的 remote URL:

```bash
# 本地
cd /workspace/smartauto
git config remote.gitee.url "https://用户名:新token@gitee.com/LGA_1_0/smartauto.git"
git config remote.gitee.pushurl "https://用户名:新token@gitee.com/LGA_1_0/smartauto.git"

# 服务器
ssh ubuntu@123.207.15.108
cd /var/www/lugong/system-dev-src
git remote set-url origin "https://用户名:新token@gitee.com/LGA_1_0/smartauto.git"
```

---

## 故障排查

| 症状 | 检查命令 |
|------|---------|
| 部署未触发 | `pm2 list` + `tail /tmp/smartauto-deploy.log` |
| Webhook 返回 301 | Nginx `/webhook/deploy` 路由配置问题，检查 zhqt.conf |
| Webhook 返回 200 但未部署 | 检查 `deploy-smartauto.sh` 执行结果 |
| Gitee 测试失败 | 确认 SSL 证书有效，备案是否通过，lg-auto.com DNS 是否生效 |
| 服务器 git pull 失败 | Token 是否过期，`git remote -v` 确认 URL |
| 构建报错 | `cd /var/www/lugong/system-dev-src/docs/system-dev && npm run build` |

---

## 文件结构

```
/var/www/lugong/
├── system-dev/              # 生产前端目录（Nginx alias）
├── system-dev-src/         # Git 工作目录（npm run build）
│   └── docs/system-dev/    # 源码
├── deploy-smartauto.sh     # 部署脚本
├── webhook-server.js       # Webhook 接收器
└── zhqt.conf               # Nginx 配置

/etc/nginx/sites-enabled/
└── zhqt.conf               # 主 Nginx 配置
```

---

## 安全注意事项

- Git Token 仅存储在已加密的 git remote URL 中
- 服务器 `/etc/hosts` 已配置 `127.0.0.1 lg-auto.com` 解决自解析问题
- Webhook 仅监听 `POST /deploy`，其他路径返回 404
- 生产目录通过 Nginx alias 提供，源码不在 Web 根目录暴露
