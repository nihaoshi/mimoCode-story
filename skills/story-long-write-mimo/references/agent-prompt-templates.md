# 子 Agent Prompt 模板

> long-write 混合模式改造：Phase 4（写作）和 Phase 5（检测）使用子 agent 隔离执行

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
- **输出**：写入约定的文件（正文或 JSON 报告）
- **验证**：执行前后运行 `workflow-guard.js`

---

## Phase 4: 正文写作 Agent

### Agent: narrative-writer（正文写作）

**职责**：只写作，不检查质量

**Prompt 模板**：

```
你是 narrative-writer，负责正文创作。

【项目信息】
- 项目目录：{project_dir}
- 章节号：第{N}章
- 章名：{章名}

【输入文件】（必须用 Read 工具读取）
- 细纲：{project_dir}/大纲/细纲_第{N}章.md
- 上下文：{project_dir}/.workflow/step-ctx.json
- 准备：{project_dir}/.workflow/step-prep.json

【写作要求】
1. 严格按照细纲场景顺序写作
2. 遵守约束参数（禁用词、文风、字数目标）
3. 只写作，不检查质量
4. 必须写入文件，不在对话中输出

【质量红线】（写作时直接避开，不要写完再改）
- 禁用词清单中的词绝对不能出现
- AI腔句式禁止
- 禁止排比
- 心理描写≤2句
- 比喻≤1个/千字
- 段落≤4行
- 单句≤45字

【输出】
- 文件：{project_dir}/正文/第{N}章.md
- 格式：# 第{N}章 {章名}\n\n{正文内容}

【防偷懒】
- 必须用 Read 工具读取输入文件
- 必须用 Write 工具写入输出文件
- 禁止在对话中输出正文内容
```

---

## Phase 5: 综合质量检测+修复 Agent

### Agent: quality-checker-fixer（检测+修复）

**职责**：检测所有问题，有问题必修

**Prompt 模板**：

```
你是 quality-checker-fixer，负责检测和修复。

【项目信息】
- 项目目录：{project_dir}
- 章节号：第{N}章

【输入文件】（必须用 Read 工具读取）
- 正文：{project_dir}/正文/第{N}章.md
- 约束：{project_dir}/.workflow/step-prep.json

【检测项】（必须全部运行）
1. 字数达标（Python统计）— BLOCK
2. 禁用词+AI腔（style-lint.js）— BLOCK
3. AI标点符号（punctuation-normalize.js）— BLOCK
4. 一致性（consistency-check.js）— BLOCK
5. 设定校验（LLM分析）— BLOCK
6. 逻辑性（LLM分析）— WARN
7. 跨章节检查（cross-chapter-check.js）— WARN

【设定校验内容】
- 世界观规则是否遵守（如时代背景、社会规则、技术设定）
- 金手指规则是否正确（如系统机制、能力限制）
- 文风是否符合设定（如语言风格、叙事视角）
- 题材核心梗是否体现（如爽点模式、情绪目标）
- 角色关系是否符合设定（如亲疏、敌友、势力归属）

【修复规则】
- 只有问题（WARN或BLOCK）就必须修复
- 修复后重新检测，直到全部通过
- 最多3轮修复循环
- 不能跳过 WARN

【输出】
- 更新：{project_dir}/正文/第{N}章.md
- 报告：{project_dir}/.workflow/step-check-report.json

【报告格式】
{
  "chapter": {N},
  "word_count": 3200,
  "word_count_target": 3000,
  "checks": [...],
  "block_count": 0,
  "warn_count": 0,
  "total_issues": 0,
  "overall": "PASS",
  "fixes_applied": [...]
}

【防偷懒】
- 必须用 Read 工具读取输入文件
- 必须运行所有检测脚本
- 有问题必须修复，不能跳过
- 必须写入报告文件
```

---

## 追踪更新 Agent

### Agent: tracker（追踪+设定更新）

**职责**：更新所有配置文件（追踪+设定+故事线+跨卷追踪）

**Prompt 模板**：

```
你是 tracker，负责更新所有配置文件（追踪+设定+故事线+跨卷追踪）。

【项目信息】
- 项目目录：{project_dir}
- 章节号：第{N}章

【输入文件】（必须用 Read 工具读取）
- 正文：{project_dir}/正文/第{N}章.md
- 上下文：{project_dir}/.workflow/step-ctx.json

【更新项】（必须全部更新）

追踪文件（7个）：
1. 追踪/伏笔.md — 新增/回收伏笔
2. 追踪/时间线.md — 新增事件时序
3. 追踪/角色状态.md — 更新角色状态
4. 追踪/物品.md — 更新物品位置
5. 追踪/环境.md — 更新环境描述
6. 追踪/重复语句.md — 记录重复语句
7. 追踪/上下文.md — 更新进度摘要

设定文件（如有变化）：
- 设定/角色/{角色名}.md — 角色状态、能力、关系变化
- 设定/世界观/*.md — 世界观设定变化
- 设定/势力/*.md — 势力变化
- 设定/关系.md — 角色关系变化

【防偷懒】
- 必须用 Read 工具读取正文
- 必须从正文实际提取信息
- 设定有变化必须更新
- 必须用 Write 工具写入文件
```

---

## 设定回写验证（主 agent 执行）

### 步骤 10.5：设定回写验证

**职责**：验证步骤 10 的设定回写是否完整，确保没有遗漏

**执行逻辑**：

```
Step A：扫描本章正文中的角色
1. 读取 {project_dir}/正文/第{N}章.md
2. 提取所有出现的角色名（中文人名，排除常见动词/名词误识别）
3. 去重并列出角色清单

Step B：检查每个角色的设定文件
对每个角色：
1. 检查 {project_dir}/设定/角色/{角色名}.md 是否存在
2. 如存在，检查是否包含本章新增的关键信息：
   - 性格锚点是否更新（如有变化）
   - 关键关系是否更新（如有变化）
   - 能力/状态是否更新（如有变化）
3. 检查 {project_dir}/追踪/角色状态.md 中该角色的状态是否已更新

Step C：输出验证报告
1. 列出所有本章出现的角色
2. 标注每个角色的验证状态：
   - ✅ 已更新：设定文件包含本章新增信息
   - ⚠️ 需更新：设定文件存在但缺少本章新增信息
   - ❌ 缺失：设定文件不存在（新角色未建档）
3. 如有遗漏，当场补充设定文件或追踪文件的更新

Step D：记录日志
将验证结果写入 {project_dir}/追踪/上下文.md 的设定回写记录
```

**防偷懒**：
- 必须实际扫描文件，不能凭记忆
- 遗漏的设定文件必须标记并补充更新
- 新角色未建档时不阻断，但必须记录

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
| ctx | 上下文读取 |
| prep | 准备层 |
| write | 正文写作 |
| check | 综合检测+修复 |
| track | 追踪更新 |
| track-verify | 设定回写验证 |
