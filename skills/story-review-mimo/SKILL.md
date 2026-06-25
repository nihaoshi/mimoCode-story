---
name: story-review-mimo
version: 3.0.0
description: |
  多视角审稿。子 agent 隔离执行 5 个审查维度，主 agent 负责读取文本和综合报告。
  触发方式：/story-review-mimo、/审稿、「帮我看看这篇」「审查」
atoms:
  - review-structure
  - review-character
  - review-writing
  - review-commercial
  - review-consistency
inputs:
  - name: project_dir
    type: directory
    required: true
    description: 写作项目根目录
---

# story-review-mimo v3.0：子 Agent 隔离审稿

## 核心设计

1. **子 agent 隔离执行**：5 个审查维度各自由独立子 agent 执行，上下文完全隔离
2. **主 agent 负责衔接**：读取文本（主 agent）→ 并行 spawn 5 个审查 agent → 综合报告（主 agent）
3. **守卫脚本**：每个子 agent 执行前后运行守卫脚本验证

## 防偷懒铁律

```
读文件，跑脚本，给用户看
不凭记忆，不跳步骤，不偷懒
```

## 前置检查

执行前必须验证项目目录存在且结构完整：

```bash
ls {project_dir}/正文/ {project_dir}/设定/ 2>/dev/null || echo "ERROR: 项目目录缺失"
```

缺失时提示用户：「项目目录 {project_dir} 不存在或结构不完整，请先用 /story-setup-mimo 部署项目。」

---

## 任务树（7 步）

```
T-REVIEW: 审稿「{文件名}」
│
├─── Phase 1: 读取文本 [主 agent]
│    └── T-REVIEW-01: 读取稿件 + 加载审查规则
│
├─── Phase 2: 并行审查 [5 个子 agent 隔离]
│    ├── T-REVIEW-STRUCT: 结构审查 [子 agent]
│    ├── T-REVIEW-CHAR:   人物审查 [子 agent]
│    ├── T-REVIEW-WRITE:  文笔审查 [子 agent]
│    ├── T-REVIEW-BIZ:    商业审查 [子 agent]
│    └── T-REVIEW-CON:    一致性审查 [子 agent]
│
└─── Phase 3: 综合报告 [主 agent]
     └── T-REVIEW-REPORT: 汇总评分 + 输出修改建议
```

---

## 审查维度

### 1. 结构审查（review-structure）

| 检查项 | 标准 |
|--------|------|
| 开篇钩子 | 前 3 句是否有吸引力 |
| 情绪曲线 | 是否有起伏，不能平 |
| 节奏把控 | 高潮/铺垫比例是否合理 |
| 反转铺垫 | 反转是否有足够铺垫 |
| 章尾钩子 | 每章结尾是否有悬念 |

### 2. 人物审查（review-character）

| 检查项 | 标准 |
|--------|------|
| 角色一致性 | 人设是否前后一致 |
| 动机合理性 | 行为是否有动机支撑 |
| 角色弧线 | 主角是否有成长/变化 |
| 配角功能 | 配角是否有存在价值 |

### 3. 文笔审查（review-writing）

| 检查项 | 标准 |
|--------|------|
| AI 味检测 | 是否有明显 AI 写作痕迹 |
| 对话质量 | 对话是否自然、有信息量 |
| 描写密度 | 是否有过多/过少描写 |
| 禁用词 | 是否有高频 AI 词汇 |

### 4. 商业审查（review-commercial）

| 检查项 | 标准 |
|--------|------|
| 爽点密度 | 每 3000-5000 字是否有爽点 |
| 钩子效果 | 钩子是否足够吸引翻页 |
| 题材适配 | 写法是否符合题材特点 |
| 平台适配 | 是否适合目标平台 |

### 5. 一致性审查（review-consistency）

| 检查项 | 标准 |
|--------|------|
| 事实一致 | 设定/属性是否前后一致 |
| 时间线 | 时间线是否混乱 |
| 伏笔回收 | 已埋伏笔是否有回收 |
| 角色状态 | 角色状态是否跟踪正确 |

---

## 各步骤说明

### Step 01: 读取稿件（主 agent）

- **Agent**: 主 agent（不 spawn）
- **职责**：
  1. 问用户：「请提供要审查的稿件（文件路径或直接贴文本）。需要重点审查哪些方面？」
  2. 用 Read 工具读取稿件全文
  3. 加载审查规则（禁用词、AI 腔句式等）
  4. 将稿件写入 `.workflow/review-input.md`
  5. 将审查偏好写入 `.workflow/review-config.json`
- **输出**: `.workflow/review-input.md`、`.workflow/review-config.json`

### Step 02-06: 并行审查（5 个子 agent 隔离）

5 个审查维度**同时 spawn**，各自独立执行：

```javascript
// 示例：spawn 结构审查 agent
actor({
  operation: "run",
  subagent_type: "general",
  description: "结构审查",
  prompt: "（见下方 Prompt 模板）",
  context: "none"  // 隔离上下文
})
```

每个子 agent 的职责：
1. 用 Read 工具读取 `.workflow/review-input.md`
2. 按维度检查项逐一审查
3. 输出评分 + 问题列表到 `.workflow/review-{维度}.json`

### Step 07: 综合报告（主 agent）

- **Agent**: 主 agent（不 spawn）
- **职责**：
  1. 读取 5 个 `.workflow/review-{维度}.json`
  2. 计算加权平均分
  3. 汇总优点 + 问题（按 P0/P1/P2 排序）
  4. 输出修改建议
  5. 输出最终审稿报告

---

## 子 Agent Prompt 模板

### 通用规则

- 所有子 agent 使用 `context: "none"` 隔离上下文
- 输入通过 `.workflow/` 目录下的文件传递
- 输出写入约定的 JSON 文件

### 结构审查 Agent Prompt

```
你是 review-structure，负责结构审查。

【项目信息】
- 工作目录：{project_dir}
- 稿件：.workflow/review-input.md

【输入文件】（必须用 Read 工具读取）
- 稿件全文：{project_dir}/.workflow/review-input.md
- 审查配置：{project_dir}/.workflow/review-config.json

【检查项】（必须全部检查）
1. 开篇钩子 — 前 3 句是否有吸引力，能否抓住读者
2. 情绪曲线 — 全文情绪是否有起伏，是否存在"平"的问题
3. 节奏把控 — 高潮与铺垫比例是否合理，是否有拖沓或仓促
4. 反转铺垫 — 反转是否有足够铺垫，是否突兀
5. 章尾钩子 — 结尾是否有悬念，能否吸引翻页

【输出格式】
写入 {project_dir}/.workflow/review-structure.json：
{
  "dimension": "structure",
  "score": 7,
  "items": [
    {
      "check": "开篇钩子",
      "score": 8,
      "status": "PASS",
      "detail": "前3句以冲突开场，有吸引力",
      "location": "第1段"
    },
    {
      "check": "情绪曲线",
      "score": 5,
      "status": "WARN",
      "detail": "中段情绪平淡，缺乏起伏",
      "location": "第3-5段"
    }
  ],
  "issues": [
    {
      "priority": "P1",
      "type": "结构",
      "location": "第3-5段",
      "problem": "中段情绪平淡",
      "suggestion": "增加一个小冲突或信息揭示"
    }
  ],
  "strengths": ["开篇有冲击力", "结尾悬念设置好"]
}

【防偷懒】
- 必须用 Read 工具读取稿件
- 每个检查项必须给出具体位置引用
- 问题必须标注优先级（P0/P1/P2）
```

### 人物审查 Agent Prompt

```
你是 review-character，负责人物审查。

【项目信息】
- 工作目录：{project_dir}
- 稿件：.workflow/review-input.md

【输入文件】（必须用 Read 工具读取）
- 稿件全文：{project_dir}/.workflow/review-input.md
- 审查配置：{project_dir}/.workflow/review-config.json

【检查项】（必须全部检查）
1. 角色一致性 — 人设是否前后一致，有无矛盾
2. 动机合理性 — 角色行为是否有动机支撑，是否突兀
3. 角色弧线 — 主角是否有成长/变化，弧线是否清晰
4. 配角功能 — 配角是否有存在价值，是否工具人

【输出格式】
写入 {project_dir}/.workflow/review-character.json：
{
  "dimension": "character",
  "score": 7,
  "items": [
    {
      "check": "角色一致性",
      "score": 8,
      "status": "PASS",
      "detail": "角色言行符合人设",
      "location": "全文"
    },
    {
      "check": "动机合理性",
      "score": 5,
      "status": "WARN",
      "detail": "第X段角色突然转变态度，缺乏铺垫",
      "location": "第X段"
    }
  ],
  "issues": [
    {
      "priority": "P1",
      "type": "人物",
      "location": "第X段",
      "problem": "角色动机不明确",
      "suggestion": "增加内心独白或前置事件"
    }
  ],
  "strengths": ["主角性格鲜明", "对话体现性格差异"]
}

【防偷懒】
- 必须用 Read 工具读取稿件
- 每个检查项必须引用具体对话或行为
- 问题必须标注优先级（P0/P1/P2）
```

### 文笔审查 Agent Prompt

```
你是 review-writing，负责文笔审查。

【项目信息】
- 工作目录：{project_dir}
- 稿件：.workflow/review-input.md

【输入文件】（必须用 Read 工具读取）
- 稿件全文：{project_dir}/.workflow/review-input.md
- 审查配置：{project_dir}/.workflow/review-config.json

【检测脚本】（必须运行）
- AI 腔检测：node {skill_dir}/../_shared/scripts/style-lint.js {稿件路径}
- 禁用词检测：node {skill_dir}/../_shared/scripts/banned-words.js {稿件路径}
- 标点检测：node {skill_dir}/../_shared/scripts/punctuation-normalize.js {稿件路径}

【检查项】（必须全部检查）
1. AI 味检测 — 是否有明显 AI 写作痕迹（排比、模板句、升华结尾）
2. 对话质量 — 对话是否自然、有信息量，是否像真人说话
3. 描写密度 — 是否有过多/过少描写，是否平衡
4. 禁用词 — 是否有高频 AI 词汇

【输出格式】
写入 {project_dir}/.workflow/review-writing.json：
{
  "dimension": "writing",
  "score": 7,
  "items": [
    {
      "check": "AI味检测",
      "score": 6,
      "status": "WARN",
      "detail": "检测到3处排比句式",
      "location": "第2段、第5段"
    },
    {
      "check": "对话质量",
      "score": 8,
      "status": "PASS",
      "detail": "对话自然，信息量充足",
      "location": "全文"
    }
  ],
  "script_results": {
    "style_lint": { "ai_score": 35, "issues": [...] },
    "banned_words": { "count": 2, "words": [...] },
    "punctuation": { "issues": [...] }
  },
  "issues": [
    {
      "priority": "P1",
      "type": "文笔",
      "location": "第2段",
      "problem": "排比句式，AI痕迹明显",
      "suggestion": "打散句式，改为长短交错"
    }
  ],
  "strengths": ["对话口语化好", "场景描写有画面感"]
}

【防偷懒】
- 必须用 Read 工具读取稿件
- 必须运行检测脚本，不能只靠目测
- 问题必须标注优先级（P0/P1/P2）
```

### 商业审查 Agent Prompt

```
你是 review-commercial，负责商业审查。

【项目信息】
- 工作目录：{project_dir}
- 稿件：.workflow/review-input.md

【输入文件】（必须用 Read 工具读取）
- 稿件全文：{project_dir}/.workflow/review-input.md
- 审查配置：{project_dir}/.workflow/review-config.json

【检测脚本】（必须运行）
- 爽点检测：node {skill_dir}/../_shared/scripts/satisfaction-meter.js {稿件路径}

【检查项】（必须全部检查）
1. 爽点密度 — 每 3000-5000 字是否有爽点，分布是否均匀
2. 钩子效果 — 钩子是否足够吸引翻页
3. 题材适配 — 写法是否符合题材特点
4. 平台适配 — 是否适合目标平台

【输出格式】
写入 {project_dir}/.workflow/review-commercial.json：
{
  "dimension": "commercial",
  "score": 7,
  "items": [
    {
      "check": "爽点密度",
      "score": 6,
      "status": "WARN",
      "detail": "全文仅1个爽点，密度不足",
      "location": "第4段"
    },
    {
      "check": "钩子效果",
      "score": 8,
      "status": "PASS",
      "detail": "结尾悬念强烈",
      "location": "末段"
    }
  ],
  "script_results": {
    "satisfaction": { "count": 1, "positions": [...], "density": 0.3 }
  },
  "issues": [
    {
      "priority": "P1",
      "type": "商业",
      "location": "全文",
      "problem": "爽点密度不足",
      "suggestion": "在第2段增加信息优势展示或打脸桥段"
    }
  ],
  "strengths": ["结尾钩子强", "题材选择有市场"]
}

【防偷懒】
- 必须用 Read 工具读取稿件
- 必须运行爽点检测脚本
- 问题必须标注优先级（P0/P1/P2）
```

### 一致性审查 Agent Prompt

```
你是 review-consistency，负责一致性审查。

【项目信息】
- 工作目录：{project_dir}
- 稿件：.workflow/review-input.md

【输入文件】（必须用 Read 工具读取）
- 稿件全文：{project_dir}/.workflow/review-input.md
- 审查配置：{project_dir}/.workflow/review-config.json

【参考文件】（动态扫描获取，一致性审查必须读取）
- 扫描追踪/目录：`ls {project_dir}/追踪/*.md 2>/dev/null`
- 扫描设定/目录：`ls {project_dir}/设定/**/*.md 2>/dev/null`
- 扫描跨卷追踪/目录：`ls {project_dir}/跨卷追踪/*.md 2>/dev/null`（可选）
- 扫描故事线/目录：`ls {project_dir}/故事线/*.md 2>/dev/null`（可选）
- 按扫描结果加载对应文件
- 故事线索引：{project_dir}/故事线/故事线_索引.md（如存在）
- 主线：{project_dir}/故事线/故事线_主线_*.md（如存在）
- 交叉点：{project_dir}/故事线/故事线_交叉点.md（如存在）

【检测脚本】（必须运行）
- 一致性检测：node {skill_dir}/../_shared/scripts/consistency-check.js {稿件路径}
- 跨章节检测：node {skill_dir}/../_shared/scripts/cross-chapter-check.js {稿件路径}

【检查项】（必须全部检查）
1. 事实一致 — 设定/属性是否前后一致，有无矛盾
2. 时间线 — 时间线是否混乱，时序是否合理
3. 伏笔回收 — 已埋伏笔是否有回收，是否有逾期
4. 角色状态 — 角色状态是否跟踪正确

【输出格式】
写入 {project_dir}/.workflow/review-consistency.json：
{
  "dimension": "consistency",
  "score": 7,
  "items": [
    {
      "check": "事实一致",
      "score": 9,
      "status": "PASS",
      "detail": "设定无矛盾",
      "location": "全文"
    },
    {
      "check": "伏笔回收",
      "score": 5,
      "status": "WARN",
      "detail": "伏笔#3已逾期2章未回收",
      "location": "伏笔.md"
    }
  ],
  "script_results": {
    "consistency": { "issues": [...] },
    "cross_chapter": { "duplicates": [...], "contradictions": [...] }
  },
  "issues": [
    {
      "priority": "P1",
      "type": "一致性",
      "location": "伏笔.md",
      "problem": "伏笔#3逾期未回收",
      "suggestion": "本章安排回收伏笔#3"
    }
  ],
  "strengths": ["时间线清晰", "角色状态准确"]
}

【防偷懒】
- 必须用 Read 工具读取稿件和追踪文件
- 必须运行检测脚本
- 问题必须标注优先级（P0/P1/P2）
```

---

## 守卫脚本调用

### 脚本位置

```
{skill_dir}/scripts/step-guard.js
```

### 调用方式

每个子 agent 执行前后运行守卫脚本：

```bash
# 执行前验证
node {skill_dir}/scripts/step-guard.js pre <步骤号> {workflow_dir}

# 执行后验证
node {skill_dir}/scripts/step-guard.js post <步骤号> {workflow_dir}
```

### 步骤号定义

| 步骤号 | 说明 |
|--------|------|
| 01 | 读取稿件（主 agent） |
| 02 | 结构审查（子 agent） |
| 03 | 人物审查（子 agent） |
| 04 | 文笔审查（子 agent） |
| 05 | 商业审查（子 agent） |
| 06 | 一致性审查（子 agent） |
| 07 | 综合报告（主 agent） |

### 工作流目录结构

```
.workflow/
├── review-input.md          # 稿件全文
├── review-config.json       # 审查配置（用户偏好）
├── review-structure.json    # 结构审查报告
├── review-character.json    # 人物审查报告
├── review-writing.json      # 文笔审查报告
├── review-commercial.json   # 商业审查报告
├── review-consistency.json  # 一致性审查报告
└── step-guard.json          # 守卫脚本状态
```

---

## Agent 间通信

- **主 → 子**：通过 `.workflow/review-input.md` 和 `.workflow/review-config.json` 传递
- **子 → 主**：通过 `.workflow/review-{维度}.json` 回传
- **上下文隔离**：所有子 agent 使用 `context: "none"`，不继承主 agent 对话历史

---

## 综合报告模板

```markdown
## 审稿报告

### 总体评分
- 结构：{1-10}
- 人物：{1-10}
- 文笔：{1-10}
- 商业性：{1-10}
- 一致性：{1-10}
- 综合：{加权平均}

### 优点
1. {具体优点}
2. {具体优点}

### 问题
| 优先级 | 类型 | 位置 | 问题描述 | 建议修改 |
|--------|------|------|----------|----------|
| P0 | {类型} | 第X段 | {问题} | {建议} |
| P1 | {类型} | 第X段 | {问题} | {建议} |

### 修改建议
{按优先级排序的修改建议}
```

---

## 评分标准

| 分数 | 等级 | 说明 |
|------|------|------|
| 9-10 | 优秀 | 可直接发布 |
| 7-8 | 良好 | 小修后可发布 |
| 5-6 | 合格 | 需要较大修改 |
| 3-4 | 不及格 | 需要重写部分内容 |
| 1-2 | 差 | 建议重新构思 |

---

## Task 跟踪集成

> 规范详见 `references/task-tracking-conventions.md`。

**触发时第一步：读取下方固定任务列表，然后逐条创建。不跳步。**

**强制执行顺序**：
1. 读取下方「固定任务列表」
2. 严格按照列表逐条创建任务
3. 逐个执行

#### 固定任务列表（审稿时，逐条创建）

```
# ===== 第1层：父任务 =====
1. task create "T-REVIEW: 审稿「{文件名}」"                    → T-REVIEW

# ===== 第2层：读取 + 5个审查维度 + 综合报告 =====
2. task create "T-REVIEW-01: 读取稿件 + 加载审查规则"            parent=T-REVIEW → T-REVIEW-01
3. task create "T-REVIEW-STRUCT: 结构审查 [子 agent 隔离]"       parent=T-REVIEW → T-REVIEW-STRUCT
4. task create "T-REVIEW-CHAR: 人物审查 [子 agent 隔离]"         parent=T-REVIEW → T-REVIEW-CHAR
5. task create "T-REVIEW-WRITE: 文笔审查 [子 agent 隔离]"        parent=T-REVIEW → T-REVIEW-WRITE
6. task create "T-REVIEW-BIZ: 商业审查 [子 agent 隔离]"          parent=T-REVIEW → T-REVIEW-BIZ
7. task create "T-REVIEW-CON: 一致性审查 [子 agent 隔离]"        parent=T-REVIEW → T-REVIEW-CON
8. task create "T-REVIEW-REPORT: 综合报告 [主 agent]"             parent=T-REVIEW → T-REVIEW-REPORT
```

### 执行规则

| 任务 | Agent | 执行方式 |
|------|-------|---------|
| T-REVIEW-01 | 主 agent | 直接执行 |
| T-REVIEW-STRUCT | 子 agent | `actor({ context: "none" })` |
| T-REVIEW-CHAR | 子 agent | `actor({ context: "none" })` |
| T-REVIEW-WRITE | 子 agent | `actor({ context: "none" })` |
| T-REVIEW-BIZ | 子 agent | `actor({ context: "none" })` |
| T-REVIEW-CON | 子 agent | `actor({ context: "none" })` |
| T-REVIEW-REPORT | 主 agent | 直接执行 |

### 审查顺序

- Step 01（读取）完成后，Step 02-06（5 个审查维度）**并行 spawn**
- 全部审查完成后，Step 07（综合报告）由主 agent 汇总

---

## 流程衔接

| 时机 | 跳转到 |
|------|--------|
| 审完修改 | `story-long-write-mimo` / `story-short-write-mimo` |
| 发现 AI 味 | `story-deslop-mimo` |

---

## 参考文档

| 文档 | 用途 |
|------|------|
| `references/agent-prompt-templates.md` | 子 Agent Prompt 模板（本文内嵌） |
| `_shared/scripts/style-lint.js` | AI 腔检测脚本 |
| `_shared/scripts/banned-words.js` | 禁用词检测脚本 |
| `_shared/scripts/punctuation-normalize.js` | 标点检测脚本 |
| `_shared/scripts/satisfaction-meter.js` | 爽点检测脚本 |
| `_shared/scripts/consistency-check.js` | 一致性检测脚本 |
| `_shared/scripts/cross-chapter-check.js` | 跨章节检测脚本 |

---

## 语言

- 跟随用户的语言回复
- 中文回复遵循《中文文案排版指北》
