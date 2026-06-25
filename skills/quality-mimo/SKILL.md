---
name: quality-mimo
version: 2.0.0
description: |
  统一质量检查入口。子agent隔离执行，有问题必修。
  触发方式：/quality-mimo、/检查质量、「检查一下」「质量检查」
atoms:
  - detect-quality
  - detect-consistency
  - detect-story
  - detect-wordcount
  - detect-voice
  - detect-emotion
  - detect-cross-chapter
inputs:
  - name: project_dir
    type: directory
    required: true
    description: 写作项目根目录
---

# quality-mimo：统一质量检查 v2.0

## 核心设计

1. **子 agent 隔离执行**：检测和修复由独立子 agent 执行，上下文完全隔离
2. **有问题必修**：只要有任何 WARN 或 BLOCK，就必须修复
3. **综合检测**：字数、禁用词、一致性、逻辑性合并为一次检测
4. **综合修复**：一个修复 agent 处理所有问题

## 防偷懒铁律

```
读文件，写文件，跑脚本，给用户看
不凭记忆，不跳步骤，不偷懒
```

## 前置检查

执行前必须验证项目目录存在且结构完整：

```bash
ls {project_dir}/正文/ {project_dir}/设定/ {project_dir}/追踪/ 2>/dev/null || echo "ERROR: 项目目录缺失"
```

缺失时提示用户：「项目目录 {project_dir} 不存在或结构不完整，请先用 /story-setup-mimo 部署项目。」

**每个 Agent 执行前后必须运行守卫脚本：**
```bash
node {skill_dir}/scripts/step-guard.js pre  <步骤号> {workflow_dir}
node {skill_dir}/scripts/step-guard.js post <步骤号> {workflow_dir}
```

---

## 触发条件

| 用户说 | 动作 |
|--------|------|
| /quality-mimo | 检查当前章节（交互式） |
| /quality-mimo <文件> | 检查指定文件 |
| /quality-mimo --full <文件> | 增强检查（身份、时间线、完整性） |
| 检查质量 | 同 /quality-mimo |
| 检查一下 | 同 /quality-mimo |

---

## 任务树（4步）

```
T-QUALITY-{N}: 质量检查「{文件名}」
│
├─── Phase 1: 读取阶段
│    └── T-QUALITY-{N}-01: 读取文本 [主 agent]
│
├─── Phase 2: 检测阶段
│    └── T-QUALITY-{N}-02: 综合质量检测 [子 agent 隔离]
│        ├── 字数检测（BLOCK）
│        ├── 禁用词+AI腔检测（BLOCK）
│        ├── AI标点符号（BLOCK）
│        ├── 一致性检测（BLOCK）
│        ├── 逻辑性检查（WARN）
│        └── 跨章节检查（WARN）
│
├─── Phase 3: 修复阶段（有问题必修）
│    ├── [条件] T-QUALITY-{N}-03: 综合修复 [子 agent 隔离]
│    └── [条件] T-QUALITY-{N}-04: 复查 [子 agent 隔离]
│
└─── Phase 4: 报告阶段
     └── T-QUALITY-{N}-05: 输出检查报告 [主 agent]
```

---

## 各步骤说明

### Step 01: 读取文本
- **Agent**: 主 agent（不隔离）
- **职责**：读取章节文件和追踪文件，准备检测上下文
- **输入**：用户指定的文件路径
- **输出**：`.workflow/step01-chapter-content.json`
- **防偷懒**：必须用 Read 工具读取，不能从上下文推断

### Step 02: 综合质量检测
- **Agent**: general（隔离执行，context=none）
- **职责**：运行所有检测脚本，汇总问题
- **检测项**：
  - 字数达标（wordcount.js 统计）— BLOCK
  - 禁用词+AI腔（style-lint.js）— BLOCK
  - AI标点符号（punctuation-normalize.js）— BLOCK
  - 一致性（consistency-check.js）— BLOCK
  - 逻辑性（LLM 分析）— WARN
  - 跨章节检查（cross-chapter-check.js）— WARN
- **输出**：`.workflow/step02-quality-report.json`
- **关键规则**：只要有任何 WARN 或 BLOCK，必须进入修复流程

### Step 03: 综合修复 [条件：有任何问题]
- **Agent**: general（隔离执行，context=none）
- **职责**：修复所有问题（字数扩充+禁用词替换+逻辑修正）
- **输入**：检测报告、正文、约束
- **输出**：修复后正文 + `.workflow/step03-fix-log.json`
- **防偷懒**：每个问题必须修复，不能跳过 WARN

### Step 04: 复查 [条件：执行了修复]
- **Agent**: general（隔离执行，context=none）
- **职责**：重新运行完整检测
- **输出**：`.workflow/step04-recheck-report.json`
- **防偷懒**：不能假设修复成功，最多3轮

### Step 05: 输出检查报告
- **Agent**: 主 agent（不隔离）
- **职责**：汇总检测结果，输出格式化报告
- **输入**：step02/step04 的报告文件
- **输出**：用户可见的格式化报告

---

## 条件任务

| 任务 | 触发条件 | 跳过则 |
|------|---------|--------|
| Step 03 | step02 有任何 WARN 或 BLOCK | abandoned |
| Step 04 | step03 存在 | abandoned |

---

## 修复循环

```
Step 02 检测到 ANY 问题（WARN 或 BLOCK）
  ↓
Step 03 综合修复（所有问题）
  ↓
Step 04 复查
  ↓
仍有问题 → 再回 Step 03（上限3轮）
  ↓
全部通过 → Step 05
```

---

## Agent 间通信

所有中间结果存放在 `{PROJECT_DIR}/.workflow/` 目录：

```
.workflow/
├── step01-chapter-content.json   # 章节内容
├── step02-quality-report.json    # 综合检测报告
├── step03-fix-log.json           # 修复日志
└── step04-recheck-report.json    # 复查报告
```

---

## Prompt 模板

> 详见 `references/agent-prompt-templates.md`

### 综合检测 Agent Prompt

```
你是 quality-checker，负责综合质量检测。

【项目信息】
- 项目目录：{project_dir}
- 文件名：{chapter_file}

【输入文件】（必须用 Read 工具读取）
- 正文：{project_dir}/正文/{chapter_file}
- 约束：{project_dir}/.workflow/step01-chapter-content.json

【参考文件】（设定校验和一致性检测必须读取，动态扫描获取）
- 扫描设定/目录：`ls {project_dir}/设定/**/*.md 2>/dev/null`
- 扫描追踪/目录：`ls {project_dir}/追踪/*.md 2>/dev/null`
- 扫描跨卷追踪/目录：`ls {project_dir}/跨卷追踪/*.md 2>/dev/null`（可选）
- 扫描故事线/目录：`ls {project_dir}/故事线/*.md 2>/dev/null`（可选）
- 按扫描结果加载对应文件

【检测项】（必须全部运行）
1. 字数达标（wordcount.js 统计）— BLOCK
2. 禁用词+AI腔（style-lint.js）— BLOCK
3. AI标点符号（punctuation-normalize.js）— BLOCK
4. 一致性（consistency-check.js）— BLOCK
5. 逻辑性（LLM分析）— WARN
6. 跨章节检查（cross-chapter-check.js）— WARN

【输出】
- 报告：{project_dir}/.workflow/step02-quality-report.json

【报告格式】
{
  "chapter": "{chapter_file}",
  "word_count": 3200,
  "word_count_target": 3000,
  "checks": [...],
  "block_count": 0,
  "warn_count": 0,
  "total_issues": 0,
  "overall": "PASS",
  "issues": [...]
}

【防偷懒】
- 必须用 Read 工具读取输入文件
- 必须运行所有检测脚本
- 必须写入报告文件
```

### 综合修复 Agent Prompt

```
你是 quality-fixer，负责修复所有质量问题。

【项目信息】
- 项目目录：{project_dir}
- 文件名：{chapter_file}

【输入文件】（必须用 Read 工具读取）
- 正文：{project_dir}/正文/{chapter_file}
- 检测报告：{project_dir}/.workflow/step02-quality-report.json

【修复规则】
- 只有问题（WARN或BLOCK）就必须修复
- 修复后重新检测，直到全部通过
- 最多3轮修复循环
- 不能跳过 WARN

【输出】
- 更新：{project_dir}/正文/{chapter_file}
- 报告：{project_dir}/.workflow/step03-fix-log.json

【防偷懒】
- 必须用 Read 工具读取输入文件
- 有问题必须修复，不能跳过
- 必须写入报告文件
```

---

## 守卫脚本调用

### 执行前验证

```bash
node {skill_dir}/scripts/step-guard.js pre {step} {workflow_dir} {project_dir}
```

### 执行后验证

```bash
node {skill_dir}/scripts/step-guard.js post {step} {workflow_dir}
```

### 步骤号定义

| 步骤 | 说明 |
|------|------|
| 01 | 读取文本 |
| 02 | 综合检测 |
| 03 | 综合修复 |
| 04 | 复查 |
| 05 | 输出报告 |

---

## 检查类型

### 1. 统一质量门禁（推荐）

**功能**：一站式检查，包含 7+ 项检查

**调用方式**：
```bash
node skills/_shared/scripts/quality-gate.js <章节文件> <项目目录>
```

**检查项目**（由以下原子 skill 执行）：
- 调用原子 `detect-quality` — 禁用词+AI腔检测
- 调用原子 `detect-consistency` — 一致性检查
- 调用原子 `detect-story` — 伏笔+设定缺口检查
- 调用原子 `detect-wordcount` — 字数检查
- 调用原子 `detect-voice` — 角色声音检查
- 调用原子 `detect-emotion` — 情绪曲线+爽点检查

**增强模式**：
```bash
node skills/_shared/scripts/quality-gate.js --full <章节文件> <项目目录>
```

增加（增强模式额外原子）：
- 调用原子 `detect-cross-chapter` — 跨章节一致性
- 调用原子 `detect-satisfaction` — 读者满意度预检
- 调用原子 `detect-story-gaps` — 故事漏洞检测

---

### 2. 全量审计

**功能**：检查整个项目的所有章节和追踪文件

**调用方式**：
```bash
node skills/_shared/scripts/full-consistency-audit.js <项目目录>
```

**检查内容**：
- 所有追踪文件完整性
- 所有章节一致性
- 跨章节矛盾检测

---

### 3. 单项检查

| 检查类型 | 调用原子 |
|---------|----------|
| 禁用词+AI腔检测 | 调用原子 `detect-quality` |
| 一致性检查 | 调用原子 `detect-consistency` |
| 伏笔+设定缺口 | 调用原子 `detect-story` |
| 字数检查 | 调用原子 `detect-wordcount` |
| 角色声音检查 | 调用原子 `detect-voice` |
| 情绪+爽点检查 | 调用原子 `detect-emotion` |
| 跨章节检查 | 调用原子 `detect-cross-chapter` |

---

## 输出格式

```
🔍 质量检查报告

📊 检查结果：
- 禁用词：✅ 通过
- AI腔：⚠️ 2处警告
- 一致性：✅ 通过
- 字数：✅ 3500/3000

📝 警告详情：
1. 第5段："不禁" → 建议删除
2. 第8段："仿佛" → 建议改为"像"

💡 是否自动修复？
```

---

## Task 跟踪集成

> 规范详见 `references/task-tracking-conventions.md`。

**触发时第一步：读取下方固定任务列表，然后逐条创建。不跳步。**

**强制执行顺序**：
1. 读取下方「固定任务列表」
2. 严格按照列表逐条创建任务
3. 逐个执行

#### 固定任务列表（质量检查时，逐条创建）

```
# ===== 第1层：父任务 =====
1. task create "T-QUALITY: 质量检查「{文件名}」"                    → T-QUALITY

# ===== 第2层：4步子任务 =====
2. task create "T-QUALITY-01: 读取文本"                               parent=T-QUALITY
3. task create "T-QUALITY-02: 综合质量检测 [子agent隔离]"              parent=T-QUALITY
4. task create "T-QUALITY-03: 综合修复 [条件，有问题才执行]"           parent=T-QUALITY
5. task create "T-QUALITY-04: 复查 [条件，执行了修复才执行]"           parent=T-QUALITY
6. task create "T-QUALITY-05: 输出检查报告"                            parent=T-QUALITY
```

### 条件创建规则

| 任务 | 执行时判断 | 跳过则 abandoned |
|------|-----------|-----------------|
| T-QUALITY-03 | step02 有任何 WARN 或 BLOCK | 全部通过则 abandoned |
| T-QUALITY-04 | step03 存在 | 无修复则 abandoned |

### 循环处理

| 循环 | 触发 | 处理 |
|------|------|------|
| 修复后仍有残留 | RECHECK 发现新问题 | 再创建 FIX（上限3轮） |

---

## 与其他skill的关系

| 关系 | 说明 |
|------|------|
| 被调用 | `story-long-write-mimo`（写作流程中自动调用） |
| 被调用 | `story-short-write-mimo`（短篇写作中调用） |
| 被调用 | `story-chapter-write-mimo`（单章写作中调用） |
| 调用 | `quality-gate.js`（质量门禁脚本） |
| 调用 | `full-consistency-audit.js`（全量审计脚本） |

---

## 常见问题

**Q1：检查发现问题后怎么办？**
A：子 agent 会自动尝试修复，修复后重新检查。

**Q2：检查需要多久？**
A：单章检查约5-10秒，全量审计约30秒。

**Q3：可以只检查某一项吗？**
A：可以，使用单项检查命令。
