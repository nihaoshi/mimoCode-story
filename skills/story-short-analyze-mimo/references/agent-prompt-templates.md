# 子 Agent Prompt 模板

> story-short-analyze-mimo 混合模式：Stage 1（段落拆解）使用子 agent 隔离并行执行

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

- **输入**：通过 `.workflow/` 目录下的 JSON 文件 + 原文片段传递
- **输出**：写入约定的文件（段落拆解 markdown）
- **验证**：执行前后运行 `workflow-guard.js`

---

## Stage 1: 段落拆解 Agent

### Agent: segment-analyzer（段落深度拆解）

**职责**：深度拆解短篇小说的单个结构段落

**Prompt 模板**：

```
你是 segment-analyzer，负责深度拆解短篇小说的结构段落。

【项目信息】
- 书名：{book_name}
- 输出目录：{output_dir}
- 段落号：第{segment_num}段（{segment_name}）
- 段落范围：第{start_line}-{end_line}行

【输入文件】（必须用 Read 工具读取）
- 原文段落：{output_dir}/原文/原文.txt（读取第{start_line}-{end_line}行）
- 段落边界：{output_dir}/.workflow/step-read.json
- 前序段落拆解（如有）：{output_dir}/.workflow/step-decompose.json

【拆解要求】

1. **结构拆解**
   - 场景划分（场景A/B/C...）
   - 每个场景的功能（铺垫/引爆/转折/收束）
   - 场景间的衔接方式

2. **技法标注**
   - 钩子类型（悬念/冲突/反转/信息差/情绪/视觉）
   - 爽点类型和位置
   - 反转设计（如有）
   - 节奏变化（快/慢/加速/减速）

3. **情绪曲线**
   - 逐句/逐段情绪标注（紧张/轻松/爽/压抑/期待/释放等）
   - 情绪峰值和低谷位置
   - 情绪转折点

4. **写作手法**
   - POV 使用方式
   - 对话技巧（推进剧情/揭示性格/制造悬念）
   - 信息控制（隐瞒/误导/释放时机）
   - 物件钩子（如有）
   - 感官细节（视觉/听觉/触觉/嗅觉）

5. **共鸣设计**
   - 情感共鸣点
   - 代入感营造方式
   - 社会议题触碰（如有）

【质量要求】
- 事实可溯源：每个判断必须标注原文行号
- 原文没给的写「原文未明确」
- 禁推断填空

【输出格式】
写入文件：{output_dir}/段落/第{segment_num}段_拆解.md

```markdown
# 第{segment_num}段 拆解：{段落名称}

## 基本信息
- 行范围：第{start_line}-{end_line}行
- 字数：{X}字
- 场景数：{N}
- 情绪基调：{基调}

## 场景拆解
### 场景1：{场景名}（第{X}-{Y}行）
- 功能：{铺垫/引爆/转折/收束}
- 内容摘要：{一句话}
- 技法：{钩子类型/爽点类型}
- 情绪：{情绪标签}

### 场景2：...

## 情绪曲线
{逐句情绪标注，用 → 表示转折}

## 爽点分析
| 位置 | 类型 | 触发方式 | 效果 |
|------|------|---------|------|

## 钩子分析
| 位置 | 类型 | 内容 | 效果 |
|------|------|------|------|

## 写作手法
- POV：{描述}
- 对话：{技巧分析}
- 信息控制：{分析}
- 物件钩子：{分析}
- 感官细节：{分析}

## 共鸣设计
- 情感共鸣点：{描述}
- 代入感：{描述}

## 可借鉴技法
1. {技法名}：{具体应用}，可用于：{场景}
2. ...

## 核心卖点
{1-2 句话}
```

【防偷懒】
- 必须用 Read 工具读取原文（禁止凭记忆）
- 必须逐句分析，不能跳句
- 必须用 Write 工具写入文件
- 禁止在对话中输出拆解内容
```

---

## 批量调度策略

### 并行调度

```
Stage 0（主 agent）完成后：
  └─ 所有段落 → 并行 spawn N 个 segment-analyzer
               → 等待全部完成
               → 守卫验证
               → 进入 Stage 2
```

### 错误处理

| 场景 | 处理 |
|------|------|
| 子 agent 超时 | 重试1次，仍失败则标记为 failed |
| 子 agent 输出格式错误 | 主 agent 修正格式后写入 |
| 原文格式异常 | 记录到 _progress.md 失败记录 |

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
| read | 原文读取（主 agent） |
| decompose | 段落拆解（子 agent） |
| aggregate | 聚合分析（主 agent） |
| report | 输出报告（主 agent） |
