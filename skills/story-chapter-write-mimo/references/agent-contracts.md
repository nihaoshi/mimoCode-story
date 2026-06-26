# Agent 契约文档 v2.0

> 定义每个 Agent 的输入输出格式、验证规则和防偷懒检查点

---

## 通用规则

### 子 agent 隔离执行

每个任务由独立的子 agent 执行，通过 `actor` 工具 spawn：
- `context: "none"` — 隔离上下文，只看到当前任务的输入
- 必须从文件读取输入，不能凭记忆
- 必须写入文件输出，不能只在对话中输出

### 输入验证

每个 Agent 启动时必须：
1. 读取所有输入文件
2. 验证 JSON 格式正确
3. 验证必要字段存在
4. 验证章节号一致性

### 输出验证

每个 Agent 完成时必须：
1. 写入约定的输出文件
2. 输出文件必须包含所有必要字段
3. 输出内容必须与输入一致

---

## Phase 1: 准备阶段

### Agent 01: health-checker（目录健全检查）

**职责**：检查项目目录结构完整性，创建缺失的目录和文件模板

**输入**：project_dir

**输出**：`.workflow/step01-health-check.json`

**验证**：checked 数组必须有 9 项

---

### Agent 02: chapter-finder（章节信息获取）

**职责**：扫描正文目录，获取最新章节信息

**输入**：正文目录

**输出**：`.workflow/step02-chapter-info.json`

**验证**：next_chapter = last_chapter + 1

---

### Agent 03: outline-checker（细纲检查）

**职责**：检查下一章细纲是否存在，验证格式完整性

**输入**：大纲目录、章节号

**输出**：`.workflow/step03-outline-check.json`

**验证**：need_create 逻辑正确

---

### Agent 04: story-architect（细纲创建）[条件]

**触发条件**：step03.need_create = true

**职责**：根据大纲和上下文创建细纲

**输入**：大纲、卷纲、上下文、伏笔、角色状态

**输出**：`大纲/细纲_{N}章.md`

**验证**：情节点 >= 10，包含钩子和爽点

---

### Agent 05: file-analyzer（文件需求分析）

**职责**：分析细纲，确定需要读取的文件列表

**输入**：细纲、角色状态

**输出**：`.workflow/step05-required-files.json`

**验证**：characters 从细纲实际解析

---

### Agent 06: setting-decider（新设定决策）

**职责**：检查是否需要创建新设定文件

**输入**：step05 输出、设定目录

**输出**：`.workflow/step06-new-settings.json`

**验证**：need_new_settings 逻辑正确

---

### Agent 07: character-designer（设定创建）[条件]

**触发条件**：step06.need_new_settings = true

**职责**：创建新设定文件

**输入**：新元素列表

**输出**：设定文件

**验证**：文件格式完整，不是空骨架

---

## Phase 2: 写作阶段

### Agent 08: context-reader（上下文读取）

**职责**：读取所有相关文件，组装结构化上下文

**输入**：step05 文件列表

**输出**：`.workflow/step08-context.json`

**验证**：previous_chapter_ending 长度 >= 100

---

### Agent 09: constraint-gen（约束生成）

**职责**：生成写作约束参数

**输入**：step08 上下文、文风文件

**输出**：`.workflow/step09-constraints.json`

**验证**：banned_words_l1 有 31 个，word_count_target 存在

---

### Agent 10: narrative-writer（正文写作）

**职责**：只写作，不检查质量

**输入**：细纲、上下文、约束

**输出**：`正文/第{N}章.md`

**验证**：文件存在，包含所有场景

**特别说明**：
- 不检查字数（后续检测）
- 不检查禁用词（后续检测）
- 不运行脚本（后续检测）
- 专注创作，写完即止

---

## Phase 3: 检测阶段

### Agent 11: quality-checker（综合质量检测）

**职责**：运行全部 6 项检测，记录所有问题

**输入**：正文文件

**输出**：`.workflow/step11-quality-report.json`

**检测项**：
1. 字数达标（BLOCK）
2. 禁用词+AI腔（BLOCK）
3. AI标点符号（BLOCK）
4. 一致性（BLOCK）
5. 章内逻辑性（WARN）
6. 跨章节检查（WARN）

**验证**：checks 数组有 6 项

**关键规则**：只要有任何 WARN 或 BLOCK，就必须进入修复流程

---

## Phase 4: 修复阶段

### Agent 12: chapter-fixer（综合修复）[条件]

**触发条件**：step11 中 total_issues > 0（有任何 WARN 或 BLOCK）

**职责**：修复所有问题（字数扩充 + 禁用词替换 + 逻辑修正）

**输入**：
- `.workflow/step11-quality-report.json`（检测报告）
- `正文/第{N}章.md`（正文）
- `.workflow/step09-constraints.json`（约束）

**输出**：
- 更新：`正文/第{N}章.md`
- 创建：`.workflow/step12-fix-log.json`

**修复策略**：

| 问题类型 | 修复方式 |
|---------|---------|
| 字数不足 | 增加细节描写、对话、心理活动 |
| 禁用词 | 替换为推荐表达 |
| AI腔 | 改写为自然句式 |
| 一致性错误 | 修正矛盾描述 |
| 逻辑问题 | 补充铺垫或调整情节 |

**验证**：fix_log 中每个问题都有修复记录

**关键规则**：
- BLOCK 优先修复
- WARN 也要修复，不能跳过
- 修复后必须重新统计字数

---

### Agent 13: rechecker（复查）[条件]

**触发条件**：step12 存在（执行了修复）

**职责**：重新运行完整检测

**输入**：修复后的正文

**输出**：`.workflow/step13-recheck-report.json`

**验证**：total_issues = 0 或最多 3 轮循环

---

## Phase 5: 收尾阶段

### Agent 14: tracker（追踪+设定更新）

**职责**：更新所有追踪文件和设定文件

**输入**：最终版正文、step08 上下文

**更新项**：

追踪文件（7个）：
1. 追踪/伏笔.md
2. 追踪/时间线.md
3. 追踪/角色状态.md
4. 追踪/物品.md
5. 追踪/环境.md
6. 追踪/重复语句.md
7. 追踪/上下文.md

设定文件（如有变化）：
- 设定/角色/{角色名}.md — 角色状态、能力、关系变化
- 设定/世界观/*.md — 世界观设定变化
- 设定/势力/*.md — 势力变化
- 设定/关系.md — 角色关系变化

**验证**：追踪文件已更新，设定文件有变化时必须更新

---

### Agent 14.5: setting-verifier（设定回写验证）

**职责**：验证 Step 14 的设定回写是否完整

**输入**：本章正文、设定文件、追踪文件

**验证项**：
1. 扫描本章正文中的所有角色名
2. 检查每个角色的设定文件是否包含本章新增的关键信息
3. 检查追踪/角色状态.md 中角色状态是否已更新
4. 输出验证报告

**输出**：`.workflow/step14.5-setting-verification.json`

**验证**：
- characters_found 数组包含本章所有角色
- verification_results 数组标注每个角色的验证状态
- missing_updates 数组列出需要回写的文件
- status 为 "warn" 时有遗漏的设定更新

---

## 输出文件清单

```
.workflow/
├── step01-health-check.json      # 目录检查结果
├── step02-chapter-info.json      # 章节信息
├── step03-outline-check.json     # 细纲检查
├── step05-required-files.json    # 需要读取的文件
├── step06-new-settings.json      # 新设定决策
├── step08-context.json           # 上下文信息
├── step09-constraints.json       # 约束参数
├── step11-quality-report.json    # 综合检测报告
├── step12-fix-log.json           # 修复日志
├── step13-recheck-report.json    # 复查报告
└── step14.5-setting-verification.json  # 设定回写验证
```
