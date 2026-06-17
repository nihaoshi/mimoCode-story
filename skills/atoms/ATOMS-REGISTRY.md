# 原子技能注册表 v3.0

> 15个原子技能，支持双模执行：独立运行 / 编排器调用

---

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

## 原子清单（15个）

### 检测类 (detect) — 8个

| ID | 名称 | 脚本 | 严重度 | 说明 | 被引用 |
|----|------|------|--------|------|--------|
| `detect-quality` | 文本质量检测 | `style-lint.js` | BLOCK | 禁用词+AI腔 | quality-mimo, story-long-write-mimo, story-chapter-write-mimo |
| `detect-consistency` | 追踪一致性检测 | `consistency-check.js` | BLOCK | 章节与追踪文件一致性 | quality-mimo, story-long-write-mimo, story-chapter-write-mimo |
| `detect-cross-chapter` | 跨章节重复检测 | `cross-chapter-check.js` | WARN | 跨章重复/矛盾 | quality-mimo, story-long-write-mimo |
| `detect-emotion` | 情绪与爽点分析 | `emotion-analyzer.js` | WARN | 情绪曲线+爽点密度 | quality-mimo |
| `detect-story` | 故事完整性检测 | `foreshadow-check.js` | WARN | 伏笔+设定缺口 | quality-mimo, story-long-write-mimo |
| `detect-voice` | 角色声音检测 | `voice-check.js` | WARN | 对话符合性格锚点 | quality-mimo, story-long-write-mimo |
| `detect-wordcount` | 字数达标检测 | manual | BLOCK | 字数统计与达标判断 | quality-mimo, story-chapter-write-mimo |
| `full-consistency-audit` | 全量一致性审计 | `full-consistency-audit.js` | BLOCK | 五大维度全量审计 | audit-mimo, quality-mimo |

### 修正类 (fix) — 3个

| ID | 名称 | 脚本 | 说明 | 被引用 |
|----|------|------|------|--------|
| `fix-text` | 文本修正 | `punctuation-normalize.js` | AI腔+禁用词+标点 | story-deslop-mimo, story-long-write-mimo |
| `fix-dialogue` | 对话心理修正 | — | 对话去腔调+心理外化 | story-deslop-mimo, story-long-write-mimo |
| `fix-style` | 风格修正 | — | 结尾去升华+节奏打散 | story-deslop-mimo, story-long-write-mimo |

### 评审类 (review) — 5个

| ID | 名称 | 类型 | 说明 | 被引用 |
|----|------|------|------|--------|
| `review-character` | 角色一致性评审 | LLM | 角色设定一致性 | story-review-mimo |
| `review-commercial` | 商业价值评审 | LLM | 爽点、钩子、题材适配 | story-review-mimo |
| `review-consistency` | 事实一致性评审 | LLM | 时间线、伏笔、状态 | story-review-mimo |
| `review-structure` | 章节结构评审 | LLM | 钩子、节奏、反转 | story-review-mimo |
| `review-writing` | 文笔质量评审 | LLM | AI腔、对话、描写 | story-review-mimo |

---

## 统计

| 分类 | 数量 |
|------|------|
| 检测类 (detect) | 8 |
| 修正类 (fix) | 3 |
| 评审类 (review) | 5 |
| **合计** | **15** |

---

## 已删除的原子技能

以下原子技能因主 skill 内部已实现类似功能而删除：

| 类别 | 原子技能 | 原因 |
|------|---------|------|
| pre-write | pre-write-load | story-long-write-mimo 准备层已实现 |
| pre-write | pre-write-constraints | story-long-write-mimo 准备层已实现 |
| pre-write | pre-write-context | story-long-write-mimo 准备层已实现 |
| pre-write | pre-write-checklist | story-long-write-mimo 准备层已实现 |
| scan | scrape-platform | story-long-scan-mimo 已实现 |
| scan | analyze-trend | story-long-scan-mimo 已实现 |
| scan | analyze-reader-profile | story-long-scan-mimo 已实现 |
| scan | generate-topic-decision | story-long-scan-mimo 已实现 |
| analyze | extract-summary | story-long-analyze-mimo 已实现 |
| analyze | extract-characters | story-long-analyze-mimo 已实现 |
| analyze | extract-world | story-long-analyze-mimo 已实现 |
| analyze | analyze-story | story-long-analyze-mimo 已实现 |
| write | design-character | story-long-write-mimo Phase 2 已实现 |
| write | design-worldbuilding | story-long-write-mimo Phase 2 已实现 |
| write | design-volume-outline | story-long-write-mimo Phase 3 已实现 |
| write | design-chapter-outline | story-long-write-mimo Phase 3 已实现 |
| write | generate-chapter | story-long-write-mimo Phase 4 已实现 |
