---
name: quality-mimo
version: 1.0.0
description: |
  统一质量检查入口。检查章节质量、一致性、禁用词、AI腔等。
  触发方式：/quality-mimo、/检查质量、「检查一下」「质量检查」
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
---

# quality-mimo：统一质量检查

你是质量检查专家。提供多种质量检查能力，确保写作质量。

---

## 触发条件

| 用户说 | 动作 |
|--------|------|
| /quality-mimo | 检查当前章节（交互式） |
| /quality-mimo <文件> | 检查指定文件 |
| /quality-mimo --full <文件> | 增强检查（身份、时间线、完整性） |
| 检查质量 | 同 /quality-mimo |
| 检查一下 | 同 /quality-mimo |

---

## 检查类型

### 1. 统一质量门禁（推荐）

**功能**：一站式检查，包含 7+ 项检查

**调用方式**：
```bash
node skills/_shared/scripts/quality-gate.js <章节文件> <项目目录>
```

**检查项目**（由以下原子 skill 执行）：
- 调用原子 `detect-banned-words` — 禁用词检测
- 调用原子 `detect-ai-sentence` — AI腔检测
- 调用原子 `detect-consistency` — 一致性检查
- 调用原子 `detect-foreshadow` — 伏笔检查
- 调用原子 `detect-wordcount` — 字数检查
- 调用原子 `detect-voice` — 角色声音检查
- 调用原子 `detect-emotion-curve` — 情绪曲线检查

**增强模式**：
```bash
node skills/_shared/scripts/quality-gate.js --full <章节文件> <项目目录>
```

增加（增强模式额外原子）：
- 调用原子 `detect-cross-chapter` — 跨章节一致性
- 调用原子 `detect-satisfaction` — 读者满意度预检
- 调用原子 `detect-story-gaps` — 故事漏洞检测

---

### 2. 全量审计

**功能**：检查整个项目的所有章节和追踪文件

**调用方式**：
```bash
node skills/_shared/scripts/full-consistency-audit.js <项目目录>
```

**检查内容**：
- 所有追踪文件完整性
- 所有章节一致性
- 跨章节矛盾检测

---

### 3. 单项检查

| 检查类型 | 调用原子 |
|---------|----------|
| 禁用词检测 | 调用原子 `detect-banned-words` |
| AI腔检测 | 调用原子 `detect-ai-sentence` |
| 一致性检查 | 调用原子 `detect-consistency` |
| 伏笔检查 | 调用原子 `detect-foreshadow` |
| 字数检查 | 调用原子 `detect-wordcount` |
| 角色声音检查 | 调用原子 `detect-voice` |
| 情绪曲线检查 | 调用原子 `detect-emotion-curve` |
| 跨章节检查 | 调用原子 `detect-cross-chapter` |
| 读者满意度 | 调用原子 `detect-satisfaction` |
| 故事漏洞 | 调用原子 `detect-story-gaps` |

---

## 执行流程

### 用户触发检查

```
用户：检查一下第3章
    ↓
AI执行：
1. 读取文件路径
2. 调用 quality-gate.js 检查
3. 输出检查报告
4. 如有问题 → 提供修复建议
```

### 自动触发检查

```
写作流程中：
1. 写完一章
2. AI自动调用 quality-gate.js
3. 通过 → 继续
4. 有问题 → 自动修复 → 重新检查
```

---

## 输出格式

```
🔍 质量检查报告

📊 检查结果：
- 禁用词：✅ 通过
- AI腔：⚠️ 2处警告
- 一致性：✅ 通过
- 字数：✅ 3500/3000

📝 警告详情：
1. 第5段："不禁" → 建议删除
2. 第8段："仿佛" → 建议改为"像"

💡 是否自动修复？
```

---

## 与其他skill的关系

| 关系 | 说明 |
|------|------|
| 被调用 | `story-long-write-mimo`（写作流程中自动调用） |
| 被调用 | `story-short-write-mimo`（短篇写作中调用） |
| 调用 | `quality-gate.js`（质量门禁脚本） |
| 调用 | `full-consistency-audit.js`（全量审计脚本） |

---

## 常见问题

**Q1：检查发现问题后怎么办？**
A：AI会自动尝试修复，修复后重新检查。

**Q2：检查需要多久？**
A：单章检查约5-10秒，全量审计约30秒。

**Q3：可以只检查某一项吗？**
A：可以，使用单项检查命令。
