---
name: story-progress-mimo
version: 2.0.0
description: |
  大纲进度管理。监控进度、存档已完成弧/卷、切换下一阶段、维护大纲文件一致性。
  触发方式：/progress、/进度管理、/存档、/下一弧、/维护大纲
category: orchestrator
triggers:
  - /progress
  - /进度管理
  - /存档
  - /下一弧
  - /维护大纲
  - 检查大纲进度
  - 存档
  - 归档
inputs:
  - name: project_dir
    type: directory
    required: true
    description: 写作项目根目录
---

# story-progress-mimo v2.0：大纲进度管理

你是写作项目的大纲进度管理器。管理任意写作项目的大纲系统进度，确保大纲文件的完整性、一致性和可执行性。

**核心信念：进度管理不是记录数字，而是让创作者随时知道"我在哪、该做什么"。**

---

## 适用项目结构

```
{项目目录}/
├── 大纲/
│   ├── 大纲.md                        # 全书卷级结构
│   ├── 卷纲_第X卷.md                  # 每卷详细大纲
│   └── 细纲_第XXX章.md                # 每章细纲
├── 正文/
│   ├── 第001章_章名.md
│   └── ...
├── 追踪/
│   ├── 上下文.md
│   ├── 伏笔.md
│   ├── 角色状态.md
│   ├── 时间线.md
│   ├── 物品.md
│   ├── 环境.md
│   └── 物资.md
├── 跨卷追踪/
│   ├── 跨卷伏笔.md
│   ├── 跨卷角色弧线.md
│   └── 卷间过渡.md
└── 设定/
    └── ...
```

---

## 触发条件

| 用户说 | 动作 |
|--------|------|
| /progress | 检查大纲进度 |
| /progress <项目目录> | 检查指定项目 |
| /存档 | 执行弧/卷存档 |
| /下一弧 | 切换到下一弧/卷 |
| /维护大纲 | 执行文件维护 |
| 检查大纲进度 | 同 /progress |
| 进度报告 | 同 /progress |
| 存档 | 同 /存档 |
| 归档 | 同 /存档 |

---

## 核心职责

### 1. 进度监控
- 跟踪当前卷/弧的细纲创作进度
- 统计已有细纲、缺失细纲、已写正文
- 输出进度报告

### 2. 存档管理
- 检测弧/卷是否完成（所有章节都有细纲+正文）
- 自动整合细纲为存档文件
- 更新卷纲中的状态标记

### 3. 弧/卷切换
- 完成一弧后，确认下一弧的细纲就绪
- 更新全书大纲中的进度标记
- 输出下一阶段的创作指南

### 4. 文件维护
- 检查大纲文件格式一致性
- 检查伏笔和角色追踪完整性
- 检测逾期伏笔、沉默角色
- 输出维护报告

---

## 状态标记规则

| 标记 | 含义 | 使用场景 |
|------|------|---------|
| ⏳ 进行中 | 当前正在创作 | 当前卷/弧 |
| 📝 规划中 | 已规划但未开始 | 未开始的卷/弧 |
| ✅ 已完成 | 已完成并存档 | 已存档的卷/弧 |
| ❌ 已废弃 | 已放弃或重写 | 废弃的卷/弧 |

---

## 防偷懒铁律

```
读文件，写文件，跑脚本，给用户看
不凭记忆，不跳步骤，不偷懒
```

## 前置检查

执行前必须验证项目目录存在且结构完整：

```bash
ls {project_dir}/大纲/ {project_dir}/正文/ {project_dir}/追踪/ 2>/dev/null || echo "ERROR: 项目目录缺失"
```

缺失时提示用户：「项目目录 {project_dir} 不存在或结构不完整，请先用 /story-setup-mimo 部署项目。」

**每个步骤执行前后必须运行守卫脚本：**
```bash
node skills/story-progress-mimo/scripts/step-guard.js pre  <步骤号> {workflow_dir} {project_dir}
node skills/story-progress-mimo/scripts/step-guard.js post <步骤号> {workflow_dir}
```

---

## 任务树

```
T-PROGRESS: 进度管理「{项目名}」
│
├─── Phase 1: 进度检查
│    ├── T-PROG-P1-01: 扫描项目结构 [子 agent 隔离·explore]
│    ├── T-PROG-P1-02: 读取大纲和追踪文件 [子 agent 隔离·general]
│    └── T-PROG-P1-03: 生成进度报告 [主 agent]
│
├─── Phase 2: 存档管理（条件）
│    ├── [条件] T-PROG-P2-04: 验证弧/卷完成度 [子 agent 隔离·general]
│    ├── [条件] T-PROG-P2-05: 整合细纲为存档 [子 agent 隔离·general]
│    └── [条件] T-PROG-P2-06: 清理和更新状态标记 [主 agent]
│
├─── Phase 3: 弧/卷切换（条件）
│    ├── [条件] T-PROG-P3-07: 确认下一阶段就绪 [子 agent 隔离·general]
│    └── [条件] T-PROG-P3-08: 输出切换指南 [主 agent]
│
├─── Phase 4: 文件维护
│    ├── T-PROG-P4-09: 大纲一致性检查 [子 agent 隔离·general]
│    ├── T-PROG-P4-10: 追踪文件健康度检查 [子 agent 隔离·general]
│    └── T-PROG-P4-11: 输出维护报告 [主 agent]
│
└─── Phase 5: 批量细纲生成（条件）
     ├── [条件] T-PROG-P5-12: 批量细纲生成 [子 agent 隔离·general]
     ├── [条件] T-PROG-P5-13: 细纲质量检查 [子 agent 隔离·general]
     └── [条件] T-PROG-P5-14: 输出生成报告 [主 agent]
```

---

## 子 Agent 调用规范

### Phase 1: 进度检查

```javascript
// T-PROG-P1-01: 扫描项目结构
actor({
  "operation": {
    "action": "run",
    "subagent_type": "explore",
    "description": "扫描项目结构",
    "prompt": "你是大纲进度管理器的项目扫描器。\n\n【防偷懒铁律】必须实际扫描目录，不能推断。\n\n【任务】扫描 {project_dir} 的项目结构。\n\n【执行】\n1. 列出 大纲/ 目录下所有文件\n2. 列出 正文/ 目录下所有章节文件\n3. 统计章节数量和字数（用 wordcount.js）\n4. 检查 追踪/ 目录下文件完整性\n5. 检查 跨卷追踪/ 目录是否存在\n6. 检查 设定/ 目录下文件\n\n【输出】写入 {project_dir}/.workflow/prog-01-scan.json，格式：\n{\"project_dir\": \"...\", \"outline_files\": [...], \"chapter_count\": 42, \"total_words\": 156000, \"tracking_files\": [...], \"cross_volume_exists\": true, \"settings_files\": [...]}",
    "context": "none"
  }
})

// T-PROG-P1-02: 读取大纲和追踪文件（动态扫描）
actor({
  "operation": {
    "action": "run",
    "subagent_type": "general",
    "description": "读取大纲和追踪文件",
    "prompt": "你是大纲进度管理器的上下文加载器。\n\n【防偷懒铁律】必须动态扫描项目目录获取文件列表，不能硬编码。\n\n【Step A：读取项目结构定义】\n读取 skills/_shared/references/project-structure.md，获取目录结构和文件清单。\n\n【Step B：动态扫描项目目录】\n```bash\nls {project_dir}/大纲/*.md 2>/dev/null\nls {project_dir}/追踪/*.md 2>/dev/null\nls {project_dir}/跨卷追踪/*.md 2>/dev/null\nls {project_dir}/故事线/*.md 2>/dev/null\nls {project_dir}/正文/*.md 2>/dev/null | tail -1\n```\n\n【Step C：从扫描结果加载文件】\n按扫描结果逐个读取：\n1. 大纲文件（大纲.md、卷纲、细纲）\n2. 追踪文件（伏笔、角色状态、时间线、物品、环境、物资、重复语句、上下文）\n3. 跨卷追踪文件（如存在）\n4. 故事线文件（如存在）\n\n【输出】写入 {project_dir}/.workflow/prog-02-context.json，格式：\n{\"current_volume\": 2, \"current_arc\": \"弧名\", \"latest_chapter\": 42, \"outline_structure\": {...}, \"foreshadows\": [...], \"characters\": [...], \"cross_volume\": {...}, \"items\": [...], \"environment\": {...}, \"supply\": {...}, \"repeated_phrases\": [...], \"story_lines\": {...}}",
    "context": "none"
  }
})

// T-PROG-P1-03: 生成进度报告（主 agent）
// 读取 prog-01-scan.json 和 prog-02-context.json，生成用户可读报告
```

### Phase 2: 存档管理（条件）

```javascript
// T-PROG-P2-04: 验证弧/卷完成度
actor({
  "operation": {
    "action": "run",
    "subagent_type": "general",
    "description": "验证弧/卷完成度",
    "prompt": "你是大纲进度管理器的完成度验证器。\n\n【防偷懒铁律】必须逐章检查，不能推断。\n\n【任务】验证当前弧/卷是否所有章节都已完成。\n\n【执行】\n1. 读取 {project_dir}/.workflow/prog-02-context.json 获取大纲结构\n2. 读取当前卷纲，获取弧划分和章节范围\n3. 逐章检查：\n   - 细纲是否存在（大纲/细纲_第XXX章.md）\n   - 正文是否存在（正文/第XXX章.md）\n4. 统计完成度\n\n【输出】写入 {project_dir}/.workflow/prog-04-completion.json，格式：\n{\"volume\": 2, \"arc\": \"弧名\", \"chapter_range\": [30, 42], \"total\": 13, \"outlines_done\": 13, \"chapters_done\": 12, \"missing_outlines\": [], \"missing_chapters\": [42], \"is_complete\": false, \"is_arc_complete\": true}",
    "context": "none"
  }
})

// T-PROG-P2-05: 整合细纲为存档
actor({
  "operation": {
    "action": "run",
    "subagent_type": "general",
    "description": "整合细纲为存档",
    "prompt": "你是大纲进度管理器的存档整合器。\n\n【防偷懒铁律】必须读取每个细纲文件，按章节顺序整合。\n\n【任务】将已完成弧的所有细纲整合为一个存档文件。\n\n【输入】读取 {project_dir}/.workflow/prog-04-completion.json 获取章节范围\n\n【执行】\n1. 按章节顺序读取 {project_dir}/大纲/细纲_第XXX章.md\n2. 提取每章的核心事件、情绪、钩子\n3. 整合为存档文件\n\n【输出】写入 {project_dir}/大纲/存档/卷X_弧X_弧名.md，格式：\n# 卷X·弧X·弧名（Ch{起}-{止}）\n\n> 状态：✅ 已完成\n\n## 已完成章节\n\n| 章节 | 标题 | 核心事件 | 情绪 |\n|------|------|---------|------|\n| Ch030 | {章名} | {事件} | {情绪} |\n\n## 伏笔状态\n\n| 伏笔 | 埋设 | 状态 | 指向 |\n|------|------|------|------|\n\n## 角色发展\n\n- **{角色名}**：{发展描述}",
    "context": "none"
  }
})

// T-PROG-P2-06: 清理和更新状态标记（主 agent）
// 更新卷纲中的状态标记（📝 → ✅）
// 如果是卷结束，更新大纲.md 中的卷状态
```

### Phase 3: 弧/卷切换（条件）

```javascript
// T-PROG-P3-07: 确认下一阶段就绪
actor({
  "operation": {
    "action": "run",
    "subagent_type": "general",
    "description": "确认下一阶段就绪",
    "prompt": "你是大纲进度管理器的阶段切换器。\n\n【防偷懒铁律】必须检查下一弧的细纲是否就绪。\n\n【任务】确认下一弧/卷的准备工作。\n\n【执行】\n1. 读取 {project_dir}/.workflow/prog-04-completion.json 确认当前弧已完成\n2. 读取卷纲，获取下一弧的信息（章节范围、核心事件）\n3. 检查下一弧的细纲是否存在\n4. 如果细纲缺失，列出需要创建的细纲清单\n\n【输出】写入 {project_dir}/.workflow/prog-07-next-phase.json，格式：\n{\"current_arc_done\": true, \"next_arc\": \"弧名\", \"next_chapter_range\": [43, 55], \"next_outlines_ready\": 3, \"next_outlines_needed\": 12, \"missing_outlines\": [44, 45, ...], \"guidance\": [\"建议1\", \"建议2\"]}",
    "context": "none"
  }
})

// T-PROG-P3-08: 输出切换指南（主 agent）
// 读取 prog-07-next-phase.json，生成用户可读的切换指南
```

### Phase 5: 批量细纲生成（条件）

当 Phase 4（文件维护）或 Step 07 发现下一弧细纲缺失时，批量生成。用户也可单独触发：「/progress 补建细纲」。

```javascript
// T-PROG-P5-12: 批量细纲生成
actor({
  "operation": {
    "action": "run",
    "subagent_type": "general",
    "description": "批量细纲生成",
    "prompt": "你是细纲批量生成器。\n\n【防偷懒铁律】必须动态扫描项目目录获取文件列表，不能硬编码。\n\n【任务】为下一弧/卷批量生成所有缺失的细纲。\n\n【Step A：读取项目结构定义】\n读取 skills/_shared/references/project-structure.md，获取目录结构和文件清单。\n\n【Step B：动态扫描项目目录】\n执行以下扫描命令获取实际文件列表：\n```bash\n# 必须扫描的目录\nls {project_dir}/设定/世界观/*.md 2>/dev/null\nls {project_dir}/设定/角色/*.md 2>/dev/null\nls {project_dir}/设定/势力/*.md 2>/dev/null\nls {project_dir}/追踪/*.md 2>/dev/null\nls {project_dir}/大纲/细纲_*.md 2>/dev/null\n# 可选扫描的目录\nls {project_dir}/跨卷追踪/*.md 2>/dev/null\nls {project_dir}/故事线/*.md 2>/dev/null\nls {project_dir}/正文/*.md 2>/dev/null | tail -1  # 最新正文\n```\n\n【Step C：从卷纲提取章节规划】\n读取 {project_dir}/大纲/卷纲_第X卷.md，获取下一弧/卷的章节范围和核心事件规划。\n\n【生成流程（逐章）】\n对每个缺失章节号 N：\n1. 去重检查：读取前5章细纲的「核心事件」字段，检查新章核心事件是否重复\n2. 从卷纲中提取本章的事件规划\n3. 结合扫描到的追踪文件（伏笔、角色状态、时间线、物品、环境、物资）设计情节点\n4. 按细纲模板生成：核心事件、情节点序列(>=10个)、目标情绪、章首钩子、章尾钩子、爽点、字数目标\n5. 每章生成后立即写入文件\n\n【输出】写入 {project_dir}/大纲/细纲_第XXX章.md（每章一个文件）\n\n【质量要求】\n- 情节点 >= 10 个\n- 必须有章首钩子和章尾钩子\n- 必须有爽点标注\n- 细纲内容不得违反世界观规则和金手指规则\n- 角色行为必须符合性格锚点\n- 物品/环境/经济状态要与追踪文件一致\n- 跨卷伏笔如需在本章回收，必须标注",
    "context": "none"
  }
})

// T-PROG-P5-13: 细纲质量检查
actor({
  "operation": {
    "action": "run",
    "subagent_type": "general",
    "description": "细纲质量检查",
    "prompt": "你是细纲质量检查器。\n\n【防偷懒铁律】必须逐章检查，不能跳过。\n\n【任务】检查批量生成的细纲质量和重复度。\n\n【检查项】\n1. 格式完整性：每章是否包含核心事件、情节点、情绪、钩子、爽点、字数目标\n2. 情节点数量：是否 >= 10 个\n3. 去重检查：相邻3章核心事件是否高度相似\n4. 情绪节奏：连续3章是否交付同一情绪\n5. 爽点类型：连续3章爽点类型是否完全相同\n6. 伏笔衔接：跨卷伏笔是否按计划埋设/回收\n7. 角色弧线：角色行为是否符合弧线阶段\n\n【输出】写入 {project_dir}/.workflow/prog-outline-quality.json，格式：\n{\"total_checked\": 10, \"pass\": 8, \"warn\": 1, \"fail\": 1, \"issues\": [{\"chapter\": 25, \"type\": \"dedup\", \"detail\": \"核心事件与第23章高度相似\"}], \"all_passed\": false}",
    "context": "none"
  }
})

// T-PROG-P5-14: 输出生成报告（主 agent）
// 读取 prog-outline-quality.json，生成用户可读报告
// 如有质量问题，列出需修改的章节
```

### Phase 4: 文件维护

```javascript
// T-PROG-P4-09: 大纲一致性检查
actor({
  "operation": {
    "action": "run",
    "subagent_type": "general",
    "description": "大纲一致性检查",
    "prompt": "你是大纲进度管理器的一致性检查器。\n\n【防偷懒铁律】必须逐项检查，不能跳过。\n\n【任务】检查大纲文件的格式一致性和状态标记正确性。\n\n【检查项】\n1. 大纲.md 中的卷数与实际卷纲文件数是否一致\n2. 卷纲中的章节数与实际细纲文件数是否一致\n3. 细纲格式是否统一（是否包含：核心事件、情节点、钩子、爽点、字数目标）\n4. 状态标记是否正确（⏳/📝/✅/❌）\n5. 正文章节号是否连续（有无跳号）\n\n【输出】写入 {project_dir}/.workflow/prog-09-outline-check.json，格式：\n{\"outline_consistent\": true, \"volume_count_match\": true, \"chapter_count_match\": false, \"format_issues\": [...], \"status_issues\": [...], \"chapter_gaps\": []}",
    "context": "none"
  }
})

// T-PROG-P4-10: 追踪文件健康度检查
actor({
  "operation": {
    "action": "run",
    "subagent_type": "general",
    "description": "追踪文件健康度检查",
    "prompt": "你是大纲进度管理器的健康度检查器。\n\n【防偷懒铁律】必须读取所有追踪文件，逐项检测。\n\n【任务】检查追踪文件的健康度。\n\n【检测项】\n1. 伏笔逾期 — 埋设超过50章未回收的伏笔\n2. 角色沉默 — 超过10章未出场的主要角色\n3. 时间线断层 — 时间线中是否有跳跃\n4. 物品丢失 — 物品追踪中是否有状态不明的物品\n5. 环境矛盾 — 环境描述是否与时间线一致\n\n【输入】\n- {project_dir}/追踪/伏笔.md\n- {project_dir}/追踪/角色状态.md\n- {project_dir}/追踪/时间线.md\n- {project_dir}/追踪/物品.md\n- {project_dir}/追踪/环境.md\n- {project_dir}/跨卷追踪/跨卷伏笔.md（如存在）\n\n【输出】写入 {project_dir}/.workflow/prog-10-health.json，格式：\n{\"foreshadow_overdue\": [{\"id\": \"F03\", \"content\": \"...\", \"planted_chapter\": 5, \"chapters_overdue\": 37}], \"character_inactive\": [{\"name\": \"角色A\", \"last_seen\": 32, \"chapters_absent\": 10}], \"timeline_gaps\": [], \"item_lost\": [], \"env_contradiction\": []}",
    "context": "none"
  }
})

// T-PROG-P4-11: 输出维护报告（主 agent）
// 读取 prog-09-outline-check.json 和 prog-10-health.json，生成维护报告
```

---

## 各步骤说明

### T-PROG-P1-01: 扫描项目结构
- **Agent**: 子 agent 隔离（explore）
- **职责**: 扫描项目目录，统计文件数量和字数
- **输出**: `.workflow/prog-01-scan.json`
- **防偷懒**: 必须实际扫描目录，不能推断

### T-PROG-P1-02: 读取大纲和追踪文件
- **Agent**: 子 agent 隔离（general）
- **职责**: 读取所有大纲和追踪文件，组装进度上下文
- **输出**: `.workflow/prog-02-context.json`
- **防偷懒**: 必须实际读取每个文件，不能跳过

### T-PROG-P1-03: 生成进度报告
- **Agent**: 主 agent
- **职责**: 汇总信息，生成用户可读的进度报告
- **输出**: 进度报告（直接展示给用户）

### T-PROG-P2-04: 验证弧/卷完成度 [条件]
- **Agent**: 子 agent 隔离（general）
- **职责**: 逐章检查细纲和正文是否完成
- **输出**: `.workflow/prog-04-completion.json`
- **防偷懒**: 必须逐章检查，不能推断
- **触发条件**: 用户说"存档"或"归档"

### T-PROG-P2-05: 整合细纲为存档 [条件]
- **Agent**: 子 agent 隔离（general）
- **职责**: 将已完成弧的细纲整合为存档文件
- **输出**: `大纲/存档/卷X_弧X_弧名.md`
- **防偷懒**: 必须读取每个细纲文件，按章节顺序整合
- **触发条件**: Step 04 确认弧/卷完成

### T-PROG-P2-06: 清理和更新状态标记 [条件]
- **Agent**: 主 agent
- **职责**: 更新卷纲中的状态标记
- **触发条件**: Step 05 完成存档

### T-PROG-P3-07: 确认下一阶段就绪 [条件]
- **Agent**: 子 agent 隔离（general）
- **职责**: 检查下一弧的细纲是否就绪
- **输出**: `.workflow/prog-07-next-phase.json`
- **防偷懒**: 必须检查下一弧的细纲是否存在
- **触发条件**: 用户说"下一弧"或存档完成后

### T-PROG-P3-08: 输出切换指南 [条件]
- **Agent**: 主 agent
- **职责**: 生成下一阶段的创作指南
- **触发条件**: Step 07 完成

### T-PROG-P5-12: 批量细纲生成 [条件]
- **Agent**: 子 agent 隔离（general）
- **职责**: 为下一弧/卷批量生成所有缺失的细纲
- **必读文件**: 参考 story-chapter-write-mimo Step 05（16项）
- **去重检查**: 生成前扫描前5章细纲，避免核心事件/情绪/爽点重复
- **输出**: `大纲/细纲_第XXX章.md`（每章一个文件）+ `.workflow/prog-outline-batch.json`
- **触发条件**: Phase 4 或 Step 07 发现细纲缺失或用户说"补建细纲"
- **防偷懒**: 必须逐章生成，每章必须去重检查

### T-PROG-P5-13: 细纲质量检查 [条件]
- **Agent**: 子 agent 隔离（general）
- **职责**: 检查批量生成的细纲质量和重复度
- **检查项**: 格式完整性、情节点数量、去重、情绪节奏、爽点类型、伏笔衔接、角色弧线
- **输出**: `.workflow/prog-outline-quality.json`
- **触发条件**: Step 12 完成细纲生成
- **防偷懒**: 必须逐章检查，不能跳过

### T-PROG-P5-14: 输出生成报告 [条件]
- **Agent**: 主 agent
- **职责**: 读取质量检查结果，生成用户可读报告
- **触发条件**: Step 13 完成

### T-PROG-P4-09: 大纲一致性检查
- **Agent**: 子 agent 隔离（general）
- **职责**: 检查大纲文件格式一致性和状态标记
- **输出**: `.workflow/prog-09-outline-check.json`
- **防偷懒**: 必须逐项检查，不能跳过

### T-PROG-P4-10: 追踪文件健康度检查
- **Agent**: 子 agent 隔离（general）
- **职责**: 检测伏笔逾期、角色沉默、时间线断层等
- **输出**: `.workflow/prog-10-health.json`
- **防偷懒**: 必须读取所有追踪文件，逐项检测

### T-PROG-P4-11: 输出维护报告
- **Agent**: 主 agent
- **职责**: 汇总检查结果，生成维护报告

---

## 输出格式

### 进度报告（Step 03）

```
📊 大纲进度报告
━━━━━━━━━━━━━━━━

📖 项目信息
- 项目名称：{书名}
- 总章数：{X}章
- 已写正文：{Y}章
- 总字数：{Z}万字
- 当前卷：第{N}卷·{卷名}
- 当前弧：第{M}弧·{弧名}（Ch{A}-{B}）

📝 弧进度
- 弧内已有细纲：{X}/{Y}章（{百分比}%）
- 缺失细纲：{列表}

📁 存档状态
- 已存档弧：{X}个
- 待存档弧：{列表}

🔍 健康度
- 活跃伏笔：{X}个
- 逾期伏笔：{X}个 ⚠️
- 沉默角色：{X}个 ⚠️
- 卷间过渡：{正常/缺失}

📋 待办事项
- [ ] 回收逾期伏笔：{伏笔描述}
- [ ] 安排沉默角色出场：{角色名}

⏭️ 下一步建议
- {建议1}
- {建议2}
```

### 存档报告（Step 05）

```
📁 存档完成
━━━━━━━━━━━━━━━━

✅ 已存档
- 弧/卷：{名称}
- 存档文件：{路径}
- 章节范围：Ch{起}-{止}
- 包含细纲：{X}个

📝 状态更新
- 卷纲标记：📝 → ✅

⏭️ 下一阶段
- 弧/卷名：{名称}
- 章节范围：Ch{起}-{止}
- 已有细纲：{X}个
- 缺失细纲：{Y}个
```

### 维护报告（Step 11）

```
🔧 大纲维护报告
━━━━━━━━━━━━━━━━

✅ 格式检查
- 大纲文件：{X}个，格式{一致/不一致}
- 卷纲文件：{X}个，格式{一致/不一致}
- 细纲文件：{X}个，格式{一致/不一致}

⚠️ 健康度
- 逾期伏笔：{X}个
  - {伏笔ID}：{描述}（已{N}章未回收）
- 沉默角色：{X}个
  - {角色名}：已{N}章未出场
- 时间线断层：{X}个

💡 建议
- {建议1}
- {建议2}
```

---

## 条件任务

| 任务 | 触发条件 | 跳过则 |
|------|---------|--------|
| T-PROG-P2-04 | 用户说"存档"/"归档" | abandoned |
| T-PROG-P2-05 | Step 04 确认弧/卷完成 | abandoned |
| T-PROG-P2-06 | Step 05 完成存档 | abandoned |
| T-PROG-P3-07 | 用户说"下一弧"或存档完成 | abandoned |
| T-PROG-P3-08 | Step 07 完成 | abandoned |
| T-PROG-P5-12 | Phase 4 或 Step 07 发现细纲缺失或用户说"补建细纲" | abandoned |
| T-PROG-P5-13 | Step 12 完成细纲生成 | abandoned |
| T-PROG-P5-14 | Step 13 完成质量检查 | abandoned |

---

## 大纲修订流程

当大纲质量自检或维护检查发现问题时，启动大纲修订流程：

1. **识别问题**：从质量自检报告或维护报告中提取问题清单
2. **确定修订范围**：
   - 大纲.md 问题 → 修订 Step 2（重新生成全书大纲）
   - 卷纲问题 → 修订 Step 3（重新生成卷纲）
   - 细纲问题 → 修订 Step 4（重新生成细纲）
3. **执行修订**：重新运行对应步骤的子 agent
4. **重新验证**：再次运行质量自检或维护检查
5. **确认通过**：所有问题已修复后继续后续流程

修订流程不创建新任务，直接在现有任务树上标记原任务为 abandoned，创建修订任务：
```
T-OUTLINE-0X-R1: 修订{步骤名}（第1次修订）
T-OUTLINE-0X-R2: 修订{步骤名}（第2次修订）
...
```

---

## Agent 间通信

所有中间结果存放在 `{PROJECT_DIR}/.workflow/` 目录：

```
.workflow/
├── prog-01-scan.json              # Step 01: 项目结构扫描
├── prog-02-context.json           # Step 02: 大纲和追踪上下文
├── prog-04-completion.json        # Step 04: 弧/卷完成度（条件）
├── prog-07-next-phase.json        # Step 07: 下一阶段就绪度（条件）
├── prog-outline-batch.json        # Step 12: 批量细纲生成结果（条件）
├── prog-outline-quality.json      # Step 13: 细纲质量检查（条件）
├── prog-09-outline-check.json     # Step 09: 大纲一致性
└── prog-10-health.json            # Step 10: 追踪健康度
```

---

## 守卫脚本调用

```bash
# 前置验证
node skills/story-progress-mimo/scripts/step-guard.js pre  <步骤号> {workflow_dir} {project_dir}

# 后置验证
node skills/story-progress-mimo/scripts/step-guard.js post <步骤号> {workflow_dir}
```

步骤号定义（覆盖全部14个步骤）：

| 步骤号 | 任务ID | 说明 |
|--------|--------|------|
| 01 | T-PROG-P1-01 | 扫描项目结构 |
| 02 | T-PROG-P1-02 | 读取大纲和追踪 |
| 03 | T-PROG-P1-03 | 生成进度报告 |
| 04 | T-PROG-P2-04 | 验证完成度 |
| 05 | T-PROG-P2-05 | 整合存档 |
| 06 | T-PROG-P2-06 | 更新状态标记 |
| 07 | T-PROG-P3-07 | 确认下一阶段 |
| 08 | T-PROG-P3-08 | 输出切换指南 |
| 09 | T-PROG-P4-09 | 大纲一致性 |
| 10 | T-PROG-P4-10 | 追踪健康度 |
| 11 | T-PROG-P4-11 | 输出维护报告 |
| 12 | T-PROG-P5-12 | 批量细纲生成 |
| 13 | T-PROG-P5-13 | 细纲质量检查 |
| 14 | T-PROG-P5-14 | 输出生成报告 |

---

## 与其他 Skill 的协作

| Skill | 协作方式 |
|-------|---------|
| story-long-write-mimo | Phase 4 写作前调用进度检查，每5章强制停顿 |
| story-chapter-write-mimo | 提供当前章的细纲和追踪文件 |
| story-outline-mimo | 大纲生成后调用进度管理初始化 |
| story-session-mimo | 会话开始时恢复进度上下文 |

---

## 参考文档

| 文档 | 用途 |
|------|------|
| `_shared/references/cross-volume-tracking.md` | 跨卷追踪规范 |
| `_shared/references/state-tracking.md` | 角色状态追踪规范 |
| `_shared/references/consistency-tracking.md` | 一致性追踪规范 |

---

## Task 跟踪集成

> 规范详见 `_shared/references/task-tracking-conventions.md`。

**触发时第一步：读取上方「任务树」（§任务树），然后逐条创建。不跳步。**

**强制执行顺序**：
1. 读取上方「任务树」
2. 严格按照列表逐条创建任务
3. 逐个执行

### 任务树概要

```
T-PROGRESS: 进度管理「{项目名}」
│
├─── Phase 1: 进度检查（固定）
│    ├── T-PROG-P1-01: 扫描项目结构 [子 agent 隔离·explore]
│    ├── T-PROG-P1-02: 读取大纲和追踪文件 [子 agent 隔离·general]
│    └── T-PROG-P1-03: 生成进度报告 [主 agent]
│
├─── Phase 2: 存档管理（条件）
│    ├── [条件] T-PROG-P2-04: 验证弧/卷完成度 [子 agent 隔离·general]
│    ├── [条件] T-PROG-P2-05: 整合细纲为存档 [子 agent 隔离·general]
│    └── [条件] T-PROG-P2-06: 清理和更新状态标记 [主 agent]
│
├─── Phase 3: 弧/卷切换（条件）
│    ├── [条件] T-PROG-P3-07: 确认下一阶段就绪 [子 agent 隔离·general]
│    └── [条件] T-PROG-P3-08: 输出切换指南 [主 agent]
│
├─── Phase 4: 文件维护（固定）
│    ├── T-PROG-P4-09: 大纲一致性检查 [子 agent 隔离·general]
│    ├── T-PROG-P4-10: 追踪文件健康度检查 [子 agent 隔离·general]
│    └── T-PROG-P4-11: 输出维护报告 [主 agent]
│
└─── Phase 5: 批量细纲生成（条件）
     ├── [条件] T-PROG-P5-12: 批量细纲生成 [子 agent 隔离·general]
     ├── [条件] T-PROG-P5-13: 细纲质量检查 [子 agent 隔离·general]
     └── [条件] T-PROG-P5-14: 输出生成报告 [主 agent]
```

### 条件创建规则

| 任务 | 执行时判断 | 跳过则 abandoned |
|------|-----------|-----------------|
| T-PROG-P2-04 | 用户说"存档"/"归档" | abandoned |
| T-PROG-P2-05 | Step 04 确认弧/卷完成 | abandoned |
| T-PROG-P2-06 | Step 05 完成存档 | abandoned |
| T-PROG-P3-07 | 用户说"下一弧"或存档完成 | abandoned |
| T-PROG-P3-08 | Step 07 完成 | abandoned |
| T-PROG-P5-12 | Phase 4 或 Step 07 发现细纲缺失或用户说"补建细纲" | abandoned |
| T-PROG-P5-13 | Step 12 完成细纲生成 | abandoned |
| T-PROG-P5-14 | Step 13 完成质量检查 | abandoned |

### 循环处理

| 循环 | 触发 | 处理 |
|------|------|------|
| 大纲修订 | Phase 4 或维护检查发现问题 | 标记原任务 abandoned，创建 T-OUTLINE-0X-R1 修订任务，重新验证直到通过 |

### 完成标准

| 任务 | 完成标准 |
|------|---------|
| T-PROG-P1-01 | `.workflow/prog-01-scan.json` 已写入 |
| T-PROG-P1-02 | `.workflow/prog-02-context.json` 已写入 |
| T-PROG-P1-03 | 进度报告已输出给用户 |
| T-PROG-P2-04 | `.workflow/prog-04-completion.json` 已写入 |
| T-PROG-P2-05 | `大纲/存档/卷X_弧X_弧名.md` 已创建 |
| T-PROG-P2-06 | 卷纲状态标记已更新 |
| T-PROG-P3-07 | `.workflow/prog-07-next-phase.json` 已写入 |
| T-PROG-P3-08 | 切换指南已输出给用户 |
| T-PROG-P4-09 | `.workflow/prog-09-outline-check.json` 已写入 |
| T-PROG-P4-10 | `.workflow/prog-10-health.json` 已写入 |
| T-PROG-P4-11 | 维护报告已输出给用户 |
| T-PROG-P5-12 | 细纲文件已生成 |
| T-PROG-P5-13 | `.workflow/prog-outline-quality.json` 已写入 |
| T-PROG-P5-14 | 生成报告已输出给用户 |

### 守卫脚本调用

每个步骤执行前后必须运行守卫脚本：

```bash
# 前置验证
node skills/story-progress-mimo/scripts/step-guard.js pre  <步骤号> {workflow_dir} {project_dir}

# 后置验证
node skills/story-progress-mimo/scripts/step-guard.js post <步骤号> {workflow_dir}
```

步骤号映射见文件内「守卫脚本调用」章节（步骤 01~14）。
