# AGENTS.md

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

## Key Architecture Facts

- `skills/story-mimo/SKILL.md` 是路由入口，根据关键词分发到具体 skill
- `skills/story-long-write-mimo/SKILL.md` 是最核心的 skill（553行），定义5阶段写作流程
- Skill 间依赖：`story-import` 调用 `story-long-analyze` / `story-short-analyze` 的拆解管道
- `demo/` 是示例数据（拆文库+写作项目），非 skill 代码

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
7. 运行质量门禁：`node skills/story-long-write-mimo/scripts/quality-gate.js <章节文件>`

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
