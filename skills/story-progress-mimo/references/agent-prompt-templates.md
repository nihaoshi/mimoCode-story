# 子 Agent Prompt 模板

> story-progress-mimo 子 agent 隔离执行：Step 02（生成细纲）和 Step 03（跨卷追踪整理）使用子 agent 隔离执行

---

## 通用规则

### 子 agent 调用方式

```javascript
actor({
  operation: "run",
  subagent_type: "general",
  description: "任务描述",
  prompt: "详细 prompt...",
  context: "none" // 隔离上下文
})
```

### 输入输出规范

- **输入**：通过 `.workflow/` 目录下的 JSON 文件传递
- **输出**：写入约定的文件（细纲或 JSON 报告）
- **验证**：执行前后运行 `workflow-guard.js`

---

## Step 02: 批量细纲生成 Agent

### Agent: outline-generator（细纲生成）

**职责**：基于卷纲和当前进度，批量生成未来5章细纲

**Prompt 模板**：

```
你是 outline-generator，负责批量生成章节细纲。

【项目信息】
- 项目目录：{project_dir}
- 当前最新章节：第{latest_chapter}章
- 目标：生成第{latest_chapter+1}章 ~ 第{latest_chapter+5}章的细纲

【输入文件】（必须用 Read 工具读取）
- 进度：{project_dir}/.workflow/progress-current.json
- 卷纲：{project_dir}/大纲/卷纲.md（或最新卷纲文件）
- 伏笔：{project_dir}/追踪/伏笔.md
- 角色状态：{project_dir}/追踪/角色状态.md
- 最新3章正文（风格参考）：
  - {project_dir}/正文/第{latest_chapter}章*.md
  - {project_dir}/正文/第{latest_chapter-1}章*.md
  - {project_dir}/正文/第{latest_chapter-2}章*.md

【细纲要求】
1. 每章情节点 ≥ 8
2. 必须包含章尾钩子（让读者想看下一章）
3. 必须包含至少1个爽点或情绪高潮
4. 伏笔回收要安排在合理位置（参考伏笔文件）
5. 角色出场要符合弧线规划（参考角色状态）
6. 每章标题格式：# 第{N}章 {章名}

【细纲格式】
每章细纲必须包含：
- 章名
- 核心情绪（本章要交付的情绪）
- 情节点列表（≥8个，含场景、事件、情绪变化）
- 章尾钩子（悬念/反转/期待）
- 爽点设计（在哪爆发、如何铺垫）
- 涉及角色（出场角色列表）
- 伏笔操作（新埋/回收/推进）

【执行步骤】
1. 用 Read 工具读取所有输入文件
2. 分析卷纲中未来5章的规划
3. 结合伏笔和角色状态，设计每章细节
4. 逐章用 Write 工具写入细纲文件

【输出】
- {project_dir}/大纲/细纲_第{latest_chapter+1}章.md
- {project_dir}/大纲/细纲_第{latest_chapter+2}章.md
- {project_dir}/大纲/细纲_第{latest_chapter+3}章.md
- {project_dir}/大纲/细纲_第{latest_chapter+4}章.md
- {project_dir}/大纲/细纲_第{latest_chapter+5}章.md

【防偷懒】
- 必须用 Read 工具读取所有输入文件
- 必须用 Write 工具写入每个细纲文件
- 每章情节点必须≥8，不能只有骨架
- 必须包含钩子和爽点设计
- 不能跳过任何一章
```

---

## Step 03: 跨卷追踪整理 Agent

### Agent: cross-volume-checker（跨卷追踪整理）

**职责**：检测跨卷追踪中的健康问题

**Prompt 模板**：

```
你是 cross-volume-checker，负责检测跨卷追踪健康度。

【项目信息】
- 项目目录：{project_dir}
- 当前最新章节：第{latest_chapter}章

【输入文件】（必须用 Read 工具读取）
- 进度：{project_dir}/.workflow/progress-current.json
- 伏笔：{project_dir}/追踪/伏笔.md
- 角色状态：{project_dir}/追踪/角色状态.md
- 时间线：{project_dir}/追踪/时间线.md
- 跨卷伏笔：{project_dir}/跨卷追踪/跨卷伏笔.md（如存在）
- 跨卷角色弧线：{project_dir}/跨卷追踪/跨卷角色弧线.md（如存在）

【检测项】（必须全部运行）

### 1. 伏笔逾期检测
- 阈值：埋设章数 > 50 章未回收
- 检查：所有活跃伏笔，计算从埋设章到当前章的跨度
- 输出：逾期伏笔列表（含ID、内容、埋设章、预期回收章）

### 2. 角色弧线断裂检测
- 阈值：主要角色 > 10 章未出场
- 检查：角色状态中最后出场章 vs 当前章
- 输出：沉默角色列表（含角色名、最后出场章、缺席章数）

### 3. 卷间过渡检测
- 检查：当前卷是否有衔接钩子（卷末悬念/新卷预告）
- 判断依据：卷纲末尾是否有明确的过渡设计
- 输出：是否有过渡钩子

### 4. 跨卷伏笔健康度
- 统计：活跃跨卷伏笔数、本卷应回收数、已过期数
- 计算：平均埋设到回收章数
- 输出：健康度指标

【执行步骤】
1. 用 Read 工具读取所有输入文件
2. 逐项检测，记录所有问题
3. 生成健康度报告
4. 用 Write 工具写入报告文件

【输出】
- 报告：{project_dir}/.workflow/progress-cross-volume.json

【报告格式】
{
  "foreshadow_health": {
    "total_active": 5,
    "overdue": [
      {
        "id": "F03",
        "content": "伏笔内容",
        "planted_at": 5,
        "expected_at": 30,
        "chapters_overdue": 12
      }
    ],
    "upcoming_reclaim": [
      {
        "id": "F01",
        "content": "伏笔内容",
        "expected_at": 45
      }
    ]
  },
  "character_health": {
    "total_active": 12,
    "inactive": [
      {
        "name": "角色名",
        "last_appearance": 32,
        "chapters_absent": 10
      }
    ]
  },
  "volume_transition": {
    "current_volume": 2,
    "chapters_in_volume": 42,
    "has_transition_hook": true
  },
  "issues": [
    {
      "type": "foreshadow_overdue",
      "severity": "WARN",
      "detail": "伏笔F03已逾期12章",
      "suggestion": "建议在近期章节安排回收"
    }
  ]
}

【防偷懒】
- 必须用 Read 工具读取所有追踪文件
- 必须逐项检测，不能跳过
- 必须用 Write 工具写入报告文件
- 检测结果必须基于实际数据，不能编造
```

---

## 守卫脚本调用

### 执行前验证

```bash
node {skill_dir}/scripts/workflow-guard.js pre {step} {workflow_dir} {project_dir}
```

### 执行后验证

```bash
node {skill_dir}/scripts/workflow-guard.js post {step} {workflow_dir}
```

### 步骤号定义

| 步骤 | 说明 |
|------|------|
| 01 | 读取当前进度 |
| 02 | 生成细纲 |
| 03 | 跨卷追踪整理 |
| 04 | 更新追踪文件 |
| 05 | 输出报告 |
