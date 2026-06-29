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

## 前置检查

执行前必须验证项目目录存在且结构完整：

```bash
# 前置守卫验证
node skills/story-rewrite-mimo/scripts/step-guard.js pre 01 {project_dir} {chapter_number}
# 检查目录存在
ls {project_dir}/正文/ {project_dir}/追踪/ {project_dir}/设定/ 2>/dev/null || echo "ERROR: 项目目录缺失"
```

缺失时提示用户：「项目目录 {project_dir} 不存在或结构不完整，请先用 /story-setup-mimo 部署项目。」

---

## 任务树

```
T-REWRITE-{N}: 重写第{N}章
│
├─── Phase 1: 诊断阶段
│    ├── T-RW-{N}-01: 加载原章和上下文 [子 agent 隔离·general]
│    ├── T-RW-{N}-02: 质量诊断 [子 agent 隔离·general]
│    ├── T-RW-{N}-03: 影响范围分析 [主 agent]
│    └── T-RW-{N}-03b: 输出诊断报告+模式选择 [主 agent]
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
│    └── T-RW-{N}-10: 更新所有配置文件 [主 agent]
│
├─── Phase 3.5: 后章一致性检查（高风险重写自动触发）
│    ├── T-RW-{N}-10b: 读取 N+1 章开头 [主 agent]
│    ├── T-RW-{N}-10c: 衔接一致性检查 [子 agent 隔离·general]
│    ├── [条件] T-RW-{N}-10d: 连锁重写 N+1 [子 agent 隔离·general]
│    └── [条件] T-RW-{N}-10e: 递归检查 N+2/N+3 [子 agent 隔离·general]
│
└─── Phase 4: 收尾阶段
     └── T-RW-{N}-11: 输出重写报告 [主 agent]
```

---

## 子 Agent 调用规范

### Phase 1: 诊断阶段

```javascript
// Step 01: 加载原章和上下文（动态扫描）
actor({
  "operation": {
    "action": "run",
    "subagent_type": "general",
    "description": "加载原章和上下文 - 第{N}章",
    "prompt": "你是章节重写的上下文加载器。\n\n【防偷懒铁律】必须动态扫描项目目录获取文件列表，不能硬编码。\n\n【任务】动态扫描项目结构，加载待重写章节的全部上下文。\n\n【Step A：读取项目结构定义】\n读取 skills/_shared/references/project-structure.md，获取目录结构和文件清单。\n\n【Step B：动态扫描项目目录】\n```bash\nls {project_dir}/设定/世界观/*.md 2>/dev/null\nls {project_dir}/设定/角色/*.md 2>/dev/null\nls {project_dir}/设定/势力/*.md 2>/dev/null\nls {project_dir}/设定/关系.md 2>/dev/null\nls {project_dir}/设定/题材定位.md 2>/dev/null\nls {project_dir}/设定/文风.md 2>/dev/null\nls {project_dir}/追踪/*.md 2>/dev/null\nls {project_dir}/跨卷追踪/*.md 2>/dev/null\nls {project_dir}/故事线/*.md 2>/dev/null\n```\n\n【Step C：加载必需文件】\n1. {project_dir}/正文/第{N}章.md — 待重写章节（必须存在）\n2. {project_dir}/大纲/细纲_第{N}章.md — 原始细纲\n3. {project_dir}/正文/第{N-1}章.md — 前一章（首章跳过）\n4. {project_dir}/正文/第{N+1}章.md — 后一章（末章跳过）\n5. 从扫描结果加载所有追踪文件\n6. 从扫描结果加载所有设定文件\n7. 从扫描结果加载跨卷追踪和故事线文件（如存在）\n\n【执行】\n1. 读取原章全文，记录原始字数\n2. 读取细纲，提取情节点、钩子、爽点\n3. 读取前后章，了解衔接\n4. 读取追踪文件，了解伏笔和角色状态\n5. 读取设定文件\n6. 读取跨卷追踪和故事线文件（如存在）\n\n【输出】写入 {project_dir}/.workflow/rw-01-context.json，格式：\n{\"chapter\": {N}, \"original_file\": \"正文/第{N}章.md\", \"original_wordcount\": 3200, \"outline\": {...}, \"previous_ending\": \"...\", \"next_opening\": \"...\", \"foreshadows\": [...], \"characters\": [...], \"items\": [...], \"environment\": {...}, \"supply\": {...}, \"timeline\": [...], \"world_rules\": [...], \"forces\": [...], \"relations\": {...}, \"genre\": {...}, \"style\": {...}, \"cross_volume\": {...}, \"story_lines\": {...}}",
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

// Step 03: 影响范围分析（主 agent）
// 读取 rw-02-diagnosis.json，评估重写影响范围
// 分析维度：
// 1. 角色变化：是否修改了角色性格锚点/关系/状态？
// 2. 物品变化：是否修改了物品位置/状态/归属？
// 3. 环境变化：是否修改了季节/天气/场景设定？
// 4. 时间线变化：是否修改了事件顺序/时间跨度？
// 5. 伏笔变化：是否修改了已埋/待回收伏笔？
// 6. 跨卷影响：是否涉及跨卷追踪的伏笔或设定？
// 7. 后章引用：N+1 章是否引用了上述变化的内容？
// 影响等级判定：
// - LOW：仅风格调整、无设定变更 → 不需要后章检查
// - MEDIUM：局部设定微调、不影响后章引用 → 需要后章检查
// - HIGH：角色状态/物品/环境/时间线/伏笔变更 → 必须后章检查
// 写入 {project_dir}/.workflow/rw-03-impact.json

// Step 03b: 输出诊断报告（主 agent）
// 读取 rw-02-diagnosis.json + rw-03-impact.json，生成用户可读报告
// 展示影响范围等级，询问用户选择重写模式
// 如果 HIGH 风险，提示用户将自动触发后章一致性检查
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

// Step 10: 更新所有配置文件（三步流程）（主 agent）
// 重写可能影响伏笔、角色状态等，需要更新所有配置文件

// Step A：动态扫描项目结构 — 获取所有实际存在的配置文件
// Step B：分析重写后的正文提取变更清单
// Step C：按清单更新文件（追踪+设定+故事线+跨卷追踪）
// 运行 character-sync.js 验证角色一致性

### Phase 3.5: 后章一致性检查

```javascript
// Step 10b: 读取 N+1 章开头（主 agent）
// 仅影响范围 = HIGH 时自动触发，MEDIUM 时提示用户确认
// 读取 {project_dir}/正文/第{N+1}章.md（如存在）
// 提取 N+1 章开头 500-1000 字的内容作为衔接检查区域

// Step 10c: 衔接一致性检查 [子 agent 隔离·general]
actor({
  "operation": {
    "action": "run",
    "subagent_type": "general",
    "description": "后章一致性检查 - 第{N+1}章",
    "prompt": "你是后章一致性检查器。\n\n【任务】检查第{N}章重写后，第{N+1}章是否存在不衔接。\n\n【输入】\n1. {project_dir}/正文/第{N}章.md — 重写后的正文\n2. {project_dir}/正文/第{N+1}章.md — 后章正文\n3. {project_dir}/.workflow/rw-03-impact.json — 影响范围分析\n4. {project_dir}/.workflow/rw-01-context.json — 原上下文（对比用）\n\n【检查项】\n1. 衔接流畅度：N 章结尾与 N+1 章开头的过渡是否自然\n2. 角色状态一致性：N+1 章开头提到的角色状态是否与 N 章重写后一致\n3. 物品一致性：N+1 章引用的物品是否在 N 章中有对应状态\n4. 环境一致性：N+1 章的季节/天气/场景是否与 N 章一致\n5. 时间线一致性：N+1 章的时间点是否与 N 章衔接\n6. 伏笔衔接：N 章新增/修改的伏笔是否在 N+1 章有呼应\n7. 信息差：N 章重写后是否改变了 N+1 章依赖的信息差\n\n【严重程度】\n- BLOCK：角色状态/物品/环境/时间线矛盾，必须修复\n- WARN：衔接不够流畅但无事实矛盾\n- INFO：无问题，一切正常\n\n【输出】写入 {project_dir}/.workflow/rw-10c-consistency.json，格式：\n{\n  \"chapter_checked\": {N+1},\n  \"impact_level\": \"HIGH\",\n  \"result\": \"BLOCK|WARN|INFO\",\n  \"blockers\": [{\"type\": \"character_state\", \"detail\": \"...\", \"location\": \"N+1章第2段\"}],\n  \"warnings\": [],\n  \"recommendations\": [\"建议对第{N+1}章进行连锁重写\"]\n}",
    "context": "none"
  }
})

// Step 10d: 连锁重写 [条件]
// 当 Step 10c 结果为 BLOCK 或 WARN 时触发
// 询问用户是否需要对 N+1 章进行连锁重写
// 如果是，调用与 Phase 2 相同的重写流程（传入 N+1）
// 重写后递归执行 Step 10b~10c 检查 N+2

// Step 10e: 递归检查 N+2/N+3 [条件]
// 连锁重写 N+1 成功后，检查 N+2
// 最多递归到 N+3（上限）
// 每层递归复用 Step 10b~10c 流程
// 写入 {project_dir}/.workflow/rw-10e-recursion-log.json
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

### Step 03: 影响范围分析
- **Agent**: 主 agent
- **职责**: 评估重写对后续章节的影响范围
- **输出**: `.workflow/rw-03-impact.json`
- **影响等级**: LOW / MEDIUM / HIGH

### Step 03b: 输出诊断报告
- **Agent**: 主 agent
- **职责**: 生成诊断报告+影响范围报告，询问用户重写模式
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

### Step 10: 更新所有配置文件
- **Agent**: 主 agent
- **职责**: 动态扫描项目结构，更新所有相关配置文件（追踪+设定+故事线+跨卷追踪），运行角色同步

### Step 10b: 读取 N+1 章开头
- **Agent**: 主 agent
- **职责**: 读取后章开头内容，提取衔接检查区域
- **触发条件**: 影响范围 = HIGH 时自动触发，MEDIUM 时提示用户

### Step 10c: 后章一致性检查
- **Agent**: 子 agent 隔离（general）
- **职责**: 检查 N+1 章与重写后 N 章的衔接一致性
- **输出**: `.workflow/rw-10c-consistency.json`
- **BLOCK 时**: 阻断流程，提示连锁重写

### Step 10d: 连锁重写 [条件]
- **Agent**: 子 agent 隔离（general）
- **职责**: 对 N+1 章进行重写（复用 Phase 2 流程）
- **触发条件**: Step 10c 结果为 BLOCK 或 WARN，用户确认

### Step 10e: 递归检查 N+2/N+3 [条件]
- **Agent**: 子 agent 隔离（general）
- **职责**: 连锁重写成功后递归检查后续章节
- **上限**: 最多 N+3

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

📌 影响范围：{LOW/MEDIUM/HIGH}
- {影响范围说明}
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
- 如影响范围为 MEDIUM/HIGH，建议检查后续章节衔接
```

---

## 连锁重写规则

当后章一致性检查发现 BLOCK 问题时，触发连锁重写流程：

1. **提示用户**：「第{N}章重写后，第{N+1}章存在 {X} 处不衔接（BLOCK），建议对第{N+1}章进行连锁重写。是否继续？」
2. **用户确认**：调用 Phase 2 重写流程处理 N+1 章
3. **递归检查**：N+1 重写成功后，检查 N+2
4. **上限控制**：最多递归到 N+3，超过则停止并提示用户手动处理
5. **每层记录**：写入 `.workflow/rw-10e-recursion-log.json` 记录连锁重写链

---

## Task 跟踪集成

本 skill 遵循 `skills/_shared/references/task-tracking-conventions.md` 规范。

### 任务树模板

```
T-REWRITE-{N}: 重写第{N}章
│
├── Phase 1: 诊断阶段
│    T-RW-{N}-01: 加载原章和上下文（done: rw-01-context.json 写入完成）
│    T-RW-{N}-02: 质量诊断（done: rw-02-diagnosis.json 写入完成）
│    T-RW-{N}-03: 影响范围分析（done: rw-03-impact.json 写入完成）
│    T-RW-{N}-03b: 输出诊断报告（done: 用户确认重写模式）
│
├── Phase 2: 重写阶段
│    [条件] T-RW-{N}-04/05/06/07: 按选定模式重写（done: 正文写入+字数验证通过）
│
├── Phase 3: 验证阶段
│    T-RW-{N}-08: 质量检测（done: rw-08-recheck.json 写入完成）
│    [条件] T-RW-{N}-09: 修复问题（done: 重新检测通过，exit code 0）
│    T-RW-{N}-10: 更新配置文件（done: 所有追踪文件+设定文件更新完成）
│
├── Phase 3.5: 后章一致性检查
│    T-RW-{N}-10b: 读取 N+1 章（done: 影响范围 HIGH 自动触发 / MEDIUM 用户确认）
│    T-RW-{N}-10c: 一致性检查（done: rw-10c-consistency.json 写入完成）
│    [条件] T-RW-{N}-10d: 连锁重写 N+1（done: N+1 重写+检测通过）
│    [条件] T-RW-{N}-10e: 递归检查 N+2/N+3（done: 每层写入 recursion-log）
│
└── Phase 4: 收尾阶段
     T-RW-{N}-11: 输出重写报告（done: 报告输出+上下文.md 更新）
```

### 条件创建规则

| 条件 | 创建任务 | 说明 |
|------|---------|------|
| 用户选择全文重写 | T-RW-{N}-04 | 其他重写模式 abandoned |
| 用户选择局部重写 | T-RW-{N}-05 | 其他重写模式 abandoned |
| 用户选择风格重写 | T-RW-{N}-06 | 其他重写模式 abandoned |
| 用户选择增强重写 | T-RW-{N}-07 | 其他重写模式 abandoned |
| Step 08 有 BLOCK | T-RW-{N}-09 | 修复后重新运行 Step 08 |
| 影响范围 = HIGH | T-RW-{N}-10b | 自动触发后章检查 |
| 影响范围 = MEDIUM | T-RW-{N}-10b | 提示用户确认 |
| 影响范围 = LOW | (跳过) | 不需要后章检查 |
| Step 10c = BLOCK/WARN | T-RW-{N}-10d | 需用户确认连锁重写 |
| 连锁重写成功 | T-RW-{N}-10e | 递归检查下一层 |

### 循环处理

**质量检测循环**（Step 08 → Step 09 → Step 08）：
- 同一检测连续 2 轮无新改动 → 停止，最多 3 轮
- 每轮循环创建新的 T-RW-{N}-09 子任务

**连锁重写循环**（Step 10d → Step 10e → Step 10c）：
- 每层递归检查 N+k，最多到 N+3
- 每层写入 recursion-log 记录连锁链

### 完成标准

| 任务 | Done 条件 |
|------|----------|
| T-RW-{N}-01 | rw-01-context.json 写入完成 |
| T-RW-{N}-02 | rw-02-diagnosis.json 写入完成 |
| T-RW-{N}-03 | rw-03-impact.json 写入完成 |
| T-RW-{N}-03b | 用户确认重写模式 |
| T-RW-{N}-04~07 | 正文写入 + 字数验证通过 |
| T-RW-{N}-08 | rw-08-recheck.json 写入完成 |
| T-RW-{N}-09 | 重新检测 exit code 0 |
| T-RW-{N}-10 | 所有配置文件更新完成 |
| T-RW-{N}-10b | 后章内容读取完成 |
| T-RW-{N}-10c | rw-10c-consistency.json 写入完成 |
| T-RW-{N}-10d | 连锁章节重写+检测通过 |
| T-RW-{N}-10e | 递归检查完成或达到上限 |
| T-RW-{N}-11 | 重写报告输出 + 上下文.md 更新 |

### 阻断规则

以下情况必须阻断流程（exit code 2）：
1. Step 08 质量检测有 BLOCK 且 Step 09 修复后仍不通过
2. Step 10c 后章一致性检查有 BLOCK 且用户拒绝连锁重写
3. 字数未达标（< 细纲目标 90%）

---

## 条件任务

| 任务 | 触发条件 | 跳过则 |
|------|---------|--------|
| T-RW-{N}-04 | 用户选择全文重写 | abandoned |
| T-RW-{N}-05 | 用户选择局部重写 | abandoned |
| T-RW-{N}-06 | 用户选择风格重写 | abandoned |
| T-RW-{N}-07 | 用户选择增强重写 | abandoned |
| T-RW-{N}-09 | Step 08 有 BLOCK | abandoned |
| T-RW-{N}-10d | Step 10c BLOCK/WARN + 用户确认 | abandoned |

---

## Agent 间通信

```
.workflow/
├── rw-01-context.json                  # Step 01: 上下文
├── rw-02-diagnosis.json                # Step 02: 诊断报告
├── rw-03-impact.json                   # Step 03: 影响范围分析
├── rw-08-recheck.json                  # Step 08: 复查报告
├── rw-09-fix-log.json                  # Step 09: 修复日志
├── rw-10c-consistency.json             # Step 10c: 后章一致性检查
└── rw-10e-recursion-log.json           # Step 10e: 连锁重写递归日志
```

---

## 步骤守卫

重写流程的各阶段之间通过守卫脚本验证输入输出：

```bash
# 前置验证
node skills/story-rewrite-mimo/scripts/step-guard.js pre <step> {project_dir} {chapter}
# 后置验证
node skills/story-rewrite-mimo/scripts/step-guard.js post <step> {project_dir} {chapter}
```

支持的步骤：01~11, 10b, 10c, 10d, 10e

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
