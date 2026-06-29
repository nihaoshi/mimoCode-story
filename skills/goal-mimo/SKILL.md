---
name: goal-mimo
version: 1.1.0
description: |
  自主写作目标控制。设置写作目标，通过可选的写作 skill（story-long-write-mimo / story-chapter-fast-write-mimo / story-chapter-ultra-write-mimo）自动循环写作直到达标。
  触发方式：/goal-mimo、/goal、「写到第X章」「完成第X卷」
  写作 skill 选择：默认 long-write，可通过关键词 fast/极致 切换为 fast-write / ultra-write
inputs:
  - name: project_dir
    type: directory
    required: true
    description: 写作项目根目录
---

# goal-mimo：自主写作目标控制

你是写作目标控制器。设置明确的写作目标，通过可选的写作 skill 自动执行循环写作直到达标。

## 写作 Skill 选择

| 用户说 | 选用的写作 Skill |
|--------|-----------------|
| /goal 写到第X章 | story-long-write-mimo（默认） |
| /goal 快速写到第X章 | story-chapter-fast-write-mimo |
| /goal 极致写到第X章 | story-chapter-ultra-write-mimo |
| /goal 写到第X章（未指定） | story-long-write-mimo（默认） |

## 前置检查

执行前必须验证项目目录存在：

```bash
ls {project_dir}/正文/ 2>/dev/null || echo "ERROR: 项目目录或正文目录不存在"
```

缺失时提示用户：「项目目录 {project_dir} 不存在或缺少正文目录，请先用 /story-setup-mimo 部署项目。」

---

## 触发条件

| 用户说 | 动作 | Skill 选择 |
|--------|------|-----------|
| /goal 写到第X章 | 设置章节数目标 | story-long-write-mimo（默认） |
| /goal 快速写到第X章 | 设置章节数目标 | story-chapter-fast-write-mimo |
| /goal 极致写到第X章 | 设置章节数目标 | story-chapter-ultra-write-mimo |
| /goal 完成第X卷 | 设置卷目标 | story-long-write-mimo（默认） |
| /goal 写X万字 | 设置字数目标 | story-long-write-mimo（默认） |
| 帮我写到第X章 | 同 /goal | story-long-write-mimo（默认） |

---

## 执行流程

### Step 1：解析目标

调用 `_shared/scripts/goal.js` 设置目标配置：

```bash
node $HOME/.config/mimocode/skills/_shared/scripts/goal.js <项目目录> --target "写到第{N}章" --min-words 3000
```

配置保存到 `<项目目录>/.story-goal.json`

**解析写作 skill 选择：** 从用户输入中提取 skill 关键词，设置 `writing_skill` 字段：
- 输入包含「快速」→ `writing_skill: "fast"`
- 输入包含「极致」→ `writing_skill: "ultra"`
- 其他/默认 → `writing_skill: "long"`

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

根据 `.story-goal.json` 中的 `writing_skill` 字段选择写作流程：

```javascript
// 读取 .story-goal.json 中的 writing_skill 值
const goalConfig = JSON.parse(fs.readFileSync('.story-goal.json', 'utf-8'));
const skill = goalConfig.writing_skill || 'long';

// 根据 skill 选择调用不同的写作流程
let writeSkillName;
switch (skill) {
  case 'fast':
    writeSkillName = 'story-chapter-fast-write-mimo';
    break;
  case 'ultra':
    writeSkillName = 'story-chapter-ultra-write-mimo';
    break;
  case 'long':
  default:
    writeSkillName = 'story-long-write-mimo';
    break;
}

// 调用选定的写作 skill
// 每章循环：
// 1. 读取细纲_第{N}章.md
// 2. 加载追踪文件（伏笔、角色状态、物品、环境）
// 3. 准备层（状态筛选、模块召回、指令确认、性格锚点检查）
// 4. 写第{N}章正文
// 5. 运行 quality-gate.js 检查
// 6. 更新所有追踪文件
// 7. 写入 MEMORY.md
// 8. 检查是否达标 → 未达标则继续下一章
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

## Task 跟踪集成

> 规范详见 `_shared/references/task-tracking-conventions.md`。

**触发时第一步：读取下方任务树，然后逐条创建。不跳步。**

**强制执行顺序**：
1. 读取上方「任务树」
2. 严格按照列表逐条创建任务
3. 逐个执行

### 固定任务列表

```
# ===== 第1层：父任务 =====
1. task create "T-GOAL: 自主写作目标控制"                          → T-GOAL

# ===== 第2层：阶段任务 =====
2. task create "T-GOAL-PHASE1: Phase 1 解析目标"  parent=T-GOAL     → T-GOAL-PHASE1
3. task create "T-GOAL-PHASE2: Phase 2 确认目标"  parent=T-GOAL     → T-GOAL-PHASE2
4. task create "T-GOAL-PHASE3: Phase 3 进入循环写作"  parent=T-GOAL → T-GOAL-PHASE3
5. task create "T-GOAL-PHASE4: Phase 4 监控进度"  parent=T-GOAL     → T-GOAL-PHASE4
6. task create "T-GOAL-PHASE5: Phase 5 完成输出"  parent=T-GOAL     → T-GOAL-PHASE5

# ===== 第3层：具体步骤 =====

# Phase 1: 解析目标
7. task create "T-GOAL-P1-01: 调用 goal.js 设置目标配置"  parent=T-GOAL-PHASE1  → T-GOAL-P1-01
8. task create "T-GOAL-P1-02: 解析写作 skill 选择"  parent=T-GOAL-PHASE1        → T-GOAL-P1-02

# Phase 2: 确认目标
9. task create "T-GOAL-P2-01: 向用户确认目标信息"  parent=T-GOAL-PHASE2          → T-GOAL-P2-01

# Phase 3: 进入循环（循环任务）
10. task create "T-GOAL-P3-N: 写第 N 章"  parent=T-GOAL-PHASE3  → T-GOAL-P3-N（每章创建）
    ├── T-GOAL-P3-N-01: 读取细纲_第N章.md
    ├── T-GOAL-P3-N-02: 加载追踪文件（伏笔、角色状态、物品、环境）
    ├── T-GOAL-P3-N-03: 准备层（状态筛选、模块召回、指令确认、性格锚点检查）
    ├── T-GOAL-P3-N-04: 写第N章正文
    ├── T-GOAL-P3-N-05: 运行 quality-gate.js 检查
    ├── T-GOAL-P3-N-06: 更新所有追踪文件
    ├── T-GOAL-P3-N-07: 写入 MEMORY.md
    └── T-GOAL-P3-N-08: 检查是否达标 → 未达标则继续下一章

# Phase 4: 监控进度
11. task create "T-GOAL-P4-01: 每章完成后输出进度报告"  parent=T-GOAL-PHASE4  → T-GOAL-P4-01

# Phase 5: 完成输出
12. task create "T-GOAL-P5-01: 达标后输出完成报告"  parent=T-GOAL-PHASE5     → T-GOAL-P5-01
13. task create "T-GOAL-P5-02: 提示运行 /dream 提取经验"  parent=T-GOAL-PHASE5  → T-GOAL-P5-02
```

### 条件创建规则

| 任务 | 执行时判断 | 跳过则 abandoned |
|------|-----------|-----------------|
| T-GOAL-PHASE2 | 目标解析成功后 | 不可能跳过 |
| T-GOAL-PHASE3 | 用户确认后 | 用户拒绝则 abandoned |
| T-GOAL-P3-N（下一章） | 检查 .story-goal.json 是否达标 | 达标则停止循环，abandoned 下一章 |
| T-GOAL-P5-02 | Phase 5 完成后 | 可选，abandoned 不影响 |

### 循环处理

| 循环 | 触发 | 处理 |
|------|------|------|
| 章节写作循环 | Phase 3 进入 | 每章创建 T-GOAL-P3-N 任务树，N 递增 |
| 达标检查 | 每章 Phase 3-N-08 | 读取 .story-goal.json 比较 current_chapter 与 target_chapter |
| 写作 skill 选择 | Phase 3 开始前 | 根据 writing_skill 字段决定调用 long/fast/ultra |

### 完成标准

| 任务 | 完成标准 |
|------|---------|
| T-GOAL-P1-01 | `.story-goal.json` 创建成功 |
| T-GOAL-P1-02 | writing_skill 字段设置正确 |
| T-GOAL-P2-01 | 用户确认目标 |
| T-GOAL-P3-N-01~08 | 第 N 章正文完成，质量检查通过，追踪文件已更新 |
| T-GOAL-P4-01 | 进度报告已输出 |
| T-GOAL-P5-01 | 完成报告已输出，目标达标 |

---

## 与其他skill的关系

| 关系 | 说明 |
|------|------|
| 调用 | `story-long-write-mimo`（默认，高质量深度写作） / `story-chapter-fast-write-mimo`（快速模式） / `story-chapter-ultra-write-mimo`（极致模式） |
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
  "completed": false,
  "writing_skill": "long"
}
```

**writing_skill 字段说明：**
- `"long"` — 使用 `story-long-write-mimo`（默认）
- `"fast"` — 使用 `story-chapter-fast-write-mimo`
- `"ultra"` — 使用 `story-chapter-ultra-write-mimo`

---

## 自动触发规则

| 时机 | 动作 |
|------|------|
| 写完一章 | 自动检查 .story-goal.json |
| 达到目标 | 自动停止，输出完成报告 |
| 未达标 | 自动继续下一章 |
