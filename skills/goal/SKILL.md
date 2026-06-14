---
name: goal-mimo
version: 1.0.0
description: |
  自主写作目标控制。设置写作目标，通过 story-long-write-mimo 工作流自动循环写作直到达标。
  触发方式：/goal-mimo、「写到第X章」「完成第X卷」
---

# goal-mimo：自主写作目标控制

你是写作目标控制器。设置明确的写作目标，通过 story-long-write 工作流自动执行。

---

## 触发条件

| 用户说 | 动作 |
|--------|------|
| /goal 写到第X章 | 设置章节数目标 |
| /goal 完成第X卷 | 设置卷目标 |
| /goal 写X万字 | 设置字数目标 |
| 帮我写到第X章 | 同 /goal |

---

## 执行流程

### Step 1：解析目标

调用 `_shared/scripts/goal.js` 设置目标配置：

```bash
node skills/_shared/scripts/goal.js <项目目录> --target "写到第{N}章" --min-words 3000
```

配置保存到 `<项目目录>/.story-goal.json`

### Step 2：确认目标

向用户确认：
```
🎯 写作目标已设置
- 目标：写到第{N}章
- 当前：第{M}章
- 剩余：{N-M}章
- 每章最低字数：3000

开始写作？
```

### Step 3：进入循环

调用 `story-long-write` 的 Goal 模式执行写作：

```
每章循环：
1. 读取细纲_第{N}章.md
2. 加载追踪文件（伏笔、角色状态、物品、环境）
3. 准备层（状态筛选、模块召回、指令确认、性格锚点检查）
4. 写第{N}章正文
5. 运行 quality-gate.js 检查
6. 更新所有追踪文件
7. 写入 MEMORY.md
8. 检查是否达标 → 未达标则继续下一章
```

### Step 4：监控进度

每章完成后输出：
```
📝 第{N}章「{章名}」完成
- 字数：{X}字
- 质量检查：{通过/警告}
- 当前进度：第{N}章/{目标}章
- 剩余：{X}章
```

### Step 5：完成输出

达标后输出完成报告：
```
🎉 目标达成！

- 目标：写到第{N}章
- 实际：完成{X}章
- 总字数：{Y}字
- 平均字数：{Z}字/章

运行 /dream 提取写作经验？
```

---

## 与其他skill的关系

| 关系 | 说明 |
|------|------|
| 调用 | `story-long-write`（执行写作工作流） |
| 辅助 | `_shared/scripts/goal.js`（目标配置） |
| 存储 | `MEMORY.md`（进度记忆） |
| 检查 | `quality-gate.js`（质量门禁） |

---

## 配置文件格式

`.story-goal.json`：
```json
{
  "target_description": "写到第30章",
  "target_chapter": 30,
  "min_words": 3000,
  "max_banned": 0,
  "current_chapter": 25,
  "chapters_written": 25,
  "completed": false
}
```

---

## 自动触发规则

| 时机 | 动作 |
|------|------|
| 写完一章 | 自动检查 .story-goal.json |
| 达到目标 | 自动停止，输出完成报告 |
| 未达标 | 自动继续下一章 |
