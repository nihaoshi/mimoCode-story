---
name: story-deslop-mimo
version: 3.1.0
description: |
  网文去AI味。子agent隔离执行：主agent读取文本 → 子agent隔离检测+修复 → 主agent输出结果。
  触发方式：/story-deslop-mimo、/去AI味、「去AI味」「这篇太AI了」
atoms:
  - fix-text
  - fix-dialogue
  - fix-style
inputs:
  - name: project_dir
    type: directory
    required: false
    description: 写作项目根目录（可选，用于输出文件）
---

# story-deslop-mimo v3.0：子 Agent 隔离去 AI 味

## 核心设计

1. **主 agent 读取文本**：读取文件、创建任务树、输出最终结果
2. **子 agent 隔离执行**：检测+修复在隔离上下文中完成，不受对话历史干扰
3. **守卫脚本验证**：每个阶段前后运行守卫脚本，确保输入输出合规
4. **有问题必修**：检测到任何 WARN 或 BLOCK 都必须修复

## 前置检查

执行前必须验证目标文件存在：

```bash
ls {target_file} 2>/dev/null || echo "ERROR: 目标文件不存在"
```

缺失时提示用户：「目标文件 {target_file} 不存在，请检查路径。」

**核心信念：AI味的主要问题不是语法，而是过度圆滑、工整、解释充分。改写目标是保留剧情功能，同时增加口语、停顿、跳跃和具体动作。**

---

## 防偷懒铁律

```
读文件，写文件，跑脚本，给用户看
不凭记忆，不跳步骤，不偷懒
```

**每个阶段执行前后必须运行守卫脚本：**
```bash
node $HOME/.config/mimocode/skills/story-long-write-mimo/scripts/step-guard.js pre  {step} {workflow_dir} {project_dir}
node $HOME/.config/mimocode/skills/story-long-write-mimo/scripts/step-guard.js post {step} {workflow_dir}
```

---

## 执行流程（3 阶段）

```
主 Agent                          子 Agent（隔离）
─────────                        ─────────────────
Phase 1: 读取文本
  ├─ 读取目标文件
  ├─ 创建 .workflow/ 目录
  ├─ 创建任务树
  └─ 守卫 pre/read
                    ──── 传入 .workflow/deslop-input.json ────→
                                                         Phase 2: 检测+修复
                                                           ├─ 守卫 pre/scan
                                                           ├─ AI味扫描
                                                           ├─ 守卫 post/scan
                                                           ├─ 守卫 pre/grade
                                                           ├─ 诊断分级
                                                           ├─ 守卫 post/grade
                                                           ├─ 守卫 pre/fix
                                                           ├─ 逐Gate修复（条件执行）
                                                           ├─ 守卫 post/fix
                                                           ├─ 守卫 pre/recheck
                                                           ├─ 复查（条件执行）
                                                           └─ 守卫 post/recheck
                    ←── 写出 .workflow/deslop-report.json ────
Phase 3: 输出结果
  ├─ 读取报告
  ├─ 将修订写入原文件
  └─ 输出润色报告给用户
```

---

## Task 跟踪集成

> 规范详见 `references/task-tracking-conventions.md`。

**触发时第一步：读取下方固定任务列表，然后逐条创建。不跳步。**

**强制执行顺序**：
1. 读取下方「固定任务列表」
2. 严格按照列表逐条创建任务
3. 逐个执行

#### 固定任务列表（去AI味时，逐条创建）

```
# ===== 第1层：父任务 =====
1. task create "T-DESLOP: 去AI味「{文件名}」"                    → T-DESLOP

# ===== 第2层：3个阶段任务 =====
2. task create "T-DESLOP-READ: Phase1 读取文本 [主Agent]"     parent=T-DESLOP → T-DESLOP-READ
3. task create "T-DESLOP-EXEC: Phase2 检测+修复 [子Agent隔离]" parent=T-DESLOP → T-DESLOP-EXEC
4. task create "T-DESLOP-OUT: Phase3 输出结果 [主Agent]"      parent=T-DESLOP → T-DESLOP-OUT

# ===== 第3层-读取：2个子任务 =====
5. task create "T-DESLOP-READ-01: 读取目标文件+创建工作流目录"    parent=T-DESLOP-READ
6. task create "T-DESLOP-READ-02: 写入 deslop-input.json"        parent=T-DESLOP-READ

# ===== 第3层-执行：4个子任务（子Agent内部） =====
7. task create "T-DESLOP-EXEC-01: AI味扫描（6维度）"              parent=T-DESLOP-EXEC
8. task create "T-DESLOP-EXEC-02: 诊断分级（轻/中/重）"           parent=T-DESLOP-EXEC
9. task create "T-DESLOP-EXEC-03: 逐Gate修复（条件执行）"         parent=T-DESLOP-EXEC
10. task create "T-DESLOP-EXEC-04: 复查（条件执行）"               parent=T-DESLOP-EXEC

# ===== 第3层-输出：3个子任务 =====
11. task create "T-DESLOP-OUT-01: 读取报告+写入修订"              parent=T-DESLOP-OUT
12. task create "T-DESLOP-OUT-02: 统计字数变化"                   parent=T-DESLOP-OUT
13. task create "T-DESLOP-OUT-03: 输出润色报告给用户"             parent=T-DESLOP-OUT
```

### 条件创建规则

| 任务 | 执行时判断 | 跳过则 abandoned |
|------|-----------|-----------------|
| T-DESLOP-EXEC-03 | 诊断为中度或重度时执行 | 轻度则跳过 |
| T-DESLOP-EXEC-04 | 修复后有残留问题时执行 | 无残留则跳过 |

### 循环处理

| 循环 | 触发 | 处理 |
|------|------|------|
| 修正后仍有残留 | RECHECK 发现新问题 | 再执行修复（上限 3 轮） |
| 同段连续 2 轮无改动 | 收敛终止 | 停止循环 |

### 过度保护

- 不得整段删除正文内容
- 删除前确认是否包含伏笔、钩子等关键信息
- 删除比例上限：轻度 ≤15%，中度 ≤25%，重度 ≤35%

---

## Phase 1：读取文本 [主 Agent]

主 Agent 在当前会话中执行，不隔离。

### Step 1：读取目标文件

```
1. 用户提供文件路径或粘贴文本
2. 用 Read 工具读取文件内容
3. 统计原文字数：node $HOME/.config/mimocode/skills/_shared/scripts/wordcount.js {文件路径} --json
```

### Step 2：创建工作流目录

```bash
mkdir -p {project_dir}/.workflow
```

### Step 3：写入输入文件

将原文写入 `.workflow/deslop-input.json`：

```json
{
  "source_file": "正文/第X章.md",
  "original_text": "{全文}",
  "char_count": {从 wordcount.js --json 输出的 char_count 获取},
  "timestamp": "{ISO时间}"
}
```

### 守卫验证

```bash
node $HOME/.config/mimocode/skills/story-long-write-mimo/scripts/step-guard.js pre read {workflow_dir} {project_dir}
# 写入后
node $HOME/.config/mimocode/skills/story-long-write-mimo/scripts/step-guard.js post read {workflow_dir}
```

---

## Phase 2：检测+修复 [子 Agent 隔离]

**全部由子 Agent 执行，上下文完全隔离。**

### 调用方式

```javascript
actor({
  operation: "run",
  subagent_type: "general",
  description: "去AI味：检测+修复",
  prompt: "<见下方 Prompt 模板>",
  context: "none"  // 隔离上下文
})
```

### 子 Agent Prompt 模板

```
你是 deslop-executor，负责检测AI味并修复。

【项目信息】
- 项目目录：{project_dir}
- 工作流目录：{project_dir}/.workflow

【输入文件】（必须用 Read 工具读取）
- 原文：{project_dir}/.workflow/deslop-input.json
- 质量规则：读取 $HOME/.config/mimocode/skills/_shared/references/quality-rules.md
- 禁用词表：读取 $HOME/.config/mimocode/skills/_shared/references/banned-words.md
- 去AI味指南：读取 $HOME/.config/mimocode/skills/_shared/references/anti-ai-writing.md

【强制检测清单】—— 以下 10 个维度必须逐项执行，每项必须打勾确认

□ 1. 一级禁用词扫描
   检查词表：不禁、竟然、仿佛、宛如、犹如、眼中闪过、嘴角勾起、心中一动、 
            心头一震、不由自主、凝视着、深深地、映入眼帘、不由得 等 66 个
   阈值：出现即标记，≥1 处即阻断

□ 2. 二级禁用词扫描
   检查词表：一抹、一丝、一缕、微微、轻轻、缓缓、顿时、突然、深邃、冰冷 等 42 个
   阈值：≥3 处/千字才标记，密度 < 1.5/千字可忽略

□ 3. AI句式检测（正则匹配）
   检查句式：
   - "不是A，而是B" → 直接写B
   - "，带着X"万能状语 → 拆短句
   - "声音不大，却带着X" → 直接写声音特征
   - "仿佛/如/似……一般" 比喻模板 → 删或白描
   - "感到X涌上心头" / "心中涌起X" → 用动作展示
   - "不仅X，更Y" / "既X，又Y" 对称句式 → 只说一个
   - "这一刻，X" / "终于明白X" / "原来，X" 总结句式 → 删或改写
   阈值：≥1 处即标记

□ 4. 程度副词扫描
   检查词表：非常、特别、极其、十分、格外、分外、异常、相当、颇为、无比、极为
   阈值：密度 ≥3/千字 阻断，<3/千字 警告

□ 5. 心理直述（Show Don't Tell）—— ⚠️ 重点检测项
   检查模式（按AI味浓度分层）：
   ─ 一级阻断（出现即修）：
     他/她感到X、他/她感受到X、他/她觉得X
     心中涌起X、心头一震、内心X、脑海浮现X
   ─ 二级警告（高频时修）：
     他/她意识到X、他/她明白X、他/她清楚X、他/她知道X（非对话）
     心里X、心中X、在心底X、从心底X、打心底X
     暗自X、暗暗X、忍不住X、不由得X、不禁X
   ─ 三级提示（建议修）：
     心想/心说/心道/心知/心念/心下了然/心知肚明
   阈值：≥5 处阻断（密度超标），<5 处警告
   修复：全部替换为动作/感官/身体反应，参照以下示例：
   | 心理直述 | 动作替代 |
   |----------|----------|
   | 他感到愤怒 | 他一拳砸在桌上 |
   | 她心里很难过 | 她低头搅杯子 |
   | 他意识到错了 | 他张了张嘴，又闭上了 |
   | 她在心底暗想 | 她盯着杯子出神 |
   | 他不禁叹了口气 | 他胸口起伏了一下 |

□ 6. 对话质量检查
   检查项：
   - 对话标签占比是否 >40%（说/道/问/答 等标签 ÷ 对话句数）
   - 单个标签是否 >5 次（说道、问道、笑道 等）
   - 对话是否书面化（缺少口语词、不完整句、打断、废话）
   修复：减少标签，用动作替代，加口语毛刺

□ 7. 段落/句子长度
   检查项：
   - 段落是否 >4 行 → 拆段
   - 句子是否 >45 字 → 拆句
   - 段落是否 >60 字 → 按句号/动作转折拆开
   修复：逐段重构

□ 8. 排比句式
   检查项：
   - 连续3行以上"是X"结构 → 精简
   - "有的...有的..."句式 → 精简
   - "一边...一边..."句式 → 精简
   - 连续3句以上逗号分隔的并列结构 → 打破
   修复：保留最强一条，其他删或改写

□ 9. 结尾升华
   检查最后一段是否包含：
   - "终于明白""这才意识到" → 删
   - "这就是X""原来X" → 删
   - 全文最后一句是否在做总结/感慨/升华 → 改为动作/对话/场景收尾
   修复：全删或改写为具体动作/场景

□ 10. AI特殊标点
   检查项：
   - 智能引号（" " ' '）→ 替换为直引号（" " ' '）
   - em dash（—）→ 替换为普通破折号（——）
   - 省略号（…）→ 替换为普通省略号（...）
   - 零宽空格（U+200B）、BOM（U+FEFF）等不可见字符 → 清理
   修复：全部替换为普通标点

【诊断分级】
| AI味程度 | 量化标准 | 处理策略 |
|----------|---------|----------|
| 轻度 | 阻断项 ≤5 处，且无 ★★★★★ 句式 | 只过 Gate A + B |
| 中度 | 阻断项 6-15 处，或 1 个 ★★★★★ 句式 | 过 Gate A + B + C + D |
| 重度 | 阻断项 >15 处，或 ≥2 个 ★★★★★ 句式 | 完整 6 Gate + 重点段落重写 |

【修复规则】（按顺序执行）
- Gate A：禁用词替换 → 具体动作/细节描写
- Gate B：句式去套路 → 打破模板化句式（"不是A而是B"→直接写B，删"带着X"等）
- Gate C：心理描写外化 → 动作/感官展示（中度+）
- Gate D：节奏打碎 → 长短句交错，拆长句，破排比（中度+）
- Gate E：对话去腔调 → 加口语词（嗯/啊/那个），加不完整句/打断，去书面化（重度）
- Gate F：结尾去升华 → 动作/场景收尾，删总结感慨（重度）
- 附加：标点清理 → 智能引号→直引号，清理不可见字符

【修复示例参考】
| 原文 | 修复后 | 类型 |
|------|--------|------|
| 他不禁深吸一口气 | 他胸口起伏了一下 | 禁用词 |
| 不是他冷漠，而是他太清楚了 | 他太清楚了 | 句式 |
| 他感到一股暖流涌上心头 | 他鼻子一酸，别过脸 | 心理外化 |
| 她的声音不大，却带着不容置疑的力量 | 她说得很轻，但每个字都像钉子 | 句式 |
| 这一刻，他心中涌起一股暖流 | 他攥紧了口袋里的钥匙 | 句式+心理 |
| "好的，我明白了。"他轻声说道 | "行。"他把烟掐了 | 对话+标签 |
| 他知道这一切都来不及了 | 他看了眼表。过了。 | 心理直述 |

【过度保护】
- 不得整段删除正文内容
- 删除前确认：是否包含伏笔、钩子、角色特征等关键信息
- 删除比例上限：轻度≤15%，中度≤25%，重度≤35%

【收敛终止】
- 同一段连续两轮无改动 → 停止
- 全文上限 3 轮

【输出】（必须用 Write 工具写入）
- 报告文件：{project_dir}/.workflow/deslop-report.json

【报告格式】
{
  "source_file": "正文/第X章.md",
  "original_char_count": {从 wordcount.js --json 获取原文 char_count},
  "revised_char_count": {修复后用 wordcount.js --json 重新统计},
  "char_change": {revised - original},
  "char_change_pct": "{百分比}%",
  "ai_level": "轻度|中度|重度",
  "density": {阻断项/千字},
  "checklist": {
    "banned_words_level1": {命中的一级禁用词列表},
    "banned_words_level2": {命中的二级禁用词列表},
    "ai_sentence_patterns": {命中的AI句式列表},
    "degree_adverbs": {程度副词统计},
    "show_dont_tell": {心理直述统计},
    "dialogue_ratio": {对话标签占比},
    "paragraph_issues": {段落问题列表},
    "parallel_structures": {排比问题列表},
    "ending_sublimation": {结尾升华问题},
    "ai_punctuation": {AI标点问题}
  },
  "gates_applied": ["A", "B", ...],
  "total_fixes": {N},
  "fix_breakdown": {
    "banned_word": {N},
    "sentence_pattern": {N},
    "psychology": {N},
    "rhythm": {N},
    "dialogue": {N},
    "ending": {N},
    "punctuation": {N}
  },
  "fixes": [
    {
      "para_index": {N},
      "gate": "A",
      "before": "原文片段",
      "after": "修改后片段",
      "reason": "禁用词：眼中闪过"
    }
  ],
  "revised_text": "{全文修订版}"
}

【防偷懒铁律】
1. 必须逐项打勾检测清单（10 项缺一不可），不得跳过任何维度
2. 必须用 Read 工具读取输入文件和参考文件
3. 必须实际运行检测，不得只检查部分维度
4. 有问题必须修复，不能只报告不修
5. 必须用 Write 工具写入报告文件
6. 禁止在对话中输出全文修订内容
7. 检测结果必须体现在 checklist 字段中，不得留空
```

### 守卫验证

```bash
# 执行前
node $HOME/.config/mimocode/skills/story-long-write-mimo/scripts/step-guard.js pre exec {workflow_dir} {project_dir}
# 执行后
node $HOME/.config/mimocode/skills/story-long-write-mimo/scripts/step-guard.js post exec {workflow_dir}
```

---

## Phase 2.5：百分制评分（条件创建）

**触发条件**：Phase 2 去AI味修复**无阻断且无警告**后创建

**⚠️ 重要：任何问题都必须处理！**
- quality-gate.js 返回 exit code 2 时，必须修复所有阻断项
- 处理完后重新运行 quality-gate.js 复查
- 复查通过（exit code 0）后才能进入评分
- **有问题必须修复，不可跳过**

**执行方式**：子agent隔离执行

**prompt**：
你是章节评分评审 agent。

## 任务
对去AI味后的章节进行百分制评分。

## 执行步骤
1. 运行评分脚本生成评审任务：
   node $HOME/.config/mimocode/skills/_shared/scripts/writing-scorer.js --json <章节文件> <项目目录> --genre <题材>
2. 读取输出中的 prompt 字段
3. 作为评审 agent，按照 prompt 中的15维度标准对章节打分
4. 将评分结果写入追踪/评分记录.md
5. 返回 JSON 格式结果：{"score": XX, "pass": true/false, "weak_dims": [...], "suggestions": [...]}

## 评分标准
详见 skills/_shared/references/writing-score-rubric.md

**判定规则**：
score >= 90 → 通过，进入 Phase 3
score < 90 → 创建 Phase 2.6 修复任务

### Phase 2.6: 评分修复（条件创建）

**触发条件**：评分 < 90

**执行方式**：子agent隔离执行

**prompt**：
你是章节评分修复 agent。
针对评分不达标的维度进行定向修复。
- 仅修改低分维度涉及的内容
- 修复时参考 writing-score-rubric.md 对应维度标准
- 修复后不得破坏其他维度的得分
- 注意：去AI味修复后的章节，修复时不得重新引入AI腔

**后续流程**：
修复后重新评分 → 仍 < 90 则再修复（上限3轮） → 3轮后仍不达标则阻断

---

## Phase 3：输出结果 [主 Agent]

主 Agent 在当前会话中执行，不隔离。

### Step 1：读取报告

```
1. 用 Read 工具读取 .workflow/deslop-report.json
2. 验证报告格式完整
```

### Step 2：写入修订

```
1. 如果 source_file 存在，将 revised_text 写回原文件
2. 如果是粘贴文本，将修订内容输出给用户
```

### 追踪文件处理说明

去AI味仅修改文风和句式，不改变剧情内容、角色行为、物品状态等。因此**不需要更新追踪文件**（伏笔、时间线、角色状态、物品、环境等均不变）。如果修改导致字数显著变化（>10%），建议重新运行质量门禁检查一致性。

### Step 3：输出润色报告

```
## 去AI味润色报告

### 字数协议
- 原文字符数：{从 wordcount.js --json 获取}
- 修订后字符数：{修复后用 wordcount.js --json 重新统计}
- 净变化：{revised - original}（{百分比}）

### AI味等级
- 等级：{轻度/中度/重度}
- 密度：{X}处/千字
- 执行Gate：{A, B, ...}

### 修改统计
- 总修改数：{N} 处
- 禁用词替换：{N} 处
- 句式调整：{N} 处
- 心理外化：{N} 处
- 节奏调整：{N} 处
- 对话优化：{N} 处
- 结尾处理：{N} 处
- 标点清理：{N} 处

### 修改前后对比
{逐段展示关键修改，标注改动类型}
```

---

## 自然文本基准

| 维度 | 自然文本 | AI味文本 |
|------|----------|----------|
| 段落长度 | 1-3句为主 | 每段4-6句，整齐均匀 |
| 对话标签 | 60%+无标签，用动作替代 | 几乎每句都有"说道/问道" |
| 情绪表达 | 动作展示（"手在抖"） | 直接告诉（"很紧张"） |
| 比喻 | 生活化（"像哈士奇护食"） | 文学化（"如寒冰般"） |
| 语气词 | "嘤""嘶""靠""行吧" | 几乎没有 |
| 排比 | 偶尔1-2个 | 连续3-5个排比 |
| 结尾 | 动作/对话收尾 | 总结/升华/感慨收尾 |

### 自然表达替换参考

- "深吸一口气" → "胸口起伏了一下" / 直接删掉
- "眼中闪过一丝..." → "他垂下眼" / "眯起眼"
- "嘴角勾起一抹..." → "笑了一下，没到眼底"
- "仿佛..." → "像..." / 直接白描
- "不禁..." → 直接写动作
- "缓缓开口" → "说"

---

## Agent 间通信

所有中间结果存放在 `{project_dir}/.workflow/` 目录：

```
.workflow/
├── deslop-input.json       # Phase 1 输出：原文+元数据
└── deslop-report.json      # Phase 2 输出：检测报告+修订全文
```

---

## 使用场景

| 场景 | 操作 |
|------|------|
| "太AI了" | 完整检测+润色 |
| "帮我润色" | 先检测，再润色 |
| "检查下" | 只检测，不修改（子Agent只输出报告，不写 revised_text） |

---

## 参考资料

共享参考文件位于 $globalRefPath`。

| 文件 | 何时加载 |
|------|----------|
| $globalRefPathquality-rules.md` | 统一质量规则（禁用词+AI腔+段落规则） |
| `../story-long-write-mimo/references/agent-prompt-templates.md` | 子Agent Prompt 模板参考 |

---

## Prompt 模板引用

子 Agent 的 Prompt 模板详见 `story-long-write-mimo/references/agent-prompt-templates.md` 中的 `quality-checker-fixer` 模板。去AI味子 Agent 复用相同的隔离执行模式和守卫验证流程。

---

## 流程衔接

| 时机 | 跳转到 |
|------|--------|
| 继续写作 | `story-long-write-mimo` / `story-short-write-mimo` |
| 发现结构问题 | `story-long-analyze-mimo` |

---

## 语言

- 跟随用户的语言回复
- 中文回复遵循《中文文案排版指北》
