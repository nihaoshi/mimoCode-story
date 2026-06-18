---
name: story-rewrite-mimo
version: 1.0.0
description: |
  章节重写。支持全文重写、局部重写、风格重写，保留原稿备份。
  触发方式：/rewrite、/重写、/回炉、「重写第X章」「修改第X章」「回炉第X章」
category: write
triggers:
  - /rewrite
  - /重写
  - /回炉
  - 重写第X章
  - 修改第X章
  - 回炉第X章
inputs:
  - name: project_dir
    type: directory
    required: true
    description: 写作项目根目录
  - name: chapter_number
    type: number
    required: true
    description: 目标章节号
---

# story-rewrite-mimo v1.0：章节重写

你是章节重写专家。对已写好的章节进行重写，支持全文重写、局部重写、风格重写。

**核心信念：重写不是推翻，是在原有基础上升级。保留好的，改掉差的。**

---

## 触发条件

| 用户说 | 动作 |
|--------|------|
| /rewrite | 进入重写流程（询问章节号） |
| /rewrite 第X章 | 重写指定章节 |
| /重写第X章 | 同上 |
| /回炉第X章 | 同上 |
| 修改第X章 | 同上 |

---

## 重写模式

| 模式 | 触发条件 | 说明 |
|------|---------|------|
| 全文重写 | "重写整章""全文重写" | 基于细纲重新写整章 |
| 局部重写 | "改第3段""重写对话部分""那场打斗不行" | 只改指定段落 |
| 风格重写 | "太AI了""语气不对""对话太书面" | 保留剧情，调整风格 |
| 增强重写 | "爽点不够""钩子不强""节奏太慢" | 针对特定维度增强 |

---

## 防偷懒铁律

```
读文件，写文件，跑脚本，给用户看
不凭记忆，不跳步骤，不偷懒
```

---

## 任务树

```
T-REWRITE-{N}: 重写第{N}章
│
├─── Phase 1: 诊断阶段
│    ├── T-RW-{N}-01: 加载原章和上下文 [子 agent 隔离·general]
│    ├── T-RW-{N}-02: 质量诊断 [子 agent 隔离·general]
│    └── T-RW-{N}-03: 输出诊断报告 [主 agent]
│
├─── Phase 2: 重写阶段（用户确认模式后）
│    ├── [条件] T-RW-{N}-04: 全文重写 [子 agent 隔离·general]
│    ├── [条件] T-RW-{N}-05: 局部重写 [子 agent 隔离·general]
│    ├── [条件] T-RW-{N}-06: 风格重写 [子 agent 隔离·general]
│    └── [条件] T-RW-{N}-07: 增强重写 [子 agent 隔离·general]
│
├─── Phase 3: 验证阶段
│    ├── T-RW-{N}-08: 质量检测 [子 agent 隔离·general]
│    ├── [条件] T-RW-{N}-09: 修复问题 [子 agent 隔离·general]
│    └── T-RW-{N}-10: 更新追踪文件 [主 agent]
│
└─── Phase 4: 收尾阶段
     └── T-RW-{N}-11: 输出重写报告 [主 agent]
```

---

## 子 Agent 调用规范

### Phase 1: 诊断阶段

```javascript
// Step 01: 加载原章和上下文
actor({
  "operation": {
    "action": "run",
    "subagent_type": "general",
    "description": "加载原章和上下文 - 第{N}章",
    "prompt": "你是章节重写的上下文加载器。\n\n【防偷懒铁律】必须实际读取每个文件，不能跳过。\n\n【任务】加载待重写章节的全部上下文。\n\n【必读文件】\n1. {project_dir}/正文/第{N}章.md — 待重写章节（必须存在）\n2. {project_dir}/大纲/细纲_第{N}章.md — 原始细纲\n3. {project_dir}/正文/第{N-1}章.md — 前一章（首章跳过）\n4. {project_dir}/正文/第{N+1}章.md — 后一章（末章跳过）\n5. {project_dir}/追踪/伏笔.md — 涉及的伏笔\n6. {project_dir}/追踪/角色状态.md — 角色状态\n7. {project_dir}/设定/角色/{相关角色}.md — 本章涉及角色\n\n【执行】\n1. 读取原章全文，记录原始字数\n2. 读取细纲，提取情节点、钩子、爽点\n3. 读取前后章，了解衔接\n4. 读取追踪文件，了解伏笔和角色状态\n\n【输出】写入 {project_dir}/.workflow/rw-01-context.json，格式：\n{\"chapter\": {N}, \"original_file\": \"正文/第{N}章.md\", \"original_wordcount\": 3200, \"outline\": {...}, \"previous_ending\": \"...\", \"next_opening\": \"...\", \"foreshadows\": [...], \"characters\": [...]}",
    "context": "none"
  }
})

// Step 02: 质量诊断
actor({
  "operation": {
    "action": "run",
    "subagent_type": "general",
    "description": "质量诊断 - 第{N}章",
    "prompt": "你是章节重写的质量诊断器。\n\n【防偷懒铁律】必须运行所有检测脚本，不能跳过。\n\n【任务】对原章进行全面质量诊断。\n\n【检测项】（必须全部运行）\n1. 字数达标 — node skills/_shared/scripts/wordcount.js {chapter_file} --json\n2. 禁用词+AI腔 — node skills/_shared/scripts/style-lint.js --json {chapter_file}\n3. AI标点符号 — node skills/_shared/scripts/punctuation-normalize.js --json {chapter_file}\n4. 一致性 — node skills/_shared/scripts/consistency-check.js --json {chapter_file} {project_dir}\n5. 跨章节检查 — node skills/_shared/scripts/cross-chapter-check.js --json {chapter_file} {project_dir}\n6. 角色声音 — node skills/_shared/scripts/voice-check.js --json {chapter_file} {project_dir}\n\n【LLM分析】\n7. 章首钩子强度\n8. 章尾钩子强度\n9. 爽点密度和位置\n10. 节奏感（快慢交替）\n11. 情绪曲线（起伏是否合理）\n12. 对话自然度\n13. 心理描写质量\n\n【输出】写入 {project_dir}/.workflow/rw-02-diagnosis.json，格式：\n{\"chapter\": {N}, \"overall_score\": 65, \"issues\": [{\"type\": \"ai_taste\", \"severity\": \"BLOCK\", \"detail\": \"...\", \"location\": \"第3段\"}, ...], \"strengths\": [\"...\"], \"weaknesses\": [\"...\"], \"recommended_mode\": \"局部重写\", \"focus_areas\": [\"对话\", \"爽点\"]}",
    "context": "none"
  }
})

// Step 03: 输出诊断报告（主 agent）
// 读取 rw-02-diagnosis.json，生成用户可读报告
// 询问用户选择重写模式
```

### Phase 2: 重写阶段

```javascript
// Step 04: 全文重写 [条件]
actor({
  "operation": {
    "action": "run",
    "subagent_type": "general",
    "description": "全文重写 - 第{N}章",
    "prompt": "你是 narrative-writer，负责全文重写。\n\n【防偷懒铁律】必须写入文件，不在对话中输出。\n\n【输入】\n1. {project_dir}/.workflow/rw-01-context.json — 上下文\n2. {project_dir}/.workflow/rw-02-diagnosis.json — 诊断报告\n3. 质量规则：读取 skills/_shared/references/quality-rules.md\n\n【重写要求】\n1. 基于细纲重新写整章\n2. 保留原章中诊断为'strengths'的部分\n3. 修复诊断报告中所有 issues\n4. 字数必须达到细纲目标\n5. 遵守质量规则（quality-rules.md）\n\n【输出】\n- 备份：{project_dir}/正文/第{N}章_原稿_{YYYYMMDD}.md\n- 重写：{project_dir}/正文/第{N}章.md\n\n写完后运行字数验证：\nnode skills/_shared/scripts/wordcount.js {chapter_file} --json",
    "context": "none"
  }
})

// Step 05: 局部重写 [条件]
actor({
  "operation": {
    "action": "run",
    "subagent_type": "general",
    "description": "局部重写 - 第{N}章",
    "prompt": "你是 narrative-writer，负责局部重写。\n\n【防偷懒铁律】必须写入文件，不在对话中输出。\n\n【输入】\n1. {project_dir}/.workflow/rw-01-context.json — 上下文\n2. {project_dir}/.workflow/rw-02-diagnosis.json — 诊断报告（focus_areas 指定重写范围）\n3. 质量规则：读取 skills/_shared/references/quality-rules.md\n\n【局部重写要求】\n1. 只修改诊断报告中 issues 指定的段落\n2. 保持其他部分不变\n3. 修改后的段落必须与前后文衔接自然\n4. 字数变化不超过原章的 30%\n\n【输出】\n- 备份：{project_dir}/正文/第{N}章_原稿_{YYYYMMDD}.md\n- 重写：{project_dir}/正文/第{N}章.md",
    "context": "none"
  }
})

// Step 06: 风格重写 [条件]
actor({
  "operation": {
    "action": "run",
    "subagent_type": "general",
    "description": "风格重写 - 第{N}章",
    "prompt": "你是 narrative-writer，负责风格重写。\n\n【防偷懒铁律】必须写入文件，不在对话中输出。\n\n【输入】\n1. {project_dir}/.workflow/rw-01-context.json — 上下文\n2. {project_dir}/.workflow/rw-02-diagnosis.json — 诊断报告\n3. 质量规则：读取 skills/_shared/references/quality-rules.md\n4. 文风设定：{project_dir}/设定/文风.md\n\n【风格重写要求】\n1. 保留原章的剧情和情节点\n2. 调整语言风格（去AI味、口语化、增加动作描写）\n3. 修复对话腔调\n4. 调整节奏（短句/长句交替）\n5. 遵守质量规则\n\n【输出】\n- 备份：{project_dir}/正文/第{N}章_原稿_{YYYYMMDD}.md\n- 重写：{project_dir}/正文/第{N}章.md",
    "context": "none"
  }
})

// Step 07: 增强重写 [条件]
actor({
  "operation": {
    "action": "run",
    "subagent_type": "general",
    "description": "增强重写 - 第{N}章",
    "prompt": "你是 narrative-writer，负责增强重写。\n\n【防偷懒铁律】必须写入文件，不在对话中输出。\n\n【输入】\n1. {project_dir}/.workflow/rw-01-context.json — 上下文\n2. {project_dir}/.workflow/rw-02-diagnosis.json — 诊断报告（focus_areas 指定增强维度）\n3. 质量规则：读取 skills/_shared/references/quality-rules.md\n\n【增强维度】（根据 focus_areas 选择）\n- 爽点不够 → 增加信息差、打脸、反转\n- 钩子不强 → 强化章首/章尾钩子\n- 节奏太慢 → 压缩过渡、增加冲突\n- 情绪太平 → 增加情绪起伏\n\n【输出】\n- 备份：{project_dir}/正文/第{N}章_原稿_{YYYYMMDD}.md\n- 重写：{project_dir}/正文/第{N}章.md",
    "context": "none"
  }
})
```

### Phase 3: 验证阶段

```javascript
// Step 08: 质量检测
actor({
  "operation": {
    "action": "run",
    "subagent_type": "general",
    "description": "重写后质量检测 - 第{N}章",
    "prompt": "你是 quality-checker，负责重写后的质量检测。\n\n【防偷懒铁律】必须运行所有检测脚本。\n\n【任务】对重写后的章节进行全面质量检测。\n\n【检测项】（必须全部运行）\n1. 字数达标 — node skills/_shared/scripts/wordcount.js {chapter_file} --json\n2. 禁用词+AI腔 — node skills/_shared/scripts/style-lint.js --json {chapter_file}\n3. AI标点符号 — node skills/_shared/scripts/punctuation-normalize.js --json {chapter_file}\n4. 一致性 — node skills/_shared/scripts/consistency-check.js --json {chapter_file} {project_dir}\n5. 跨章节检查 — node skills/_shared/scripts/cross-chapter-check.js --json {chapter_file} {project_dir}\n\n【输出】写入 {project_dir}/.workflow/rw-08-recheck.json，格式：\n{\"status\": \"pass|warn|fail\", \"blockers\": [...], \"warnings\": [...], \"improvement\": {\"original_score\": 65, \"new_score\": 85, \"issues_fixed\": 8, \"issues_remaining\": 1}}",
    "context": "none"
  }
})

// Step 09: 修复问题 [条件]
actor({
  "operation": {
    "action": "run",
    "subagent_type": "general",
    "description": "修复重写后问题 - 第{N}章",
    "prompt": "你是 quality-fixer，负责修复重写后残留的问题。\n\n【防偷懒铁律】每个问题必须修复。\n\n【输入】\n- 检测报告：{project_dir}/.workflow/rw-08-recheck.json\n- 正文：{project_dir}/正文/第{N}章.md\n- 质量规则：读取 skills/_shared/references/quality-rules.md\n\n【输出】\n- 更新：{project_dir}/正文/第{N}章.md\n- 日志：{project_dir}/.workflow/rw-09-fix-log.json",
    "context": "none"
  }
})

// Step 10: 更新追踪文件（主 agent）
// 重写可能影响伏笔、角色状态等，需要更新追踪文件
// 运行 character-sync.js 验证角色一致性
```

### Phase 4: 收尾阶段

```javascript
// Step 11: 输出重写报告（主 agent）
// 汇总重写前后对比，生成报告
```

---

## 各步骤说明

### Step 01: 加载原章和上下文
- **Agent**: 子 agent 隔离（general）
- **职责**: 加载待重写章节的全部上下文
- **输出**: `.workflow/rw-01-context.json`
- **防偷懒**: 必须实际读取每个文件，不能跳过

### Step 02: 质量诊断
- **Agent**: 子 agent 隔离（general）
- **职责**: 对原章进行全面质量诊断
- **输出**: `.workflow/rw-02-diagnosis.json`
- **防偷懒**: 必须运行所有检测脚本

### Step 03: 输出诊断报告
- **Agent**: 主 agent
- **职责**: 生成诊断报告，询问用户重写模式
- **输出**: 诊断报告 + 模式选择

### Step 04-07: 重写 [条件]
- **Agent**: 子 agent 隔离（general）
- **职责**: 按选定模式重写章节
- **输出**: 备份原稿 + 重写后正文
- **触发条件**: 用户确认重写模式

### Step 08: 质量检测
- **Agent**: 子 agent 隔离（general）
- **职责**: 对重写后章节进行质量检测
- **输出**: `.workflow/rw-08-recheck.json`

### Step 09: 修复问题 [条件]
- **Agent**: 子 agent 隔离（general）
- **职责**: 修复重写后残留的问题
- **触发条件**: Step 08 有 BLOCK

### Step 10: 更新追踪文件
- **Agent**: 主 agent
- **职责**: 更新追踪文件，运行角色同步

### Step 11: 输出重写报告
- **Agent**: 主 agent
- **职责**: 汇总重写前后对比

---

## 输出格式

### 诊断报告（Step 03）

```
📋 第{N}章 诊断报告
━━━━━━━━━━━━━━━━

📊 综合评分：{X}/100

✅ 优点
- {优点1}
- {优点2}

❌ 问题
- [{severity}] {问题描述}（{位置}）
- [{severity}] {问题描述}（{位置}）

💡 建议
- 推荐模式：{全文重写/局部重写/风格重写/增强重写}
- 重点改进：{focus_areas}
```

### 重写报告（Step 11）

```
📝 第{N}章 重写完成
━━━━━━━━━━━━━━━━

📊 对比
- 原文字数：{X}字 → 重写后：{Y}字
- 原始评分：{X}/100 → 重写后：{Y}/100
- 修复问题：{X}个
- 残留问题：{Y}个

📁 文件
- 原稿备份：{路径}
- 重写正文：{路径}

⏭️ 下一步
- 建议运行 /quality-mimo 检查整体质量
- 建议检查后续章节衔接
```

---

## 条件任务

| 任务 | 触发条件 | 跳过则 |
|------|---------|--------|
| T-RW-{N}-04 | 用户选择全文重写 | abandoned |
| T-RW-{N}-05 | 用户选择局部重写 | abandoned |
| T-RW-{N}-06 | 用户选择风格重写 | abandoned |
| T-RW-{N}-07 | 用户选择增强重写 | abandoned |
| T-RW-{N}-09 | Step 08 有 BLOCK | abandoned |

---

## Agent 间通信

```
.workflow/
├── rw-01-context.json           # Step 01: 上下文
├── rw-02-diagnosis.json         # Step 02: 诊断报告
├── rw-08-recheck.json           # Step 08: 复查报告
└── rw-09-fix-log.json           # Step 09: 修复日志
```

---

## 与其他 Skill 的协作

| Skill | 协作方式 |
|-------|---------|
| story-long-write-mimo | 提供细纲和追踪文件上下文 |
| story-chapter-write-mimo | 提供单章写作流程参考 |
| quality-mimo | 重写后质量检查 |
| story-deslop-mimo | 风格重写时参考去AI味规则 |
| story-progress-mimo | 重写后更新进度 |

---

## 参考文档

| 文档 | 用途 |
|------|------|
| `_shared/references/quality-rules.md` | 质量规则 |
| `_shared/references/lazy-prevention.md` | 防偷懒规则 |
| `_shared/references/tracking-update-rules.md` | 追踪更新规则 |
| `_shared/references/anti-ai-writing.md` | 去AI味指南 |
| `_shared/references/banned-words.md` | 禁用词清单 |
