---
name: story-chapter-write-mimo
version: 2.0.0
description: 单章写作流程，14步子agent隔离执行，有问题必修
category: write
triggers:
  - /chapter-write
  - 写第X章
  - 单章写作
  - 续写
inputs:
  - name: project_dir
    type: directory
    required: true
    description: 写作项目根目录
  - name: chapter_number
    type: number
    required: false
    description: 指定章节号（默认自动检测下一章）
---

# 单章写作流程 v2.0

## 核心设计

1. **子 agent 隔离执行**：每个任务由独立子 agent 执行，上下文完全隔离
2. **有问题必修**：质量检测中只要有任何 WARN 或 BLOCK，就必须修复
3. **综合检测**：字数、禁用词、一致性、逻辑性合并为一次检测
4. **综合修复**：一个修复 agent 处理所有问题

## 防偷懒铁律

```
读文件，写文件，跑脚本，给用户看
不凭记忆，不跳步骤，不偷懒
```

**每个 Agent 执行前后必须运行守卫脚本：**
```bash
node {skill_dir}/scripts/step-guard.js pre  <步骤号> {workflow_dir}
node {skill_dir}/scripts/step-guard.js post <步骤号> {workflow_dir}
```

---

## 任务树（14步）

```
T-CHAP-{N}: 写第{N}章
│
├─── Phase 1: 准备阶段
│    ├── T-CHAP-{N}-01: 目录健全检查 [explore]
│    ├── T-CHAP-{N}-02: 获取最新章节信息 [explore]
│    ├── T-CHAP-{N}-03: 检查细纲是否存在 [explore]
│    ├── [条件] T-CHAP-{N}-04: 创建细纲 [general]
│    ├── T-CHAP-{N}-05: 分析细纲确定读取文件 [general]
│    ├── T-CHAP-{N}-06: 决策是否创建新设定 [general]
│    └── [条件] T-CHAP-{N}-07: 创建新设定文件 [general]
│
├─── Phase 2: 写作阶段
│    ├── T-CHAP-{N}-08: 读取上下文并展示 [general]
│    ├── T-CHAP-{N}-09: 生成约束参数 [general]
│    └── T-CHAP-{N}-10: 正文写作 [general] ← 只写作，不检查
│
├─── Phase 3: 检测阶段
│    └── T-CHAP-{N}-11: 综合质量检测 [general]
│        ├── 字数检测
│        ├── 禁用词+AI腔检测
│        ├── 一致性检测
│        ├── 章内逻辑性检查
│        └── 跨章节检查
│
├─── Phase 4: 修复阶段（有问题必修）
│    ├── [条件] T-CHAP-{N}-12: 综合修复 [general]
│    └── [条件] T-CHAP-{N}-13: 复查 [general]
│
└─── Phase 5: 收尾阶段
     └── T-CHAP-{N}-14: 追踪+设定更新 [general]
```

---

## 各步骤说明

### Step 01: 目录健全检查
- **Agent**: explore（隔离执行）
- **检查**：正文/、追踪/、大纲/、设定/、5个追踪文件模板
- **输出**：`.workflow/step01-health-check.json`
- **防偷懒**：必须实际检查每个路径，缺失必须创建

### Step 02: 获取最新章节
- **Agent**: explore（隔离执行）
- **检查**：扫描正文目录，找最大编号，统计字数
- **输出**：`.workflow/step02-chapter-info.json`
- **防偷懒**：必须扫描目录，不能从上下文推断

### Step 03: 检查细纲
- **Agent**: explore（隔离执行）
- **检查**：细纲文件是否存在，格式是否完整
- **输出**：`.workflow/step03-outline-check.json`
- **防偷懒**：存在时必须验证格式

### Step 04: 创建细纲 [条件：need_create=true]
- **Agent**: general（隔离执行）
- **输入**：大纲、卷纲、上下文、伏笔、角色状态
- **输出**：`大纲/细纲_{N}章.md`
- **防偷懒**：情节点 >= 10，必须有钩子和爽点

### Step 05: 文件分析
- **Agent**: general（隔离执行）
- **检查**：从细纲解析角色、场景、伏笔
- **输出**：`.workflow/step05-required-files.json`
- **必须包含的设定文件**（除角色外，全部加载）：
  - `设定/世界观/*.md` — 世界观、力量体系、金手指等
  - `设定/势力/*.md` — 势力设定
  - `设定/关系.md` — 角色关系
  - `设定/题材定位.md` — 题材核心梗
  - `设定/文风.md` — 文风设定
- **防偷懒**：必须从细纲实际解析，不能硬编码；设定文件必须全部列出

### Step 06: 设定决策
- **Agent**: general（隔离执行）
- **检查**：与角色状态交叉比对，发现新元素
- **输出**：`.workflow/step06-new-settings.json`
- **防偷懒**：必须实际比对

### Step 07: 创建设定 [条件：need_new_settings=true]
- **Agent**: general（隔离执行）
- **输入**：新元素列表
- **输出**：设定文件
- **防偷懒**：必须完整，不能只有骨架

### Step 08: 读取上下文
- **Agent**: general（隔离执行）
- **检查**：读取 step05 列出的所有文件
- **强制加载的设定文件**（除角色外）：
  - `设定/世界观/*.md` — 世界观规则（如时代背景、社会规则、技术设定）
  - `设定/势力/*.md` — 势力设定（如组织结构、势力关系）
  - `设定/关系.md` — 角色关系网络
  - `设定/题材定位.md` — 题材核心梗、卖点
  - `设定/文风.md` — 文风约束
- **输出**：`.workflow/step08-context.json`
- **防偷懒**：上一章结尾必须是最后500字原文；设定文件必须全部读取，不能跳过

### Step 09: 生成约束
- **Agent**: general（隔离执行）
- **检查**：加载禁用词、文风规则、字数限制
- **输出**：`.workflow/step09-constraints.json`
- **防偷懒**：禁用词必须从文件加载，字数限制必须明确

### Step 10: 正文写作
- **Agent**: general（隔离执行）
- **职责**：只写作，不检查质量
- **输入**：细纲、上下文、约束
- **输出**：`正文/第{N}章.md`
- **防偷懒**：必须包含所有场景，必须写入文件

### Step 11: 综合质量检测
- **Agent**: general（隔离执行）
- **检测项**：
  - 字数达标（BLOCK）
  - 禁用词+AI腔（BLOCK）
  - AI标点符号（BLOCK）
  - 一致性（BLOCK）
  - **设定校验（BLOCK）** — 世界观、金手指、文风、题材、关系
  - 章内逻辑性（WARN）
  - 跨章节检查（WARN）
- **设定校验内容**：
  - 世界观规则是否遵守（如时代背景、社会规则、技术设定）
  - 金手指规则是否正确（如系统机制、能力限制）
  - 文风是否符合设定（如语言风格、叙事视角）
  - 题材核心梗是否体现（如爽点模式、情绪目标）
  - 角色关系是否符合设定（如亲疏、敌友、势力归属）
- **输出**：`.workflow/step11-quality-report.json`
- **关键规则**：只要有任何 WARN 或 BLOCK，必须进入修复流程

### Step 12: 综合修复 [条件：有任何问题]
- **Agent**: general（隔离执行）
- **职责**：修复所有问题（字数扩充+禁用词替换+逻辑修正）
- **输入**：检测报告、正文、约束
- **输出**：修复后正文 + `.workflow/step12-fix-log.json`
- **防偷懒**：每个问题必须修复，不能跳过 WARN

### Step 13: 复查 [条件：执行了修复]
- **Agent**: general（隔离执行）
- **职责**：重新运行完整检测
- **输出**：`.workflow/step13-recheck-report.json`
- **防偷懒**：不能假设修复成功，最多3轮

### Step 14: 追踪+设定更新
- **Agent**: general（隔离执行）
- **检查**：从正文提取信息，更新追踪文件和设定文件
- **输出**：
  - 追踪文件（7个）：伏笔、时间线、角色状态、物品、环境、重复语句、上下文
  - 设定文件：角色设定、世界观、势力等（如有变化）
- **防偷懒**：必须从正文实际提取，不能凭记忆；设定有变化必须更新

---

## 条件任务

| 任务 | 触发条件 | 跳过则 |
|------|---------|--------|
| Step 04 | step03.need_create=true | abandoned |
| Step 07 | step06.need_new_settings=true | abandoned |
| Step 12 | step11有任何WARN或BLOCK | abandoned |
| Step 13 | step12存在 | abandoned |

---

## 修复循环

```
Step 11 检测到 ANY 问题（WARN 或 BLOCK）
  ↓
Step 12 综合修复（所有问题）
  ↓
Step 13 复查
  ↓
仍有问题 → 再回 Step 12（上限3轮）
  ↓
全部通过 → Step 14
```

---

## Agent 间通信

所有中间结果存放在 `{PROJECT_DIR}/.workflow/` 目录：

```
.workflow/
├── step01-health-check.json
├── step02-chapter-info.json
├── step03-outline-check.json
├── step05-required-files.json
├── step06-new-settings.json
├── step08-context.json
├── step09-constraints.json
├── step11-quality-report.json    # 综合检测报告
├── step12-fix-log.json           # 修复日志
└── step13-recheck-report.json    # 复查报告
```

---

## 参考文档

| 文档 | 用途 |
|------|------|
| `references/anti-lazy-checklist.md` | 防偷懒速查，每个Agent必读 |
| `references/agent-contracts.md` | Agent详细契约，按需读取 |
| `references/logic-check-rules.md` | 章内逻辑性检查规则 |
| `references/quality-detection-spec.md` | 综合质量检测规范 |
| `_shared/scripts/quality-gate.js` | 质量门禁脚本 |
