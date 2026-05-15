# SmartAuto 项目看板

> 生成时间: 2026-05-15 21:04

## 看板结构（8列）

| 列 ID | 含义 | WIP限制 |
|-------|------|---------|
| backlog | 待办 | 无 |
| spec | 需求校验中 | 3 |
| planning | 规划文档中 | 3 |
| skeleton | 骨架搭建中 | 3 |
| sandbox | 沙箱验证中 | 3 |
| compliance | 合规测试中 | 3 |
| develop | 业务开发中 | 5 |
| done | 已完成 | 无 |

## 六步法流程

    Backlog -> Spec -> Planning -> Skeleton -> Sandbox -> Compliance -> Develop -> Done

## 当前统计

| 状态 | 数量 | 占比 |
|------|------|------|
| DONE 已完成 | 7 | 22.6% |
| develop 开发中 | 0 | 0% |
| backlog 待办 | 21 | 67.7% |
| **总计** | **31** | 100% |

## 操作命令

```bash
# 查看所有卡片
cat /var/www/smartauto/docs/board/board.json | python3 -m json.tool

# 查看待办卡片
cat /var/www/smartauto/docs/board/board.json | python3 -c "import json,sys; d=json.load(sys.stdin); [print(c['id'],c['title']) for c in d['cards'] if c['col']=='backlog']"

# 进度报告
cat /var/www/smartauto/docs/board/progress.md
```
