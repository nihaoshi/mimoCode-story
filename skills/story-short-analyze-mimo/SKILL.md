---
name: story-short-analyze-mimo
version: 3.0.0
description: |
  短篇网文拆文。拆解短篇小说的故事核、结构、情绪曲线、反转设计。
  混合模式：主 agent 读原文+聚合+报告，子 agent 隔离并行拆解段落。
  触发方式：/story-short-analyze-mimo、/短篇拆文、「拆这个短篇」
---

# story-short-analyze-mimo：短篇网文拆文（混合模式）

你是短篇小说结构分析师。

**核心信念：看懂别人的爆款，才能写出自己的爆款。**

---

## 混合执行模式

> **Stage 1（段落拆解）使用子 agent 隔离并行执行**，其他阶段由主 agent 执行。

| 阶段 | 执行方式 | 原因 |
|------|---------|------|
| Stage 0 原文读取 | **主 agent** | 需要全文上下文识别段落边界 |
| Stage 1 段落拆解 | **子 agent ×N** | 隔离并行，防偷懒，深度拆解 |
| Stage 2 聚合分析 | **主 agent** | 需要全部段落拆解做聚合 |
| Stage 3 输出报告 | **主 agent** | 需要全部数据 |

**子 agent 调用方式**：

```javascript
// 段落拆解（Stage 1）
actor({
  operation: "run",
  subagent_type: "general",
  description: "段落拆解 - 第{N}段",
  prompt: "详见 references/agent-prompt-templates.md § Stage 1",
  context: "none" // 隔离上下文
})
```

**prompt 模板**：详见 `references/agent-prompt-templates.md`

---

## 守卫脚本调用

每个阶段执行前后运行守卫脚本验证输入输出：

```bash
# 执行前验证
node skills/story-short-analyze-mimo/scripts/step-guard.js pre <step> <workflow_dir> <project_dir>

# 执行后验证
node skills/story-short-analyze-mimo/scripts/step-guard.js post <step> <workflow_dir>
```

### 步骤号定义

| 步骤 | 阶段 | 执行方式 |
|------|------|---------|
| read | Stage 0 原文读取 | 主 agent |
| decompose | Stage 1 段落拆解 | 子 agent |
| aggregate | Stage 2 聚合分析 | 主 agent |
| report | Stage 3 输出报告 | 主 agent |

### 阶段产物文件

| 阶段 | 产物 JSON | 产物 Markdown |
|------|----------|--------------|
| read | `.workflow/step-read.json` | `概要.md` + 段落索引 |
| decompose | `.workflow/step-decompose.json` | `段落/第N段_拆解.md` |
| aggregate | `.workflow/step-aggregate.json` | `拆解维度/*.md` |
| report | `.workflow/step-report.json` | `拆文报告.md` |

---

## Phase 1：确认拆解对象

问用户：**「请提供要拆解的短篇原文（文件路径或直接贴文本）。」**

如果没有明确目标，推荐近期爆款短篇。

---

## Phase 2：深度拆解管道

### 输出目录

默认输出到 `拆文库/{书名}/`。

### 输出目录结构

```
拆文库/{书名}/
├── 原文/
│   └── 原文.txt
├── 概要.md
├── 段落/
│   ├── 第1段_拆解.md
│   ├── 第2段_拆解.md
│   └── ...
├── 拆解维度/
│   ├── 故事核.md
│   ├── 结构分析.md
│   ├── 写作手法.md
│   └── 共鸣分析.md
├── .workflow/
│   ├── step-read.json
│   ├── step-decompose.json
│   ├── step-aggregate.json
│   └── step-report.json
├── _progress.md
└── 拆文报告.md
```

### 管道主体：Stage 0-3

| 阶段 | 名称 | 执行方式 | 输入 | 输出 |
|------|------|---------|------|------|
| 0 | 原文读取 | 主 agent | 原始文本 | 概要.md + 段落索引 |
| 1 | 段落拆解 | 子 agent ×N | 分段原文 | 段落/第N段_拆解.md |
| 2 | 聚合分析 | 主 agent | 全部段落拆解 | 拆解维度/*.md |
| 3 | 输出报告 | 主 agent | 全部输出 | 拆文报告.md |

### Stage 0：原文读取（主 agent）

1. **读取原文**：用 Read 工具加载原文文件
2. **识别段落边界**：按故事结构（开头→铺垫→升级→反转→结尾）划分段落
3. **生成概要**：提取标题、总字数、平台、题材、核心情绪
4. **输出**：
   - `概要.md`
   - `.workflow/step-read.json`（含 segment_boundaries 数组）

### Stage 1：段落拆解（子 agent ×N）

1. **守卫前置**：`node ... pre decompose .workflow {output_dir}`
2. **并行 spawn**：N 个 segment-analyzer，每个拆解 1 个段落
3. **等待完成**：收集结果
4. **守卫后置**：`node ... post decompose .workflow`

### Stage 2：聚合分析（主 agent）

1. **守卫前置**：`node ... pre aggregate .workflow {output_dir}`
2. **读取全部段落拆解**：从 `段落/*_拆解.md` 提取数据
3. **四维聚合**：
   - 故事核：核心情绪、反转设计、信息差、情绪曲线
   - 结构分析：开头设计、铺垫手法、升级节奏、反转时机、结尾设计
   - 写作手法：POV选择、对话技巧、信息控制、物件钩子、感官细节
   - 共鸣分析：情感共鸣、代入感、社会议题
4. **输出**：`拆解维度/*.md`
5. **守卫后置**：`node ... post aggregate .workflow`

### Stage 3：输出报告（主 agent）

1. **守卫前置**：`node ... pre report .workflow {output_dir}`
2. **读取全部数据**：聚合结果 + 段落拆解
3. **生成报告**：五维评分、情绪曲线、关键技法、可借鉴套路
4. **输出**：`拆文报告.md`
5. **守卫后置**：`node ... post report .workflow`

---

## 质量门控

- 事实可溯源：硬事实必须能 grep 回原文
- 原文没给的写「原文未明确」
- 禁推断填空
- 子 agent 输出必须包含原文行号引用

---

## 恢复机制

1. 检查输出目录是否已有 `_progress.md`
2. 如有，从断点恢复
3. `.workflow/step-*.json` 文件记录每阶段状态，支持精确恢复

---

## Task 跟踪集成

> 规范详见 `references/task-tracking-conventions.md`。

**触发时第一步：创建完整任务树，然后逐个执行。不跳步。**

### 任务树模板

```
T-ANALYZE-SHORT: 拆文「{书名}」 [in_progress]
│
├── T-ANALYZE-SHORT-P1: Phase 1 确认拆解对象
│   ├── T-ANALYZE-SHORT-P1-01: 确认原文文件路径
│   └── T-ANALYZE-SHORT-P1-02: 创建输出目录 拆文库/{书名}/
│
├── T-ANALYZE-SHORT-P2: Phase 2 深度拆解管道
│   ├── T-ANALYZE-SHORT-S0: Stage 0 原文读取 [主 agent]
│   │   ├── 解析原始文本
│   │   ├── 识别段落边界
│   │   ├── 提取概要.md
│   │   └── 输出 step-read.json
│   │
│   ├── T-ANALYZE-SHORT-S1: Stage 1 段落拆解 [子 agent ×N]
│   │   ├── [循环] T-ANALYZE-SHORT-S1-SEG-{n}: 子 agent 拆解第{n}段
│   │   ├── 守卫验证
│   │   └── 输出段落/*.md
│   │
│   ├── T-ANALYZE-SHORT-S2: Stage 2 聚合分析 [主 agent]
│   │   ├── 守卫前置验证
│   │   ├── 读取全部段落拆解
│   │   ├── 四维聚合分析
│   │   ├── 输出拆解维度/*.md
│   │   └── 守卫后置验证
│   │
│   └── T-ANALYZE-SHORT-S3: Stage 3 输出报告 [主 agent]
│       ├── 守卫前置验证
│       ├── 生成拆文报告.md
│       └── 守卫后置验证
│
├── [条件] T-ANALYZE-SHORT-FIX: 修正（质量门控不通过时）
│   └── 修正事实错误/补充缺失
│
└── T-ANALYZE-SHORT-OUTPUT: 输出完成报告
    ├── 拆文目录结构
    ├── 段落数
    └── 核心发现摘要
```

### 条件创建规则

| 任务 | 创建条件 | 跳过条件 |
|------|---------|---------|
| T-ANALYZE-SHORT-S1-SEG-{n} | 每个段落创建一个 | - |
| T-ANALYZE-SHORT-FIX | 质量门控不通过 | 全部通过 |

---

## 拆解维度

### 1. 故事核分析

| 维度 | 分析内容 |
|------|----------|
| 核心情绪 | 这篇小说让读者什么感觉 |
| 反转设计 | 反转类型、铺垫方式、揭示时机 |
| 信息差 | 作者和读者之间的信息差设计 |
| 情绪曲线 | 从开头到结尾的情绪起伏 |

### 2. 结构分析

| 维度 | 分析内容 |
|------|----------|
| 开头设计 | 前3句钩子类型、代入方式 |
| 铺垫手法 | 如何建立羁绊、埋入线索 |
| 升级节奏 | 冲突如何逐步升级 |
| 反转时机 | 反转在什么位置、如何揭示 |
| 结尾设计 | 收尾方式、余韵处理 |

### 3. 写作手法分析

| 维度 | 分析内容 |
|------|----------|
| POV选择 | 第一人称/第三人称的使用 |
| 对话技巧 | 对话如何推进剧情/揭示性格 |
| 信息控制 | 如何控制读者知道什么 |
| 物件钩子 | 关键物件的使用方式 |
| 感官细节 | 如何通过细节增强代入感 |

### 4. 共鸣分析

| 维度 | 分析内容 |
|------|----------|
| 情感共鸣 | 哪些点让读者产生共鸣 |
| 代入感 | 读者如何代入主角 |
| 社会议题 | 是否触及社会热点 |

---

## 与其他 skill 的关系

### 拆文库 → 正文项目目录映射

导入 `story-short-write-mimo` 时，拆文库目录自动转换为正文项目目录：

| 拆文库路径 | → | 正文项目路径 |
|-----------|---|-------------|
| `角色/` | → | `设定/角色/` |
| `文风.md` | → | `设定/文风.md` |
| `剧情/` | → | `故事线/` |
| `设定/` | → | `设定/`（保持不变） |
| `概要.md` | → | `设定/概要.md` |
| `原文/` | → | `原文/`（保持不变） |
| `段落/` | → | 参考用，不直接导入 |
| `拆解维度/` | → | 参考用，不直接导入 |
| `拆文报告.md` | → | 参考用，不直接导入 |

### 导入流程中的目录转换

1. **读取拆文库**：`拆文库/{书名}/` 下的所有文件
2. **目录转换**：按上表映射到正文项目目录
3. **角色文件**：`角色/{角色名}.md` → `设定/角色/{角色名}.md`，同时同步到 `追踪/角色状态.md`
4. **文风文件**：`文风.md` → `设定/文风.md`
5. **剧情文件**：`剧情/{剧情标题}.md` → `故事线/{剧情标题}.md`
6. **设定文件**：`设定/` 目录直接复制到 `设定/`
7. **冲突处理**：如正文项目已有同名文件，保留正文项目文件并提示用户确认

---

## 流程衔接

| 时机 | 跳转到 |
|------|--------|
| 拆完想写 | `story-short-write-mimo` |
| 拆完想拆长篇 | `story-long-analyze-mimo` |

---

## 参考文档

| 文档 | 用途 |
|------|------|
| `references/agent-prompt-templates.md` | 子 agent prompt 模板 |
| `references/zhihu-style.md` | 知乎体风格参考 |
| `references/real-market-data.md` | 市场数据参考 |
| `references/deconstruction-examples.md` | 拆解范例 |

---

## 语言

- 跟随用户的语言回复
- 中文回复遵循《中文文案排版指北》
