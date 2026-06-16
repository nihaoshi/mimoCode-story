# 原子技能注册表

> 45个原子技能，可独立调用或编排组合

## 使用方式

### 直接调用

`/atom:detect-banned-words` — 直接运行单个原子

### 编排组合

在新 SKILL.md 中引用原子：

```yaml
atoms:
  - detect-banned-words
  - fix-banned-words
```

---

## 原子清单

### 检测类 (detect) — 11个

| ID | 名称 | 脚本 | 严重度 |
|----|------|------|--------|
| `detect-banned-words` | 扫描禁用词 | `_shared/scripts/style-lint.js` | BLOCK |
| `detect-ai-sentence` | 检测AI腔句式 | `_shared/scripts/style-lint.js --ai-only` | WARN |
| `detect-consistency` | 检测追踪一致性 | `_shared/scripts/consistency-check.js` | BLOCK |
| `detect-cross-chapter` | 跨章节重复/矛盾检测 | `_shared/scripts/cross-chapter-check.js` | WARN |
| `detect-emotion-curve` | 情绪曲线分析 | `_shared/scripts/emotion-analyzer.js` | WARN |
| `detect-foreshadow` | 伏笔埋设/回收检测 | `_shared/scripts/foreshadow-check.js` | WARN |
| `detect-satisfaction` | 爽点密度检测 | `_shared/scripts/satisfaction-meter.js` | WARN |
| `detect-story-gaps` | 世界观缺口检测 | `_shared/scripts/detect-story-gaps.js` | WARN |
| `detect-voice` | 角色声音一致性检测 | `_shared/scripts/voice-check.js` | WARN |
| `detect-wordcount` | 字数达标检测 | `manual` (LLM 计算) | BLOCK |
| `full-consistency-audit` | 全量一致性审计 | `_shared/scripts/full-consistency-audit.js` | BLOCK |

### 修正类 (fix) — 7个

| ID | 名称 | 脚本 | 类型 |
|----|------|------|------|
| `fix-ai-sentence` | 句式去套路化 | — | LLM |
| `fix-banned-words` | 替换禁用词 | — | LLM |
| `fix-dialogue-naturalize` | 对话去腔调化 | — | LLM |
| `fix-ending-desublimate` | 结尾去升华 | — | LLM |
| `fix-psychology-externalize` | 心理直述→动作展示 | — | LLM |
| `fix-punctuation` | 标点规范化 | `_shared/scripts/punctuation-normalize.js` | Script |
| `fix-rhythm-break` | 打散排比节奏 | — | LLM |

### 评审类 (review) — 5个

| ID | 名称 | 脚本 | 类型 |
|----|------|------|------|
| `review-character` | 角色一致性评审 | — | LLM |
| `review-commercial` | 商业价值评审 | — | LLM |
| `review-consistency` | 事实一致性评审 | — | LLM |
| `review-structure` | 章节结构评审 | — | LLM |
| `review-writing` | 文笔质量评审 | — | LLM |

### 写前预防类 (pre-write) — 6个

| ID | 名称 | 脚本 | 类型 |
|----|------|------|------|
| `banned-words-preload` | 加载禁用词列表 | — | LLM |
| `character-anchor-load` | 提取角色性格锚点 | — | LLM |
| `rules-engine` | 生成适用规则集 | — | LLM |
| `style-constraint-gen` | 生成风格约束 | — | LLM |
| `prompt-template-inject` | 组合写作约束文本 | — | LLM |
| `pre-write-checklist` | 写前条件检查 | `_shared/scripts/detect-story-gaps.js` | Script |

### 扫榜类 (scan) — 4个

| ID | 名称 | 脚本 | 类型 |
|----|------|------|------|
| `scrape-platform` | 抓取平台排行榜 | — | LLM |
| `analyze-trend` | 提取题材趋势 | — | LLM |
| `analyze-reader-profile` | 分析读者特征 | — | LLM |
| `generate-topic-decision` | 生成选题建议 | — | LLM |

### 拆文类 (analyze) — 7个

| ID | 名称 | 脚本 | 类型 |
|----|------|------|------|
| `extract-summary` | 提取章节结构概要 | — | LLM |
| `extract-chapter-summary` | 提取章情节点和角色 | — | LLM |
| `extract-characters` | 提取角色关系和分级 | — | LLM |
| `extract-settings` | 提取世界观和设定 | — | LLM |
| `extract-style` | 提取写作风格 | — | LLM |
| `analyze-golden-chapters` | 深度拆解黄金三章 | — | LLM |
| `analyze-aggregate` | 聚合剧情线和故事框架 | — | LLM |

### 写作类 (write) — 5个

| ID | 名称 | 脚本 | 类型 |
|----|------|------|------|
| `design-character` | 设计角色卡片 | — | LLM |
| `design-worldbuilding` | 设计世界观和力量体系 | — | LLM |
| `design-volume-outline` | 设计卷级大纲 | — | LLM |
| `design-chapter-outline` | 设计单章细纲 | — | LLM |
| `generate-chapter` | 生成正文草稿 | — | LLM |

---

## 统计

| 分类 | 数量 | LLM | 脚本 |
|------|------|-----|------|
| 检测类 (detect) | 11 | 0 | 11 |
| 修正类 (fix) | 7 | 6 | 1 |
| 评审类 (review) | 5 | 5 | 0 |
| 写前预防类 (pre-write) | 6 | 5 | 1 |
| 扫榜类 (scan) | 4 | 4 | 0 |
| 拆文类 (analyze) | 7 | 7 | 0 |
| 写作类 (write) | 5 | 5 | 0 |
| **合计** | **45** | **32** | **13** |
