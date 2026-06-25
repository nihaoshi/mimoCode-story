---
name: audit-mimo
version: 2.0.0
description: |
  全量项目审计。子 agent 隔离执行5维度审计，主 agent 汇总报告。
  触发方式：/audit-mimo、/全量检查、「审计项目」「检查整个项目」
inputs:
  - name: project_dir
    type: directory
    required: true
    description: 写作项目根目录
---

# audit-mimo v2.0：全量项目审计（子 agent 隔离模式）

## 核心设计

1. **子 agent 隔离执行**：5个审计维度各由独立子 agent 执行，上下文完全隔离
2. **主 agent 编排**：读取项目 → 分发审计 → 汇总报告
3. **守卫脚本**：每个子 agent 执行前后运行守卫脚本验证
4. **中间产物落盘**：所有审计结果写入 `.workflow/` 目录

## 防偷懒铁律

```
读文件，跑脚本，写报告，不凭记忆
```

**每个子 agent 执行前后必须运行守卫脚本：**
```bash
node {skill_dir}/scripts/audit-guard.js pre  {维度} {workflow_dir} {project_dir}
node {skill_dir}/scripts/audit-guard.js post {维度} {workflow_dir}
```

维度值：`role` | `item` | `env` | `timeline` | `foreshadow`

---

## 触发条件

| 用户说 | 动作 |
|--------|------|
| /audit-mimo | 审计当前项目 |
| /audit-mimo <项目目录> | 审计指定项目 |
| 审计项目 | 同 /audit-mimo |
| 检查整个项目 | 同 /audit-mimo |

---

## 任务树

```
T-AUDIT: 全量审计「{项目名}」
│
├─── Phase 1: 准备阶段 [主 agent]
│    ├── T-AUDIT-01: 确定项目目录并验证结构
│    └── T-AUDIT-02: 读取所有追踪文件，生成审计上下文
│
├─── Phase 2: 五维度审计 [子 agent 隔离]
│    ├── T-AUDIT-03: 角色审计 [子 agent]
│    ├── T-AUDIT-04: 物品审计 [子 agent]
│    ├── T-AUDIT-05: 环境审计 [子 agent]
│    ├── T-AUDIT-06: 时间线审计 [子 agent]
│    └── T-AUDIT-07: 伏笔审计 [子 agent]
│
├─── Phase 3: 综合报告 [主 agent]
│    ├── T-AUDIT-08: 汇总五维度结果，生成综合报告
│    └── [条件] T-AUDIT-09: 修正建议执行（发现BLOCK时）
│
```

---

## 各步骤说明

### Step 01: 确定项目目录并验证结构
- **执行者**：主 agent
- **检查**：正文/、追踪/、设定/ 目录是否存在
- **输出**：确认项目路径，缺失目录则创建

### Step 02: 读取所有追踪文件，生成审计上下文
- **执行者**：主 agent
- **检查**：读取追踪/ 下所有 .md 文件
- **输出**：`.workflow/audit-ctx.json`
- **格式**：
```json
{
  "project_dir": "D:/project",
  "chapter_count": 25,
  "tracking_files": {
    "角色状态.md": "content...",
    "物品.md": "content...",
    "环境.md": "content...",
    "时间线.md": "content...",
    "伏笔.md": "content...",
    "物资.md": "content...",
    "重复语句.md": "content...",
    "上下文.md": "content..."
  },
  "setting_files": {
    "世界观": "content...",
    "角色": "content...",
    "势力": "content...",
    "关系": "content...",
    "题材定位": "content...",
    "文风": "content..."
  },
  "cross_volume_files": {
    "跨卷伏笔.md": "content...",
    "跨卷角色弧线.md": "content...",
    "卷间过渡.md": "content..."
  },
  "storyline_files": {
    "故事线_索引.md": "content...",
    "故事线_主线_*.md": "content...",
    "故事线_交叉点.md": "content..."
  },
  "chapter_list": ["第1章", "第2章", ...]
}
```

### Step 03: 角色审计 [子 agent 隔离]
- **Agent**: general（隔离执行）
- **职责**：检查角色状态一致性、人设矛盾
- **输入**：`.workflow/audit-ctx.json` + 所有章节正文
- **输出**：`.workflow/audit-role.json`
- **守卫**：`audit-guard.js pre/post role`

### Step 04: 物品审计 [子 agent 隔离]
- **Agent**: general（隔离执行）
- **职责**：检查物品位置/状态前后一致性
- **输入**：`.workflow/audit-ctx.json` + 所有章节正文
- **输出**：`.workflow/audit-item.json`
- **守卫**：`audit-guard.js pre/post item`

### Step 05: 环境审计 [子 agent 隔离]
- **Agent**: general（隔离执行）
- **职责**：检查环境描述（季节/天气/场景）前后一致
- **输入**：`.workflow/audit-ctx.json` + 所有章节正文
- **输出**：`.workflow/audit-env.json`
- **守卫**：`audit-guard.js pre/post env`

### Step 06: 时间线审计 [子 agent 隔离]
- **Agent**: general（隔离执行）
- **职责**：检查事件时序是否合理、有无矛盾
- **输入**：`.workflow/audit-ctx.json` + 所有章节正文
- **输出**：`.workflow/audit-timeline.json`
- **守卫**：`audit-guard.js pre/post timeline`

### Step 07: 伏笔审计 [子 agent 隔离]
- **Agent**: general（隔离执行）
- **职责**：检查伏笔是否遗漏、逾期、未回收
- **输入**：`.workflow/audit-ctx.json` + 所有章节正文
- **输出**：`.workflow/audit-foreshadow.json`
- **守卫**：`audit-guard.js pre/post foreshadow`

### Step 08: 汇总综合报告
- **执行者**：主 agent
- **检查**：读取 5 个维度的审计结果 JSON
- **输出**：终端输出 + `.workflow/audit-report.json`

### Step 09: 修正建议执行 [条件：有BLOCK级问题]
- **执行者**：主 agent
- **触发**：任一维度报告中有 BLOCK 级问题
- **行为**：逐项列出修正建议，询问用户是否执行

---

## 子 Agent Prompt 模板

### 通用规则

- **调用方式**：`actor({ operation: "run", subagent_type: "general", context: "none" })`
- **输入**：通过 `.workflow/audit-ctx.json` 传递项目上下文
- **输出**：写入 `.workflow/audit-{维度}.json`
- **防偷懒**：必须用 Read 工具读取文件，不能从对话推断

---

### 角色审计 Agent Prompt

```
你是 role-auditor，负责角色一致性审计。

【项目信息】
- 项目目录：{project_dir}

【输入文件】（动态扫描获取）
- 审计上下文：{project_dir}/.workflow/audit-ctx.json
- 扫描追踪/目录：`ls {project_dir}/追踪/*.md 2>/dev/null`
- 扫描设定/目录：`ls {project_dir}/设定/**/*.md 2>/dev/null`
- 所有章节正文：{project_dir}/正文/第{N}章.md（逐章读取）

【审计项】
1. 角色名称是否前后一致（别名、称呼变化是否有铺垫）
2. 角色性格是否前后矛盾（行为是否符合性格锚点）
3. 角色关系是否前后一致（亲疏、敌友变化是否有铺垫）
4. 角色能力是否前后一致（技能、权限有无突变）
5. 角色外貌/年龄是否前后一致

【输出格式】
写入 {project_dir}/.workflow/audit-role.json：
{
  "dimension": "role",
  "issues": [
    {
      "severity": "BLOCK|WARN|INFO",
      "type": "名称矛盾|性格矛盾|关系矛盾|能力矛盾|外貌矛盾",
      "chapters": ["第3章", "第8章"],
      "description": "具体描述",
      "suggestion": "修正建议"
    }
  ],
  "summary": "角色审计总结",
  "block_count": 0,
  "warn_count": 0
}

【防偷懒】
- 必须逐章读取正文，不能只读追踪文件
- 每个问题必须引用具体章节和原文
- 没有问题时也要输出报告（issues为空数组）
```

---

### 物品审计 Agent Prompt

```
你是 item-auditor，负责物品一致性审计。

【项目信息】
- 项目目录：{project_dir}

【输入文件】（动态扫描获取）
- 审计上下文：{project_dir}/.workflow/audit-ctx.json
- 扫描追踪/目录：`ls {project_dir}/追踪/*.md 2>/dev/null`（获取物品.md等）
- 所有章节正文：{project_dir}/正文/第{N}章.md（逐章读取）

【审计项】
1. 物品位置是否前后一致（谁持有、在哪）
2. 物品状态是否前后一致（损坏、消失、出现是否有交代）
3. 物品来源是否合理（突然出现的物品是否有交代）
4. 关键物品是否在剧情中被遗忘

【输出格式】
写入 {project_dir}/.workflow/audit-item.json：
{
  "dimension": "item",
  "issues": [
    {
      "severity": "BLOCK|WARN|INFO",
      "type": "位置矛盾|状态矛盾|来源不明|遗忘物品",
      "chapters": ["第5章", "第12章"],
      "item_name": "物品名",
      "description": "具体描述",
      "suggestion": "修正建议"
    }
  ],
  "summary": "物品审计总结",
  "block_count": 0,
  "warn_count": 0
}

【防偷懒】
- 必须逐章读取正文，提取物品出现的位置
- 交叉比对追踪文件和正文描述
- 没有问题时也要输出报告
```

---

### 环境审计 Agent Prompt

```
你是 env-auditor，负责环境一致性审计。

【项目信息】
- 项目目录：{project_dir}

【输入文件】（动态扫描获取）
- 审计上下文：{project_dir}/.workflow/audit-ctx.json
- 扫描追踪/目录：`ls {project_dir}/追踪/*.md 2>/dev/null`（获取环境.md等）
- 所有章节正文：{project_dir}/正文/第{N}章.md（逐章读取）

【审计项】
1. 季节/时间是否前后一致（同一天不能又冷又热）
2. 天气是否前后一致（同一场景不能又晴又雨）
3. 场景空间是否合理（距离、方位、布局）
4. 环境描写与剧情时间是否匹配

【输出格式】
写入 {project_dir}/.workflow/audit-env.json：
{
  "dimension": "env",
  "issues": [
    {
      "severity": "BLOCK|WARN|INFO",
      "type": "季节矛盾|天气矛盾|空间矛盾|时间不匹配",
      "chapters": ["第6章", "第7章"],
      "description": "具体描述",
      "suggestion": "修正建议"
    }
  ],
  "summary": "环境审计总结",
  "block_count": 0,
  "warn_count": 0
}

【防偷懒】
- 必须逐章读取正文，提取环境描写
- 注意隐含的环境信息（如衣着暗示季节）
- 没有问题时也要输出报告
```

---

### 时间线审计 Agent Prompt

```
你是 timeline-auditor，负责时间线一致性审计。

【项目信息】
- 项目目录：{project_dir}

【输入文件】（动态扫描获取）
- 审计上下文：{project_dir}/.workflow/audit-ctx.json
- 扫描追踪/目录：`ls {project_dir}/追踪/*.md 2>/dev/null`（获取时间线.md等）
- 所有章节正文：{project_dir}/正文/第{N}章.md（逐章读取）

【审计项】
1. 事件先后顺序是否合理
2. 时间跨度是否合理（人物不能同时出现在两个地方）
3. 年龄与时间跨度是否匹配
4. 回忆/闪回的时间标记是否清晰
5. 日夜节律是否合理（连续白天或连续黑夜）

【输出格式】
写入 {project_dir}/.workflow/audit-timeline.json：
{
  "dimension": "timeline",
  "issues": [
    {
      "severity": "BLOCK|WARN|INFO",
      "type": "时序矛盾|时间冲突|年龄矛盾|节律异常",
      "chapters": ["第10章", "第15章"],
      "description": "具体描述",
      "suggestion": "修正建议"
    }
  ],
  "summary": "时间线审计总结",
  "block_count": 0,
  "warn_count": 0
}

【防偷懒】
- 必须逐章读取正文，提取时间标记
- 构建事件时间轴，交叉验证
- 没有问题时也要输出报告
```

---

### 伏笔审计 Agent Prompt

```
你是 foreshadow-auditor，负责伏笔完整性审计。

【项目信息】
- 项目目录：{project_dir}

【输入文件】（动态扫描获取）
- 审计上下文：{project_dir}/.workflow/audit-ctx.json
- 扫描追踪/目录：`ls {project_dir}/追踪/*.md 2>/dev/null`（获取伏笔.md等）
- 所有章节正文：{project_dir}/正文/第{N}章.md（逐章读取）

【审计项】
1. 已埋伏笔是否在合理章节内回收
2. 伏笔回收时是否与原始设定一致
3. 是否有"已回收"标记但正文未体现的情况
4. 是否有逾期未回收的伏笔（超过10章未回收）
5. 是否有伏笔重复埋设

【输出格式】
写入 {project_dir}/.workflow/audit-foreshadow.json：
{
  "dimension": "foreshadow",
  "issues": [
    {
      "severity": "BLOCK|WARN|INFO",
      "type": "未回收|回收不一致|逾期|重复埋设",
      "foreshadow_name": "伏笔名",
      "planted_chapter": "第3章",
      "expected_resolve": "第8章",
      "actual_resolve": null,
      "description": "具体描述",
      "suggestion": "修正建议"
    }
  ],
  "summary": "伏笔审计总结",
  "block_count": 0,
  "warn_count": 0
}

【防偷懒】
- 必须逐章读取正文，验证伏笔回收情况
- 不能只看追踪文件的标记，必须对照正文
- 没有问题时也要输出报告
```

---

## Agent 间通信

所有中间结果存放在 `{PROJECT_DIR}/.workflow/` 目录：

```
.workflow/
├── audit-ctx.json              # Phase 1: 审计上下文（主agent生成）
├── audit-role.json             # Step 03: 角色审计结果
├── audit-item.json             # Step 04: 物品审计结果
├── audit-env.json              # Step 05: 环境审计结果
├── audit-timeline.json         # Step 06: 时间线审计结果
├── audit-foreshadow.json       # Step 07: 伏笔审计结果
└── audit-report.json           # Step 08: 综合报告（主agent生成）
```

---

## 综合报告格式

```
🔍 全量项目审计报告

📊 项目信息：
- 项目：{项目名}
- 章节数：{X}章
- 追踪文件：{X}个

📋 五维度检查结果：
- 角色一致性：✅ 无问题 | ⚠️ {N}处问题
- 物品一致性：✅ 无问题 | ⚠️ {N}处问题
- 环境一致性：✅ 无问题 | ⚠️ {N}处问题
- 时间线合理性：✅ 无问题 | ⚠️ {N}处问题
- 伏笔完整性：✅ 无问题 | ⚠️ {N}处问题

📝 BLOCK级问题（必须修复）：
1. [角色] 第3章 vs 第8章：李青云性格矛盾
   - 第3章：沉稳内敛，不轻易发怒
   - 第8章：因小事暴怒，与人设不符
   - 建议：补充铺垫或调整第8章反应

2. [物品] 第5章 vs 第12章：白瓷片位置矛盾
   - 第5章：放在桌上
   - 第12章：从怀中掏出
   - 建议：统一位置描述

⚠️ WARN级问题（建议修复）：
1. [伏笔] 第3章伏笔"神秘来信"逾期未回收（已过15章）
2. [时间线] 第10-12章时间跨度模糊

💡 修复建议优先级：
1. 先修BLOCK级（影响读者体验）
2. 再修WARN级（提升作品质量）
```

---

## 条件任务

| 任务 | 触发条件 | 跳过则 |
|------|---------|--------|
| T-AUDIT-09 | 任一维度有BLOCK | abandoned |

---

## 与其他skill的关系

| 关系 | 说明 |
|------|------|
| 调用 | `full-consistency-audit.js`（审计脚本，可辅助自动检查） |
| 被调用 | 用户主动触发 |
| 被调用 | 写作流程中定期执行 |

---

## 使用场景

| 场景 | 说明 |
|------|------|
| 写完一批章节后 | 检查新写的章节是否与之前矛盾 |
| 准备发布前 | 全面检查项目质量 |
| 发现问题时 | 定位矛盾来源 |
| 定期维护 | 每月审计一次，保持项目健康 |

---

## Task 跟踪集成

> 规范详见 `references/task-tracking-conventions.md`。

**触发时第一步：读取上方任务树，然后逐条创建。不跳步。**

**强制执行顺序**：
1. 读取上方「任务树」
2. 严格按照列表逐条创建任务
3. 逐个执行
4. Phase 2 的 5 个子 agent 任务可并行 spawn

#### 固定任务列表（全量审计时，逐条创建）

```
# ===== 第1层：父任务 =====
1. task create "T-AUDIT: 全量审计「{项目名}」"                          → T-AUDIT

# ===== 第2层：3个阶段 =====
2. task create "T-AUDIT-PREP: Phase 1 准备阶段（主agent）"  parent=T-AUDIT → T-AUDIT-PREP
3. task create "T-AUDIT-DIM: Phase 2 五维度审计（子agent）" parent=T-AUDIT → T-AUDIT-DIM
4. task create "T-AUDIT-REPORT: Phase 3 综合报告（主agent）" parent=T-AUDIT → T-AUDIT-REPORT

# ===== 第3层-准备阶段：2项 =====
5. task create "T-AUDIT-01: 确定项目目录并验证结构"          parent=T-AUDIT-PREP
6. task create "T-AUDIT-02: 读取追踪文件生成审计上下文"      parent=T-AUDIT-PREP

# ===== 第3层-五维度审计：5项（可并行） =====
7. task create "T-AUDIT-03: 角色审计 [子agent]"              parent=T-AUDIT-DIM
8. task create "T-AUDIT-04: 物品审计 [子agent]"              parent=T-AUDIT-DIM
9. task create "T-AUDIT-05: 环境审计 [子agent]"              parent=T-AUDIT-DIM
10. task create "T-AUDIT-06: 时间线审计 [子agent]"            parent=T-AUDIT-DIM
11. task create "T-AUDIT-07: 伏笔审计 [子agent]"              parent=T-AUDIT-DIM

# ===== 第3层-综合报告：2项 =====
12. task create "T-AUDIT-08: 汇总五维度结果生成综合报告"      parent=T-AUDIT-REPORT
13. task create "T-AUDIT-09: 修正建议执行（条件创建）"         parent=T-AUDIT-REPORT
```

### 条件创建规则

| 任务 | 执行时判断 | 跳过则 abandoned |
|------|-----------|-----------------|
| T-AUDIT-09 | 发现BLOCK级问题时start | 无BLOCK则abandoned |

### 并行执行规则

Phase 2 的 5 个子 agent 任务（T-AUDIT-03 ~ T-AUDIT-07）可以并行 spawn，无需串行等待。所有子 agent 完成后才进入 Phase 3。
