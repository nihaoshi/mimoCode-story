# 原子化重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将23个网文技能拆分为45个原子技能，旧技能保留并内部重构为调用原子，支持自由编排组合

**Architecture:** 原子技能在 `skills/atoms/` 目录，每个原子一个 SKILL.md（<50行）。脚本提升到 `_shared/scripts/`。旧技能内部改为声明原子依赖+按步骤调用。

**Tech Stack:** Markdown（SKILL.md）、Node.js 14+（脚本）

---

## 文件结构总览

```
skills/
├── atoms/
│   ├── ATOMS-REGISTRY.md           ← 原子清单+接口规范
│   ├── detect-banned-words/SKILL.md
│   ├── detect-ai-sentence/SKILL.md
│   ├── ... (45个原子)
│   └── generate-chapter/SKILL.md
├── _shared/scripts/                ← 脚本提升到这里
│   ├── quality-gate.js
│   ├── style-lint.js
│   ├── ... (14个从long-write移来)
│   └── punctuation-normalize.js    ← 合并后版本
├── story-long-write-mimo/          ← 内部重构
│   ├── SKILL.md
│   └── references/                 ← 保留
├── quality-mimo/                   ← 内部重构
├── story-deslop-mimo/              ← 内部重构
├── story-review-mimo/              ← 内部重构
└── ... (其他技能保留)
```

---

## Phase 1：脚本重组

### Task 1.1：审计脚本依赖

**Covers:** S6

**Files:**
- Read: `skills/story-long-write-mimo/scripts/*.js`（14个脚本）
- Read: `skills/_shared/scripts/*.js`（6个共享脚本）
- Read: `skills/story-short-write-mimo/scripts/quality-gate.js`

- [ ] **Step 1: 扫描所有脚本的 require 路径**

```bash
cd D:\mimocode-story
# 扫描所有脚本中的 require 语句
rg "require\(" skills/story-long-write-mimo/scripts/ --no-heading
rg "require\(" skills/_shared/scripts/ --no-heading
rg "require\(" skills/story-short-write-mimo/scripts/ --no-heading
```

记录所有相对路径依赖，用于后续更新。

- [ ] **Step 2: 扫描所有 SKILL.md 中的脚本路径引用**

```bash
rg "story-long-write-mimo/scripts/" skills/ --include="*.md" --no-heading
```

记录所有引用了 long-write 脚本的 SKILL.md 文件。

- [ ] **Step 3: 记录审计结果**

将发现的依赖关系写入 `docs/compose/plans/script-audit-results.md`

---

### Task 1.2：移动脚本到 _shared/scripts/

**Covers:** S6

**Files:**
- Move: `skills/story-long-write-mimo/scripts/*.js` → `skills/_shared/scripts/`
- Keep: `skills/story-long-write-mimo/scripts/` 目录（清空后删除）

- [ ] **Step 1: 复制脚本到 _shared/scripts/**

```powershell
# 复制（不移动，先保留原文件作为备份）
Copy-Item "skills\story-long-write-mimo\scripts\quality-gate.js" "skills\_shared\scripts\"
Copy-Item "skills\story-long-write-mimo\scripts\style-lint.js" "skills\_shared\scripts\"
Copy-Item "skills\story-long-write-mimo\scripts\consistency-check.js" "skills\_shared\scripts\"
Copy-Item "skills\story-long-write-mimo\scripts\foreshadow-check.js" "skills\_shared\scripts\"
Copy-Item "skills\story-long-write-mimo\scripts\voice-check.js" "skills\_shared\scripts\"
Copy-Item "skills\story-long-write-mimo\scripts\emotion-analyzer.js" "skills\_shared\scripts\"
Copy-Item "skills\story-long-write-mimo\scripts\satisfaction-meter.js" "skills\_shared\scripts\"
Copy-Item "skills\story-long-write-mimo\scripts\cross-chapter-check.js" "skills\_shared\scripts\"
Copy-Item "skills\story-long-write-mimo\scripts\detect-story-gaps.js" "skills\_shared\scripts\"
Copy-Item "skills\story-long-write-mimo\scripts\full-consistency-audit.js" "skills\_shared\scripts\"
Copy-Item "skills\story-long-write-mimo\scripts\wordcount-pacer.js" "skills\_shared\scripts\"
Copy-Item "skills\story-long-write-mimo\scripts\detect-python.js" "skills\_shared\scripts\"
Copy-Item "skills\story-long-write-mimo\scripts\repair-scripts.js" "skills\_shared\scripts\"
Copy-Item "skills\story-long-write-mimo\scripts\normalize-punctuation.js" "skills\_shared\scripts\"
```

- [ ] **Step 2: 更新脚本内部的 require 路径**

对每个复制到 `_shared/scripts/` 的脚本，检查并更新其 `require()` 中的相对路径。主要变化：
- `require('./banned-words.js')` → 保持不变（同目录）
- `require('./style-lint.js')` → 保持不变（同目录）
- 引用 `__dirname` 的路径 → 保持不变

- [ ] **Step 3: 验证脚本可运行**

```bash
cd D:\mimocode-story
# 测试禁用词检测
node skills/_shared/scripts/style-lint.js demo/让你管账号，你高燃混剪炸全网/正文/第1章.txt --banned-only
# 测试质量门禁
node skills/_shared/scripts/quality-gate.js demo/让你管账号，你高燃混剪炸全网/正文/第1章.txt
```

- [ ] **Step 4: 删除原目录脚本**

```powershell
Remove-Item "skills\story-long-write-mimo\scripts\*.js" -Force
```

---

### Task 1.3：合并标点规范化脚本

**Covers:** S6

**Files:**
- Read: `skills/_shared/scripts/punctuation-normalize.js`（312行，基础版）
- Read: `skills/_shared/scripts/normalize-punctuation.js`（359行，增强版）
- Modify: `skills/_shared/scripts/punctuation-normalize.js`（合并后覆盖）

- [ ] **Step 1: 对比两个脚本的功能差异**

```bash
cd D:\mimocode-story
# 查看增强版独有的功能
rg "引号|破折号|em-dash|quote" skills/_shared/scripts/normalize-punctuation.js
```

- [ ] **Step 2: 将增强版功能合并到基础版**

在 `punctuation-normalize.js` 中增加：
- 引号模式切换（中文引号 ↔ 直角引号）
- 破折号智能替换
- 保留基础版的简洁接口

- [ ] **Step 3: 删除增强版**

```powershell
Remove-Item "skills\_shared\scripts\normalize-punctuation.js" -Force
```

- [ ] **Step 4: 验证合并后脚本**

```bash
node skills/_shared/scripts/punctuation-normalize.js demo/让你管账号，你高燃混剪炸全网/正文/第1章.txt
```

---

### Task 1.4：更新所有脚本路径引用

**Covers:** S6

**Files:**
- Modify: `skills/quality-mimo/SKILL.md`
- Modify: `skills/audit-mimo/SKILL.md`
- Modify: `skills/story-session-mimo/SKILL.md`
- Modify: `skills/goal-mimo/SKILL.md`
- Modify: `skills/story-export-mimo/SKILL.md`
- Modify: `skills/story-long-write-mimo/SKILL.md`
- Modify: `skills/story-short-write-mimo/SKILL.md`

- [ ] **Step 1: 更新 quality-mimo 中的脚本路径**

将 `story-long-write-mimo/scripts/quality-gate.js` → `_shared/scripts/quality-gate.js` 等

- [ ] **Step 2: 更新 audit-mimo 中的脚本路径**

将 `story-long-write-mimo/scripts/full-consistency-audit.js` → `_shared/scripts/full-consistency-audit.js`

- [ ] **Step 3: 更新 story-session-mimo 中的脚本路径**

将 `story-long-write-mimo/scripts/detect-story-gaps.js` → `_shared/scripts/detect-story-gaps.js`

- [ ] **Step 4: 更新 goal-mimo 中的脚本路径**

将 `quality-gate.js` 路径更新

- [ ] **Step 5: 更新 story-export-mimo 中的脚本路径**

将 `normalize-punctuation.js` → `_shared/scripts/punctuation-normalize.js`

- [ ] **Step 6: 更新 story-long-write-mimo 中的脚本路径**

将所有 `scripts/xxx.js` → `_shared/scripts/xxx.js`

- [ ] **Step 7: 更新 story-short-write-mimo 中的脚本路径**

将 `_shared/scripts/punctuation-normalize.js` 路径确认正确

- [ ] **Step 8: 全量验证脚本调用**

```bash
cd D:\mimocode-story
# 搜索所有仍引用旧路径的地方
rg "story-long-write-mimo/scripts/" skills/ --include="*.md"
# 应该返回空
```

---

## Phase 2：创建原子技能

### Task 2.1：创建原子目录和注册表

**Covers:** S3, S4

**Files:**
- Create: `skills/atoms/ATOMS-REGISTRY.md`

- [ ] **Step 1: 创建 atoms 目录**

```powershell
New-Item -ItemType Directory -Path "skills\atoms" -Force
```

- [ ] **Step 2: 创建 ATOMS-REGISTRY.md**

```markdown
# 原子技能注册表

> 自动检测类、修正类、评审类、写前预防类、扫榜类、拆文类、写作类原子技能

## 使用方式

### 直接调用
`/atom:detect-banned-words` - 直接运行单个原子

### 编排组合
在新 SKILL.md 中引用原子：
```yaml
atoms:
  - detect-banned-words
  - fix-banned-words
```

## 原子清单

### 检测类 (detect)
| ID | 名称 | 脚本 | 严重度 |
|----|------|------|--------|
| detect-banned-words | 禁用词检测 | style-lint.js | BLOCK |
| detect-ai-sentence | AI腔检测 | style-lint.js | WARN |
| detect-consistency | 一致性检测 | consistency-check.js | BLOCK |
| detect-foreshadow | 伏笔检测 | foreshadow-check.js | WARN |
| detect-wordcount | 字数检测 | quality-gate.js | BLOCK |
| detect-voice | 角色声音检测 | voice-check.js | WARN |
| detect-emotion-curve | 情绪曲线检测 | emotion-analyzer.js | WARN |
| detect-cross-chapter | 跨章重复检测 | cross-chapter-check.js | WARN |
| detect-satisfaction | 爽点密度检测 | satisfaction-meter.js | WARN |
| detect-story-gaps | 设定缺口检测 | detect-story-gaps.js | WARN |
| full-consistency-audit | 全量一致性审计 | full-consistency-audit.js | BLOCK |

### 修正类 (fix)
| ID | 名称 | 实现 | Gate |
|----|------|------|------|
| fix-banned-words | 禁用词自动替换 | LLM | A |
| fix-ai-sentence | 句式去套路化 | LLM | B |
| fix-psychology-externalize | 心理外化 | LLM | C |
| fix-rhythm-break | 节奏打散 | LLM | D |
| fix-dialogue-naturalize | 对话去腔调 | LLM | E |
| fix-ending-desublimate | 结尾去升华 | LLM | F |
| fix-punctuation | 标点规范化 | punctuation-normalize.js | - |

### 评审类 (review)
| ID | 名称 | 维度 |
|----|------|------|
| review-structure | 结构评审 | 钩子/情绪/节奏 |
| review-character | 角色评审 | 一致性/动机/弧线 |
| review-writing | 文笔评审 | AI腔/对话/描写 |
| review-commercial | 商业评审 | 爽点/钩子/适配 |
| review-consistency | 一致性评审 | 事实/时间线/伏笔 |

### 写前预防类 (pre-write)
| ID | 名称 | 实现 |
|----|------|------|
| rules-engine | 规则引擎 | LLM |
| pre-write-checklist | 写前检查清单 | detect-story-gaps.js |
| prompt-template-inject | Prompt模板注入 | LLM |
| banned-words-preload | 禁用词预加载 | banned-words.js |
| style-constraint-gen | 风格约束生成 | LLM |
| character-anchor-load | 角色锚点加载 | LLM |

### 扫榜类 (scan)
| ID | 名称 | 实现 |
|----|------|------|
| scrape-platform | 平台数据采集 | scraper脚本 |
| analyze-trend | 题材趋势分析 | LLM |
| generate-topic-decision | 选题决策生成 | LLM |
| analyze-reader-profile | 读者画像分析 | LLM |

### 拆文类 (analyze)
| ID | 名称 | 实现 |
|----|------|------|
| extract-summary | 概要提取 | LLM |
| analyze-golden-chapters | 黄金三章拆解 | LLM |
| extract-chapter-summary | 逐章摘要提取 | LLM |
| analyze-aggregate | 聚合分析 | LLM |
| extract-settings | 设定提取 | LLM |
| extract-characters | 角色提取 | LLM |
| extract-style | 文风提取 | LLM |

### 写作类 (write)
| ID | 名称 | 实现 |
|----|------|------|
| design-volume-outline | 卷纲设计 | LLM |
| design-chapter-outline | 细纲设计 | LLM |
| design-character | 角色设计 | LLM |
| design-worldbuilding | 世界观设计 | LLM |
| generate-chapter | 正文生成 | LLM |
```

---

### Task 2.2：创建检测类原子技能（11个）

**Covers:** S3, S4

**Files:**
- Create: `skills/atoms/detect-banned-words/SKILL.md`
- Create: `skills/atoms/detect-ai-sentence/SKILL.md`
- Create: `skills/atoms/detect-consistency/SKILL.md`
- Create: `skills/atoms/detect-foreshadow/SKILL.md`
- Create: `skills/atoms/detect-wordcount/SKILL.md`
- Create: `skills/atoms/detect-voice/SKILL.md`
- Create: `skills/atoms/detect-emotion-curve/SKILL.md`
- Create: `skills/atoms/detect-cross-chapter/SKILL.md`
- Create: `skills/atoms/detect-satisfaction/SKILL.md`
- Create: `skills/atoms/detect-story-gaps/SKILL.md`
- Create: `skills/atoms/full-consistency-audit/SKILL.md`

每个原子 SKILL.md 模板：

```yaml
---
name: {atom-id}
version: 1.0.0
description: {描述}
category: detect
inputs:
  - name: target
    type: file_path
    required: true
    description: 目标文件路径
outputs:
  - name: report
    type: report
    format: markdown
severity: {BLOCK|WARN}
script: _shared/scripts/{script-name}.js
triggers:
  - /atom:{atom-id}
  - {中文触发词}
---

# {atom-id}

## 功能
{功能描述}

## 执行步骤
1. 读取输入文件
2. 运行脚本：`node skills/_shared/scripts/{script}.js {input}`
3. 解析输出，格式化为标准报告

## 输出格式
{标准报告格式}
```

- [ ] **Step 1: 创建 detect-banned-words/SKILL.md**

```yaml
---
name: detect-banned-words
version: 1.0.0
description: 扫描章节中的Level1/Level2禁用词
category: detect
inputs:
  - name: chapter_file
    type: file_path
    required: true
    description: 章节文件路径
outputs:
  - name: report
    type: report
    format: markdown
severity: BLOCK
script: _shared/scripts/style-lint.js
triggers:
  - /atom:detect-banned-words
  - 检测禁用词
---

# detect-banned-words

## 功能
扫描指定章节中的 Level1（31词）和 Level2（18词）禁用词。

## 执行步骤
1. 读取 {chapter_file}
2. 运行：`node skills/_shared/scripts/style-lint.js {chapter_file} --banned-only`
3. 输出禁用词列表

## 输出格式
### 禁用词检测报告
- 文件：{chapter_file}
- Level1 禁用词：N 个
- Level2 禁用词：N 个

| 禁用词 | 级别 | 位置 | 上下文 |
|--------|------|------|--------|
```

- [ ] **Step 2: 创建 detect-ai-sentence/SKILL.md**

```yaml
---
name: detect-ai-sentence
version: 1.0.0
description: 检测AI写作痕迹（排比/句式/标签）
category: detect
inputs:
  - name: chapter_file
    type: file_path
    required: true
outputs:
  - name: report
    type: report
severity: WARN
script: _shared/scripts/style-lint.js
triggers:
  - /atom:detect-ai-sentence
  - 检测AI腔
---

# detect-ai-sentence

## 功能
检测章节中的AI写作痕迹：排比句式、标签化表达、过度修饰。

## 执行步骤
1. 运行：`node skills/_shared/scripts/style-lint.js {chapter_file} --ai-only`
2. 输出AI腔检测报告
```

- [ ] **Step 3: 创建 detect-consistency/SKILL.md**

```yaml
---
name: detect-consistency
version: 1.0.0
description: 交叉验证追踪文件的一致性（物品/环境/角色/时间线）
category: detect
inputs:
  - name: chapter_file
    type: file_path
    required: true
  - name: tracking_dir
    type: dir_path
    required: true
    description: 追踪目录路径
outputs:
  - name: report
    type: report
severity: BLOCK
script: _shared/scripts/consistency-check.js
triggers:
  - /atom:detect-consistency
  - 检测一致性
---

# detect-consistency

## 功能
将章节内容与追踪文件交叉验证，检查物品位置、环境描述、角色状态、时间线是否一致。

## 执行步骤
1. 运行：`node skills/_shared/scripts/consistency-check.js {chapter_file} --tracking-dir {tracking_dir}`
2. 输出一致性报告
```

- [ ] **Step 4: 创建其余8个检测原子**

按同样模板创建：
- `detect-foreshadow/SKILL.md` → foreshadow-check.js
- `detect-wordcount/SKILL.md` → quality-gate.js（字数检查部分）
- `detect-voice/SKILL.md` → voice-check.js
- `detect-emotion-curve/SKILL.md` → emotion-analyzer.js
- `detect-cross-chapter/SKILL.md` → cross-chapter-check.js
- `detect-satisfaction/SKILL.md` → satisfaction-meter.js
- `detect-story-gaps/SKILL.md` → detect-story-gaps.js
- `full-consistency-audit/SKILL.md` → full-consistency-audit.js

---

### Task 2.3：创建修正类原子技能（7个）

**Covers:** S3, S4

**Files:**
- Create: `skills/atoms/fix-banned-words/SKILL.md`
- Create: `skills/atoms/fix-ai-sentence/SKILL.md`
- Create: `skills/atoms/fix-psychology-externalize/SKILL.md`
- Create: `skills/atoms/fix-rhythm-break/SKILL.md`
- Create: `skills/atoms/fix-dialogue-naturalize/SKILL.md`
- Create: `skills/atoms/fix-ending-desublimate/SKILL.md`
- Create: `skills/atoms/fix-punctuation/SKILL.md`

修正类原子的模板（LLM驱动）：

```yaml
---
name: {atom-id}
version: 1.0.0
description: {描述}
category: fix
inputs:
  - name: chapter_file
    type: file_path
    required: true
  - name: report
    type: report
    required: false
    description: 检测报告（来自detect原子）
outputs:
  - name: fixed_text
    type: text
severity: BLOCK
triggers:
  - /atom:{atom-id}
---

# {atom-id}

## 功能
{修正功能描述}

## 参考文档
- references/_shared/references/banned-words.md（禁用词列表）
- references/_shared/references/anti-ai-writing.md（去AI味方法）

## 执行步骤
1. 读取 {chapter_file}
2. 如果有检测报告，定位问题区域
3. 按以下规则修正：
   {具体修正规则}
4. 输出修正后文本

## 输出格式
### 修正报告
- 文件：{chapter_file}
- 修正项数：N
- 修正详情：
  | 位置 | 原文 | 修正后 | 原因 |
```

- [ ] **Step 1: 创建 fix-banned-words/SKILL.md**

修正规则：将禁用词替换为推荐表达，参考 `banned-words.md` 中的替换建议。

- [ ] **Step 2: 创建 fix-ai-sentence/SKILL.md**（Gate B）

修正规则：
- "不是A而是B" → 改为直接描写
- "带着X" → 改为具体动作
- "仿佛/宛如/恰似" → 删除或改为直接描写
- 排比句 → 打散为独立句子

- [ ] **Step 3: 创建 fix-psychology-externalize/SKILL.md**（Gate C）

修正规则：将"他感到愤怒"等直接心理描写转为动作展示（攥紧拳头、咬牙等）。

- [ ] **Step 4: 创建 fix-rhythm-break/SKILL.md**（Gate D）

修正规则：
- 打断排比结构
- 长句拆短
- 段落长短交错

- [ ] **Step 5: 创建 fix-dialogue-naturalize/SKILL.md**（Gate E）

修正规则：
- 加口语化（省略、打断）
- 删除解释性对话
- 减少对话标签

- [ ] **Step 6: 创建 fix-ending-desublimate/SKILL.md**（Gate F）

修正规则：
- 删除总结性语句
- 用动作/场景收尾
- 删"总之/总而言之/不得不说"

- [ ] **Step 7: 创建 fix-punctuation/SKILL.md**

```yaml
---
name: fix-punctuation
version: 1.0.0
description: 清理AI特殊标点、不可见字符
category: fix
inputs:
  - name: chapter_file
    type: file_path
    required: true
outputs:
  - name: fixed_text
    type: text
script: _shared/scripts/punctuation-normalize.js
triggers:
  - /atom:fix-punctuation
  - 标点规范化
---

# fix-punctuation

## 执行步骤
1. 运行：`node skills/_shared/scripts/punctuation-normalize.js {chapter_file}`
2. 输出修正后文本
```

---

### Task 2.4：创建评审类原子技能（5个）

**Covers:** S3, S4

**Files:**
- Create: `skills/atoms/review-structure/SKILL.md`
- Create: `skills/atoms/review-character/SKILL.md`
- Create: `skills/atoms/review-writing/SKILL.md`
- Create: `skills/atoms/review-commercial/SKILL.md`
- Create: `skills/atoms/review-consistency/SKILL.md`

评审类原子模板（LLM驱动）：

```yaml
---
name: {atom-id}
version: 1.0.0
description: {描述}
category: review
inputs:
  - name: chapter_file
    type: file_path
    required: true
  - name: context
    type: file_path
    required: false
    description: 上下文文件（角色设定/题材定位等）
outputs:
  - name: review_report
    type: report
triggers:
  - /atom:{atom-id}
---

# {atom-id}

## 功能
{评审维度描述}

## 执行步骤
1. 读取 {chapter_file}
2. 如有上下文文件，一并读取
3. 按以下维度打分（1-10）：
   {评分标准}
4. 列出问题清单（P0/P1/P2）

## 输出格式
### {维度}评审报告
- 评分：X/10
- 问题清单：
  | 严重度 | 位置 | 问题描述 | 建议 |
```

- [ ] **Step 1: 创建 review-structure/SKILL.md**

评分维度：钩子效果、情绪曲线起伏、节奏控制、反转设计、章尾钩子

- [ ] **Step 2: 创建 review-character/SKILL.md**

评分维度：角色一致性、动机合理性、弧线完整性、配角立体度
输入额外需要：角色设定文件

- [ ] **Step 3: 创建 review-writing/SKILL.md**

评分维度：AI腔程度、对话质量、描写密度、禁用词使用

- [ ] **Step 4: 创建 review-commercial/SKILL.md**

评分维度：爽点密度、钩子效果、题材适配度、平台适配度
输入额外需要：题材定位文件

- [ ] **Step 5: 创建 review-consistency/SKILL.md**

评分维度：事实一致性、时间线合理性、伏笔管理、角色状态一致性
输入额外需要：追踪文件

---

### Task 2.5：创建写前预防类原子技能（6个）

**Covers:** S3, S4

**Files:**
- Create: `skills/atoms/rules-engine/SKILL.md`
- Create: `skills/atoms/pre-write-checklist/SKILL.md`
- Create: `skills/atoms/prompt-template-inject/SKILL.md`
- Create: `skills/atoms/banned-words-preload/SKILL.md`
- Create: `skills/atoms/style-constraint-gen/SKILL.md`
- Create: `skills/atoms/character-anchor-load/SKILL.md`

- [ ] **Step 1: 创建 rules-engine/SKILL.md**

```yaml
---
name: rules-engine
version: 1.0.0
description: 根据题材/平台/风格自动选择适用规则
category: pre-write
inputs:
  - name: genre_file
    type: file_path
    required: true
    description: 题材定位.md
  - name: config_file
    type: file_path
    required: false
    description: .story-config.json
outputs:
  - name: ruleset
    type: yaml
triggers:
  - /atom:rules-engine
  - 规则引擎
---

# rules-engine

## 功能
读取题材定位和项目配置，生成本次写作适用的规则集。

## 执行步骤
1. 读取 {genre_file}（题材定位.md）
2. 读取 {config_file}（.story-config.json，如存在）
3. 从 `references/genre-writing-formulas.md` 匹配题材规则
4. 从 `references/publishing-guide.md` 匹配平台规则
5. 输出规则集 YAML

## 输出格式
```yaml
genre: {题材名}
platform: {平台名}
style: {风格要求}
avoid: [避免列表]
word_count_target: {字数目标}
banned_words_level: {1|2}
```
```

- [ ] **Step 2: 创建 pre-write-checklist/SKILL.md**

脚本：detect-story-gaps.js
检查项：细纲存在、上一章存在、角色状态.md 存在、伏笔.md 存在、文风.md 存在

- [ ] **Step 3: 创建 prompt-template-inject/SKILL.md**

输入：规则集 + 角色锚点
输出：注入AI上下文的约束文本段

- [ ] **Step 4: 创建 banned-words-preload/SKILL.md**

脚本：banned-words.js
输出：Level1 + Level2 禁用词完整列表文本

- [ ] **Step 5: 创建 style-constraint-gen/SKILL.md**

输入：题材定位.md + 平台
参考：genre-writing-formulas.md + publishing-guide.md
输出：风格约束文本

- [ ] **Step 6: 创建 character-anchor-load/SKILL.md**

输入：追踪/角色状态.md
输出：各角色性格锚点摘要

---

### Task 2.6：创建扫榜类原子技能（4个）

**Covers:** S3, S4

**Files:**
- Create: `skills/atoms/scrape-platform/SKILL.md`
- Create: `skills/atoms/analyze-trend/SKILL.md`
- Create: `skills/atoms/generate-topic-decision/SKILL.md`
- Create: `skills/atoms/analyze-reader-profile/SKILL.md`

- [ ] **Step 1: 创建 scrape-platform/SKILL.md**

输入：平台名 + 榜单类型
脚本：根据平台选择对应 scraper（qidian/fanqie/jjwxc/ciweimao/qimao/dz/heiyan）
输出：结构化排行数据

- [ ] **Step 2: 创建 analyze-trend/SKILL.md**

输入：排行数据
输出：题材热度趋势分析

- [ ] **Step 3: 创建 generate-topic-decision/SKILL.md**

输入：趋势数据 + 用户偏好
输出：选题决策.md

- [ ] **Step 4: 创建 analyze-reader-profile/SKILL.md**

输入：平台数据
参考：reader-profiling.md
输出：读者画像报告

---

### Task 2.7：创建拆文类原子技能（7个）

**Covers:** S3, S4

**Files:**
- Create: `skills/atoms/extract-summary/SKILL.md`
- Create: `skills/atoms/analyze-golden-chapters/SKILL.md`
- Create: `skills/atoms/extract-chapter-summary/SKILL.md`
- Create: `skills/atoms/analyze-aggregate/SKILL.md`
- Create: `skills/atoms/extract-settings/SKILL.md`
- Create: `skills/atoms/extract-characters/SKILL.md`
- Create: `skills/atoms/extract-style/SKILL.md`

- [ ] **Step 1: 创建 extract-summary/SKILL.md**

输入：原始文本
输出：概要.md + 章节索引
对应：analyze Stage 0

- [ ] **Step 2: 创建 analyze-golden-chapters/SKILL.md**

输入：前3章原文
输出：第1-3章_深度拆解.md + 快速预览.md
对应：analyze Stage 1

- [ ] **Step 3: 创建 extract-chapter-summary/SKILL.md**

输入：分块章节
输出：章节摘要.md
对应：analyze Stage 2

- [ ] **Step 4: 创建 analyze-aggregate/SKILL.md**

输入：全部摘要
输出：剧情/*.md + 故事线.md
对应：analyze Stage 3

- [ ] **Step 5: 创建 extract-settings/SKILL.md**

输入：Stage 2-3 数据
输出：设定/*.md
对应：analyze Stage 4

- [ ] **Step 6: 创建 extract-characters/SKILL.md**

输入：Stage 2-3 数据
输出：角色/*.md
对应：analyze Stage 4

- [ ] **Step 7: 创建 extract-style/SKILL.md**

输入：拆文报告 + 原文
输出：文风.md
对应：analyze Stage 6

---

### Task 2.8：创建写作类原子技能（5个）

**Covers:** S3, S4

**Files:**
- Create: `skills/atoms/design-volume-outline/SKILL.md`
- Create: `skills/atoms/design-chapter-outline/SKILL.md`
- Create: `skills/atoms/design-character/SKILL.md`
- Create: `skills/atoms/design-worldbuilding/SKILL.md`
- Create: `skills/atoms/generate-chapter/SKILL.md`

- [ ] **Step 1: 创建 design-volume-outline/SKILL.md**

输入：题材定位 + 拆文库
输出：卷纲.md（功能/事件/状态变化）
参考：outline-methods.md

- [ ] **Step 2: 创建 design-chapter-outline/SKILL.md**

输入：卷纲 + 章节号
输出：细纲.md（事件/钩子/爽点/字数目标）
参考：hooks-chapter.md

- [ ] **Step 3: 创建 design-character/SKILL.md**

输入：题材 + 功能位
输出：角色卡.md（基本信息/动机/弱点/弧线）
参考：character-basics.md

- [ ] **Step 4: 创建 design-worldbuilding/SKILL.md**

输入：题材定位
输出：世界观/*.md（力量体系/势力/地理）
参考：worldbuilding-intro.md

- [ ] **Step 5: 创建 generate-chapter/SKILL.md**

输入：细纲 + 上一章 + 设定文件
输出：正文草稿
参考：writing-craft.md, dialogue-mastery.md

---

## Phase 3：旧技能内部重构

### Task 3.1：重构 quality-mimo

**Covers:** S7

**Files:**
- Modify: `skills/quality-mimo/SKILL.md`

- [ ] **Step 1: 读取当前 quality-mimo SKILL.md**

- [ ] **Step 2: 重写为原子编排模式**

```yaml
---
name: quality-mimo
version: 2.0.0
description: 统一质量检查入口
atoms:
  - detect-banned-words
  - detect-ai-sentence
  - detect-consistency
  - detect-foreshadow
  - detect-wordcount
  - detect-voice
  - detect-emotion-curve
  - detect-cross-chapter
  - detect-satisfaction
  - detect-story-gaps
triggers:
  - /quality-mimo
  - /检查质量
  - 检查一下
  - 质量检查
---

# quality-mimo

## 功能
统一质量检查入口，依次调用各检测原子，汇总为统一报告。

## 流程
1. 根据用户选择确定检查范围（全量/单项）
2. 依次调用检测原子
3. 汇总为统一质量报告

## 输出格式
（保持原有格式不变）
```

- [ ] **Step 3: 验证行为不变**

---

### Task 3.2：重构 story-deslop-mimo

**Covers:** S7

**Files:**
- Modify: `skills/story-deslop-mimo/SKILL.md`

- [ ] **Step 1: 读取当前 story-deslop-mimo SKILL.md**

- [ ] **Step 2: 重写为原子编排模式**

```yaml
---
name: story-deslop-mimo
version: 3.0.0
description: 网文去AI味
atoms:
  - fix-banned-words
  - fix-ai-sentence
  - fix-psychology-externalize
  - fix-rhythm-break
  - fix-dialogue-naturalize
  - fix-ending-desublimate
  - fix-punctuation
triggers:
  - /story-deslop-mimo
  - /去AI味
  - 去AI味
  - 这篇太AI了
---

# story-deslop-mimo

## 功能
通过6道门控清除AI写作痕迹。

## 流程
1. 评估严重度（light/moderate/heavy）
2. 按严重度选择执行的Gate
3. 依次调用修正原子（Gate A→F）
4. 检查收敛（无新变化则停止）
5. 最多3轮

## Gate映射
- Gate A → fix-banned-words
- Gate B → fix-ai-sentence
- Gate C → fix-psychology-externalize
- Gate D → fix-rhythm-break
- Gate E → fix-dialogue-naturalize
- Gate F → fix-ending-desublimate
- 附加 → fix-punctuation
```

- [ ] **Step 3: 验证行为不变**

---

### Task 3.3：重构 story-review-mimo

**Covers:** S7

**Files:**
- Modify: `skills/story-review-mimo/SKILL.md`

- [ ] **Step 1: 重写为原子编排模式**

```yaml
---
name: story-review-mimo
version: 3.0.0
description: 多视角审稿
atoms:
  - review-structure
  - review-character
  - review-writing
  - review-commercial
  - review-consistency
triggers:
  - /story-review-mimo
  - /审稿
  - 帮我看看这篇
  - 审查
---

# story-review-mimo

## 功能
从5个维度审稿评分。

## 流程
1. 依次调用5个评审原子
2. 汇总为统一评审报告（5维度评分+问题清单）

## 输出格式
（保持原有格式不变）
```

- [ ] **Step 2: 验证行为不变**

---

### Task 3.4：重构 story-long-write-mimo Phase 5

**Covers:** S7

**Files:**
- Modify: `skills/story-long-write-mimo/SKILL.md`

- [ ] **Step 1: 读取当前 Phase 5 内容**

- [ ] **Step 2: 将 Phase 5 改为调用检测+修正原子**

Phase 5 新内容：
```
## Phase 5: 质量检查

调用以下原子：
1. detect-banned-words → 如有禁用词 → fix-banned-words
2. detect-consistency → 如有不一致 → 标记
3. detect-foreshadow → 如有逾期 → 标记
4. fix-punctuation → 标点规范化
```

- [ ] **Step 3: 更新脚本路径引用**

将所有 `scripts/xxx.js` → `_shared/scripts/xxx.js`

- [ ] **Step 4: 验证行为不变**

---

### Task 3.5：重构其他技能的脚本路径

**Covers:** S6

**Files:**
- Modify: `skills/story-session-mimo/SKILL.md`
- Modify: `skills/goal-mimo/SKILL.md`
- Modify: `skills/audit-mimo/SKILL.md`
- Modify: `skills/story-export-mimo/SKILL.md`

- [ ] **Step 1: 更新 story-session-mimo 脚本路径**

- [ ] **Step 2: 更新 goal-mimo 脚本路径**

- [ ] **Step 3: 更新 audit-mimo 脚本路径**

- [ ] **Step 4: 更新 story-export-mimo 脚本路径**

---

## Phase 4：更新路由和配置

### Task 4.1：更新 story-mimo 路由表

**Covers:** S8

**Files:**
- Modify: `skills/story-mimo/SKILL.md`

- [ ] **Step 1: 在路由表中新增原子技能入口**

新增路由：
```
| 原子检测 | /atom:detect-* | 对应原子技能 |
| 原子修正 | /atom:fix-* | 对应原子技能 |
| 原子评审 | /atom:review-* | 对应原子技能 |
```

- [ ] **Step 2: 保留所有现有路由**

---

### Task 4.2：更新 .skills-plugin-config.json

**Covers:** S9

**Files:**
- Modify: `.skills-plugin-config.json`

- [ ] **Step 1: 新增原子技能注册**

在 skills 数组中添加45个原子技能条目，category 标记为 "atom"。

- [ ] **Step 2: 验证 JSON 格式正确**

```bash
node -e "JSON.parse(require('fs').readFileSync('.skills-plugin-config.json','utf8')); console.log('OK')"
```

---

### Task 4.3：更新 AGENTS.md

**Covers:** S9

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: 在参考文档速查表中新增原子技能说明**

- [ ] **Step 2: 更新脚本路径引用**

---

## 验证清单

- [ ] 所有脚本在 `_shared/scripts/` 下可正常运行
- [ ] 每个原子 SKILL.md 可通过 `/atom:xxx` 独立调用
- [ ] 旧技能触发词和行为完全不变
- [ ] 编排 SKILL.md 可正确引用和调用原子
- [ ] 无残留的 `story-long-write-mimo/scripts/` 引用
- [ ] `.skills-plugin-config.json` 格式正确
