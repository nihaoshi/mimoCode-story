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

**每个步骤执行前后必须运行守卫脚本：**
```bash
node skills/story-progress-mimo/scripts/workflow-guard.js pre  <步骤号> {workflow_dir} {project_dir}
node skills/story-progress-mimo/scripts/workflow-guard.js post <步骤号> {workflow_dir}
```

---

## 任务树

```
T-PROGRESS: 进度管理「{项目名}」
│
├─── Phase 1: 进度检查
│    ├── T-PROG-01: 扫描项目结构 [子 agent 隔离·explore]
│    ├── T-PROG-02: 读取大纲和追踪文件 [子 agent 隔离·general]
│    └── T-PROG-03: 生成进度报告 [主 agent]
│
├─── Phase 2: 存档管理（条件）
│    ├── [条件] T-PROG-04: 验证弧/卷完成度 [子 agent 隔离·general]
│    ├── [条件] T-PROG-05: 整合细纲为存档 [子 agent 隔离·general]
│    └── [条件] T-PROG-06: 清理和更新状态标记 [主 agent]
│
├─── Phase 3: 弧/卷切换（条件）
│    ├── [条件] T-PROG-07: 确认下一阶段就绪 [子 agent 隔离·general]
│    └── [条件] T-PROG-08: 输出切换指南 [主 agent]
│
└─── Phase 4: 文件维护
     ├── T-PROG-09: 大纲一致性检查 [子 agent 隔离·general]
     ├── T-PROG-10: 追踪文件健康度检查 [子 agent 隔离·general]
     └── T-PROG-11: 输出维护报告 [主 agent]
```

---

## 子 Agent 调用规范

### Phase 1: 进度检查

```javascript
// Step 01: 扫描项目结构
actor({
  "operation": {
    "action": "run",
    "subagent_type": "explore",
    "description": "扫描项目结构",
    "prompt": "你是大纲进度管理器的项目扫描器。\n\n【防偷懒铁律】必须实际扫描目录，不能推断。\n\n【任务】扫描 {project_dir} 的项目结构。\n\n【执行】\n1. 列出 大纲/ 目录下所有文件\n2. 列出 正文/ 目录下所有章节文件\n3. 统计章节数量和字数（用 wordcount.js）\n4. 检查 追踪/ 目录下文件完整性\n5. 检查 跨卷追踪/ 目录是否存在\n6. 检查 设定/ 目录下文件\n\n【输出】写入 {project_dir}/.workflow/prog-01-scan.json，格式：\n{\"project_dir\": \"...\", \"outline_files\": [...], \"chapter_count\": 42, \"total_words\": 156000, \"tracking_files\": [...], \"cross_volume_exists\": true, \"settings_files\": [...]}",
    "context": "none"
  }
})

// Step 02: 读取大纲和追踪文件
actor({
  "operation": {
    "action": "run",
    "subagent_type": "general",
    "description": "读取大纲和追踪文件",
    "prompt": "你是大纲进度管理器的上下文加载器。\n\n参考 skills/_shared/references/context-checklist.md 场景5：进度管理（16项）。\n\n【防偷懒铁律】必须实际读取每个文件，不能跳过。\n\n【任务】读取所有大纲和追踪文件，组装进度上下文。\n\n【必读文件】\n1. {project_dir}/大纲/大纲.md — 全书卷级结构\n2. {project_dir}/大纲/卷纲_第X卷.md — 当前卷大纲（按当前卷号读取）\n3. {project_dir}/追踪/上下文.md — 上次进度摘要\n4. {project_dir}/追踪/伏笔.md — 活跃伏笔\n5. {project_dir}/追踪/角色状态.md — 角色状态\n6. {project_dir}/追踪/时间线.md — 事件时序\n7. 跨卷追踪/跨卷伏笔.md — 跨卷伏笔（如存在）\n8. 跨卷追踪/跨卷角色弧线.md — 角色弧线（如存在）\n9. 跨卷追踪/卷间过渡.md — 卷间过渡（如存在）\n10. {project_dir}/追踪/物品.md — 物品位置（T4）\n11. {project_dir}/追踪/环境.md — 环境状态（T5）\n12. {project_dir}/追踪/物资.md — 经济状态（T6）\n13. {project_dir}/追踪/重复语句.md — 重复语句（T7）\n14. {project_dir}/故事线/故事线_索引.md — 故事线索引（L1，如存在）\n15. {project_dir}/故事线/故事线_主线_*.md — 主线故事线（L2，如存在）\n16. {project_dir}/故事线/故事线_交叉点.md — 交叉点（L3，如存在）\n\n【输出】写入 {project_dir}/.workflow/prog-02-context.json，格式：\n{\"current_volume\": 2, \"current_arc\": \"弧名\", \"latest_chapter\": 42, \"outline_structure\": {...}, \"foreshadows\": [...], \"characters\": [...], \"cross_volume\": {...}, \"items\": [...], \"environment\": {...}, \"supply\": {...}, \"repeated_phrases\": [...], \"story_lines\": {...}}",
    "context": "none"
  }
})

// Step 03: 生成进度报告（主 agent）
// 读取 prog-01-scan.json 和 prog-02-context.json，生成用户可读报告
```

### Phase 2: 存档管理（条件）

```javascript
// Step 04: 验证弧/卷完成度
actor({
  "operation": {
    "action": "run",
    "subagent_type": "general",
    "description": "验证弧/卷完成度",
    "prompt": "你是大纲进度管理器的完成度验证器。\n\n【防偷懒铁律】必须逐章检查，不能推断。\n\n【任务】验证当前弧/卷是否所有章节都已完成。\n\n【执行】\n1. 读取 {project_dir}/.workflow/prog-02-context.json 获取大纲结构\n2. 读取当前卷纲，获取弧划分和章节范围\n3. 逐章检查：\n   - 细纲是否存在（大纲/细纲_第XXX章.md）\n   - 正文是否存在（正文/第XXX章.md）\n4. 统计完成度\n\n【输出】写入 {project_dir}/.workflow/prog-04-completion.json，格式：\n{\"volume\": 2, \"arc\": \"弧名\", \"chapter_range\": [30, 42], \"total\": 13, \"outlines_done\": 13, \"chapters_done\": 12, \"missing_outlines\": [], \"missing_chapters\": [42], \"is_complete\": false, \"is_arc_complete\": true}",
    "context": "none"
  }
})

// Step 05: 整合细纲为存档
actor({
  "operation": {
    "action": "run",
    "subagent_type": "general",
    "description": "整合细纲为存档",
    "prompt": "你是大纲进度管理器的存档整合器。\n\n【防偷懒铁律】必须读取每个细纲文件，按章节顺序整合。\n\n【任务】将已完成弧的所有细纲整合为一个存档文件。\n\n【输入】读取 {project_dir}/.workflow/prog-04-completion.json 获取章节范围\n\n【执行】\n1. 按章节顺序读取 {project_dir}/大纲/细纲_第XXX章.md\n2. 提取每章的核心事件、情绪、钩子\n3. 整合为存档文件\n\n【输出】写入 {project_dir}/大纲/存档/卷X_弧X_弧名.md，格式：\n# 卷X·弧X·弧名（Ch{起}-{止}）\n\n> 状态：✅ 已完成\n\n## 已完成章节\n\n| 章节 | 标题 | 核心事件 | 情绪 |\n|------|------|---------|------|\n| Ch030 | {章名} | {事件} | {情绪} |\n\n## 伏笔状态\n\n| 伏笔 | 埋设 | 状态 | 指向 |\n|------|------|------|------|\n\n## 角色发展\n\n- **{角色名}**：{发展描述}",
    "context": "none"
  }
})

// Step 06: 清理和更新状态标记（主 agent）
// 更新卷纲中的状态标记（📝 → ✅）
// 如果是卷结束，更新大纲.md 中的卷状态
```

### Phase 3: 弧/卷切换（条件）

```javascript
// Step 07: 确认下一阶段就绪
actor({
  "operation": {
    "action": "run",
    "subagent_type": "general",
    "description": "确认下一阶段就绪",
    "prompt": "你是大纲进度管理器的阶段切换器。\n\n【防偷懒铁律】必须检查下一弧的细纲是否就绪。\n\n【任务】确认下一弧/卷的准备工作。\n\n【执行】\n1. 读取 {project_dir}/.workflow/prog-04-completion.json 确认当前弧已完成\n2. 读取卷纲，获取下一弧的信息（章节范围、核心事件）\n3. 检查下一弧的细纲是否存在\n4. 如果细纲缺失，列出需要创建的细纲清单\n\n【输出】写入 {project_dir}/.workflow/prog-07-next-phase.json，格式：\n{\"current_arc_done\": true, \"next_arc\": \"弧名\", \"next_chapter_range\": [43, 55], \"next_outlines_ready\": 3, \"next_outlines_needed\": 12, \"missing_outlines\": [44, 45, ...], \"guidance\": [\"建议1\", \"建议2\"]}",
    "context": "none"
  }
})

// Step 08: 输出切换指南（主 agent）
// 读取 prog-07-next-phase.json，生成用户可读的切换指南
```

### Phase 4: 文件维护

```javascript
// Step 09: 大纲一致性检查
actor({
  "operation": {
    "action": "run",
    "subagent_type": "general",
    "description": "大纲一致性检查",
    "prompt": "你是大纲进度管理器的一致性检查器。\n\n【防偷懒铁律】必须逐项检查，不能跳过。\n\n【任务】检查大纲文件的格式一致性和状态标记正确性。\n\n【检查项】\n1. 大纲.md 中的卷数与实际卷纲文件数是否一致\n2. 卷纲中的章节数与实际细纲文件数是否一致\n3. 细纲格式是否统一（是否包含：核心事件、情节点、钩子、爽点、字数目标）\n4. 状态标记是否正确（⏳/📝/✅/❌）\n5. 正文章节号是否连续（有无跳号）\n\n【输出】写入 {project_dir}/.workflow/prog-09-outline-check.json，格式：\n{\"outline_consistent\": true, \"volume_count_match\": true, \"chapter_count_match\": false, \"format_issues\": [...], \"status_issues\": [...], \"chapter_gaps\": []}",
    "context": "none"
  }
})

// Step 10: 追踪文件健康度检查
actor({
  "operation": {
    "action": "run",
    "subagent_type": "general",
    "description": "追踪文件健康度检查",
    "prompt": "你是大纲进度管理器的健康度检查器。\n\n【防偷懒铁律】必须读取所有追踪文件，逐项检测。\n\n【任务】检查追踪文件的健康度。\n\n【检测项】\n1. 伏笔逾期 — 埋设超过50章未回收的伏笔\n2. 角色沉默 — 超过10章未出场的主要角色\n3. 时间线断层 — 时间线中是否有跳跃\n4. 物品丢失 — 物品追踪中是否有状态不明的物品\n5. 环境矛盾 — 环境描述是否与时间线一致\n\n【输入】\n- {project_dir}/追踪/伏笔.md\n- {project_dir}/追踪/角色状态.md\n- {project_dir}/追踪/时间线.md\n- {project_dir}/追踪/物品.md\n- {project_dir}/追踪/环境.md\n- {project_dir}/跨卷追踪/跨卷伏笔.md（如存在）\n\n【输出】写入 {project_dir}/.workflow/prog-10-health.json，格式：\n{\"foreshadow_overdue\": [{\"id\": \"F03\", \"content\": \"...\", \"planted_chapter\": 5, \"chapters_overdue\": 37}], \"character_inactive\": [{\"name\": \"角色A\", \"last_seen\": 32, \"chapters_absent\": 10}], \"timeline_gaps\": [], \"item_lost\": [], \"env_contradiction\": []}",
    "context": "none"
  }
})

// Step 11: 输出维护报告（主 agent）
// 读取 prog-09-outline-check.json 和 prog-10-health.json，生成维护报告
```

---

## 各步骤说明

### Step 01: 扫描项目结构
- **Agent**: 子 agent 隔离（explore）
- **职责**: 扫描项目目录，统计文件数量和字数
- **输出**: `.workflow/prog-01-scan.json`
- **防偷懒**: 必须实际扫描目录，不能推断

### Step 02: 读取大纲和追踪文件
- **Agent**: 子 agent 隔离（general）
- **职责**: 读取所有大纲和追踪文件，组装进度上下文
- **输出**: `.workflow/prog-02-context.json`
- **防偷懒**: 必须实际读取每个文件，不能跳过

### Step 03: 生成进度报告
- **Agent**: 主 agent
- **职责**: 汇总信息，生成用户可读的进度报告
- **输出**: 进度报告（直接展示给用户）

### Step 04: 验证弧/卷完成度 [条件]
- **Agent**: 子 agent 隔离（general）
- **职责**: 逐章检查细纲和正文是否完成
- **输出**: `.workflow/prog-04-completion.json`
- **防偷懒**: 必须逐章检查，不能推断
- **触发条件**: 用户说"存档"或"归档"

### Step 05: 整合细纲为存档 [条件]
- **Agent**: 子 agent 隔离（general）
- **职责**: 将已完成弧的细纲整合为存档文件
- **输出**: `大纲/存档/卷X_弧X_弧名.md`
- **防偷懒**: 必须读取每个细纲文件，按章节顺序整合
- **触发条件**: Step 04 确认弧/卷完成

### Step 06: 清理和更新状态标记 [条件]
- **Agent**: 主 agent
- **职责**: 更新卷纲中的状态标记
- **触发条件**: Step 05 完成存档

### Step 07: 确认下一阶段就绪 [条件]
- **Agent**: 子 agent 隔离（general）
- **职责**: 检查下一弧的细纲是否就绪
- **输出**: `.workflow/prog-07-next-phase.json`
- **防偷懒**: 必须检查下一弧的细纲是否存在
- **触发条件**: 用户说"下一弧"或存档完成后

### Step 08: 输出切换指南 [条件]
- **Agent**: 主 agent
- **职责**: 生成下一阶段的创作指南
- **触发条件**: Step 07 完成

### Step 09: 大纲一致性检查
- **Agent**: 子 agent 隔离（general）
- **职责**: 检查大纲文件格式一致性和状态标记
- **输出**: `.workflow/prog-09-outline-check.json`
- **防偷懒**: 必须逐项检查，不能跳过

### Step 10: 追踪文件健康度检查
- **Agent**: 子 agent 隔离（general）
- **职责**: 检测伏笔逾期、角色沉默、时间线断层等
- **输出**: `.workflow/prog-10-health.json`
- **防偷懒**: 必须读取所有追踪文件，逐项检测

### Step 11: 输出维护报告
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
| T-PROG-04 | 用户说"存档"/"归档" | abandoned |
| T-PROG-05 | Step 04 确认弧/卷完成 | abandoned |
| T-PROG-06 | Step 05 完成存档 | abandoned |
| T-PROG-07 | 用户说"下一弧"或存档完成 | abandoned |
| T-PROG-08 | Step 07 完成 | abandoned |

---

## Agent 间通信

所有中间结果存放在 `{PROJECT_DIR}/.workflow/` 目录：

```
.workflow/
├── prog-01-scan.json              # Step 01: 项目结构扫描
├── prog-02-context.json           # Step 02: 大纲和追踪上下文
├── prog-04-completion.json        # Step 04: 弧/卷完成度（条件）
├── prog-07-next-phase.json        # Step 07: 下一阶段就绪度（条件）
├── prog-09-outline-check.json     # Step 09: 大纲一致性
└── prog-10-health.json            # Step 10: 追踪健康度
```

---

## 守卫脚本调用

```bash
# 前置验证
node skills/story-progress-mimo/scripts/workflow-guard.js pre  <步骤号> {workflow_dir} {project_dir}

# 后置验证
node skills/story-progress-mimo/scripts/workflow-guard.js post <步骤号> {workflow_dir}
```

步骤号定义：

| 步骤号 | 说明 |
|--------|------|
| 01 | 扫描项目结构 |
| 02 | 读取大纲和追踪 |
| 04 | 验证完成度 |
| 05 | 整合存档 |
| 07 | 确认下一阶段 |
| 09 | 大纲一致性 |
| 10 | 追踪健康度 |

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
