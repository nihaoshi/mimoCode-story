# 综合质量检测规范

> 定义 Step 11 综合质量检测的检测项、检测方法和输出格式

---

## 检测项总览

| 序号 | 检测项 | 严重度 | 脚本/方法 | 说明 |
|------|--------|--------|----------|------|
| 1 | 字数达标 | BLOCK | Python 统计 | 字数 < 目标90% 阻断 |
| 2 | 禁用词+AI腔 | BLOCK | style-lint.js | 命中一级禁用词阻断 |
| 3 | AI标点符号 | BLOCK | punctuation-normalize.js | 全角/半角混用、多余标点 |
| 4 | 一致性 | BLOCK | consistency-check.js | 与追踪文件矛盾阻断 |
| 5 | 章内逻辑性 | WARN | LLM 分析 | 事件逻辑不连贯警告 |
| 6 | 跨章节检查 | WARN | cross-chapter-check.js | 重复内容警告 |

**关键规则**：只要检测结果中存在任何 WARN 或 BLOCK，就必须进入修复流程，不能跳过。

---

## 检测项详细说明

### 1. 字数达标（BLOCK）

**检测方法**：Python 统计实际字符数

**检测逻辑**：
```python
import re

def count_chars(text):
    # 统计中文字符、中文标点、英文字母、数字
    chinese = len(re.findall(r'[\u4e00-\u9fff]', text))
    punct = len(re.findall(r'[\u3000-\u303f\uff00-\uffef]', text))
    english = len(re.findall(r'[a-zA-Z]', text))
    numbers = len(re.findall(r'[0-9]', text))
    return chinese + punct + english + numbers
```

**判定标准**：
- 字数 >= 目标字数 * 90% → PASS
- 字数 < 目标字数 * 90% → BLOCK

### 2. 禁用词+AI腔（BLOCK）

**检测方法**：style-lint.js 脚本扫描

**一级禁用词（31个，命中即阻断）**：
```
不禁、竟然、居然、事实上、实际上、显而易见、毫无疑问、可想而知、
不言而喻、与此同时、值得注意的是、需要指出的是、不可否认、
嘴角勾起、嘴角上扬、嘴角微扬、眼中闪过、眼底闪过、目光中闪过、
深吸一口气、长舒一口气、吐出一口浊气、缓缓开口、淡淡说道、轻声说道、
仿佛、宛如、恰似、犹如、值得一提、不得不说、总而言之
```

**二级禁用词（18个，高频出现警告）**：
```
一抹、一丝、一缕、一股、不由得、忍不住、情不自禁、
微微、轻轻、缓缓、淡淡、顿时、霎时、刹那间、
果然、或许、也许、大概
```

**AI腔句式（命中即警告）**：
- "他感到一股X涌上心头"
- "她的X宛如Y"
- "这不仅X，更Y"
- "这一刻，X"
- "面对X，他选择了Y"
- "不是A，而是B"

### 3. 一致性（BLOCK）

**检测方法**：consistency-check.js 脚本比对

**检测维度**：
- 物品位置一致性：与追踪/物品.md 比对
- 角色状态一致性：与追踪/角色状态.md 比对
- 环境描述一致性：与追踪/环境.md 比对
- 时间线一致性：与追踪/时间线.md 比对

**判定标准**：发现矛盾即 BLOCK

### 3. AI标点符号（BLOCK）

**检测方法**：punctuation-normalize.js 脚本扫描

**检测内容**：
- 全角/半角标点混用（如中文用英文逗号）
- 多余标点（连续多个句号、省略号不规范）
- AI 常用标点模式（过度使用省略号、感叹号）
- 引号配对错误
- 顿号、逗号使用不当
- 破折号滥用（连续使用 `---` 或 `——` 过多）

**常见 AI 标点问题**：
- 连续使用"……"而非"……"
- 中英文标点混用（"你好,世界" vs "你好，世界"）
- 省略号后紧跟标点（"……。"）
- 过度使用感叹号表达情绪
- 使用 `---` 作为分隔符或破折号（应使用 `——` 或删除）
- 连续多个 `---` 或 `***`

**判定标准**：发现标点问题即 BLOCK

### 4. 章内逻辑性（WARN）

**检测方法**：LLM 分析（参照 logic-check-rules.md）

**检测维度**：
- 时间逻辑：事件顺序是否合理
- 因果逻辑：事件因果关系
- 角色逻辑：行为是否符合设定
- 空间逻辑：场景转换是否合理
- 动机逻辑：行动是否有理由

**判定标准**：发现问题即 WARN

### 5. 跨章节检查（WARN）

**检测方法**：cross-chapter-check.js 脚本扫描

**检测内容**：
- 重复语句检测
- 重复描写检测
- 矛盾描述检测

**判定标准**：发现重复或矛盾即 WARN

---

## 输出格式

```json
{
  "chapter": 21,
  "timestamp": "2026-06-17T20:00:00Z",
  "word_count": 3200,
  "word_count_target": 3000,
  "word_count_pass": true,
  "checks": [
    {
      "name": "wordcount",
      "status": "pass",
      "severity": "BLOCK",
      "details": "3200/3000"
    },
    {
      "name": "banned-words",
      "status": "fail",
      "severity": "BLOCK",
      "found": ["竟然", "不禁"],
      "positions": [123, 456],
      "details": "发现2个一级禁用词"
    },
    {
      "name": "punctuation",
      "status": "fail",
      "severity": "BLOCK",
      "found": ["中英文标点混用", "省略号不规范"],
      "positions": [78, 234],
      "details": "发现2处标点问题"
    },
    {
      "name": "consistency",
      "status": "pass",
      "severity": "BLOCK",
      "details": "无矛盾"
    },
    {
      "name": "logic",
      "status": "fail",
      "severity": "WARN",
      "issues": [
        {
          "type": "cause",
          "location": "场景2",
          "description": "江晨突然决定冒险，缺乏铺垫"
        }
      ],
      "details": "发现1个逻辑问题"
    },
    {
      "name": "cross-chapter",
      "status": "pass",
      "severity": "WARN",
      "details": "无重复"
    }
  ],
  "block_count": 2,
  "warn_count": 1,
  "total_issues": 3,
  "overall": "BLOCK"
}
```

---

## 修复触发规则

| 条件 | 处理 |
|------|------|
| block_count > 0 | 必须进入修复流程 |
| warn_count > 0 | 必须进入修复流程 |
| total_issues == 0 | 可进入追踪更新 |

**关键规则**：只要 total_issues > 0，就必须修复，不能跳过。

---

## 修复优先级

1. **BLOCK 类型优先修复**
   - 字数不足 → 扩充正文
   - 禁用词命中 → 替换表达
   - 一致性错误 → 修正矛盾

2. **WARN 类型也要修复**
   - 逻辑问题 → 补充铺垫或调整情节
   - 跨章节重复 → 改写重复内容
