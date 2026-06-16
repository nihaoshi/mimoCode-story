# 原子化重构设计文档 v2

> 2026-06-16 | 基于 PROJECT-FUNCTIONALITY-REPORT.md v3.3.1

---

## [S1] 问题

1. 现有23个技能是"大块头"，无法单独调用其中某个子功能
2. 想单独跑"禁用词检测"必须加载整个 quality-mimo 或 story-long-write-mimo
3. 无法自由组合功能（如：只跑检测不修正，或只修正不禁用词检测）
4. 脚本归属不合理，14个脚本放在 story-long-write-mimo/scripts/ 但被多个技能依赖

## [S2] 目标架构

```
skills/
├── atoms/                          ← 新增：原子技能目录
│   ├── ATOMS-REGISTRY.md           ← 原子清单+接口规范
│   ├── detect-banned-words/SKILL.md
│   ├── detect-ai-sentence/SKILL.md
│   ├── detect-consistency/SKILL.md
│   ├── fix-banned-words/SKILL.md
│   ├── fix-ai-sentence/SKILL.md
│   ├── review-structure/SKILL.md
│   ├── ... (共 ~31 个原子)
│   └── generate-synopsis/SKILL.md
├── story-mimo/                     ← 路由入口（更新路由表）
├── story-long-write-mimo/          ← 保留，内部重构为调用原子
├── story-short-write-mimo/         ← 保留，内部重构为调用原子
├── quality-mimo/                   ← 保留，内部重构为调用原子
├── story-deslop-mimo/              ← 保留，内部重构为调用原子
├── story-review-mimo/              ← 保留，内部重构为调用原子
├── ... (其他现有技能保留)
└── _shared/                        ← 共享资源
    ├── scripts/                    ← 脚本提升到这里
    ├── references/
    ├── templates/
    └── checklists/
```

**核心原则**：
- 原子技能独立可用（`/atom:detect-banned-words`）
- 旧技能行为不变（内部改为调用原子）
- 新技能通过引用原子名编排

## [S3] 原子技能清单

### 3.1 检测类（11个）

| 原子ID | 名称 | 输入 | 输出 | 脚本 |
|--------|------|------|------|------|
| `detect-banned-words` | 禁用词检测 | 章节文件 | 禁用词列表+位置 | style-lint.js |
| `detect-ai-sentence` | AI腔检测 | 章节文件 | AI腔报告 | style-lint.js |
| `detect-consistency` | 一致性检测 | 章节+追踪文件 | 一致性报告 | consistency-check.js |
| `detect-foreshadow` | 伏笔检测 | 章节+伏笔.md | 伏笔报告 | foreshadow-check.js |
| `detect-wordcount` | 字数检测 | 章节+细纲 | 字数报告 | quality-gate.js |
| `detect-voice` | 角色声音检测 | 章节+角色状态.md | 声音报告 | voice-check.js |
| `detect-emotion-curve` | 情绪曲线检测 | 章节文件 | 情绪曲线+平坦报告 | emotion-analyzer.js |
| `detect-cross-chapter` | 跨章重复检测 | 章节+前N章 | 重复报告 | cross-chapter-check.js |
| `detect-satisfaction` | 爽点密度检测 | 章节文件 | 爽点密度报告 | satisfaction-meter.js |
| `detect-story-gaps` | 设定缺口检测 | 项目目录 | 缺口报告 | detect-story-gaps.js |
| `full-consistency-audit` | 全量一致性审计 | 全部章节+追踪 | 审计报告 | full-consistency-audit.js |

### 3.2 修正类（7个）

| 原子ID | 名称 | 输入 | 输出 | 实现 |
|--------|------|------|------|------|
| `fix-banned-words` | 禁用词自动替换 | 章节+禁用词列表 | 修正后文本 | LLM改写 |
| `fix-ai-sentence` | 句式去套路化 | 章节文件 | 修正后文本 | LLM (Gate B) |
| `fix-psychology-externalize` | 心理外化 | 章节文件 | 修正后文本 | LLM (Gate C) |
| `fix-rhythm-break` | 节奏打散 | 章节文件 | 修正后文本 | LLM (Gate D) |
| `fix-dialogue-naturalize` | 对话去腔调 | 章节文件 | 修正后文本 | LLM (Gate E) |
| `fix-ending-desublimate` | 结尾去升华 | 章节文件 | 修正后文本 | LLM (Gate F) |
| `fix-punctuation` | 标点规范化 | 章节文件 | 修正后文本 | punctuation-normalize.js |

### 3.3 评审类（5个）

| 原子ID | 名称 | 输入 | 输出 | 实现 |
|--------|------|------|------|------|
| `review-structure` | 结构评审 | 章节文件 | 结构评分+问题 | LLM |
| `review-character` | 角色评审 | 章节+角色设定 | 角色评分+问题 | LLM |
| `review-writing` | 文笔评审 | 章节文件 | 文笔评分+问题 | LLM |
| `review-commercial` | 商业评审 | 章节+题材定位 | 商业评分+问题 | LLM |
| `review-consistency` | 一致性评审 | 章节+追踪文件 | 一致性评分+问题 | LLM |

### 3.4 写前预防类（6个）

| 原子ID | 名称 | 输入 | 输出 | 实现 |
|--------|------|------|------|------|
| `rules-engine` | 规则引擎 | 题材定位+配置 | 规则集 | LLM |
| `pre-write-checklist` | 写前检查清单 | 项目目录 | 就绪/缺失报告 | detect-story-gaps.js |
| `prompt-template-inject` | Prompt模板注入 | 规则集+锚点 | 约束文本段 | LLM |
| `banned-words-preload` | 禁用词预加载 | banned-words.js | 禁用词文本 | 脚本读取 |
| `style-constraint-gen` | 风格约束生成 | 题材+平台 | 风格约束文本 | LLM |
| `character-anchor-load` | 角色锚点加载 | 角色状态.md | 锚点摘要文本 | LLM |

### 3.5 扫榜类（4个）

| 原子ID | 名称 | 输入 | 输出 | 脚本 |
|--------|------|------|------|------|
| `scrape-platform` | 平台数据采集 | 平台+榜单类型 | 结构化排行数据 | scraper脚本 |
| `analyze-trend` | 题材趋势分析 | 排行数据 | 趋势分析报告 | LLM |
| `generate-topic-decision` | 选题决策生成 | 趋势+用户偏好 | 选题决策.md | LLM |
| `analyze-reader-profile` | 读者画像分析 | 平台数据 | 画像报告 | LLM |

### 3.6 拆文类（4个）

| 原子ID | 名称 | 输入 | 输出 | 实现 |
|--------|------|------|------|------|
| `extract-summary` | 概要提取 | 原始文本 | 概要.md+章节索引 | LLM |
| `analyze-golden-chapters` | 黄金三章拆解 | 前3章原文 | 深度拆解.md×3 | LLM |
| `extract-chapter-summary` | 逐章摘要提取 | 分块章节 | 章节摘要.md | LLM |
| `analyze-aggregate` | 聚合分析 | 全部摘要 | 剧情/*.md+故事线.md | LLM |

### 3.7 拆文-设定类（3个）

| 原子ID | 名称 | 输入 | 输出 | 实现 |
|--------|------|------|------|------|
| `extract-settings` | 设定提取 | Stage 2-3 数据 | 设定/*.md | LLM |
| `extract-characters` | 角色提取 | Stage 2-3 数据 | 角色/*.md | LLM |
| `extract-style` | 文风提取 | 拆文报告+原文 | 文风.md | LLM |

### 3.8 写作类（5个）

| 原子ID | 名称 | 输入 | 输出 | 实现 |
|--------|------|------|------|------|
| `design-volume-outline` | 卷纲设计 | 题材+拆文库 | 卷纲.md | LLM |
| `design-chapter-outline` | 细纲设计 | 卷纲+章节号 | 细纲.md | LLM |
| `design-character` | 角色设计 | 题材+功能位 | 角色卡.md | LLM |
| `design-worldbuilding` | 世界观设计 | 题材定位 | 世界观/*.md | LLM |
| `generate-chapter` | 正文生成 | 细纲+上下文 | 正文草稿 | LLM |

**总计：~45个原子技能**

## [S4] 原子技能接口规范

每个原子的 SKILL.md 遵循统一格式：

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
  - name: result
    type: report
    format: markdown
severity: BLOCK
script: _shared/scripts/style-lint.js
triggers:
  - /detect-banned-words
  - 检测禁用词
---

# detect-banned-words

## 功能
扫描指定章节文件中的 Level1（31词）和 Level2（18词）禁用词。

## 执行步骤
1. 读取 {chapter_file}
2. 运行 `node skills/_shared/scripts/style-lint.js {chapter_file} --banned-only`
3. 输出禁用词列表，包含：词、位置（行:列）、上下文、严重度

## 输出格式
```markdown
## 禁用词检测报告
- 文件：{chapter_file}
- Level1 禁用词：N 个
- Level2 禁用词：N 个

| 禁用词 | 级别 | 位置 | 上下文 |
|--------|------|------|--------|
| 仿佛 | L1 | 12:5 | ...仿佛在梦中... |
```
```

## [S5] 编排机制

### 编排 SKILL.md 格式

新技能通过引用原子ID来组合功能：

```yaml
---
name: my-custom-qa
version: 1.0.0
description: 自定义质检流程
atoms:
  - detect-banned-words
  - detect-consistency
  - fix-banned-words
  - review-structure
triggers:
  - /my-qa
---

# my-custom-qa

## 流程
1. 调用 `detect-banned-words` 检测禁用词
2. 调用 `detect-consistency` 检查一致性
3. 如果有禁用词，调用 `fix-banned-words` 自动替换
4. 调用 `review-structure` 评审结构

## 输出
合并各原子输出为统一报告
```

### Agent 执行流程

当 Agent 加载编排 SKILL.md 时：
1. 读取 `atoms:` 字段，获取依赖的原子列表
2. 按流程步骤顺序执行
3. 每步通过 `skill` 工具加载对应原子 SKILL.md
4. 原子的 instructions 注入上下文，Agent 执行
5. 输出传递给下一步

## [S6] 脚本重组

### 移动到 _shared/scripts/

| 脚本 | 从 | 到 |
|------|----|----|
| quality-gate.js | story-long-write-mimo/scripts/ | _shared/scripts/ |
| style-lint.js | story-long-write-mimo/scripts/ | _shared/scripts/ |
| consistency-check.js | story-long-write-mimo/scripts/ | _shared/scripts/ |
| foreshadow-check.js | story-long-write-mimo/scripts/ | _shared/scripts/ |
| voice-check.js | story-long-write-mimo/scripts/ | _shared/scripts/ |
| emotion-analyzer.js | story-long-write-mimo/scripts/ | _shared/scripts/ |
| satisfaction-meter.js | story-long-write-mimo/scripts/ | _shared/scripts/ |
| cross-chapter-check.js | story-long-write-mimo/scripts/ | _shared/scripts/ |
| detect-story-gaps.js | story-long-write-mimo/scripts/ | _shared/scripts/ |
| full-consistency-audit.js | story-long-write-mimo/scripts/ | _shared/scripts/ |
| wordcount-pacer.js | story-long-write-mimo/scripts/ | _shared/scripts/ |
| detect-python.js | story-long-write-mimo/scripts/ | _shared/scripts/ |
| repair-scripts.js | story-long-write-mimo/scripts/ | _shared/scripts/ |
| normalize-punctuation.js | story-long-write-mimo/scripts/ | **合并**到 punctuation-normalize.js |

### 合并标点规范化

合并 `_shared/scripts/punctuation-normalize.js`（312行）和 `normalize-punctuation.js`（359行）：
- 保留增强版的引号模式切换和破折号智能替换
- 输出到 `_shared/scripts/punctuation-normalize.js`

### 脚本路径更新

所有引用 `story-long-write-mimo/scripts/` 的地方改为 `_shared/scripts/`：
- quality-mimo SKILL.md
- audit-mimo SKILL.md
- story-session-mimo SKILL.md
- goal-mimo SKILL.md
- story-export-mimo SKILL.md

## [S7] 旧技能内部重构

### 重构原则
- 行为完全不变（用户感知不到差异）
- 内部流程改为"声明原子依赖 → 按步骤调用原子"
- 不删除旧技能，不改变触发词

### 重构示例：quality-mimo

**重构前**：内联调用脚本
```
运行 style-lint.js → 运行 consistency-check.js → ... → 汇总报告
```

**重构后**：调用原子
```
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

流程：
1. 依次调用各检测原子
2. 汇总为统一质量报告
```

### 重构示例：story-deslop-mimo

**重构前**：内联6个Gate
```
Gate A → Gate B → Gate C → Gate D → Gate E → Gate F
```

**重构后**：调用修正原子
```
atoms:
  - fix-banned-words
  - fix-ai-sentence
  - fix-psychology-externalize
  - fix-rhythm-break
  - fix-dialogue-naturalize
  - fix-ending-desublimate

流程：
1. 依次调用各修正原子（按严重度排序）
2. 每轮修正后检查收敛
3. 最多3轮
```

### 重构示例：story-long-write-mimo

Phase 5 质量检查改为调用：
```
atoms:
  - detect-banned-words
  - detect-consistency
  - detect-foreshadow
  - fix-banned-words (如有)
  - fix-punctuation
```

## [S8] 配置更新

`.skills-plugin-config.json` 新增原子技能注册：

```json
{
  "skills": [
    ...现有23个技能...,
    {
      "name": "detect-banned-words",
      "path": "skills/atoms/detect-banned-words/SKILL.md",
      "description": "禁用词检测",
      "category": "atom"
    },
    ...其他原子...
  ]
}
```

## [S9] 实施阶段

### Phase 1：脚本重组
1. 移动14个脚本到 `_shared/scripts/`
2. 合并标点规范化脚本
3. 更新所有 require 路径
4. 验证：运行 quality-gate.js

### Phase 2：创建原子技能
1. 创建 `skills/atoms/` 目录
2. 创建 `ATOMS-REGISTRY.md`
3. 逐个创建原子 SKILL.md（45个）
4. 每个原子单独验证

### Phase 3：旧技能内部重构
1. quality-mimo → 调用检测原子
2. story-deslop-mimo → 调用修正原子
3. story-review-mimo → 调用评审原子
4. story-long-write-mimo Phase 5 → 调用检测+修正原子
5. 其他涉及的技能更新脚本路径

### Phase 4：更新路由和配置
1. story-mimo 路由表新增原子技能入口
2. 更新 .skills-plugin-config.json
3. 更新 AGENTS.md

## [S10] 验证方式

1. **原子独立性**：每个原子可以单独通过 `/atom:xxx` 调用并正确输出
2. **旧技能兼容**：旧技能的触发词和行为完全不变
3. **编排功能**：写一个测试编排 SKILL.md，引用多个原子，验证执行流程
4. **脚本路径**：所有脚本调用路径正确，无 require 错误
5. **端到端**：用 demo/ 项目走一遍完整写作+质检流程

## [S11] 风险和缓解

| 风险 | 缓解措施 |
|------|----------|
| 45个原子创建工作量大 | 按类别批量创建，复用模板 |
| 脚本移动后路径失效 | Phase 1 完成后立即全量验证 |
| 旧技能重构后行为变化 | 逐个对比测试，确保输出一致 |
| 原子粒度太细导致编排复杂 | 提供常用编排模板 |
| Agent 上下文窗口压力 | 原子 SKILL.md 控制在 50 行以内 |
