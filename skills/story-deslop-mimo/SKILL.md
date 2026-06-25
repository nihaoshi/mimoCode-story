---
name: story-deslop-mimo
version: 3.0.0
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
node skills/story-long-write-mimo/scripts/workflow-guard.js pre  {step} {workflow_dir} {project_dir}
node skills/story-long-write-mimo/scripts/workflow-guard.js post {step} {workflow_dir}
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
3. 统计原文字数：node skills/_shared/scripts/wordcount.js {文件路径} --json
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
node skills/story-long-write-mimo/scripts/workflow-guard.js pre read {workflow_dir} {project_dir}
# 写入后
node skills/story-long-write-mimo/scripts/workflow-guard.js post read {workflow_dir}
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
- 质量规则：读取 skills/_shared/references/quality-rules.md（含禁用词+AI腔+段落规则）

【检测项】（必须全部运行，对应6个维度）
1. 禁用词扫描 — 统计禁用词数量和位置
2. AI腔句式 — 标记模板化句式位置
3. 心理直述 — 标记"告诉而非展示"的位置
4. 排比/节奏 — 标记连续排比和节奏问题
5. 对话腔调 — 标记过度书面化的对话
6. 结尾升华 — 标记总结性/升华性语句

【诊断分级】
| AI味程度 | 量化标准 | 处理策略 |
|----------|---------|----------|
| 轻度 | 禁用词 ≤5处/千字 | 只过 Gate A + B |
| 中度 | 禁用词 6-15处/千字 | 过 Gate A + B + C + D |
| 重度 | 禁用词 >15处/千字 | 完整 6 Gate + 重点段落重写 |

【修复规则】（按顺序执行）
- Gate A：禁用词替换 → 具体动作/细节描写
- Gate B：句式去套路 → 打破模板化句式
- Gate C：心理描写外化 → 动作/感官展示（中度+）
- Gate D：节奏打碎 → 长短句交错（中度+）
- Gate E：对话去腔调 → 加口语化（重度）
- Gate F：结尾去升华 → 动作/场景收尾（重度）
- 附加：标点清理 → 智能引号→直引号，清理不可见字符

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
  "density": {禁用词/千字},
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

【防偷懒】
- 必须用 Read 工具读取输入文件
- 必须实际运行检测，不能跳过任何维度
- 有问题必须修复，不能只报告不修
- 必须用 Write 工具写入报告文件
- 禁止在对话中输出全文修订内容
```

### 守卫验证

```bash
# 执行前
node skills/story-long-write-mimo/scripts/workflow-guard.js pre exec {workflow_dir} {project_dir}
# 执行后
node skills/story-long-write-mimo/scripts/workflow-guard.js post exec {workflow_dir}
```

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

共享参考文件位于 `../_shared/references/`。

| 文件 | 何时加载 |
|------|----------|
| `_shared/references/quality-rules.md` | 统一质量规则（禁用词+AI腔+段落规则） |
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
