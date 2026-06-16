# AGENTS.md

## ⚠️ 强制执行规则（不可违反）

**触发任何编排 skill 时，第一步必须创建任务树，然后逐个执行。**

违反此规则 = 任务失败。

### 执行前检查清单

触发 skill 后，在做任何其他事情之前，必须完成：

1. **检查是否有 `in_progress` 的任务** — 有则从断点继续，不重复创建
2. **创建完整任务树** — 按该 skill 的 `## Task 跟踪集成` 章节定义的模板创建
3. **逐个 `start` → 执行 → `done`** — 不跳步，不合并，不省略

### 禁止行为

- ❌ 直接开始写正文，不创建任务
- ❌ 跳过上下文读取步骤
- ❌ 合并多个步骤为一个任务
- ❌ 检测到问题后直接修改，不创建修正任务
- ❌ 修正后不重新验证字数
- ❌ 跳过追踪文件更新

### 允许行为

- ✅ 条件不满足时 `abandoned` 跳过（如首章跳过上一章正文）
- ✅ 用户明确说"跳过某步"时 `abandoned`
- ✅ 无对标书时跳过文风召回

### 自检机制

每个任务 `done` 前，检查：
- [ ] 上一个任务已经 `done`
- [ ] 本任务的所有子步骤都已完成
- [ ] 如有修正，已回到字数验证重新检查

### 运行时强制检查

**正确执行顺序**：

```
1. skill 触发
2. 创建完整任务树（不可跳过）
3. 标记任务已创建：node task-gate.js <项目目录> <章节号> mark
4. 写正文前检查：node task-gate.js <项目目录> <章节号> check
5. 退出码2 = 阻断，必须回到步骤2
```

**预检脚本**（从全局skill目录执行）：

```bash
# 步骤3：标记任务已创建
node skills/_shared/scripts/task-gate.js <项目目录> <章节号> mark

# 步骤4：写正文前检查
node skills/_shared/scripts/task-gate.js <项目目录> <章节号> check
```

退出码含义：
- 0 = 任务树就绪，可以开始写作
- 1 = 警告（可继续）
- 2 = **阻断：未标记任务创建，必须先创建任务树**

**退出码 2 时，禁止写正文，必须先创建完整任务树。**

### 跨会话恢复规则

新会话开始时，必须先读取：
1. `追踪/上下文.md` — 上次进度
2. 检查 memory 中是否有 `in_progress` 的任务
3. 如有 → 从断点继续，不重复创建
4. 如无 → 创建完整任务树后才能开始

---

## What This Repo Is

纯 Markdown 技能定义仓库，为 MiMo Code 提供网文写作全流程 skill。无构建系统、无测试、无包管理器。`skills/` 下每个目录是一个 skill，由 `SKILL.md` 定义行为。

## Skill Structure Convention

每个 skill 目录：
```
skill-name/
├── SKILL.md          # 必需。skill 定义（触发词、流程、规则）
├── references/       # 可选。该 skill 专属的参考文档
└── scripts/          # 可选。自动化脚本（Node.js）
```

共享资源在 `skills/_shared/`（references/templates/examples/checklists），所有 skill 引用但不修改。

## Task 跟踪集成规范

**所有编排 skill（有明确执行流程的 skill）必须在 SKILL.md 中包含 `## Task 跟踪集成` 章节。**

规范详见 `skills/_shared/references/task-tracking-conventions.md`。

### 核心要求

1. **先建任务骨架，再逐个执行** — skill 触发时第一步是创建完整任务树
2. **不跳步** — 每个任务必须 `done` 后才能进入下一个
3. **条件创建** — 循环/分支步骤只在条件满足时创建，不预建空壳
4. **完成标准明确** — 每个任务的 `done` 条件写在 summary 中

### 已集成 task 跟踪的 skill

| Skill | 说明 |
|-------|------|
| `story-long-write-mimo` | 长篇写作5阶段，含单章完整任务树 |
| `story-short-write-mimo` | 短篇写作4阶段，含逐场景任务树 |
| `story-deslop-mimo` | 去AI味4阶段，含Gate A~F条件创建 |
| `story-review-mimo` | 审稿5维度，含综合报告 |
| `quality-mimo` | 质量门禁，含标准/增强模式 |
| `audit-mimo` | 全量审计3维度 |
| `story-session-mimo` | 会话生命周期3阶段 |
| `story-mimo` | 路由入口，含任务状态感知 |
| `story-long-analyze-mimo` | 长篇拆文6阶段，含Stage 1停靠点 |
| `story-import-mimo` | 导入4阶段，含篇幅分流 |

### 新建 skill 时

创建新的编排 skill 时，必须：
1. 在 SKILL.md 中添加 `## Task 跟踪集成` 章节
2. 引用 `references/task-tracking-conventions.md` 规范
3. 定义该 skill 的任务树模板
4. 定义条件创建规则和循环处理规则

---

## Key Architecture Facts

- `skills/story-mimo/SKILL.md` 是路由入口，根据关键词分发到具体 skill
- `skills/story-long-write-mimo/SKILL.md` 是最核心的 skill（553行），定义5阶段写作流程
- Skill 间依赖：`story-import` 调用 `story-long-analyze` / `story-short-analyze` 的拆解管道
- `demo/` 是示例数据（拆文库+写作项目），非 skill 代码
- `skills/atoms/` 包含 45 个原子技能，是最小粒度的功能单元，可被上层 skill 调用或由用户直接使用

## Atom Skills（原子技能）

原子技能通过 `/atom:{atom-id}` 直接调用，是 skill 的底层构建块。45 个原子技能分为 7 类：

| 类别 | 说明 | 包含的原子 |
|------|------|-----------|
| analyze | 拆文提取 | `extract-summary`、`extract-characters`、`extract-settings`、`extract-style`、`extract-chapter-summary`、`analyze-golden-chapters`、`analyze-aggregate` |
| scan | 扫榜选题 | `scrape-platform`、`analyze-trend`、`analyze-reader-profile`、`generate-topic-decision` |
| pre-write | 写前准备 | `character-anchor-load`、`style-constraint-gen`、`banned-words-preload`、`prompt-template-inject`、`pre-write-checklist`、`rules-engine` |
| write | 设计生成 | `generate-chapter`、`design-worldbuilding`、`design-character`、`design-chapter-outline`、`design-volume-outline` |
| review | 多维评审 | `review-consistency`、`review-commercial`、`review-writing`、`review-character`、`review-structure` |
| fix | 精准修复 | `fix-ai-sentence`、`fix-banned-words`、`fix-dialogue-naturalize`、`fix-ending-desublimate`、`fix-psychology-externalize`、`fix-punctuation`、`fix-rhythm-break` |
| detect | 检测诊断 | `detect-ai-sentence`、`detect-banned-words`、`detect-consistency`、`detect-cross-chapter`、`detect-emotion-curve`、`detect-foreshadow`、`detect-satisfaction`、`detect-story-gaps`、`detect-voice`、`detect-wordcount`、`full-consistency-audit` |

原子技能既可被上层 skill 内部调用，也可由用户直接使用 `/atom:{atom-id}` 按需组合。

## 全局脚本调用规则

**所有脚本调用必须使用全局 skill 目录路径，禁止使用项目内的 `skills/` 目录。**

全局 skill 目录通过以下方式定位（优先级从高到低）：
1. 环境变量 `MIMOCODE_SKILLS_DIR`
2. 当前会话的工作目录（如果是 skill 仓库）
3. 配置文件 `$HOME\.config\mimocode\config.json` 中的 `skills_dir` 字段
4. 默认路径：`$HOME\.config\mimocode\skills\`

执行脚本时，必须先切换到全局 skill 目录再执行。

## When Editing a Skill

1. 先读该 skill 的 `SKILL.md` 理解完整流程
2. 引用 `_shared/references/` 中的文档时，通过 `references/文件名.md` 相对路径引用
3. 新增共享文档放 `_shared/references/`，新增 skill 专属文档放 skill 自己的 `references/`
4. 脚本放 skill 的 `scripts/` 目录，用 Node.js 编写

## Demo Directory

`demo/` 包含完整示例，修改 skill 时可参考 demo 中的实际产出格式：
- `拆文库-*/` — 拆文管道的完整输出
- `*/正文/` — 写作项目的实际章节文件
- 修改输出模板时，同步检查 demo 中对应的产物文件是否需要更新

## Gotchas

- 所有 skill 用中文编写，遵循《中文文案排版指北》
- SKILL.md frontmatter 的 `name` 字段必须与目录名一致
- `references/` 中的大文件（30KB+）按场景按需加载，不要在 SKILL.md 中要求一次全部加载

## Writing Project Rules（写作项目强制规则）

以下规则适用于用户的写作项目（非本仓库），写入 AGENTS.md 后 AI 每次会话自动读取：

### 写完每章必须执行

1. 更新 `追踪/伏笔.md` — 新增/回收伏笔
2. 更新 `追踪/时间线.md` — 记录事件时序
3. 更新 `追踪/角色状态.md` — 更新角色状态 + 性格锚点（如有变化）
4. 更新 `追踪/物品.md` — 物品位置/状态变化
5. 更新 `追踪/环境.md` — 季节/天气/场景
6. 更新 `追踪/上下文.md` — 进度摘要
7. 运行质量门禁：`node skills/_shared/scripts/quality-gate.js <章节文件>`

**质量门禁规则**：退出码 2（阻断）时**不得标记任务完成**，必须修复后重新运行。退出码 0 = 全部通过，1 = 有警告（可继续），2 = 有阻断项（必须修复）。

门禁自动检查：禁用词、一致性（物品/环境/角色/时间线）、伏笔逾期、字数达标。

### 跨会话恢复规则

新会话开始时，必须先读取：
1. `追踪/上下文.md` — 上次进度
2. `追踪/角色状态.md` — 角色当前状态（含性格锚点）
3. `追踪/伏笔.md` — 待回收伏笔

### 性格一致性规则

写对话和行为描写前，必须检查角色的"性格锚点"（在 `追踪/角色状态.md` 中）。不得让角色说出/做出违背锚点的事，除非有充分铺垫。

### 一级禁用词（写正文时必查，命中即替换）

不禁、竟然、居然、事实上、实际上、显而易见、毫无疑问、可想而知、不言而喻、与此同时、值得注意的是、需要指出的是、不可否认、嘴角勾起、嘴角上扬、嘴角微扬、眼中闪过、眼底闪过、目光中闪过、深吸一口气、长舒一口气、吐出一口浊气、缓缓开口、淡淡说道、轻声说道、仿佛、宛如、恰似、犹如、值得一提、不得不说、总而言之

### 写作铁律（不可违反）

1. 写正文前必须用 Read 工具读细纲，不得凭记忆写
2. 续写前必须用 Read 工具读上一章正文，不得凭记忆接
3. 写对话前必须查角色性格锚点（`追踪/角色状态.md`）
4. 参考文档标记"必读"的必须实际用 Read 工具加载，不得跳过
5. 字数未达标（< 细纲目标 90%）不得结束本章

### 参考文档速查（按场景→文件名）

| 场景 | 文件 |
|------|------|
| 写对话 | `dialogue-mastery.md` |
| 设角色 | `character-basics.md` |
| 写大纲 | `outline-methods.md` |
| 开篇设计 | `opening-design.md` |
| 钩子设计 | `hooks-chapter.md` |
| 反转设计 | `reversal-toolkit.md` |
| 去AI味 | `anti-ai-writing.md` + `banned-words.md` |
| 情感线 | `emotional-arc-design.md` |
| 题材公式 | `genre-writing-formulas.md` |
| 爽点设计 | `plot-emotion-system.md` |

### 原子技能速查（按类别→atom-id）

| 类别 | 调用方式 | 用途 |
|------|---------|------|
| 拆文提取 | `/atom:extract-summary` 等 7 个 | 从原文提取结构、角色、设定、风格 |
| 扫榜选题 | `/atom:scrape-platform` 等 4 个 | 抓取排行、分析趋势、生成选题建议 |
| 写前准备 | `/atom:character-anchor-load` 等 6 个 | 加载锚点、禁用词、生成约束和规则集 |
| 设计生成 | `/atom:generate-chapter` 等 5 个 | 设计世界观、角色、大纲、生成正文 |
| 多维评审 | `/atom:review-consistency` 等 5 个 | 一致性、商业性、文笔、角色、结构评审 |
| 精准修复 | `/atom:fix-ai-sentence` 等 7 个 | 去AI腔、替换禁用词、修复对话和节奏 |
| 检测诊断 | `/atom:detect-banned-words` 等 11 个 | 禁用词扫描、一致性检查、情绪曲线分析 |

### Git Hooks 安装

在写作项目中安装 hooks（仅需一次）：

**macOS / Linux：**
```bash
cp .githooks/* .git/hooks/
chmod +x .git/hooks/*
```

**Windows (PowerShell)：**
```powershell
Copy-Item .githooks\* .git\hooks\ -Force
```
