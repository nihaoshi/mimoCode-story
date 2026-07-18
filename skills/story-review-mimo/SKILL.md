---
name: story-review-mimo
version: 4.0.0
description: |
  多视角审稿。子 agent 隔离执行 7 个审查维度（5 个 review + 2 个 detect 补充），主 agent 负责读取文本和综合报告。
  触发方式：/story-review-mimo、/审稿、「帮我看看这篇」「审查」
atoms:
  - review-structure
  - review-character
  - review-writing
  - review-commercial
  - review-consistency
  - detect-wordcount
  - detect-cross-chapter
  - detect-voice
  - detect-quality
inputs:
  - name: project_dir
    type: directory
    required: true
    description: 写作项目根目录
---

# story-review-mimo v4.0：子 Agent 隔离审稿

## 核心设计

1. **子 agent 隔离执行**：7 个审查维度各自由独立子 agent 执行，上下文完全隔离
2. **主 agent 负责衔接**：读取文本（主 agent）→ 并行 spawn 审查 agent → 综合报告（主 agent）
3. **守卫脚本**：每个子 agent 执行前后运行守卫脚本验证
4. **原子技能集成**：字数、跨章、声音检测使用 detect-* 原子技能脚本，不内嵌重复逻辑

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

## 任务树（9 步）

```
T-REVIEW: 审稿「{文件名}」
│
├─── Phase 1: 读取文本 [主 agent]
│    └── T-REVIEW-01: 读取稿件 + 加载审查规则
│
├─── Phase 2: 并行审查 [7 个子 agent 隔离]
│    ├── T-REVIEW-STRUCT:  结构审查 [子 agent]
│    ├── T-REVIEW-CHAR:    人物审查 [子 agent]
│    ├── T-REVIEW-WRITE:   文笔审查 [子 agent]
│    ├── T-REVIEW-BIZ:     商业审查 [子 agent]
│    ├── T-REVIEW-CON:     一致性审查 [子 agent]
│    ├── T-REVIEW-WC:      字数达标检测 [子 agent, atom:detect-wordcount]
│    └── T-REVIEW-CC:      跨章/声音检测 [子 agent, atom:detect-cross-chapter + detect-voice]
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

### 6. 字数达标检测（detect-wordcount）— BLOCK

| 检查项 | 标准 |
|--------|------|
| 字数达标 | 章节字数 ≥ 细纲目标的 90% |

**严重度：BLOCK**。未达标则整体审稿不通过，必须修改后复检。

### 7. 跨章/声音/毒点检测（detect-cross-chapter + detect-voice + LLM 毒点分析）— WARN

| 检查项 | 标准 |
|--------|------|
| 跨章重复 | 与前序章节的重复描写 |
| 跨章矛盾 | 与前序章节的事实矛盾 |
| 角色声音 | 对话是否符合性格锚点 |
| 毒点检测 | 爽文不爽、压制无目的、反派结局与主角无关等 |

**严重度：WARN**。标记问题并给出修改建议，不影响审稿通过。

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

### Step 02-08: 并行审查（7 个子 agent 隔离）

7 个审查维度**同时 spawn**，各自独立执行：

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

### Step 09: 综合报告（主 agent）

- **Agent**: 主 agent（不 spawn）
- **职责**：
  1. 读取 7 个 `.workflow/review-{维度}.json`
  2. 计算加权平均分（BLOCK 维度 2x，WARN 维度 1x）
  3. 汇总优点 + 问题（按 P0/P1/P2 排序）
  4. 输出修改建议
  5. 输出最终审稿报告
  6. **如有 BLOCK 不通过 → 触发修改后复检流程**

---

## 子 Agent Prompt 模板

### 通用规则

- 所有子 agent 使用 `context: "none"` 隔离上下文
- 输入通过 `.workflow/` 目录下的文件传递
- 输出写入约定的 JSON 文件
- 质量红线：读取 `$HOME/.config/mimocode/skills/_shared/references/quality-rules.md` 获取完整规则

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
  "severity": "WARN",
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
  "severity": "WARN",
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
- 质量规则：$HOME/.config/mimocode/skills/_shared/references/quality-rules.md

【检测脚本】（必须运行）
- 文本质量：node {skill_dir}/../../_shared/scripts/style-lint.js --json {稿件路径}

【检查项】（必须全部检查）
1. AI 味检测 — 是否有明显 AI 写作痕迹（排比、模板句、升华结尾）
2. 对话质量 — 对话是否自然、有信息量，是否像真人说话
3. 描写密度 — 是否有过多/过少描写，是否平衡
4. 禁用词 — 是否有高频 AI 词汇

【输出格式】
写入 {project_dir}/.workflow/review-writing.json：
{
  "dimension": "writing",
  "severity": "WARN",
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
    "detect_quality": { "level1_banned": 0, "level2_banned": 2, "ai_situations": 3 }
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
- 情绪爽点：node {skill_dir}/../../_shared/scripts/satisfaction-meter.js --json {稿件路径}

【检查项】（必须全部检查）
1. 爽点密度 — 每 3000-5000 字是否有爽点，分布是否均匀
2. 钩子效果 — 钩子是否足够吸引翻页
3. 题材适配 — 写法是否符合题材特点
4. 平台适配 — 是否适合目标平台

【毒点检测】（LLM 分析，必须检查）
1. 爽文不爽 — 主角是否长期处于被动/弱势而无反击
2. 压制无目的 — 是否有无意义的压制情节（为虐而虐）
3. 反派结局与主角无关 — 反派被处理但主角未获得收益
4. 降智打击 — 配角是否为了衬托主角而集体降智

【输出格式】
写入 {project_dir}/.workflow/review-commercial.json：
{
  "dimension": "commercial",
  "severity": "WARN",
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
    "detect_emotion": { "satisfaction_count": 1, "density": 0.3 }
  },
  "poison_points": [
    {
      "type": "压制无目的",
      "location": "第2-3段",
      "detail": "主角被压制3段后无反击，无目的",
      "suggestion": "增加主角暗中布局或提前反击"
    }
  ],
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
- 必须运行情绪爽点检测脚本
- 必须进行毒点检测（LLM 分析）
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
- 一致性检测：node {skill_dir}/../../_shared/scripts/consistency-check.js --json {稿件路径} {project_dir}

【检查项】（必须全部检查）
1. 事实一致 — 设定/属性是否前后一致，有无矛盾
2. 时间线 — 时间线是否混乱，时序是否合理
3. 伏笔回收 — 已埋伏笔是否有回收，是否有逾期
4. 角色状态 — 角色状态是否跟踪正确

【输出格式】
写入 {project_dir}/.workflow/review-consistency.json：
{
  "dimension": "consistency",
  "severity": "WARN",
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
    "detect_consistency": { "issues": [...] }
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

### 字数达标检测 Agent Prompt（detect-wordcount）— BLOCK

```
你是 detect-wordcount，负责字数达标检测。

【项目信息】
- 工作目录：{project_dir}
- 稿件：.workflow/review-input.md

【输入文件】（必须用 Read 工具读取）
- 稿件全文：{project_dir}/.workflow/review-input.md
- 审查配置：{project_dir}/.workflow/review-config.json

【检测脚本】（必须运行）
- 字数统计：node {skill_dir}/../../_shared/scripts/wordcount.js {稿件路径} --json

【检查项】（必须全部检查）
1. 字数达标 — 章节字数 ≥ 细纲目标的 90%

【输出格式】
写入 {project_dir}/.workflow/review-wordcount.json：
{
  "dimension": "wordcount",
  "severity": "BLOCK",
  "score": 10,
  "items": [
    {
      "check": "字数达标",
      "actual_words": 2500,
      "target_words": 2000,
      "reach_rate": "125%",
      "status": "PASS",
      "detail": "字数达标"
    }
  ],
  "issues": [],
  "strengths": []
}

如果未达标：
{
  "dimension": "wordcount",
  "severity": "BLOCK",
  "score": 0,
  "items": [
    {
      "check": "字数达标",
      "actual_words": 1500,
      "target_words": 2000,
      "reach_rate": "75%",
      "status": "FAIL",
      "detail": "字数不足，仅达标75%，需至少达到90%"
    }
  ],
  "issues": [
    {
      "priority": "P0",
      "type": "字数",
      "location": "全文",
      "problem": "字数未达标",
      "suggestion": "扩充内容至目标字数的90%以上"
    }
  ]
}

【防偷懒】
- 必须用 Read 工具读取稿件
- 必须运行字数统计脚本
- 未达标时必须标注 P0 优先级
```

### 跨章/声音/毒点检测 Agent Prompt（detect-cross-chapter + detect-voice）— WARN

```
你是 detect-cross-chapter + detect-voice，负责跨章重复、角色声音和毒点检测。

【项目信息】
- 工作目录：{project_dir}
- 稿件：.workflow/review-input.md

【输入文件】（必须用 Read 工具读取）
- 稿件全文：{project_dir}/.workflow/review-input.md
- 审查配置：{project_dir}/.workflow/review-config.json
- 角色状态：{project_dir}/追踪/角色状态.md

【检测脚本】（必须运行）
- 跨章检测：node {skill_dir}/../../_shared/scripts/cross-chapter-check.js {稿件路径}
- 声音检测：node {skill_dir}/../../_shared/scripts/voice-check.js {稿件路径} {project_dir}/追踪/角色状态.md

【检查项】（必须全部检查）
1. 跨章重复 — 与前序章节的重复描写
2. 跨章矛盾 — 与前序章节的事实矛盾
3. 角色声音 — 对话是否符合性格锚点
4. 毒点检测（LLM 分析）— 爽文不爽、压制无目的、反派结局与主角无关等

【输出格式】
写入 {project_dir}/.workflow/review-crosschapter.json：
{
  "dimension": "crosschapter_voice",
  "severity": "WARN",
  "score": 7,
  "items": [
    {
      "check": "跨章重复",
      "score": 8,
      "status": "PASS",
      "detail": "无明显重复描写",
      "location": "全文"
    },
    {
      "check": "角色声音",
      "score": 5,
      "status": "WARN",
      "detail": "角色A在第3段使用了过于书面化的表达，不符合其草根设定",
      "location": "第3段"
    }
  ],
  "script_results": {
    "cross_chapter": { "duplicates": [...], "contradictions": [...] },
    "voice_check": { "deviations": [...] }
  },
  "poison_points": [
    {
      "type": "爽文不爽",
      "location": "第2-5段",
      "detail": "主角被压制4段后无反击，读者情绪积压过长",
      "suggestion": "在第5段安排小反击或信息优势展示"
    }
  ],
  "issues": [],
  "strengths": []
}

【防偷懒】
- 必须用 Read 工具读取稿件和角色状态
- 必须运行跨章检测和声音检测脚本
- 必须进行毒点检测（LLM 分析）
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
| 07 | 字数达标检测（子 agent, BLOCK） |
| 08 | 跨章/声音/毒点检测（子 agent） |
| 09 | 综合报告（主 agent） |

### 工作流目录结构

```
.workflow/
├── review-input.md              # 稿件全文
├── review-config.json           # 审查配置（用户偏好）
├── review-structure.json        # 结构审查报告
├── review-character.json        # 人物审查报告
├── review-writing.json          # 文笔审查报告
├── review-commercial.json       # 商业审查报告
├── review-consistency.json      # 一致性审查报告
├── review-wordcount.json        # 字数达标检测报告（BLOCK）
├── review-crosschapter.json     # 跨章/声音/毒点检测报告
└── step-guard.json              # 守卫脚本状态
```

---

## Agent 间通信

- **主 → 子**：通过 `.workflow/review-input.md` 和 `.workflow/review-config.json` 传递
- **子 → 主**：通过 `.workflow/review-{维度}.json` 回传
- **上下文隔离**：所有子 agent 使用 `context: "none"`，不继承主 agent 对话历史

---

## 综合报告模板

### 加权评分规则

| 维度 | 严重度 | 权重 |
|------|--------|------|
| 字数达标 | BLOCK | 2x |
| 文本质量（禁用词+AI腔） | BLOCK | 2x |
| 一致性 | BLOCK | 2x |
| 结构审查 | WARN | 1x |
| 人物审查 | WARN | 1x |
| 文笔审查 | WARN | 1x |
| 商业审查 | WARN | 1x |
| 一致性审查 | WARN | 1x |
| 跨章/声音/毒点 | WARN | 1x |

**综合分计算公式**：
```
综合分 = Σ(各维度分 × 权重) / Σ(权重)
```

**通过规则**：
- **所有 BLOCK 维度 PASS → 审稿通过**
- **任一 BLOCK 维度 FAIL → 审稿不通过，必须修改后复检**
- WARN 维度不影响通过判定，但需列出修改建议

### 报告模板

```markdown
## 审稿报告

### 总体评分
- 结构：{1-10}
- 人物：{1-10}
- 文笔：{1-10}
- 商业性：{1-10}
- 一致性：{1-10}
- 字数：{达标/未达标}
- 跨章/声音：{问题数}
- 综合：{加权平均}

### BLOCK 检查结果
| 维度 | 状态 | 详情 |
|------|------|------|
| 字数达标 | PASS/FAIL | {详情} |
| 文本质量 | PASS/FAIL | {详情} |
| 一致性 | PASS/FAIL | {详情} |

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

### 结论
- ✅ 审稿通过（所有 BLOCK 维度通过）
- ❌ 审稿不通过（{原因}，需修改后复检）
```

---

## 修改后复检流程

当审稿结果为「不通过」时，执行以下复检流程：

### 复检触发条件

- 任一 BLOCK 维度 FAIL
- 用户明确要求复检

### 复检步骤

1. 用户根据修改建议修改稿件
2. 用户运行复检：`/story-review-mimo {项目目录} --recheck`
3. 主 agent 只读取修改后的稿件 + 上一次审稿报告
4. 子 agent **仅复检上次不通过的维度**（不重复已通过的检查）
5. 输出复检报告，标记「复检通过」或「复检不通过 + 剩余问题」

### 复检报告模板

```markdown
## 复检报告

### 复检维度
| 维度 | 上次状态 | 本次状态 | 详情 |
|------|----------|----------|------|
| 字数达标 | FAIL | PASS | 字数已达2500，达标率125% |
| 文本质量 | FAIL | FAIL | 仍有2处Level1禁用词 |

### 结论
- ⚠️ 复检不通过（{剩余问题数} 个问题待修复）
- ✅ 复检通过（所有复检维度通过）
```

### 复检限制

- 最多复检 3 次，超过后建议重新写作
- 每次复检必须明确标注「第 N 次复检」

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

> 规范详见 $globalRefPathtask-tracking-conventions.md`。

**触发时第一步：读取下方固定任务列表，然后逐条创建。不跳步。**

**强制执行顺序**：
1. 读取下方「固定任务列表」
2. 严格按照列表逐条创建任务
3. 逐个执行

#### 固定任务列表（审稿时，逐条创建）

```
# ===== 第1层：父任务 =====
1. task create "T-REVIEW: 审稿「{文件名}」"                    → T-REVIEW

# ===== 第2层：读取 + 7个审查维度 + 综合报告 =====
2. task create "T-REVIEW-01: 读取稿件 + 加载审查规则"            parent=T-REVIEW → T-REVIEW-01
3. task create "T-REVIEW-STRUCT: 结构审查 [子 agent 隔离]"       parent=T-REVIEW → T-REVIEW-STRUCT
4. task create "T-REVIEW-CHAR: 人物审查 [子 agent 隔离]"         parent=T-REVIEW → T-REVIEW-CHAR
5. task create "T-REVIEW-WRITE: 文笔审查 [子 agent 隔离]"        parent=T-REVIEW → T-REVIEW-WRITE
6. task create "T-REVIEW-BIZ: 商业审查 [子 agent 隔离]"          parent=T-REVIEW → T-REVIEW-BIZ
7. task create "T-REVIEW-CON: 一致性审查 [子 agent 隔离]"        parent=T-REVIEW → T-REVIEW-CON
8. task create "T-REVIEW-WC: 字数达标检测 [子 agent 隔离]"       parent=T-REVIEW → T-REVIEW-WC
9. task create "T-REVIEW-CC: 跨章/声音/毒点检测 [子 agent 隔离]" parent=T-REVIEW → T-REVIEW-CC
10. task create "T-REVIEW-REPORT: 综合报告 [主 agent]"           parent=T-REVIEW → T-REVIEW-REPORT
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
| T-REVIEW-WC | 子 agent | `actor({ context: "none" })` |
| T-REVIEW-CC | 子 agent | `actor({ context: "none" })` |
| T-REVIEW-REPORT | 主 agent | 直接执行 |

### 审查顺序

- Step 01（读取）完成后，Step 02-08（7 个审查维度）**并行 spawn**
- 全部审查完成后，Step 09（综合报告）由主 agent 汇总

---

## 流程衔接

| 时机 | 跳转到 |
|------|--------|
| 审完修改 | `story-write-mimo` / `story-short-write-mimo` |
| 发现 AI 味 | `story-deslop-mimo` |
| 审稿不通过 | 修改后复检流程 |

---

## 参考文档

| 文档 | 用途 |
|------|------|
| `references/agent-prompt-templates.md` | 子 Agent Prompt 模板（本文内嵌） |
| $globalRefPathquality-rules.md` | 质量规则（禁用词、AI腔等） |
| `_shared/scripts/wordcount.js` | 字数统计脚本 |
| `_shared/scripts/cross-chapter-check.js` | 跨章节检测脚本 |
| `_shared/scripts/voice-check.js` | 角色声音检测脚本 |
| `_shared/scripts/style-lint.js` | AI 腔+禁用词检测脚本 |
| `_shared/scripts/consistency-check.js` | 一致性检测脚本 |
| `_shared/scripts/emotion-analyzer.js` | 情绪分析脚本 |
| `_shared/scripts/satisfaction-meter.js` | 爽点检测脚本 |
| `../../atoms/detect-quality/SKILL.md` | 文本质量检测原子技能 |
| `../../atoms/detect-wordcount/SKILL.md` | 字数达标检测原子技能 |
| `../../atoms/detect-cross-chapter/SKILL.md` | 跨章检测原子技能 |
| `../../atoms/detect-voice/SKILL.md` | 角色声音检测原子技能 |
| `../../atoms/detect-emotion/SKILL.md` | 情绪爽点检测原子技能 |
| `../../atoms/detect-consistency/SKILL.md` | 一致性检测原子技能 |

---

## 语言

- 跟随用户的语言回复
- 中文回复遵循《中文文案排版指北》
