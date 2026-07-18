---
name: story-write-mimo
description: >
  统一网文写作入口。支持单章写作、续写、修改、重写。
  通过模式参数控制深度：standard（标准）、fast（快速）、ultra（极致）。
triggers:
  - /story-write-mimo
  - /写章
  - /续写
  - /写正文
  - 「帮我写一章」
  - 「续写下一章」
  - 「写第X章」
---

# story-write-mimo — 统一写作入口

> 版本：1.0.0（优化版）

## 模式选择

| 模式 | 触发词 | 核心差异 |
|------|--------|----------|
| **standard** | 默认 | 完整流程，2轮修复，全检测 |
| **fast** | `fast`、`快速` | 最简记忆包，1轮修复，只检测BLOCK项 |
| **ultra** | `极致`、`深度` | 全量检测+深度检测，3轮评分修复 |
| **batch** | `batch`、`批量` | 一次写2-3章，自适应批量 |
| **revise** | `revise`、`修改`、`重写` | 加载前后章上下文+备份+级联检查 |

## 核心流程（9步）

```
Phase 1: 准备
  Step 01: 目录健全检查 + 细纲验证
  Step 02: 细纲分析 + 对标处理 + 设定决策

Phase 2: 上下文注入
  Step 03: 读取上下文 + 约束生成

Phase 3: 写作
  Step 04: 正文写作

Phase 4: 检测
  Step 05: 脚本检测（BLOCK+WARN）
  Step 06: LLM分析检测（BLOCK+WARN）

Phase 5: 修复（条件）
  Step 07: 综合修复
  Step 08: 复查

Phase 6: 评分（条件）
  Step 08.5: 百分制评分
  Step 08.6: 评分修复（score<90时）

Phase 7: 收尾
  Step 09: 追踪更新 + 设定回写验证
```

## 详细步骤

### Step 01: 目录健全检查 + 细纲验证
**任务**：检查项目目录结构，验证细纲存在。
**输出**：目录状态报告，细纲是否存在。
**验证**：所有必要目录存在，细纲格式正确。

### Step 02: 细纲分析 + 对标处理 + 设定决策
**任务**：分析细纲涉及内容，处理对标文件，确定设定需求。
**输出**：涉及角色/场景列表，设定决策结果。
**验证**：所有涉及角色/场景都有设定文件。

### Step 03: 读取上下文 + 约束生成
**任务**：分层读取上下文，生成写作约束参数。
**分层读取**：
- Layer 1（必读）：追踪/上下文.md，细纲
- Layer 2（按需）：涉及角色/场景设定，追踪状态
- Layer 3（条件）：跨卷伏笔，故事线
**输出**：上下文摘要，约束参数JSON。

### Step 04: 正文写作
**任务**：根据细纲、上下文、约束生成章节正文。
**写作规则**：
1. 直接输出正文，无额外说明
2. 承接上文状态
3. 遵循设定、文笔、情绪、一致性约束
**输出**：章节正文（3000-4000字）。

### Step 05: 脚本检测（BLOCK+WARN）
**检测项**：
- 字数达标（BLOCK）
- 禁用词+AI腔（BLOCK）
- AI标点符号（BLOCK）
- 一致性（BLOCK）
- 跨章节检查（WARN）
**命令**：`node skills/_shared/scripts/quality-gate.js 正文/第XXX章.md 项目目录`
**输出**：检测报告JSON，退出码。

### Step 06: LLM分析检测（BLOCK+WARN）
**检测项**：
- 设定校验（BLOCK）
- 章内逻辑性（WARN）
- 跨卷一致性（WARN）
- 物品/角色/环境一致性（BLOCK）
- 角色声音一致性（WARN）
**输出**：LLM分析报告，问题列表。

### Step 07: 综合修复（条件触发）
**触发条件**：Step 05或Step 06有问题时。
**修复规则**：BLOCK项必须修复，WARN项必须修复，最小改动原则。
**输出**：修复后的章节正文，修复日志。

### Step 08: 复查（条件触发）
**触发条件**：Step 07执行了才执行。
**任务**：重新运行Step 05和Step 06检测。
**修复循环**：检测→修复→复查，上限2轮。

### Step 08.5: 百分制评分（条件触发）
**触发条件**：Step 08复查通过后执行。
**评分维度**：15个维度，总分≥90分通过。
**输出**：评分报告，低分维度列表。

### Step 08.6: 评分修复（条件触发）
**触发条件**：Step 08.5评分<90分时执行。
**修复规则**：每次修复1-2个低分维度，最多3轮。
**输出**：修复后的章节正文，重新评分结果。

### Step 09: 追踪更新 + 设定回写验证
**任务**：按顺序更新6个追踪文件，回写设定文件。
**输出**：更新后的追踪文件，一致性验证报告。

## 质量门禁

### 退出码
- 0: pass（全部通过）
- 1: warn（有警告但无阻断）
- 2: blocked（有阻断项，必须修复）

### 门禁规则
- 退出码2时不得标记任务完成，必须修复后重新运行。
- 退出码0或1时可以继续下一步。

## 防偷懒铁律

1. **必须读文件**：写正文前必须用Read工具读细纲。
2. **必须写文件**：追踪文件必须实际写入。
3. **必须验证**：每步完成后验证输出文件存在且格式正确。
4. **必须展示**：检测结果必须展示给用户。
5. **有问题必修**：BLOCK项和WARN项必须修复。

## Agent契约

### 子agent隔离执行规则
1. 所有子agent使用 `context: "none"` 隔离执行。
2. 中间结果存放在 `.workflow/` 目录。
3. 每步输出JSON文件供下一步读取。
4. 子agent不能直接修改项目文件。

### 输入输出契约
| 步骤 | 输入 | 输出 |
|------|------|------|
| Step 01 | 项目目录 | .workflow/step01-report.json |
| Step 02 | 细纲+项目目录 | .workflow/step02-analysis.json |
| Step 03 | 上下文+约束 | .workflow/step03-context.json |
| Step 04 | 上下文+约束 | 正文/第{X}章.md |
| Step 05 | 正文 | .workflow/step05-report.json |
| Step 06 | 正文+设定+追踪 | .workflow/step06-report.json |
| Step 07 | 检测报告+正文 | 正文（更新后） |
| Step 08 | 正文 | .workflow/step08-report.json |
| Step 09 | 正文+追踪 | 追踪文件（更新后） |

## 参考文档

### 写作时必读
- `skills/_shared/references/quality-rules.md` — 质量规则
- `skills/_shared/references/anti-ai-writing.md` — 去AI味指南
- `skills/_shared/references/style-craft.md` — 写作技法

### 写对话时必读
- `skills/_shared/references/dialogue-mastery.md` — 对话设计

### 控制情绪时必读
- `skills/_shared/references/emotional-arc-design.md` — 情绪弧线
- `skills/_shared/references/emotion-curve-design.md` — 情绪曲线

### 按题材写作时必读
- `skills/_shared/references/genre-writing-formulas.md` — 题材公式
- `skills/_shared/references/genre-writing-techniques.md` — 题材技法