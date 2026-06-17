# 原子技能统一格式规范 v2.0

## 目标

1. **同类合并**：将功能相近的原子技能合并（如detect-banned-words + detect-ai-sentence → detect-quality）
2. **规范格式**：统一frontmatter字段、正文结构、输出格式
3. **双模执行**：支持独立运行和编排器调用两种模式

## 合并方案

### 检测类合并（11→6）

| 新ID | 合并自 | 说明 |
|------|--------|------|
| `detect-quality` | detect-banned-words + detect-ai-sentence | 文本质量检测（禁用词+AI腔） |
| `detect-consistency` | 保持不变 | 追踪一致性检测 |
| `detect-cross-chapter` | 保持不变 | 跨章节重复检测 |
| `detect-emotion` | detect-emotion-curve + detect-satisfaction | 情绪与爽点分析 |
| `detect-story` | detect-foreshadow + detect-story-gaps | 故事完整性检测 |
| `detect-voice` | 保持不变 | 角色声音检测 |
| `detect-wordcount` | 保持不变 | 字数检测 |
| `full-consistency-audit` | 保持不变 | 全量审计 |

### 修正类合并（7→4）

| 新ID | 合并自 | 说明 |
|------|--------|------|
| `fix-text` | fix-ai-sentence + fix-banned-words + fix-punctuation | 文本修正（AI腔+禁用词+标点） |
| `fix-dialogue` | fix-dialogue-naturalize + fix-psychology-externalize | 对话与心理修正 |
| `fix-style` | fix-ending-desublimate + fix-rhythm-break | 风格修正（结尾+节奏） |

### 评审类保持（5个不变）

review-character, review-commercial, review-consistency, review-structure, review-writing

### 写前预防类合并（6→3）

| 新ID | 合并自 | 说明 |
|------|--------|------|
| `pre-write-constraints` | banned-words-preload + style-constraint-gen + rules-engine | 约束加载（禁用词+风格+规则） |
| `pre-write-context` | character-anchor-load + prompt-template-inject | 上下文加载（角色锚点+模板） |
| `pre-write-checklist` | 保持不变 | 写前检查清单 |

### 扫榜类保持（4个不变）

scrape-platform, analyze-trend, analyze-reader-profile, generate-topic-decision

### 拆文类合并（7→4）

| 新ID | 合并自 | 说明 |
|------|--------|------|
| `extract-summary` | 保持不变 | 章节结构概要 |
| `extract-characters` | extract-characters + extract-chapter-summary | 角色与情节提取 |
| `extract-world` | extract-settings + extract-style | 世界观与风格提取 |
| `analyze-story` | analyze-golden-chapters + analyze-aggregate | 故事深度分析 |

### 写作类保持（5个不变）

design-character, design-worldbuilding, design-volume-outline, design-chapter-outline, generate-chapter

## 合并后统计

| 分类 | 合并前 | 合并后 |
|------|--------|--------|
| 检测类 | 11 | 8 |
| 修正类 | 7 | 3 |
| 评审类 | 5 | 5 |
| 写前预防类 | 6 | 3 |
| 扫榜类 | 4 | 4 |
| 拆文类 | 7 | 4 |
| 写作类 | 5 | 5 |
| **合计** | **45** | **32** |

## 统一Frontmatter格式

```yaml
---
name: atom-name
version: 2.0.0
description: 一句话描述
category: detect|fix|review|analyze|write|scan|pre-write
# 双模执行
dual_mode:
  standalone: true
  orchestrator: true
# 输入
inputs:
  - name: input_name
    type: file|directory|text|number|json
    required: true|false
    description: 描述
    default_source: "默认路径"  # 独立模式
# 输出
outputs:
  - name: output_name
    type: file|report|text|json
    format: markdown|json
    destination: "输出路径"  # 可选
# 元数据
severity: BLOCK|WARN|INFO  # 检测/评审类
script: _shared/scripts/xxx.js  # 可选
references:
  - _shared/references/xxx.md  # 可选
triggers:
  - /atom:atom-name
  - 触发词
---
```

## 统一正文结构

```markdown
# atom-name

## 功能
一句话描述

## 双模执行
- **独立模式**：输入为空时，从 `default_source` 读取
- **编排器模式**：输入不为空时，以传入数据为准

## 执行步骤
1. 步骤1
2. 步骤2
...

## 输出格式
### 输出名称
- 字段1
- 字段2
...
```

## 实施步骤

1. 创建合并计划文件
2. 逐个合并原子技能（保留旧目录为.backup）
3. 更新ATOMS-REGISTRY.md
4. 更新引用这些原子的上层skill
5. 测试双模执行
