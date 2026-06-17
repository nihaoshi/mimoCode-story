---
name: story-chapter-write-mimo
version: 1.1.0
description: 单章写作完整流程，14步严格串行，防偷懒守卫自动验证
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

# 单章写作流程

## 启动前必读

1. 本文件（核心流程）
2. `references/anti-lazy-checklist.md`（防偷懒速查）
3. `references/agent-contracts.md`（Agent 详细契约，按需）

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

退出码 0 = 通过，1 = 阻断（不得继续）。

---

## 任务树

```
T-CHAP-{N}: 写第{N}章
├── T-CHAP-{N}-01: 目录健全检查
├── T-CHAP-{N}-02: 获取最新章节信息
├── T-CHAP-{N}-03: 检查细纲是否存在
├── [条件] T-CHAP-{N}-04: 创建细纲
├── T-CHAP-{N}-05: 分析细纲确定读取文件
├── T-CHAP-{N}-06: 决策是否创建新设定
├── [条件] T-CHAP-{N}-07: 创建新设定文件
├── T-CHAP-{N}-08: 读取上下文并展示
├── T-CHAP-{N}-09: 生成约束参数
├── T-CHAP-{N}-10: 正文写作
├── T-CHAP-{N}-11: 质量检测
├── [条件] T-CHAP-{N}-12: 修复循环
├── [条件] T-CHAP-{N}-13: 复查
└── T-CHAP-{N}-14: 追踪文件更新
```

---

## 各步骤速查

### Step 01: 目录健全检查
- **检查**：正文/、追踪/、大纲/、设定/、5个追踪文件模板
- **输出**：`.workflow/step01-health-check.json`
- **防偷懒**：必须实际检查每个路径，缺失必须创建

### Step 02: 获取最新章节
- **检查**：扫描正文目录，找最大编号，统计字数
- **输出**：`.workflow/step02-chapter-info.json`
- **防偷懒**：必须扫描目录，不能从上下文推断

### Step 03: 检查细纲
- **检查**：细纲文件是否存在，格式是否完整
- **输出**：`.workflow/step03-outline-check.json`
- **防偷懒**：存在时必须验证格式

### Step 04: 创建细纲 [条件：need_create=true]
- **输入**：大纲、卷纲、上下文、伏笔、角色状态
- **输出**：`大纲/细纲_{N}章.md`
- **防偷懒**：情节点 >= 10，必须有钩子和爽点

### Step 05: 文件分析
- **检查**：从细纲解析角色、场景、伏笔
- **输出**：`.workflow/step05-required-files.json`
- **防偷懒**：必须从细纲实际解析，不能硬编码

### Step 06: 设定决策
- **检查**：与角色状态交叉比对，发现新元素
- **输出**：`.workflow/step06-new-settings.json`
- **防偷懒**：必须实际比对

### Step 07: 创建设定 [条件：need_new_settings=true]
- **输入**：新元素列表
- **输出**：设定文件
- **防偷懒**：必须完整，不能只有骨架

### Step 08: 读取上下文
- **检查**：读取 step05 列出的所有文件
- **输出**：`.workflow/step08-context.json`
- **防偷懒**：上一章结尾必须是最后500字原文

### Step 09: 生成约束
- **检查**：加载禁用词、文风规则
- **输出**：`.workflow/step09-constraints.json`
- **防偷懒**：禁用词必须从文件加载（L1: 31个，L2: 18个）

### Step 10: 正文写作
- **输入**：细纲、上下文、约束
- **输出**：`正文/第{N}章.md`
- **防偷懒**：必须包含所有场景，字数 >= 目标90%

### Step 11: 质量检测
- **检查**：字数、禁用词、一致性、跨章重复、角色声音、情绪、伏笔
- **输出**：`.workflow/step11-quality-report.json`
- **防偷懒**：必须运行全部7项检测

### Step 12: 修复 [条件：block_count > 0]
- **输入**：检测报告、正文、约束
- **输出**：更新正文 + `.workflow/step12-fix-log.json`
- **防偷懒**：每个BLOCK必须修复，remaining_blocks=0

### Step 13: 复查 [条件：step12存在]
- **检查**：重新运行完整检测
- **输出**：`.workflow/step13-recheck-report.json`
- **防偷懒**：不能假设修复成功，最多3轮

### Step 14: 追踪更新
- **检查**：从正文提取信息，更新7个追踪文件
- **输出**：伏笔、时间线、角色状态、物品、环境、重复语句、上下文
- **防偷懒**：必须从正文实际提取，不能凭记忆

---

## 条件任务

| 任务 | 触发条件 | 跳过则 |
|------|---------|--------|
| Step 04 | step03.need_create=true | abandoned |
| Step 07 | step06.need_new_settings=true | abandoned |
| Step 12 | step11.block_count>0 | abandoned |
| Step 13 | step12存在 | abandoned |

---

## 修复循环

```
Step 11 检测到 BLOCK
  ↓
Step 12 修复
  ↓
Step 13 复查
  ↓
仍有 BLOCK → 再回 Step 12（上限3轮）
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
├── step11-quality-report.json
├── step12-fix-log.json
└── step13-recheck-report.json
```

---

## 参考文档

| 文档 | 用途 |
|------|------|
| `references/anti-lazy-checklist.md` | 防偷懒速查，每个Agent必读 |
| `references/agent-contracts.md` | Agent详细契约，按需读取 |
| `_shared/references/task-tracking-conventions.md` | 任务跟踪规范 |
| `atoms/ATOMS-REGISTRY.md` | 原子技能注册表 |
| `_shared/scripts/quality-gate.js` | 质量门禁脚本 |
