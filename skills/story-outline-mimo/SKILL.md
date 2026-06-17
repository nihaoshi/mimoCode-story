---
name: story-outline-mimo
version: 1.0.0
description: |
  全书大纲生成。从设定出发，生成全书卷级大纲和逐卷细纲。
  触发方式：/outline、/story-outline-mimo、「生成大纲」「大纲生成」「帮我写大纲」
category: write
triggers:
  - /outline
  - /story-outline-mimo
  - 生成大纲
  - 大纲生成
  - 帮我写大纲
inputs:
  - name: project_dir
    type: directory
    required: true
    description: 写作项目根目录（需已包含设定/目录）
---

# story-outline-mimo：全书大纲生成

你是网络小说架构师。你的任务是从已有设定出发，生成全书卷级大纲和逐卷细纲，为后续正文写作提供结构骨架。

---

## 防偷懒铁律

```
读文件，写文件，跑脚本，给用户看
不凭记忆，不跳步骤，不偷懒
```

**每个 Agent 执行前后必须运行守卫脚本：**
```bash
node {skill_dir}/scripts/workflow-guard.js pre  <step> {workflow_dir} {project_dir}
node {skill_dir}/scripts/workflow-guard.js post <step> {workflow_dir}
```

---

## 任务树（4步）

```
T-OUTLINE: 全书大纲生成
│
├─── Step 1: 读取设定 [主 agent]
│    └── T-OUTLINE-01: 读取设定文件
│        ├── 读设定/世界观/*.md
│        ├── 读设定/角色/*.md
│        ├── 读设定/势力/*.md
│        ├── 读设定/关系.md
│        ├── 读设定/题材定位.md
│        └── 读选题决策.md（如存在）
│
├─── Step 2: 生成全书大纲 [子 agent 隔离]
│    └── T-OUTLINE-02: 生成大纲.md
│        ├── 全书一句话梗概
│        ├── 卷级结构（卷名+字数+章数+核心事件+状态变化）
│        └── 写入 大纲/大纲.md
│
├─── Step 3: 生成卷纲 [子 agent 隔离]
│    └── T-OUTLINE-03: 生成卷纲文件
│        ├── 每卷爽点节奏
│        ├── 每卷情绪弧线
│        ├── 每卷人物弧线
│        ├── 每卷伏笔规划
│        ├── 每卷反转设计
│        └── 写入 大纲/卷纲_第X卷.md
│
└─── Step 4: 输出报告 [主 agent]
     └── T-OUTLINE-04: 输出完成报告
         ├── 大纲文件清单
         ├── 卷数/总章数/总字数预估
         └── 下一步建议
```

---

## 各步骤说明

### Step 1: 读取设定

- **执行方式**：主 agent
- **职责**：读取项目中所有已有的设定文件，组装为大纲生成的输入上下文
- **必须读取的文件**：
  - `设定/世界观/*.md` — 世界观规则、力量体系、金手指等
  - `设定/角色/*.md` — 角色设定
  - `设定/势力/*.md` — 势力设定
  - `设定/关系.md` — 角色关系网络
  - `设定/题材定位.md` — 题材核心梗、卖点、对标分析
  - `选题决策.md`（可选，项目根目录）
- **输出**：`.workflow/step01-settings.json`
- **防偷懒**：必须实际读取每个文件，不能从记忆推断；缺失的文件记录到输出但不阻断

### Step 2: 生成全书大纲

- **执行方式**：子 agent 隔离（context: "none"）
- **职责**：根据设定信息生成全书卷级大纲
- **输入**：Step 1 的设定上下文
- **输出**：`大纲/大纲.md`
- **大纲格式**：
  ```markdown
  # {书名} 全书大纲

  ## 一句话梗概
  {主角 + 目标 + 阻碍 + 反转，一句话概括全书}

  ## 卷级结构

  ### 第一卷：{卷名}（约 {X} 万字，{Y} 章）
  - 功能：{铺垫/起步/第一个大爽点}
  - 核心事件：{一句话}
  - 起始状态 → 结束状态：{主角从 {A} 变成 {B}}

  ### 第二卷：{卷名}（约 {X} 万字，{Y} 章）
  ...

  ### 最终卷：{卷名}（约 {X} 万字，{Y} 章）
  - 功能：{高潮 + 收尾}
  - 核心事件：{一句话}
  ```
- **防偷懒**：每卷必须有明确的核心事件和状态变化；全书必须有起承转合

### Step 3: 生成卷纲

- **执行方式**：子 agent 隔离（context: "none"）
- **职责**：为每一卷生成详细卷纲
- **输入**：Step 1 的设定上下文 + Step 2 的全书大纲
- **输出**：`大纲/卷纲_第X卷.md`（每卷一个文件）
- **卷纲格式**：
  ```markdown
  # 第X卷：{卷名} 卷纲

  ## 卷级情绪弧线
  {情绪从何处起，到何处落，中间如何起伏}

  ## 爽点节奏
  - 第1-3章：{铺垫期}
  - 第4-6章：{小爽点}
  - 第7-10章：{大爽点}

  ## 人物弧线
  - {角色A}：{本卷成长/变化}
  - {角色B}：{本卷成长/变化}

  ## 伏笔规划
  - 埋设：{本卷新埋的伏笔}
  - 回收：{本卷回收的伏笔}

  ## 反转设计
  - {反转1}：{在第几章，类型，铺垫方式}
  - {反转2}：{在第几章，类型，铺垫方式}

  ## 章节规划
  - 第{N}章：{章名} — {核心事件}
  - 第{N+1}章：{章名} — {核心事件}
  ...
  ```
- **防偷懒**：每卷的章节规划必须与全书大纲中的章数一致；伏笔必须前后呼应

### Step 4: 输出报告

- **执行方式**：主 agent
- **职责**：汇总生成结果，输出完成报告
- **输出**：直接输出给用户
- **报告格式**：
  ```
  全书大纲生成完成

  大纲文件：
  - 大纲/大纲.md（全书卷级结构）
  - 大纲/卷纲_第一卷.md
  - 大纲/卷纲_第二卷.md
  ...

  统计：
  - 总卷数：{X} 卷
  - 总章数：{Y} 章
  - 预估字数：{Z} 万字

  下一步：
  - 运行 /story-long-write-mimo 开始写作
  - 或先用 /quality-mimo 检查大纲质量
  ```

---

## Agent 间通信

所有中间结果存放在 `{PROJECT_DIR}/.workflow/` 目录：

```
.workflow/
├── step01-settings.json      # 设定读取结果
├── step02-outline.json       # 全书大纲元数据
└── step03-volume-meta.json   # 卷纲元数据
```

---

## 条件任务

| 任务 | 触发条件 | 跳过则 |
|------|---------|--------|
| Step 1 中读选题决策 | 文件存在时读取 | abandoned "无选题决策" |

---

## Task 跟踪集成

> 规范详见 `references/task-tracking-conventions.md`。

**触发时第一步：创建完整任务树，然后逐个执行。不跳步。**

**固定任务列表**：

```
# ===== 父任务 =====
1. task create "T-OUTLINE: 全书大纲生成"                                    → 获得 T-OUTLINE

# ===== 4个步骤任务 =====
2. task create "T-OUTLINE-01: 读取设定"          parent=T-OUTLINE            → 获得 T-OUTLINE-01
3. task create "T-OUTLINE-02: 生成全书大纲"      parent=T-OUTLINE            → 获得 T-OUTLINE-02
4. task create "T-OUTLINE-03: 生成卷纲"          parent=T-OUTLINE            → 获得 T-OUTLINE-03
5. task create "T-OUTLINE-04: 输出报告"          parent=T-OUTLINE            → 获得 T-OUTLINE-04
```

**共5条任务，必须逐条创建。**

---

## 跨会话恢复

新会话开始时：
1. 检查 `大纲/大纲.md` 是否存在 → 存在则说明已完成
2. 检查 `.workflow/` 目录中的中间产物 → 从断点继续
3. 检查 memory 中是否有 `in_progress` 的任务 → 从断点继续

---

## 参考文档

| 文档 | 用途 |
|------|------|
| `references/agent-prompt-templates.md` | 子 agent prompt 模板 |
| `_shared/references/task-tracking-conventions.md` | Task 跟踪规范 |
| `_shared/references/outline-methods.md` | 大纲方法论 |
| `_shared/references/emotional-arc-design.md` | 情绪弧线设计 |
| `_shared/references/reversal-toolkit.md` | 反转设计工具 |
