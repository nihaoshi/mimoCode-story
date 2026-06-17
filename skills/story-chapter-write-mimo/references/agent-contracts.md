# Agent 契约文档

> 定义每个 Agent 的输入输出格式、验证规则和防偷懒检查点

---

## 通用规则

### 输入验证

每个 Agent 启动时必须：
1. 读取所有输入文件
2. 验证 JSON 格式正确（如果是 JSON 输入）
3. 验证必要字段存在
4. 验证数据类型正确
5. 验证章节号一致性

### 输出验证

每个 Agent 完成时必须：
1. 写入约定的输出文件
2. 输出文件必须包含所有必要字段
3. 输出内容必须与输入一致（如章节号匹配）
4. 输出文件必须是合法 JSON

### 防偷懒检查点

每个 Agent 的 done 条件前必须验证：
- [ ] 输入文件已实际读取（不能使用缓存或记忆）
- [ ] 输出文件已实际写入（文件存在且内容正确）
- [ ] 输出内容与输入一致（章节号、路径等匹配）
- [ ] 结果已展示给用户

---

## Agent 01: health-checker（目录健全检查）

### 职责
检查项目目录结构完整性，创建缺失的目录和文件模板。

### 输入
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project_dir | string | 是 | 项目根目录路径 |

### 输出
文件：`{project_dir}/.workflow/step01-health-check.json`

```json
{
  "status": "pass|fail",
  "timestamp": "2026-06-17T19:57:00Z",
  "project_dir": "D:/mimoCode-story/demo/让你管账号，你高燃混剪炸全网",
  "checked": [
    {"path": "正文/", "exists": true, "created": false},
    {"path": "追踪/", "exists": true, "created": false},
    {"path": "大纲/", "exists": true, "created": false},
    {"path": "设定/", "exists": true, "created": false},
    {"path": "追踪/伏笔.md", "exists": true, "created": false},
    {"path": "追踪/时间线.md", "exists": true, "created": false},
    {"path": "追踪/角色状态.md", "exists": true, "created": false},
    {"path": "追踪/物品.md", "exists": false, "created": true},
    {"path": "追踪/环境.md", "exists": true, "created": false}
  ],
  "created": ["追踪/物品.md"],
  "errors": []
}
```

### 验证规则
1. `status` 必须是 "pass" 或 "fail"
2. `checked` 数组必须包含 9 个元素
3. 每个 checked 元素必须有 path、exists、created 字段
4. 如果有目录不存在，必须创建并标记 created = true
5. 如果有文件不存在，必须创建空模板并标记 created = true

### 防偷懒检查
- [ ] 实际检查了每个路径（不能假设存在）
- [ ] 缺失的目录已创建
- [ ] 缺失的文件已创建空模板
- [ ] 输出 JSON 包含所有 9 个检查项

### 模板内容

**伏笔.md 模板**：
```markdown
# 伏笔追踪

| ID | 伏笔内容 | 埋设章节 | 预计回收章节 | 状态 | 重要度 |
|----|---------|---------|-------------|------|--------|
```

**时间线.md 模板**：
```markdown
# 时间线

| 章节 | 故事时间 | 事件 |
|------|---------|------|
```

**角色状态.md 模板**：
```markdown
# 角色状态追踪

（按角色分节，每个角色含当前身份、能力、关系、性格锚点、状态变更记录）
```

**物品.md 模板**：
```markdown
# 物品追踪

| 物品 | 首次出现 | 当前位置 | 状态 | 备注 |
|------|---------|---------|------|------|
```

**环境.md 模板**：
```markdown
# 环境追踪

| 章节 | 季节 | 天气 | 场景 |
|------|------|------|------|
```

---

## Agent 02: chapter-finder（章节信息获取）

### 职责
扫描正文目录，获取最新章节信息和下一章编号。

### 输入
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project_dir | string | 是 | 项目根目录路径 |

### 输出
文件：`{project_dir}/.workflow/step02-chapter-info.json`

```json
{
  "timestamp": "2026-06-17T19:57:00Z",
  "project_dir": "D:/mimoCode-story/demo/让你管账号，你高燃混剪炸全网",
  "last_chapter": 20,
  "last_chapter_file": "正文/第020章.md",
  "last_chapter_name": "章名",
  "last_chapter_words": 3500,
  "next_chapter": 21,
  "next_chapter_padded": "021",
  "next_chapter_file": "正文/第021章.md",
  "total_chapters": 20,
  "total_words": 37349
}
```

### 验证规则
1. `last_chapter` 必须是正整数
2. `last_chapter_file` 必须是实际存在的文件路径
3. `next_chapter` = `last_chapter` + 1
4. `next_chapter_padded` 必须是 3 位数补零
5. `total_words` 必须是实际统计的字数

### 防偷懒检查
- [ ] 实际扫描了正文目录（不能从上下文.md 推断）
- [ ] 读取了最新章节文件获取章名
- [ ] 使用 Python 统计了实际字数
- [ ] 输出 JSON 包含所有必要字段

### 字数统计方法

```python
import re
import sys

def count_chinese_chars(text):
    # 统计中文字符、中文标点、英文字母、数字
    chinese_chars = len(re.findall(r'[\u4e00-\u9fff]', text))
    chinese_punct = len(re.findall(r'[\u3000-\u303f\uff00-\uffef]', text))
    english_chars = len(re.findall(r'[a-zA-Z]', text))
    numbers = len(re.findall(r'[0-9]', text))
    return chinese_chars + chinese_punct + english_chars + numbers

if __name__ == "__main__":
    file_path = sys.argv[1]
    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()
    print(count_chinese_chars(text))
```

---

## Agent 03: outline-checker（细纲检查）

### 职责
检查下一章细纲是否存在，验证格式完整性。

### 输入
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project_dir | string | 是 | 项目根目录路径 |
| next_chapter | number | 是 | 下一章编号 |
| next_chapter_padded | string | 是 | 补零后的章节号 |

### 输出
文件：`{project_dir}/.workflow/step03-outline-check.json`

```json
{
  "timestamp": "2026-06-17T19:57:00Z",
  "chapter": 21,
  "outline_file": "大纲/细纲_第021章.md",
  "exists": true,
  "valid_format": true,
  "need_create": false,
  "outline_summary": "本章主要场景：军营训练场...",
  "scene_count": 3,
  "character_count": 2,
  "has_hook": true,
  "has_climax": true
}
```

### 验证规则
1. `exists` 必须是实际检查结果
2. 如果 `exists` == true，必须验证格式：
   - 包含"场景分解"或类似章节
   - 包含"钩子"或"悬念"相关内容
   - 包含"爽点"相关内容
   - 情节点数量 >= 10
3. `valid_format` 基于上述验证结果
4. `need_create` = !exists || !valid_format

### 防偷懒检查
- [ ] 实际检查了文件存在性
- [ ] 存在时实际读取了文件内容
- [ ] 验证了格式完整性
- [ ] 输出 JSON 包含所有必要字段

---

## Agent 04: story-architect（细纲创建）[条件任务]

### 职责
根据大纲和上下文创建细纲。

### 触发条件
step03 中 `need_create == true`

### 输入
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project_dir | string | 是 | 项目根目录路径 |
| chapter | number | 是 | 章节编号 |
| chapter_padded | string | 是 | 补零后的章节号 |

需要读取的文件：
- `{project_dir}/大纲/大纲.md`
- `{project_dir}/大纲/卷纲_第X卷.md`
- `{project_dir}/追踪/上下文.md`
- `{project_dir}/追踪/伏笔.md`
- `{project_dir}/追踪/角色状态.md`
- 上一章细纲（如有）

### 输出
文件：`{project_dir}/大纲/细纲_{chapter_padded}章.md`

### 细纲格式要求

```markdown
# 第{N}章「{章名}」细纲

## 基本信息
- 目标字数：{3000-4000}
- 情绪基调：{如：紧张→释然→期待}
- 核心冲突：{一句话}

## 场景分解

### 场景1：{场景名}
- 时间：{故事内时间}
- 地点：{地点}
- 人物：{出场角色}
- 事件：{具体发生什么}
- 情绪：{角色情绪}
- 钩子：{吸引读者继续的悬念}

### 场景2：{...}
...

## 爽点设计
- 爽点1：{位置+内容}
- 爽点2：{...}

## 章尾钩子
- {本章结尾的悬念/期待}

## 伏笔操作
- 埋设：{新伏笔}
- 回收：{本章回收的伏笔}
```

### 验证规则
1. 情节点数量 >= 10
2. 包含"钩子"或"悬念"相关内容
3. 包含"爽点"相关内容
4. 与大纲和上一章衔接

### 防偷懒检查
- [ ] 实际读取了大纲和上下文文件
- [ ] 情节点不少于 10 个
- [ ] 包含钩子和爽点设计
- [ ] 与大纲和上一章衔接
- [ ] 细纲文件已实际创建

---

## Agent 05: file-analyzer（文件需求分析）

### 职责
分析细纲，确定需要读取的文件列表。

### 输入
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project_dir | string | 是 | 项目根目录路径 |
| chapter | number | 是 | 章节编号 |
| chapter_padded | string | 是 | 补零后的章节号 |

需要读取的文件：
- `{project_dir}/大纲/细纲_{chapter_padded}章.md`
- `{project_dir}/追踪/角色状态.md`

### 输出
文件：`{project_dir}/.workflow/step05-required-files.json`

```json
{
  "timestamp": "2026-06-17T19:57:00Z",
  "chapter": 21,
  "characters": ["江晨", "钟嘉嘉"],
  "character_files": ["设定/角色/江晨.md", "设定/角色/钟嘉嘉.md"],
  "scenes": ["军营", "城市"],
  "foreshadows": ["F001", "F015"],
  "tracking_files": [
    "追踪/伏笔.md",
    "追踪/时间线.md",
    "追踪/角色状态.md",
    "追踪/物品.md",
    "追踪/环境.md"
  ],
  "setting_files": [
    "设定/世界观/背景设定.md",
    "设定/关系.md"
  ],
  "reference_files": [],
  "previous_chapter_file": "正文/第020章.md"
}
```

### 验证规则
1. `characters` 必须从细纲实际解析
2. `character_files` 必须与角色状态文件交叉验证
3. `tracking_files` 必须包含所有追踪文件
4. `previous_chapter_file` 必须是实际存在的文件

### 防偷懒检查
- [ ] 实际读取了细纲文件
- [ ] 从细纲实际解析了角色列表
- [ ] 与角色状态文件交叉验证
- [ ] 输出 JSON 包含所有必要字段

---

## Agent 06: setting-decider（新设定决策）

### 职责
检查是否需要创建新设定文件。

### 输入
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project_dir | string | 是 | 项目根目录路径 |
| required_files | object | 是 | step05 的输出 |

### 输出
文件：`{project_dir}/.workflow/step06-new-settings.json`

```json
{
  "timestamp": "2026-06-17T19:57:00Z",
  "need_new_settings": false,
  "new_characters": [],
  "new_scenes": [],
  "new_items": [],
  "new_organizations": []
}
```

### 验证规则
1. 必须与角色状态文件交叉比对
2. 新角色不在现有角色列表中
3. 新场景不在现有环境列表中

### 防偷懒检查
- [ ] 实际读取了角色状态文件
- [ ] 实际检查了环境文件
- [ ] 与细纲中的元素交叉比对
- [ ] 输出 JSON 包含所有必要字段

---

## Agent 07: character-designer（设定创建）[条件任务]

### 职责
创建新设定文件。

### 触发条件
step06 中 `need_new_settings == true`

### 输入
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project_dir | string | 是 | 项目根目录路径 |
| new_settings | object | 是 | step06 中的新元素列表 |

### 输出
创建对应的设定文件：
- `{project_dir}/设定/角色/{角色名}.md`
- `{project_dir}/设定/世界观/{场景名}.md`
- 等等

### 角色文件格式

```markdown
# {角色名}

## 基本信息
- 姓名：
- 年龄：
- 身份：
- 外貌：

## 性格设定
- 核心性格：{2-3 个关键词}
- 说话风格：
- 行为模式：
- 禁忌：

## 动机链
- 短期目标：
- 长期目标：
- 内心冲突：

## 关系网络
- 与{角色B}：{关系描述}

## 状态变更记录
- 第{N}章：{变化}
```

### 验证规则
1. 每个新元素必须创建对应文件
2. 文件格式必须完整
3. 不能只有骨架

### 防偷懒检查
- [ ] 每个新元素都创建了对应文件
- [ ] 文件格式完整
- [ ] 内容不是空骨架

---

## Agent 08: context-reader（上下文读取）

### 职责
读取所有相关文件，组装结构化上下文。

### 输入
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project_dir | string | 是 | 项目根目录路径 |
| chapter | number | 是 | 章节编号 |
| required_files | object | 是 | step05 的输出 |

### 输出
文件：`{project_dir}/.workflow/step08-context.json`

```json
{
  "timestamp": "2026-06-17T19:57:00Z",
  "chapter": 21,
  "previous_chapter_ending": "（最后500字实际文本）",
  "active_foreshadows": [
    {"id": "F001", "content": "江晨的身世之谜", "planted_at": 3, "status": "已埋"}
  ],
  "character_states": {
    "江晨": {
      "identity": "军宣创作者",
      "ability": "视频剪辑、文案写作",
      "mood": "自信、积极",
      "personality_anchor": "热血、执着、正义感强"
    }
  },
  "environment": {
    "season": "春",
    "weather": "晴",
    "location": "军营"
  },
  "items": [],
  "writing_intent": "展示江晨的新任务挑战"
}
```

### 验证规则
1. `previous_chapter_ending` 必须是实际文本（最后 500 字）
2. `active_foreshadows` 必须从伏笔文件实际提取
3. `character_states` 必须从角色状态文件实际提取
4. `environment` 必须从环境文件实际提取

### 防偷懒检查
- [ ] 实际读取了每个文件
- [ ] 上一章结尾是实际文本
- [ ] 伏笔列表从文件实际提取
- [ ] 角色状态从文件实际提取
- [ ] 输出 JSON 包含所有必要字段

---

## Agent 09: constraint-gen（约束生成）

### 职责
生成写作约束参数。

### 输入
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project_dir | string | 是 | 项目根目录路径 |
| chapter | number | 是 | 章节编号 |
| context | object | 是 | step08 的输出 |

需要读取的文件：
- `{project_dir}/设定/文风.md`（如有）

### 输出
文件：`{project_dir}/.workflow/step09-constraints.json`

```json
{
  "timestamp": "2026-06-17T19:57:00Z",
  "chapter": 21,
  "word_count_target": 3000,
  "word_count_min": 2700,
  "banned_words_l1": ["不禁", "竟然", ...],
  "banned_words_l2": ["一抹", "一丝", ...],
  "ai_patterns_banned": [
    "他感到一股X涌上心头",
    "她的X宛如Y",
    "这不仅X，更Y",
    "这一刻，X",
    "面对X，他选择了Y",
    "不是A，而是B"
  ],
  "style_rules": {
    "max_paragraph_lines": 4,
    "max_sentence_chars": 45,
    "max_psychology_sentences": 2,
    "max_metaphor_per_1000": 1,
    "tension_sentence_length": "3-8字短句",
    "forbidden_opening": ["清晨", "阳光", "醒来", "睁开眼"],
    "forbidden_ending": ["总结", "升华", "感悟"]
  },
  "context_ref": "step08-context.json"
}
```

### 验证规则
1. `banned_words_l1` 必须包含 31 个一级禁用词
2. `banned_words_l2` 必须包含 18 个二级禁用词
3. `ai_patterns_banned` 必须包含 6 个禁止句式
4. `style_rules` 必须包含所有规则

### 防偷懒检查
- [ ] 禁用词从实际文件加载
- [ ] 文风规则从文风.md 提取（如有）
- [ ] 输出 JSON 包含所有必要字段

---

## Agent 10: narrative-writer（正文写作）

### 职责
根据细纲和约束写作正文。

### 输入
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project_dir | string | 是 | 项目根目录路径 |
| chapter | number | 是 | 章节编号 |
| chapter_padded | string | 是 | 补零后的章节号 |
| context | object | 是 | step08 的输出 |
| constraints | object | 是 | step09 的输出 |

需要读取的文件：
- `{project_dir}/大纲/细纲_{chapter_padded}章.md`

### 输出
文件：`{project_dir}/正文/第{chapter_padded}章.md`

### 写作要求
1. 严格按照细纲场景顺序写作
2. 遵守所有约束参数
3. 开头不能用"清晨/阳光/醒来"等俗套
4. 结尾必须有钩子
5. 对话必须符合角色性格锚点
6. 段落不超过 4 行
7. 单句不超过 45 字
8. 心理描写不超过 2 句
9. 比喻不超过 1 个/千字
10. 紧张处用 3-8 字短句

### 正文格式

```markdown
# 第{N}章 {章名}

{正文内容}
```

### 验证规则
1. 文件必须存在
2. 字数 >= 目标字数 * 90%
3. 包含细纲中的所有场景
4. 开头不是禁止的俗套
5. 结尾有钩子

### 防偷懒检查
- [ ] 实际读取了细纲文件
- [ ] 实际读取了上下文和约束
- [ ] 正文文件已实际创建
- [ ] 字数达到要求
- [ ] 包含所有场景

---

## Agent 11: quality-checker（质量检测）

### 职责
运行质量检测脚本，生成检测报告。

### 输入
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project_dir | string | 是 | 项目根目录路径 |
| chapter | number | 是 | 章节编号 |
| chapter_padded | string | 是 | 补零后的章节号 |

### 输出
文件：`{project_dir}/.workflow/step11-quality-report.json`

### 检测项

| 序号 | 检测项 | 脚本 | 严重度 |
|------|--------|------|--------|
| 1 | 字数达标 | Python 统计 | BLOCK |
| 2 | 禁用词 | style-lint.js | BLOCK |
| 3 | 一致性 | consistency-check.js | BLOCK |
| 4 | 跨章节重复 | cross-chapter-check.js | WARN |
| 5 | 角色声音 | voice-check.js | WARN |
| 6 | 情绪曲线 | emotion-analyzer.js | WARN |
| 7 | 伏笔检查 | foreshadow-check.js | WARN |

### 输出格式

```json
{
  "timestamp": "2026-06-17T19:57:00Z",
  "chapter": 21,
  "chapter_file": "正文/第021章.md",
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
      "details": "发现 2 个一级禁用词"
    }
  ],
  "block_count": 1,
  "warn_count": 0,
  "overall": "BLOCK"
}
```

### 验证规则
1. 必须运行所有检测脚本
2. 每个检测项必须有结果
3. BLOCK 项必须列出具体位置
4. `overall` 基于 block_count 和 warn_count 计算

### 防偷懒检查
- [ ] 实际运行了所有检测脚本
- [ ] 每个检测项都有结果
- [ ] BLOCK 项列出了具体位置
- [ ] 输出 JSON 包含所有必要字段

---

## Agent 12: fixer（问题修复）[条件任务]

### 职责
修复质量检测发现的问题。

### 触发条件
step11 中 `block_count > 0`

### 输入
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project_dir | string | 是 | 项目根目录路径 |
| chapter | number | 是 | 章节编号 |
| chapter_padded | string | 是 | 补零后的章节号 |
| quality_report | object | 是 | step11 的输出 |
| constraints | object | 是 | step09 的输出 |

### 输出
- 更新：`{project_dir}/正文/第{chapter_padded}章.md`
- 创建：`{project_dir}/.workflow/step12-fix-log.json`

### 修复策略

| 问题类型 | 修复方式 | 调用原子 |
|---------|---------|---------|
| 字数不足 | 补写场景/扩充描写 | generate-chapter |
| 禁用词 | 替换为推荐表达 | fix-text |
| 一致性错误 | 修正矛盾描述 | fix-text |
| 对话不自然 | 对话去腔调 | fix-dialogue |
| 结尾升华 | 删除总结性语句 | fix-style |

### 输出格式

```json
{
  "timestamp": "2026-06-17T19:57:00Z",
  "chapter": 21,
  "fixes_applied": [
    {
      "type": "banned-word",
      "original": "他不禁感到一阵激动",
      "fixed": "他攥紧了拳头，指节发白",
      "position": 123,
      "word": "不禁"
    }
  ],
  "fix_count": 5,
  "new_word_count": 3350,
  "remaining_blocks": 0
}
```

### 验证规则
1. 每个 BLOCK 项必须修复
2. 修复必须实际修改文件
3. 修复后必须重新统计字数
4. `remaining_blocks` 必须为 0

### 防偷懒检查
- [ ] 每个 BLOCK 项都已修复
- [ ] 正文文件已实际修改
- [ ] 字数已重新统计
- [ ] 输出 JSON 包含所有必要字段

---

## Agent 13: rechecker（复查）[条件任务]

### 职责
修复后重新运行质量检测。

### 触发条件
step12 存在（即执行了修复）

### 输入
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project_dir | string | 是 | 项目根目录路径 |
| chapter | number | 是 | 章节编号 |
| chapter_padded | string | 是 | 补零后的章节号 |

### 输出
文件：`{project_dir}/.workflow/step13-recheck-report.json`

### 循环规则
- 最多 3 轮修复-复查循环
- 连续 2 轮无新改动则停止
- 3 轮后仍有 BLOCK 则标记任务失败

### 防偷懒检查
- [ ] 重新运行了完整检测
- [ ] 没有假设修复成功
- [ ] 输出 JSON 包含所有必要字段

---

## Agent 14: tracker（追踪更新）

### 职责
更新所有追踪文件。

### 输入
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| project_dir | string | 是 | 项目根目录路径 |
| chapter | number | 是 | 章节编号 |
| chapter_padded | string | 是 | 补零后的章节号 |
| context | object | 是 | step08 的输出 |

### 更新项

| 序号 | 文件 | 更新内容 |
|------|------|---------|
| 1 | 追踪/伏笔.md | 新增/回收本章伏笔 |
| 2 | 追踪/时间线.md | 新增本章事件时序 |
| 3 | 追踪/角色状态.md | 更新角色状态变更 |
| 4 | 追踪/物品.md | 更新物品位置/状态 |
| 5 | 追踪/环境.md | 更新环境描述 |
| 6 | 追踪/重复语句.md | 记录本章重复语句 |
| 7 | 追踪/上下文.md | 更新进度摘要 |

### 验证规则
1. 必须从正文实际提取信息
2. 每个文件必须实际更新
3. 更新内容必须与正文一致

### 防偷懒检查
- [ ] 实际读取了正文文件
- [ ] 从正文实际提取了信息
- [ ] 每个追踪文件都已更新
- [ ] 更新内容与正文一致
