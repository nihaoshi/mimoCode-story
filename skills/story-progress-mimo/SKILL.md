---
name: story-progress-mimo
version: 1.0.0
description: |
  进度管理。读取当前写作进度，批量生成未来5章细纲，整理跨卷追踪文件，更新上下文并输出报告。
  触发方式：/progress、/进度管理、/整理追踪
category: orchestrator
triggers:
  - /progress
  - 进度管理
  - 整理追踪
inputs:
  - name: project_dir
    type: directory
    required: true
    description: 写作项目根目录
  - name: chapters_ahead
    type: number
    required: false
    default: 5
    description: 预生成细纲章数（默认5）
---

# story-progress-mimo：进度管理

你是写作进度管理器。你的任务是：读取当前写作进度，批量生成未来章节细纲，整理跨卷追踪文件，更新上下文，输出完整进度报告。

---

## 核心设计

1. **主 agent + 子 agent 混合执行**：读写追踪文件由主 agent 完成，批量细纲生成和跨卷整理由子 agent 隔离执行
2. **防偷懒铁律**：每个步骤必须实际读取文件、写入产出、运行守卫脚本
3. **跨卷追踪整理**：自动检测伏笔逾期、角色弧线断裂、卷间过渡缺失

---

## 防偷懒铁律

```
读文件，写文件，跑脚本，给用户看
不凭记忆，不跳步骤，不偷懒
```

**每个步骤执行前后必须运行守卫脚本：**
```bash
node {skill_dir}/scripts/workflow-guard.js pre  <步骤号> {workflow_dir} {project_dir}
node {skill_dir}/scripts/workflow-guard.js post <步骤号> {workflow_dir}
```

---

## 任务树（5步）

```
T-PROGRESS: 进度管理
│
├── T-PROGRESS-01: 读取当前进度 [主 agent]
│   ├── 扫描正文目录，确定最新章节号
│   ├── 读取追踪/上下文.md
│   ├── 读取追踪/伏笔.md
│   ├── 读取追踪/角色状态.md
│   └── 输出：.workflow/progress-current.json
│
├── T-PROGRESS-02: 生成5章细纲 [子 agent 隔离]
│   ├── 读取大纲/卷纲.md（或 最新卷纲）
│   ├── 读取最新3章正文（取风格参考）
│   ├── 读取追踪文件作为上下文
│   ├── 逐章生成细纲（情节点≥8，含钩子+爽点）
│   └── 输出：大纲/细纲_第{N+1~N+5}章.md
│
├── T-PROGRESS-03: 整理跨卷追踪 [子 agent 隔离]
│   ├── 检测伏笔逾期（埋设章数>阈值未回收）
│   ├── 检测角色弧线断裂（多章未出场/未发展）
│   ├── 检测卷间过渡缺失（卷末无衔接钩子）
│   ├── 检测跨卷伏笔健康度
│   └── 输出：.workflow/progress-cross-volume.json
│
├── T-PROGRESS-04: 更新追踪文件 [主 agent]
│   ├── 更新追踪/上下文.md（进度摘要）
│   ├── 更新跨卷追踪/跨卷伏笔.md（如有逾期）
│   ├── 更新跨卷追踪/跨卷角色弧线.md（如有断裂）
│   └── 输出：更新后的追踪文件
│
└── T-PROGRESS-05: 输出报告 [主 agent]
    ├── 汇总进度信息
    ├── 汇总跨卷健康度
    ├── 汇总待办事项
    └── 输出：进度报告（直接展示给用户）
```

---

## 各步骤说明

### Step 01: 读取当前进度
- **执行者**: 主 agent
- **职责**: 扫描项目状态，收集所有进度信息
- **必读文件**:
  - `正文/` 目录 — 扫描所有章节文件，确定最新章节号和字数
  - `追踪/上下文.md` — 上次进度摘要
  - `追踪/伏笔.md` — 活跃伏笔列表
  - `追踪/角色状态.md` — 角色当前状态
  - `追踪/时间线.md` — 事件时序
  - `追踪/物品.md` — 物品位置
  - `追踪/环境.md` — 环境状态
- **输出**: `.workflow/progress-current.json`
- **输出格式**:
```json
{
  "latest_chapter": 42,
  "latest_chapter_name": "章名",
  "total_words": 156000,
  "current_volume": 2,
  "active_foreshadows": 5,
  "active_characters": 12,
  "tracking_health": {
    "foreshadow_overdue": 1,
    "character_inactive": 2,
    "volume_transition_missing": false
  }
}
```
- **防偷懒**: 必须实际扫描目录和读取文件，不能从上下文推断

### Step 02: 生成5章细纲
- **执行者**: 子 agent（隔离执行）
- **职责**: 基于卷纲和当前进度，批量生成未来5章细纲
- **输入**:
  - `大纲/卷纲.md` — 当前卷大纲
  - 最新3章正文 — 风格参考
  - `.workflow/progress-current.json` — 当前进度
  - `追踪/伏笔.md` — 待回收伏笔
  - `追踪/角色状态.md` — 角色状态
- **输出**: `大纲/细纲_第{N+1}章.md` ~ `大纲/细纲_第{N+5}章.md`
- **细纲要求**:
  - 每章情节点 ≥ 8
  - 必须包含章尾钩子
  - 必须包含至少1个爽点
  - 伏笔回收要安排在合理位置
  - 角色出场要符合弧线规划
- **防偷懒**: 必须用 Read 工具读取输入，必须用 Write 工具写入细纲文件

### Step 03: 整理跨卷追踪
- **执行者**: 子 agent（隔离执行）
- **职责**: 检测跨卷追踪中的健康问题
- **检测项**:
  1. **伏笔逾期** — 埋设章数超过阈值（默认50章）未回收的伏笔
  2. **角色弧线断裂** — 超过10章未出场的主要角色
  3. **卷间过渡缺失** — 当前卷末尾缺少衔接钩子
  4. **跨卷伏笔健康度** — 活跃跨卷伏笔数、应回收数、已过期数
- **输入**:
  - `追踪/伏笔.md` — 所有伏笔
  - `追踪/角色状态.md` — 角色状态
  - `跨卷追踪/跨卷伏笔.md` — 跨卷伏笔（如存在）
  - `跨卷追踪/跨卷角色弧线.md` — 角色弧线（如存在）
  - `.workflow/progress-current.json` — 当前进度
- **输出**: `.workflow/progress-cross-volume.json`
- **输出格式**:
```json
{
  "foreshadow_health": {
    "total_active": 5,
    "overdue": [
      { "id": "F03", "content": "...", "planted_at": 5, "expected_at": 30 }
    ],
    "upcoming_reclaim": [
      { "id": "F01", "content": "...", "expected_at": 45 }
    ]
  },
  "character_health": {
    "total_active": 12,
    "inactive": [
      { "name": "角色A", "last_appearance": 32, "chapters_absent": 10 }
    ]
  },
  "volume_transition": {
    "current_volume": 2,
    "chapters_in_volume": 42,
    "has_transition_hook": true
  },
  "issues": [
    { "type": "foreshadow_overdue", "severity": "WARN", "detail": "..." }
  ]
}
```
- **防偷懒**: 必须实际读取所有追踪文件，必须逐项检测

### Step 04: 更新追踪文件
- **执行者**: 主 agent
- **职责**: 根据检测结果更新追踪文件
- **更新内容**:
  - `追踪/上下文.md` — 更新进度摘要（当前章节、下一章目标）
  - `跨卷追踪/跨卷伏笔.md` — 标记逾期伏笔、更新健康度（如存在逾期）
  - `跨卷追踪/跨卷角色弧线.md` — 标记断裂角色、建议出场安排（如存在断裂）
- **防偷懒**: 必须实际用 Edit 工具修改文件，不能只在报告中提及

### Step 05: 输出报告
- **执行者**: 主 agent
- **职责**: 汇总所有信息，生成用户可读的进度报告
- **报告内容**:
```
📊 写作进度报告
━━━━━━━━━━━━━━━━

📖 当前进度
- 最新章节：第{N}章「{章名}」
- 总字数：{X}万字
- 当前卷：第{M}卷

📝 已生成细纲
- 第{N+1}章 ~ 第{N+5}章（共5章）

🔍 跨卷健康度
- 活跃伏笔：{X}个
- 逾期伏笔：{X}个 ⚠️
- 沉默角色：{X}个 ⚠️
- 卷间过渡：{正常/缺失}

📋 待办事项
- [ ] 回收逾期伏笔：{伏笔描述}
- [ ] 安排沉默角色出场：{角色名}
- [ ] 补充卷间过渡钩子

⏭️ 下一步
- 建议从第{N+1}章开始写作
- 重点关注：{最关键的问题}
```
- **防偷懒**: 必须基于实际数据生成，不能编造

---

## 条件任务

| 任务 | 触发条件 | 跳过则 |
|------|---------|--------|
| 跨卷追踪目录创建 | `跨卷追踪/` 不存在 | 自动创建 |
| 跨卷伏笔更新 | step03 发现逾期伏笔 | abandoned |
| 跨卷角色弧线更新 | step03 发现沉默角色 | abandoned |

---

## Agent 间通信

所有中间结果存放在 `{PROJECT_DIR}/.workflow/` 目录：

```
.workflow/
├── progress-current.json          # Step 01: 当前进度
├── progress-cross-volume.json     # Step 03: 跨卷健康度
└── progress-report.json           # Step 05: 完整报告
```

子 agent 通过 `.workflow/` 目录读取输入、写入输出，主 agent 负责协调和最终展示。

---

## 守卫脚本调用

```bash
# 前置验证（检查输入文件是否存在）
node {skill_dir}/scripts/workflow-guard.js pre  <步骤号> {workflow_dir} {project_dir}

# 后置验证（检查输出文件是否有效）
node {skill_dir}/scripts/workflow-guard.js post <步骤号> {workflow_dir}
```

步骤号定义：

| 步骤号 | 说明 |
|--------|------|
| 01 | 读取当前进度 |
| 02 | 生成细纲 |
| 03 | 跨卷追踪整理 |
| 04 | 更新追踪文件 |
| 05 | 输出报告 |

---

## 参考文档

| 文档 | 用途 |
|------|------|
| `references/agent-prompt-templates.md` | 子 Agent Prompt 模板 |
| `_shared/references/cross-volume-tracking.md` | 跨卷追踪规范 |
| `_shared/references/task-tracking-conventions.md` | Task 跟踪规范 |
