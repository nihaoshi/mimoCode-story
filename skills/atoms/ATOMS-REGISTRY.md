# 原子技能注册表 v2.0

> 32个原子技能（合并自45个），支持双模执行：独立运行 / 编排器调用

## 使用方式

### 独立调用

`/atom:detect-quality` — 直接运行单个原子（输入为空时使用项目默认路径）

### 编排器调用

在编排器中传入数据：
```json
{
  "atom": "detect-quality",
  "inputs": {
    "chapter_file": "正文/第001章.md",
    "check_type": "all"
  }
}
```

---

## 双模执行说明

| 模式 | 输入 | 行为 |
|------|------|------|
| **独立模式** | inputs 为空 | 从 `default_source` 读取项目默认文件 |
| **编排器模式** | inputs 不为空 | 以传入数据为准 |

---

## 原子清单

### 检测类 (detect) — 8个

| ID | 名称 | 脚本 | 严重度 | 说明 |
|----|------|------|--------|------|
| `detect-quality` | 文本质量检测 | `style-lint.js` | BLOCK | 禁用词+AI腔（合并自 detect-banned-words + detect-ai-sentence） |
| `detect-consistency` | 追踪一致性检测 | `consistency-check.js` | BLOCK | 章节与追踪文件一致性 |
| `detect-cross-chapter` | 跨章节重复检测 | `cross-chapter-check.js` | WARN | 跨章重复/矛盾 |
| `detect-emotion` | 情绪与爽点分析 | `emotion-analyzer.js` | WARN | 情绪曲线+爽点密度（合并自 detect-emotion-curve + detect-satisfaction） |
| `detect-story` | 故事完整性检测 | `foreshadow-check.js` | WARN | 伏笔+设定缺口（合并自 detect-foreshadow + detect-story-gaps） |
| `detect-voice` | 角色声音检测 | `voice-check.js` | WARN | 对话符合性格锚点 |
| `detect-wordcount` | 字数达标检测 | manual | BLOCK | 字数统计与达标判断 |
| `full-consistency-audit` | 全量一致性审计 | `full-consistency-audit.js` | BLOCK | 五大维度全量审计 |

### 修正类 (fix) — 3个

| ID | 名称 | 脚本 | 说明 |
|----|------|------|------|
| `fix-text` | 文本修正 | `punctuation-normalize.js` | AI腔+禁用词+标点（合并自 fix-ai-sentence + fix-banned-words + fix-punctuation） |
| `fix-dialogue` | 对话心理修正 | — | 对话去腔调+心理外化（合并自 fix-dialogue-naturalize + fix-psychology-externalize） |
| `fix-style` | 风格修正 | — | 结尾去升华+节奏打散（合并自 fix-ending-desublimate + fix-rhythm-break） |

### 评审类 (review) — 5个

| ID | 名称 | 类型 | 说明 |
|----|------|------|------|
| `review-character` | 角色一致性评审 | LLM | 角色设定一致性 |
| `review-commercial` | 商业价值评审 | LLM | 爽点、钩子、题材适配 |
| `review-consistency` | 事实一致性评审 | LLM | 时间线、伏笔、状态 |
| `review-structure` | 章节结构评审 | LLM | 钩子、节奏、反转 |
| `review-writing` | 文笔质量评审 | LLM | AI腔、对话、描写 |

### 写前预防类 (pre-write) — 4个

| ID | 名称 | 说明 |
|----|------|------|
| `pre-write-load` | 写前准备 | 加载细纲+追踪+设定+对标全部上下文 |
| `pre-write-constraints` | 约束加载 | 禁用词+风格+规则（合并自 banned-words-preload + style-constraint-gen + rules-engine） |
| `pre-write-context` | 上下文加载 | 角色锚点+模板注入（合并自 character-anchor-load + prompt-template-inject） |
| `pre-write-checklist` | 写前检查清单 | 前置条件验证 |

### 扫榜类 (scan) — 4个

| ID | 名称 | 说明 |
|----|------|------|
| `scrape-platform` | 平台数据采集 | 抓取排行榜数据 |
| `analyze-trend` | 题材趋势分析 | 提取热度和趋势 |
| `analyze-reader-profile` | 读者特征分析 | 目标平台读者画像 |
| `generate-topic-decision` | 选题建议生成 | 可执行选题方案 |

### 拆文类 (analyze) — 4个

| ID | 名称 | 说明 |
|----|------|------|
| `extract-summary` | 章节结构概要 | 提取章节结构和概要 |
| `extract-characters` | 角色与情节提取 | 角色信息+章节摘要（合并自 extract-characters + extract-chapter-summary） |
| `extract-world` | 世界观与风格提取 | 设定+文风（合并自 extract-settings + extract-style） |
| `analyze-story` | 故事深度分析 | 黄金三章+聚合分析（合并自 analyze-golden-chapters + analyze-aggregate） |

### 写作类 (write) — 5个

| ID | 名称 | 说明 |
|----|------|------|
| `design-character` | 角色卡片设计 | 角色基本信息、动机、弧线 |
| `design-worldbuilding` | 世界观设计 | 力量体系和势力 |
| `design-volume-outline` | 卷级大纲设计 | 卷结构和事件规划 |
| `design-chapter-outline` | 单章细纲设计 | 场景分解、钩子、爽点 |
| `generate-chapter` | 正文草稿生成 | 基于细纲生成正文 |

---

## 统计

| 分类 | 合并前 | 合并后 | 减少 |
|------|--------|--------|------|
| 检测类 (detect) | 11 | 8 | -3 |
| 修正类 (fix) | 7 | 3 | -4 |
| 评审类 (review) | 5 | 5 | 0 |
| 写前预防类 (pre-write) | 6 | 4 | -2 |
| 扫榜类 (scan) | 4 | 4 | 0 |
| 拆文类 (analyze) | 7 | 4 | -3 |
| 写作类 (write) | 5 | 5 | 0 |
| **合计** | **45** | **33** | **-12** |

---

## 合并映射表

| 新原子 | 合并自 |
|--------|--------|
| detect-quality | detect-banned-words + detect-ai-sentence |
| detect-emotion | detect-emotion-curve + detect-satisfaction |
| detect-story | detect-foreshadow + detect-story-gaps |
| fix-text | fix-ai-sentence + fix-banned-words + fix-punctuation |
| fix-dialogue | fix-dialogue-naturalize + fix-psychology-externalize |
| fix-style | fix-ending-desublimate + fix-rhythm-break |
| pre-write-constraints | banned-words-preload + style-constraint-gen + rules-engine |
| pre-write-context | character-anchor-load + prompt-template-inject |
| extract-characters | extract-characters + extract-chapter-summary |
| extract-world | extract-settings + extract-style |
| analyze-story | analyze-golden-chapters + analyze-aggregate |
