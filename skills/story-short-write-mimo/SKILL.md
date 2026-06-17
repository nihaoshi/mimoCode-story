---
name: story-short-write-mimo
version: 3.0.0
description: |
  短篇网文写作。从构思到成稿，聚焦情绪拉扯与节奏把控。
  触发方式：/story-short-write-mimo、/写短篇、「帮我写一篇短篇」「写个盐言故事」
---

# story-short-write-mimo：短篇网文写作 v3.0

你是短篇网文写作执行器。从构思到成稿，完成一篇完整的短篇小说。

**执行规则：短篇以情绪为目标函数，所有内容为情绪服务。**

---

## 核心设计

1. **子 agent 隔离执行**：正文写作和综合检测由独立子 agent 执行，上下文完全隔离
2. **有问题必修**：质量检测中只要有任何 WARN 或 BLOCK，就必须修复
3. **综合检测**：字数、禁用词、一致性、AI腔合并为一次检测
4. **综合修复**：一个修复 agent 处理所有问题
5. **主 agent 负责**：上下文读取、准备层、追踪更新

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

## 执行规则

1. **先定情绪，再定故事**。动笔前必须确定目标情绪
2. **一个反转撑一篇**。所有铺垫为反转服务
3. **每句话必须有用**。不推动剧情/不铺垫反转/不推高情绪 → 删
4. **开头 3 句定生死，结尾定传播**
5. **默认第一人称**。除非题材明确需要第三人称

---

## 任务树（5步）

```
T-SHORT-WRITE: 写短篇「{标题}」
│
├─── Step 1: 读取上下文 [主 agent]
│    ├── T-SHORT-CTX-01: 确定情绪目标（问用户）
│    ├── T-SHORT-CTX-02: 构思核心框架（梗概+反转+情绪设计+人设）
│    └── T-SHORT-CTX-03: 输出设定.md + 小节大纲.md
│
├─── Step 2: 准备层 [主 agent]
│    ├── T-SHORT-PREP-01: 加载禁用词+文风规则+字数限制
│    ├── T-SHORT-PREP-02: 生成约束参数
│    └── T-SHORT-PREP-03: 写入 .workflow/step-prep.json
│
├─── Step 3: 正文写作 [子 agent 隔离]
│    └── T-SHORT-WRITE-01: 逐场景写作（只写作，不检查）
│
├─── Step 4: 综合检测+修复 [子 agent 隔离]
│    ├── T-SHORT-CHECK-01: 综合质量检测
│    └── [条件] T-SHORT-CHECK-02: 综合修复+复查（最多3轮）
│
└─── Step 5: 追踪更新 [主 agent]
     ├── T-SHORT-TRACK-01: 更新追踪文件（伏笔/时间线/角色/物品/环境/上下文）
     └── T-SHORT-TRACK-02: 输出完成报告
```

---

## 各步骤说明

### Step 1: 读取上下文 [主 agent]

**职责**：确定情绪目标、构思核心框架、输出设定和大纲

#### T-SHORT-CTX-01: 确定情绪目标
- 问用户：**「你想让读者读完什么感觉？有没有想写的题材方向？」**
- 匹配情绪类型：

| 情绪类型 | 适合场景 | 市场热度 |
|----------|----------|----------|
| 意难平 | 虐恋、遗憾、错过 | 🔥🔥🔥 |
| 反转震撼 | 悬疑、身份错位 | 🔥🔥🔥 |
| 爽感释放 | 打脸、逆袭 | 🔥🔥 |
| 治愈温暖 | 成长、亲情、友情 | 🔥🔥 |
| 细思极恐 | 悬疑、心理 | 🔥 |
| 共鸣感动 | 现实、职场、婚姻 | 🔥🔥🔥 |

#### T-SHORT-CTX-02: 构思核心框架

```
## 短篇核心框架

### 基本信息
- 标题（暂定）：{}
- 目标字数：{} 字（通常 8000-20000 字）
- 目标平台：{}
- 情绪目标：{读者读完的感受}

### 一句话梗概
{主角 + 困境 + 反转 + 情绪落点}

### 核心反转
- 反转类型：{身份反转/视角反转/动机反转/时间线反转}
- 反转内容：{一句话描述}
- 铺垫线索：{至少 3 个铺垫点}

### 情绪设计
- 开头情绪：{}（强度 {1-10}）
- 中段情绪：{}（强度 {1-10}）
- 反转情绪：{}（强度 {1-10}，峰值维持 ≥2 节）
- 结尾情绪：{}（强度 {1-10}）

### 人设速写
- 主角：{一句话人设}
- 关键角色：{一句话人设}
- 关系：{他们之间的关系}
```

#### T-SHORT-CTX-03: 输出文件
- 输出 `设定.md` 到项目目录
- 输出 `小节大纲.md` 到项目目录
- 创建项目目录结构：

```
{短篇标题}/
├── 设定.md
├── 小节大纲.md
├── 正文.md
└── .workflow/
    └── step-prep.json
```

---

### Step 2: 准备层 [主 agent]

**职责**：加载约束参数，生成子 agent 所需的输入文件

#### T-SHORT-PREP-01: 加载约束
- 加载禁用词清单（从 `../_shared/references/banned-words.md`）
- 加载文风规则（从 `../_shared/references/anti-ai-writing.md`）
- 确定字数目标（从小节大纲）

#### T-SHORT-PREP-02: 生成约束参数
- 整合所有约束为结构化 JSON

#### T-SHORT-PREP-03: 写入 .workflow/step-prep.json

```json
{
  "title": "短篇标题",
  "word_count_target": 8000,
  "platform": "番茄/盐言/...",
  "emotion_target": "意难平",
  "emotion_intensity": 8,
  "pov": "first_person",
  "banned_words": [...],
  "style_rules": [...],
  "outline_sections": [...]
}
```

---

### Step 3: 正文写作 [子 agent 隔离]

**职责**：只写作，不检查质量

**调用方式**：
```javascript
actor({
  operation: "run",
  subagent_type: "general",
  description: "短篇正文写作",
  prompt: "你是 narrative-writer，负责短篇正文创作...\n\n【输入文件】\n- 设定：{project_dir}/设定.md\n- 小节大纲：{project_dir}/小节大纲.md\n- 约束：{project_dir}/.workflow/step-prep.json\n\n【写作要求】\n1. 严格按照小节大纲逐节写作\n2. 遵守约束参数（禁用词、文风、字数目标）\n3. 只写作，不检查质量\n4. 必须写入文件，不在对话中输出\n\n【质量红线】（写作时直接避开）\n- 禁用词清单中的词绝对不能出现\n- AI腔句式禁止\n- 禁止排比\n- 心理描写≤2句\n- 比喻≤1个/千字\n- 段落≤4行\n- 单句≤45字\n\n【输出】\n- 文件：{project_dir}/正文.md\n- 格式：完整短篇正文",
  context: "none"
})
```

**写作指令**：
- 按三维度织入逐场景写作：发生、感知、反应同时织入同一段
- 按镜头断段：一段只承载一个动作/信息变化
- 优先一段一句，避免一段到底
- 段落 >60 字按句号/动作转折拆开，单句 >45 字拆短

**分段结构**：

| 段落 | 占比 | 要点 |
|------|------|------|
| 开头 | 前300-500字 | 3句内抓住读者，必须包含钩子 |
| 铺垫 | 30-40% | 建立羁绊，埋入3+反转线索 |
| 升级 | 20-30% | 冲突升级，制造紧迫感 |
| 反转 | 10-15% | 一节内完成揭示，情绪冲击>前面所有 |
| 结尾 | 5-10% | 安静细节收尾，余韵或呼应 |

**开头技巧**：

| 技巧 | 示例 |
|------|------|
| 冲突前置 | 「离婚协议放在桌上，他已经签了。」 |
| 信息差钩 | 「她不知道，对面那个男人已经在计划第三次了。」 |
| 反常行为 | 「她把订婚戒指冲进了马桶。」 |
| 悬念句 | 「我死后的第三天，老公发了一条朋友圈。」 |

---

### Step 4: 综合检测+修复 [子 agent 隔离]

**职责**：检测所有问题，有问题必修

**调用方式**：
```javascript
actor({
  operation: "run",
  subagent_type: "general",
  description: "短篇质量检测+修复",
  prompt: "你是 quality-checker-fixer，负责检测和修复。\n\n【项目信息】\n- 项目目录：{project_dir}\n\n【输入文件】\n- 正文：{project_dir}/正文.md\n- 约束：{project_dir}/.workflow/step-prep.json\n\n【检测项】（必须全部运行）\n1. 字数达标 — BLOCK\n2. 禁用词+AI腔 — BLOCK\n3. AI标点符号 — BLOCK\n4. 一致性（物品/角色/环境/时间线）— BLOCK\n5. 章内逻辑性 — WARN\n\n【修复规则】\n- 只有问题（WARN或BLOCK）就必须修复\n- 修复后重新检测，直到全部通过\n- 最多3轮修复循环\n- 不能跳过 WARN\n\n【输出】\n- 更新：{project_dir}/正文.md\n- 报告：{project_dir}/.workflow/step-check-report.json\n\n【防偷懒】\n- 必须用 Read 工具读取输入文件\n- 必须运行所有检测脚本\n- 有问题必须修复，不能跳过\n- 必须写入报告文件",
  context: "none"
})
```

**检测项详细说明**：

| 检测项 | 级别 | 脚本/方法 |
|--------|------|-----------|
| 字数达标 | BLOCK | 统计字数 ≥ 目标字数 |
| 禁用词+AI腔 | BLOCK | 从 banned-words.md 加载检测 |
| AI标点符号 | BLOCK | 标点规范化检查 |
| 一致性 | BLOCK | 物品/角色/环境/时间线一致性 |
| 章内逻辑性 | WARN | LLM 分析逻辑漏洞 |

**修复循环**：
```
检测到 ANY 问题（WARN 或 BLOCK）
  ↓
综合修复（所有问题）
  ↓
复查
  ↓
仍有问题 → 再修复（上限3轮）
  ↓
全部通过 → Step 5
```

---

### Step 5: 追踪更新 [主 agent]

**职责**：更新追踪文件，输出完成报告

#### T-SHORT-TRACK-01: 更新追踪文件

从正文实际提取信息，更新：
1. 追踪/伏笔.md — 新增/回收伏笔
2. 追踪/时间线.md — 新增事件时序
3. 追踪/角色状态.md — 更新角色状态
4. 追踪/物品.md — 更新物品位置
5. 追踪/环境.md — 更新环境描述
6. 追踪/上下文.md — 更新进度摘要

#### T-SHORT-TRACK-02: 输出完成报告

```
## 短篇完成报告

- 标题：{标题}
- 总字数：{字数}
- 情绪目标：{情绪}（强度 {N}）
- 检测结果：PASS / WARN: {N} / BLOCK: {N}
- 修复轮次：{N}
- 文件位置：{path}
```

---

## Agent 间通信

所有中间结果存放在 `{PROJECT_DIR}/.workflow/` 目录：

```
.workflow/
├── step-prep.json            # 准备层输出（约束参数）
├── step-check-report.json    # 综合检测报告
└── step-fix-log.json         # 修复日志（如有）
```

---

## 条件任务

| 任务 | 触发条件 | 跳过则 |
|------|---------|--------|
| T-SHORT-CHECK-02 | 检测有任何WARN或BLOCK | abandoned |

---

## 去AI味前置约束（写作时必须遵守）

> ⚠️ 去AI味不是写完再改，而是写作时就必须遵循的规则。完整指南见 `../_shared/references/anti-ai-writing.md`。

**禁止词汇（出现即删）**：
```
不由得、不禁、宛如、恍若、犹如、恍如、仿佛、
嘴角微微上扬、眼中闪过一丝、心中暗想、一股暖流、
仿佛整个世界都、视线模糊了、声音颤抖着、不禁感叹、
深深地、默默地、轻轻地、缓缓地、凝视着、凝望、
倒映着、诉说着、映照着、如X般、似X一般
```

**禁止句式（出现即改）**：
- "他感到一股X涌上心头" → 用动作/细节代替
- "她的X宛如Y" → 删掉比喻或换新奇比喻
- "这不仅X，更Y" → 只说一个
- "X的同时，Y" → 分成两句
- "这一刻，X" → 直接写X
- "面对X，他选择了Y" → 直接写他Y了
- "尽管X，然而Y" → 直接写Y
- "不是A，而是B" → 直接写B

**程度副词禁用**：非常、特别、极其、十分、格外、分外、异常、相当、颇为、无比、极为

**比喻规则**：每千字不超过1个比喻，且必须是新奇的比喻（读者没见过的）

**心理描写规则**：每次不超过2句，优先用动作替代（口诀：能动手别动心）

**段落规则**：一段不超过4行，一段只承载一个动作/信息变化，单句超过45字拆短

**节奏规则**：紧张处连续短句（3-8字），舒缓处允许长句，关键转折一句极短独立成段

**对话规则**：加入不完整句、打断、废话，口语化，不同角色说话方式要区分

**留白规则**：最强烈的感情不写，最重要的转折不解释，最美的画面不形容

**禁止排比**：禁止连续3句以上相同结构的排比

---

## 参考文档

| 文档 | 用途 |
|------|------|
| `references/writing-workflow.md` | 写作工作流参考 |
| `references/villain-and-reveal.md` | 反派和揭示设计 |
| `references/genre-writing-techniques.md` | 题材写作技法 |
| `references/output-contract.md` | 产出格式规范 |
| `../_shared/references/anti-ai-writing.md` | 去AI味指南（必读） |
| `../_shared/references/banned-words.md` | 禁用词清单 |
| `../_shared/references/format-and-structure.md` | 格式规范 |
| `../_shared/references/writing-craft.md` | 写作技法 |
| `../_shared/references/genre-writing-formulas.md` | 题材公式 |
| `../_shared/references/emotional-methods.md` | 情感设计方法 |
| `../_shared/references/hooks-chapter.md` | 钩子设计 |
| `../_shared/references/reversal-toolkit.md` | 反转工具箱 |
| `../_shared/references/character-basics.md` | 人物基础 |

---

## 流程衔接

| 时机 | 跳转到 |
|------|--------|
| 有参考小说 | `story-short-analyze-mimo` |
| 写完去AI味 | `story-deslop-mimo` |
| 设定太大 | `story-long-write-mimo` |

---

## 语言

- 跟随用户的语言回复
- 中文回复遵循《中文文案排版指北》
